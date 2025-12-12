/**
 * RLS Isolation Tests
 *
 * These integration tests verify that Row Level Security (RLS) properly
 * isolates data between tenants. They require a running PostgreSQL database
 * with RLS policies applied.
 *
 * IMPORTANT: Run `psql -f packages/db/src/rls/policies.sql` before running these tests.
 *
 * Blueprint Reference: Section 10 - RLS Plantilla
 */

import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest'
import { sql } from 'drizzle-orm'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import {
  withTenantContext,
  withTenantRead,
  getCurrentTenantId,
  assertTenantContext,
} from '../src/rls'
import { courses, tenants, memberships, leads } from '../src/schema'

// Skip integration tests if no DATABASE_URL
const DATABASE_URL = process.env.DATABASE_URL
const shouldRunIntegration = Boolean(DATABASE_URL)

// Test tenant UUIDs
const TENANT_A_ID = '11111111-1111-1111-1111-111111111111'
const TENANT_B_ID = '22222222-2222-2222-2222-222222222222'
const USER_ID = '33333333-3333-3333-3333-333333333333'

describe.skipIf(!shouldRunIntegration)('RLS Isolation - Integration Tests', () => {
  let client: ReturnType<typeof postgres>
  let db: ReturnType<typeof drizzle>

  beforeAll(async () => {
    if (!DATABASE_URL) return

    client = postgres(DATABASE_URL)
    db = drizzle(client)

    // Create test tenants
    await db.insert(tenants).values([
      { id: TENANT_A_ID, name: 'Tenant A', slug: 'tenant-a' },
      { id: TENANT_B_ID, name: 'Tenant B', slug: 'tenant-b' },
    ]).onConflictDoNothing()

    // Create test courses for each tenant
    await db.insert(courses).values([
      { id: '44444444-4444-4444-4444-444444444444', tenantId: TENANT_A_ID, title: 'Course A1', slug: 'course-a1' },
      { id: '55555555-5555-5555-5555-555555555555', tenantId: TENANT_A_ID, title: 'Course A2', slug: 'course-a2' },
      { id: '66666666-6666-6666-6666-666666666666', tenantId: TENANT_B_ID, title: 'Course B1', slug: 'course-b1' },
    ]).onConflictDoNothing()
  })

  afterAll(async () => {
    if (!client) return

    // Cleanup test data (bypass RLS for cleanup)
    await db.execute(sql`DELETE FROM courses WHERE id IN (
      '44444444-4444-4444-4444-444444444444',
      '55555555-5555-5555-5555-555555555555',
      '66666666-6666-6666-6666-666666666666'
    )`)
    await db.execute(sql`DELETE FROM tenants WHERE id IN (
      '11111111-1111-1111-1111-111111111111',
      '22222222-2222-2222-2222-222222222222'
    )`)

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
        expect(result.data).toBe(TENANT_A_ID)
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
          return res.rows[0]?.user_id
        }
      )

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data).toBe(USER_ID)
      }
    })

    it('rejects invalid tenant_id format', async () => {
      const result = await withTenantContext(db, { tenantId: 'invalid' }, async (tx) => {
        return 'should not reach here'
      })

      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.message).toContain('Invalid tenant_id format')
      }
    })
  })

  describe('Tenant Isolation', () => {
    it('Tenant A only sees their own courses', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        return await tx.select().from(courses)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBe(2)
        expect(result.data.every(c => c.tenantId === TENANT_A_ID)).toBe(true)
      }
    })

    it('Tenant B only sees their own courses', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_B_ID }, async (tx) => {
        return await tx.select().from(courses)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.length).toBe(1)
        expect(result.data[0].tenantId).toBe(TENANT_B_ID)
      }
    })

    it('Tenant A cannot read Tenant B courses directly by ID', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        return await tx
          .select()
          .from(courses)
          .where(sql`id = '66666666-6666-6666-6666-666666666666'`)
      })

      expect(result.success).toBe(true)
      if (result.success) {
        // RLS should filter out Tenant B's course
        expect(result.data.length).toBe(0)
      }
    })

    it('Tenant A cannot insert into Tenant B', async () => {
      const result = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        // Attempt to insert with Tenant B's ID should fail due to WITH CHECK
        await tx.insert(courses).values({
          tenantId: TENANT_B_ID, // Wrong tenant!
          title: 'Malicious Course',
          slug: 'malicious',
        })
        return 'should not reach here'
      })

      // Should fail due to RLS WITH CHECK policy
      expect(result.success).toBe(false)
    })
  })

  describe('Context Isolation (Connection Pooling Safety)', () => {
    it('context does not leak between transactions', async () => {
      // First transaction sets Tenant A
      const result1 = await withTenantContext(db, { tenantId: TENANT_A_ID }, async (tx) => {
        return await getCurrentTenantId(tx)
      })

      // Second transaction sets Tenant B
      const result2 = await withTenantContext(db, { tenantId: TENANT_B_ID }, async (tx) => {
        return await getCurrentTenantId(tx)
      })

      // Third transaction without context should not see previous context
      // This tests that set_config(..., true) properly reverts
      const result3 = await db.transaction(async (tx) => {
        // Reading setting without it being set should return null
        const res = await tx.execute(
          sql`SELECT current_setting('app.tenant_id', true) as tenant_id`
        )
        return res.rows[0]?.tenant_id
      })

      expect(result1.success && result1.data).toBe(TENANT_A_ID)
      expect(result2.success && result2.data).toBe(TENANT_B_ID)
      // Third transaction should have null/empty context
      expect(result3).toBeFalsy()
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
      if (result.success) {
        expect(result.data).toBe('ok')
      }
    })
  })
})

// Unit tests that don't require a database
describe('RLS Utilities - Unit Tests', () => {
  describe('TenantContext validation', () => {
    it('accepts valid UUID format', () => {
      const validUUIDs = [
        '11111111-1111-1111-1111-111111111111',
        'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
        'AAAAAAAA-BBBB-CCCC-DDDD-EEEEEEEEEEEE', // uppercase
      ]

      // UUID regex used in withTenantContext
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      validUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(true)
      })
    })

    it('rejects invalid UUID formats', () => {
      const invalidUUIDs = [
        'not-a-uuid',
        '12345',
        '11111111-1111-1111-1111', // too short
        '11111111-1111-1111-1111-1111111111111', // too long
        '11111111-1111-1111-1111-11111111111g', // invalid char
      ]

      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

      invalidUUIDs.forEach(uuid => {
        expect(uuidRegex.test(uuid)).toBe(false)
      })
    })
  })
})
