/**
 * @fileoverview Tenant Registration API
 * Creates a new tenant with an initial admin user and membership.
 *
 * POST /api/tenants/register
 * Body: { name, slug, adminEmail, adminPassword, plan? }
 *
 * Returns 201 with tenant and admin info on success.
 * Returns 400 for validation errors, 409 for duplicate slug/email, 429 for rate limiting.
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { queryFirst, withTransaction } from '@/@payload-config/lib/db'
import {
  checkRateLimit,
  getClientIP,
  createRateLimitHeaders,
} from '../../../../lib/rateLimit'

// ============================================================================
// Constants
// ============================================================================

/**
 * Slugs reserved for system subdomains (from packages/tenant/src/resolver.ts).
 * These cannot be used as tenant slugs.
 */
const RESERVED_SLUGS = [
  'www',
  'api',
  'admin',
  'app',
  'dashboard',
  'docs',
  'status',
  'mail',
]

// ============================================================================
// Schemas
// ============================================================================

const RegisterTenantSchema = z.object({
  name: z
    .string()
    .min(1, 'Tenant name is required')
    .max(100, 'Tenant name must be at most 100 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .max(63, 'Slug must be at most 63 characters')
    .regex(
      /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/,
      'Slug must contain only lowercase letters, numbers, and hyphens, and cannot start or end with a hyphen'
    )
    .refine((val) => !RESERVED_SLUGS.includes(val), {
      message: 'This slug is reserved and cannot be used',
    }),
  adminEmail: z.string().email('Invalid email address'),
  adminPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be at most 128 characters'),
  plan: z.enum(['starter', 'pro', 'enterprise']).default('starter'),
})

// ============================================================================
// POST /api/tenants/register
// ============================================================================

export async function POST(request: NextRequest) {
  // Rate limiting
  const clientIP = getClientIP(request)
  const rateLimitResult = checkRateLimit(clientIP)
  const rateLimitHeaders = createRateLimitHeaders(rateLimitResult)

  if (rateLimitResult.isLimited) {
    return NextResponse.json(
      {
        error: 'Too many registration attempts. Please try again later.',
        retryAfter: rateLimitResult.retryAfterSeconds,
      },
      {
        status: 429,
        headers: rateLimitHeaders,
      }
    )
  }

  try {
    const body = await request.json()
    const validation = RegisterTenantSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400, headers: rateLimitHeaders }
      )
    }

    const { name, slug, adminEmail, adminPassword, plan } = validation.data

    // Check if slug is already taken
    const existingTenant = await queryFirst<{ id: string }>(
      `SELECT id FROM tenants WHERE slug = $1 LIMIT 1`,
      [slug]
    )

    if (existingTenant) {
      return NextResponse.json(
        { error: 'A tenant with this slug already exists' },
        { status: 409, headers: rateLimitHeaders }
      )
    }

    // Check if admin email is already registered
    const existingUser = await queryFirst<{ id: string }>(
      `SELECT id FROM users WHERE email = $1 LIMIT 1`,
      [adminEmail.toLowerCase()]
    )

    if (existingUser) {
      return NextResponse.json(
        { error: 'A user with this email already exists' },
        { status: 409, headers: rateLimitHeaders }
      )
    }

    // Hash the admin password
    const passwordHash = await bcrypt.hash(adminPassword, 12)

    // Use a transaction to ensure atomicity: tenant, user, and membership
    // are all created together or not at all.
    const result = await withTransaction(async (tx) => {
      const tenantRows = await tx.unsafe<{
        id: string
        slug: string
        plan: string
        status: string
      }[]>(
        `INSERT INTO tenants (name, slug, plan, status, domains, branding, created_at, updated_at)
         VALUES ($1, $2, $3, 'trial', $4::jsonb, $5::jsonb, NOW(), NOW())
         RETURNING id, slug, plan, status`,
        [name, slug, plan, JSON.stringify([]), JSON.stringify({})]
      )
      const tenant = tenantRows[0]

      if (!tenant) {
        throw new Error('Failed to create tenant record')
      }

      const userRows = await tx.unsafe<{
        id: string
        email: string
        name: string
      }[]>(
        `INSERT INTO users (email, name, password_hash, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         RETURNING id, email, name`,
        [adminEmail.toLowerCase(), name, passwordHash]
      )
      const adminUser = userRows[0]

      if (!adminUser) {
        throw new Error('Failed to create admin user record')
      }

      await tx.unsafe(
        `INSERT INTO memberships (user_id, tenant_id, roles, status, created_at)
         VALUES ($1, $2, $3::jsonb, 'active', NOW())`,
        [adminUser.id, tenant.id, JSON.stringify(['admin'])]
      )

      return { tenant, adminUser }
    })

    return NextResponse.json(
      {
        tenant: {
          id: result.tenant.id,
          slug: result.tenant.slug,
          plan: result.tenant.plan,
        },
        admin: {
          id: result.adminUser.id,
          email: result.adminUser.email,
          name: result.adminUser.name,
        },
      },
      { status: 201, headers: rateLimitHeaders }
    )
  } catch (error) {
    console.error('Tenant registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register tenant' },
      { status: 500, headers: rateLimitHeaders }
    )
  }
}
