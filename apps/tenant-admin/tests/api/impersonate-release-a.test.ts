// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cookies } from 'next/headers'
import {
  LEGACY_SESSION_COOKIES,
  SESSION_V2_COOKIE,
  signSessionV2,
  verifyPayloadToken,
  type VerifiedPrincipal,
} from '@/lib/server/session'

const { mockGetPayload } = vi.hoisted(() => ({ mockGetPayload: vi.fn() }))
vi.mock('next/headers', () => ({ cookies: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mockGetPayload }))
vi.mock('@/lib/server/rate-limit', () => ({
  enforceSensitiveRateLimit: vi.fn(async () => ({
    allowed: true,
    headers: { 'X-RateLimit-Remaining': '2' },
    result: {},
  })),
  sensitiveRateLimitResponse: vi.fn(),
}))

import { POST } from '@/app/api/auth/impersonate/route'

function cookieStore(values: Record<string, string> = {}) {
  return {
    get: vi.fn((name: string) => (values[name] ? { value: values[name] } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  }
}

async function actorCookie(overrides: Partial<VerifiedPrincipal> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const token = await signSessionV2({
    userId: '1',
    tenantId: 'tenant-1',
    roles: ['admin'],
    sessionVersion: 1,
    sessionId: 'actor-session',
    issuedAt: now,
    expiresAt: now + 3600,
    ...overrides,
  })
  return { [SESSION_V2_COOKIE]: token }
}

function request(body: Record<string, unknown> = {}, headers: Record<string, string> = {}) {
  return new Request('https://tenant.akademate.com/api/auth/impersonate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', host: 'tenant.akademate.com', ...headers },
    body: JSON.stringify(body),
  })
}

const actorUser = {
  id: 1, email: 'admin@tenant.test', role: 'admin', tenant: { id: 'tenant-1' },
  is_active: true, session_version: 1,
}
const targetUser = {
  id: 2, email: 'target@tenant.test', role: 'gestor', tenant: { id: 'tenant-1' },
  is_active: true, session_version: 1,
}

describe('POST /api/auth/impersonate Release A', () => {
  const findByID = vi.fn()
  const create = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.TRUST_PROXY_HEADERS
    process.env.IMPERSONATION_ENABLED = 'true'
    process.env.PAYLOAD_SECRET = 'payload-secret-that-is-long-enough'
    process.env.SESSION_SIGNING_SECRET_CURRENT = 'current-session-secret-that-is-long-enough'
    findByID.mockImplementation(async ({ id }: { id: string }) =>
      String(id) === '1' ? actorUser : targetUser,
    )
    create.mockResolvedValue({ id: 'audit-1' })
    mockGetPayload.mockResolvedValue({ findByID, create })
  })

  it('fails closed when disabled or anonymous', async () => {
    process.env.IMPERSONATION_ENABLED = 'false'
    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie()) as never)
    expect((await POST(request({ userId: 'target-1', reason: 'Support case SUP-42' }))).status).toBe(404)

    process.env.IMPERSONATION_ENABLED = 'true'
    vi.mocked(cookies).mockResolvedValue(cookieStore() as never)
    expect((await POST(request({ userId: 'target-1', reason: 'Support case SUP-42' }))).status).toBe(401)
  })

  it('rejects revoked, inactive, role-changed and tenant-changed actors', async () => {
    for (const changedActor of [
      { ...actorUser, session_version: 2 },
      { ...actorUser, is_active: false },
      { ...actorUser, role: 'gestor' },
      { ...actorUser, tenant: { id: 'tenant-2' } },
    ]) {
      findByID.mockImplementation(async ({ id }: { id: string }) =>
      String(id) === '1' ? changedActor : targetUser,
      )
      vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie()) as never)

      const response = await POST(request({ userId: 'target-1', reason: 'Support case SUP-42' }))
      expect(response.status).toBe(401)
      expect((await response.json()).code).toBe('SESSION_INVALIDATED')
    }
  })

  it('rejects unauthorized roles, cross-tenant targets, chaining and missing reason', async () => {
    findByID.mockImplementation(async ({ id }: { id: string }) =>
      String(id) === '1' ? { ...actorUser, role: 'gestor' } : targetUser,
    )
    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie({ roles: ['gestor'] })) as never)
    expect((await POST(request({ userId: 'target-1', reason: 'Support case SUP-42' }))).status).toBe(403)

    findByID.mockImplementation(async ({ id }: { id: string }) =>
      String(id) === '1' ? actorUser : { ...targetUser, tenant: { id: 'tenant-2' } },
    )
    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie()) as never)
    expect((await POST(request({ userId: 'target-1', reason: 'Support case SUP-42' }))).status).toBe(403)

    findByID.mockImplementation(async ({ id }: { id: string }) =>
      String(id) === '1' ? actorUser : targetUser,
    )
    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie({
      impersonation: { actorUserId: 'root-1', reason: 'Original support case' },
    })) as never)
    expect((await POST(request({ userId: 'target-1', reason: 'Second hop attempt' }))).status).toBe(403)

    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie()) as never)
    expect((await POST(request({ userId: 'target-1', reason: ' ' }))).status).toBe(400)
  })

  it('issues cookies server-side, returns no token and clears host/domain variants', async () => {
    const store = cookieStore(await actorCookie())
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await POST(request({
      userId: 'target-1', reason: 'Investigate support case SUP-42',
    }, { 'x-forwarded-for': '203.0.113.9' }))
    const body = await response.json()

    expect(response.status).toBe(200)
    expect(body).toEqual({ success: true, redirect: '/admin' })
    expect(body).not.toHaveProperty('token')
    const payloadSet = store.set.mock.calls.find(([name]) => name === 'payload-token')
    const v2Set = store.set.mock.calls.find(([name]) => name === SESSION_V2_COOKIE)
    expect(payloadSet?.[1]).not.toBe('')
    expect(v2Set?.[1]).not.toBe('')
    await expect(verifyPayloadToken(String(payloadSet?.[1]))).resolves.toMatchObject({
      userId: '2', tenantId: 'tenant-1', roles: ['gestor'], sessionVersion: 1,
      impersonation: { actorUserId: '1', reason: 'Investigate support case SUP-42' },
    })

    for (const name of ['payload-token', SESSION_V2_COOKIE, ...LEGACY_SESSION_COOKIES]) {
      expect(store.delete).toHaveBeenCalledWith(name)
      expect(store.delete).toHaveBeenCalledWith({ name, path: '/', domain: '.akademate.com' })
    }
    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ip_address: null,
        metadata: expect.objectContaining({ ipSource: 'untrusted' }),
      }),
    }))
  })

  it('uses forwarded IP only with explicit proxy trust', async () => {
    process.env.TRUST_PROXY_HEADERS = 'true'
    vi.mocked(cookies).mockResolvedValue(cookieStore(await actorCookie()) as never)

    await POST(request(
      { userId: 'target-1', reason: 'Investigate support case SUP-42' },
      { 'x-forwarded-for': '203.0.113.9, 10.0.0.2' },
    ))

    expect(create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        ip_address: '203.0.113.9',
        metadata: expect.objectContaining({ ipSource: 'x-forwarded-for' }),
      }),
    }))
  })
})
