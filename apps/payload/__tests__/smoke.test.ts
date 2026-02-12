/**
 * @module @akademate/payload/__tests__/smoke
 * Smoke tests for the Payload CMS app
 */

import { describe, it, expect } from 'vitest'

// ---------------------------------------------------------------------------
// Health Endpoint
// ---------------------------------------------------------------------------

describe('Payload Health Endpoint — GET /api/health', () => {
  it('returns 200 with a healthy status body', async () => {
    const { GET } = await import('../app/api/health/route')
    const response = await GET()

    expect(response.status).toBe(200)

    const body = await response.json()
    expect(body.status).toBe('healthy')
    expect(body.service).toBe('payload')
    expect(body.timestamp).toBeDefined()
    expect(body.environment).toBeDefined()
    expect(body.version).toBeDefined()
  })

  it('returns Cache-Control: no-store header', async () => {
    const { GET } = await import('../app/api/health/route')
    const response = await GET()

    expect(response.headers.get('Cache-Control')).toBe(
      'no-store, no-cache, must-revalidate',
    )
  })

  it('returns a valid ISO-8601 timestamp', async () => {
    const { GET } = await import('../app/api/health/route')
    const response = await GET()
    const body = await response.json()

    const parsed = new Date(body.timestamp)
    expect(parsed.getTime()).not.toBeNaN()
  })
})

// ---------------------------------------------------------------------------
// Tenant Access Control
// ---------------------------------------------------------------------------

describe('Payload Tenant Access Control', () => {
  it('publicRead always returns true', async () => {
    const { publicRead } = await import('../access/tenantAccess')
    // publicRead ignores its arguments entirely
    const result = (publicRead as () => boolean)()
    expect(result).toBe(true)
  })

  it('authenticated returns false when no user is present', async () => {
    const { authenticated } = await import('../access/tenantAccess')
    const result = authenticated({ req: { user: null } } as never)
    expect(result).toBe(false)
  })

  it('authenticated returns true for any logged-in user', async () => {
    const { authenticated } = await import('../access/tenantAccess')
    const result = authenticated({
      req: { user: { id: 'u1', roles: [] } },
    } as never)
    expect(result).toBe(true)
  })

  it('superadminOnly returns true for superadmin role', async () => {
    const { superadminOnly } = await import('../access/tenantAccess')
    const result = superadminOnly({
      req: {
        user: {
          id: 'u1',
          roles: [{ role: 'superadmin' }],
        },
      },
    } as never)
    expect(result).toBe(true)
  })

  it('superadminOnly returns false for non-superadmin user', async () => {
    const { superadminOnly } = await import('../access/tenantAccess')
    const result = superadminOnly({
      req: {
        user: {
          id: 'u2',
          roles: [{ role: 'admin' }],
        },
      },
    } as never)
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Collection Field Definitions
// ---------------------------------------------------------------------------

describe('Payload Collection Field Definitions', () => {
  it('tenantField is a required relationship to tenants', async () => {
    const { tenantField } = await import('../collections/fields')

    expect(tenantField.name).toBe('tenant')
    expect(tenantField.type).toBe('relationship')
    expect(tenantField.required).toBe(true)
  })

  it('timestampFields contains createdAt and updatedAt', async () => {
    const { timestampFields } = await import('../collections/fields')

    expect(timestampFields).toHaveLength(2)
    const names = timestampFields.map((f) => f.name)
    expect(names).toContain('createdAt')
    expect(names).toContain('updatedAt')
  })
})
