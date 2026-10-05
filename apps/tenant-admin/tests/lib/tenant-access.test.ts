// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import {
  requireAnyRole,
  requirePrincipal,
  requireTenantScope,
  TenantAccessError,
} from '@/lib/server/tenant-access'
import { SESSION_V2_COOKIE, signSessionV2, type VerifiedPrincipal } from '@/lib/server/session'

vi.mock('server-only', () => ({}))

const encoder = new TextEncoder()
const now = Math.floor(Date.now() / 1000)
const persistedUser = {
  id: 'user-1',
  tenant: 'tenant-1',
  role: 'admin',
  session_version: 1,
  is_active: true,
}
const payload = { findByID: vi.fn(async () => persistedUser) }

function principal(overrides: Partial<VerifiedPrincipal> = {}): VerifiedPrincipal {
  return {
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
    sessionVersion: 1,
    sessionId: 'session-1',
    issuedAt: now,
    expiresAt: now + 3600,
    ...overrides,
  }
}

describe('tenant access foundation', () => {
  beforeEach(() => {
    vi.stubEnv('SESSION_SIGNING_SECRET_CURRENT', 'current-session-secret-that-is-long-enough')
    vi.stubEnv('PAYLOAD_SECRET', 'payload-secret-that-is-long-enough')
    payload.findByID.mockClear()
  })

  afterEach(() => vi.unstubAllEnvs())

  it('rejects an anonymous request', async () => {
    await expect(requirePrincipal(new Request('https://app.test/api/config'), payload))
      .rejects.toMatchObject({ status: 401 })
  })

  it('rejects a forged session cookie', async () => {
    const forged = await new SignJWT({
      tenant_id: 'tenant-1', roles: ['admin'], token_version: 2, session_version: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'akademate_session_v2' })
      .setIssuer('akademate-tenant-admin')
      .setAudience('akademate-session-v2')
      .setSubject('user-1').setJti('forged').setIssuedAt(now).setExpirationTime(now + 3600)
      .sign(encoder.encode('attacker-secret-that-is-long-enough'))

    await expect(requirePrincipal(new Request('https://app.test/api/config', {
      headers: { cookie: `${SESSION_V2_COOKIE}=${forged}` },
    }), payload)).rejects.toMatchObject({ status: 401 })
  })

  it('resolves persisted identity and accepts same-tenant scope', async () => {
    const token = await signSessionV2(principal())
    const resolved = await requirePrincipal(new Request('https://app.test/api/config', {
      headers: { cookie: `${SESSION_V2_COOKIE}=${token}; x-tenant-id=tenant-evil` },
    }), payload)

    expect(requireTenantScope(resolved, 'tenant-1')).toBe('tenant-1')
    expect(payload.findByID).toHaveBeenCalledWith(expect.objectContaining({ id: 'user-1' }))
  })

  it('returns a 404-shaped error for cross-tenant and missing resources', () => {
    expect(() => requireTenantScope(principal(), 'tenant-2')).toThrowError(TenantAccessError)
    expect(() => requireTenantScope(principal(), 'tenant-2')).toThrow(expect.objectContaining({ status: 404 }))
    expect(() => requireTenantScope(principal(), null)).toThrow(expect.objectContaining({ status: 404 }))
  })

  it('rejects an insufficient role', () => {
    expect(() => requireAnyRole(principal({ roles: ['lectura'] }), ['admin']))
      .toThrow(expect.objectContaining({ status: 403 }))
  })

  it('fails closed for superadmin without an audited tenant-scope operation contract', () => {
    const superadmin = principal({ tenantId: 'platform', roles: ['superadmin'] })
    expect(() => requireTenantScope(superadmin, 'tenant-1'))
      .toThrow(expect.objectContaining({ status: 404 }))
  })
})

