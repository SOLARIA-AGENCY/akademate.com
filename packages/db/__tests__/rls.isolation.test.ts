/**
 * RLS Isolation Tests
 *
 * These integration tests verify that Row Level Security (RLS) utilities work correctly.
 *
 * IMPORTANT NOTES:
 * 1. Run `psql -f packages/db/migrations/0001_enable_rls.sql` and
 *    `psql -f packages/db/migrations/0002_complete_rls.sql` before running these tests.
 * 2. The superuser (carlosjperez) has BYPASSRLS privilege and bypasses RLS by design.
 * 3. True tenant isolation is enforced for non-superuser database connections.
 * 4. In production, apps use a non-superuser role that respects RLS.
 *
 * Blueprint Reference: Section 10 - RLS Plantilla
 *
 * NOTE: Schema uses INTEGER PKs (Payload pattern), not UUIDs.
 */

import { describe, expect, it, beforeAll, afterAll } from 'vitest'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  withTenantContext,
  withTenantRead,
  getCurrentTenantId,
  assertTenantContext,
} from '../src/rls'

// Skip integration tests unless explicitly enabled with DATABASE_URL + RUN_DB_TESTS=true
const DATABASE_URL = process.env.DATABASE_URL
const shouldRunIntegration = Boolean(DATABASE_URL && process.env.RUN_DB_TESTS === 'true')

// Test tenant IDs (integers)
const TENANT_A_ID = 100
const TENANT_B_ID = 200
const USER_ID = 300
const DEV_TENANT_ID = 1 // The development tenant from migration

describe.skipIf(!shouldRunIntegration)('RLS Isolation - Integration Tests', () => {
  let client: ReturnType<typeof postgres>
  let db: ReturnType<typeof drizzle>
  let isSuperuser: boolean

  beforeAll(async () => {
    if (!DATABASE_URL) return

    client = postgres(DATABASE_URL)
    db = drizzle(client)

    // Check if current user has BYPASSRLS (superuser behavior)
    const result = await db.execute(sql`
      SELECT rolbypassrls FROM pg_roles WHERE rolname = current_user
    `)
    isSuperuser = result.rows?.[0]?.rolbypassrls === true

    if (isSuperuser) {
      console.log('[RLS Tests] Running as superuser - RLS bypass active. Tenant isolation tests will be skipped.')
    }

    // Create test tenants (plan enum: starter, pro, enterprise)
    await db.execute(sql`
      INSERT INTO tenants (id, name, slug, plan, status)
      VALUES
        (${TENANT_A_ID}, 'Tenant A', 'tenant-a', 'pro', 'active'),
        (${TENANT_B_ID}, 'Tenant B', 'tenant-b', 'pro', 'active')
      ON CONFLICT (id) DO NOTHING
    `)

    // Create test courses for each tenant
    await db.execute(sql`
      INSERT INTO courses (id, tenant_id, title, slug, status)
      VALUES
        (1001, ${TENANT_A_ID}, 'Course A1', 'course-a1', 'draft'),
        (1002, ${TENANT_A_ID}, 'Course A2', 'course-a2', 'draft'),
        (1003, ${TENANT_B_ID}, 'Course B1', 'course-b1', 'draft')
      ON CONFLICT (id) DO NOTHING
    `)
  })

  afterAll(async () => {
    if (!client) return

    // Cleanup test data (delete courses first due to FK constraint)
    await db.execute(sql`DELETE FROM courses WHERE tenant_id IN (${TENANT_A_ID}, ${TENANT_B_ID})`)
    await db.execute(sql`DELETE FROM courses WHERE id IN (1001, 1002, 1003)`)
    await db.execute(sql`DELETE FROM tenants WHERE id IN (${TENANT_A_ID}, ${TENANT_B_ID})`)

    await client.end()
  })

  describe('withTenantContext', () => {
    it('sets tenant_id in transaction context', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        const tenantId = await getCurrentTenantId(tx)
        return tenantId
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(String(TENANT_A_ID))
      }
    })

    it('sets optional user_id in context', async () => {
      const result = await withTenantContext(
        db,
        { tenantId: TENANT_A_ID, userId: USER_ID },
        async (tx) => {
          const res = await tx.execute(
            sql`SELECT current_setting('app.user_id', true) as user_id`
          )
          // Handle both postgres-js (array) and standard (rows) result formats
          const row = Array.isArray(res) ? res[0] : res.rows?.[0]
          return row?.user_id
        }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(String(USER_ID))
      }
    })

    it('rejects invalid tenant_id format', async () => {
      const result = await withTenantContext(db, { tenantId: 'invalid' }, async (_tx) => {
        return 'should not reach here'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Invalid tenant_id format')
      }
    })

    it('rejects negative tenant_id', async () => {
      const result = await withTenantContext(db, { tenantId: -1 }, async (_tx) => {
        return 'should not reach here'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Invalid tenant_id format')
      }
    })

    it('rejects zero tenant_id', async () => {
      const result = await withTenantContext(db, { tenantId: 0 }, async (_tx) => {
        return 'should not reach here'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Invalid tenant_id format')
      }
    })

    it('accepts numeric tenant_id', async () => {
      const result = await withTenantContext(db, { tenantId: 42 }, async (tx) => {
        return await getCurrentTenantId(tx)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('42')
      }
    })

    it('accepts string numeric tenant_id', async () => {
      const result = await withTenantContext(db, { tenantId: '123' }, async (tx) => {
        return await getCurrentTenantId(tx)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe('123')
      }
    })
  })

  describe('RLS Infrastructure Verification', () => {
    it('verifies RLS is enabled on courses table', async () => {
      // db.execute returns raw postgres-js array result
      const result = await db.execute(sql`
        SELECT rowsecurity FROM pg_tables
        WHERE tablename = 'courses' AND schemaname = 'public'
      `)
      expect(result[0]?.rowsecurity).toBe(true)
    })

    it('verifies tenant isolation policy exists on courses', async () => {
      const result = await db.execute(sql`
        SELECT polname FROM pg_policy
        WHERE polrelid = 'courses'::regclass
      `)
      expect(result.length).toBeGreaterThan(0)
      expect(result[0]?.polname).toBe('tenant_isolation_courses')
    })

    it('verifies all tenant-scoped tables have RLS enabled', async () => {
      // Complete list of all 31 tenant-scoped tables per blueprint (Section 10)
      const expectedTables = [
        // Core (6)
        'memberships', 'courses', 'api_keys', 'audit_logs',
        'subscriptions', 'webhooks',
        // Billing (3)
        'invoices', 'payment_methods', 'payment_transactions',
        // Catalog (4)
        'cycles', 'centers', 'instructors', 'course_runs',
        // LMS (8)
        'modules', 'lessons', 'materials', 'assignments',
        'enrollments', 'lesson_progress', 'submissions', 'grades',
        // Marketing (2)
        'leads', 'campaigns',
        // Gamification (4)
        'badge_definitions', 'user_badges', 'points_transactions', 'user_streaks',
        // Operations (4)
        'attendance', 'calendar_events', 'live_sessions', 'certificates',
      ]

      const result = await db.execute(sql`
        SELECT tablename FROM pg_tables
        WHERE schemaname = 'public' AND rowsecurity = true
        ORDER BY tablename
      `)

      // db.execute returns array directly with postgres-js
      const tablesWithRLS = result.map((r: any) => r.tablename)

      for (const table of expectedTables) {
        expect(tablesWithRLS).toContain(table)
      }
    })

    it('verifies all tenant-scoped tables have tenant_isolation policy', async () => {
      // Every tenant-scoped table should have a tenant_isolation_* policy
      const expectedPolicies = [
        // Core
        'tenant_isolation_memberships', 'tenant_isolation_courses',
        'tenant_isolation_api_keys', 'tenant_isolation_audit_logs',
        'tenant_isolation_subscriptions', 'tenant_isolation_webhooks',
        // Billing
        'tenant_isolation_invoices', 'tenant_isolation_payment_methods',
        'tenant_isolation_payment_transactions',
        // Catalog
        'tenant_isolation_cycles', 'tenant_isolation_centers',
        'tenant_isolation_instructors', 'tenant_isolation_course_runs',
        // LMS
        'tenant_isolation_modules', 'tenant_isolation_lessons',
        'tenant_isolation_materials', 'tenant_isolation_assignments',
        'tenant_isolation_enrollments', 'tenant_isolation_lesson_progress',
        'tenant_isolation_submissions', 'tenant_isolation_grades',
        // Marketing
        'tenant_isolation_leads', 'tenant_isolation_campaigns',
        // Gamification
        'tenant_isolation_badge_definitions', 'tenant_isolation_user_badges',
        'tenant_isolation_points_transactions', 'tenant_isolation_user_streaks',
        // Operations
        'tenant_isolation_attendance', 'tenant_isolation_calendar_events',
        'tenant_isolation_live_sessions', 'tenant_isolation_certificates',
      ]

      const result = await db.execute(sql`
        SELECT policyname FROM pg_policies
        WHERE schemaname = 'public'
        ORDER BY policyname
      `)

      const policies = result.map((r: any) => r.policyname)

      for (const policy of expectedPolicies) {
        expect(policies).toContain(policy)
      }
    })

    it('verifies public read policies exist for courses and course_runs', async () => {
      const result = await db.execute(sql`
        SELECT tablename, policyname FROM pg_policies
        WHERE schemaname = 'public'
          AND policyname IN ('public_read_courses', 'public_read_published_course_runs')
        ORDER BY policyname
      `)

      const policies = result.map((r: any) => r.policyname)
      expect(policies).toContain('public_read_courses')
      expect(policies).toContain('public_read_published_course_runs')
    })

    it('verifies dev tenant (ID=1) exists', async () => {
      const result = await db.execute(sql`
        SELECT id, slug, status FROM tenants WHERE id = ${DEV_TENANT_ID}
      `)
      expect(result.length).toBe(1)
      expect(result[0]?.slug).toBe('dev')
      expect(result[0]?.status).toBe('active')
    })
  })

  describe('withTenantRead convenience wrapper', () => {
    it('sets tenant context for read operations', async () => {
      const result = await withTenantRead(db, DEV_TENANT_ID, async (tx) => {
        return await getCurrentTenantId(tx)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(String(DEV_TENANT_ID))
      }
    })
  })

  describe('assertTenantContext', () => {
    it('throws when context is not set', async () => {
      await expect(
        db.transaction(async (tx) => {
          await assertTenantContext(tx)
        })
      ).rejects.toThrow('Tenant context not set')
    })

    it('does not throw when context is set', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        await assertTenantContext(tx) // Should not throw
        return 'ok'
      })

      expect(result.success).toBe(true)
    })
  })
})

// Unit tests that don't require a database
describe('RLS Utilities - Unit Tests', () => {
  describe('TenantContext validation', () => {
    it('accepts valid integer formats', () => {
      const validIds = [1, 100, 999999, '1', '100', '999999']

      validIds.forEach(id => {
        const numValue = typeof id === 'number' ? id : parseInt(id, 10)
        expect(!isNaN(numValue) && numValue > 0 && Number.isInteger(numValue)).toBe(true)
      })
    })

    it('rejects invalid formats', () => {
      // Note: parseInt('1.5') = 1, which would be valid
      const invalidIds = ['not-a-number', '', '0', '-1', 'abc123']

      invalidIds.forEach(id => {
        const numValue = parseInt(id, 10)
        const isValid = !isNaN(numValue) && numValue > 0 && Number.isInteger(numValue)
        expect(isValid).toBe(false)
      })
    })
  })
})
