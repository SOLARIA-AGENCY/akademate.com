// @vitest-environment node

import { beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { cookies } from 'next/headers'
import { SESSION_V2_COOKIE, signSessionV2, type VerifiedPrincipal } from '@/lib/server/session'

const { mockGetPayload } = vi.hoisted(() => ({
  mockGetPayload: vi.fn(),
}))

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

vi.mock('payload', () => ({
  getPayload: mockGetPayload,
}))

import { DELETE, GET, POST } from '@/app/api/auth/session/route'

const encoder = new TextEncoder()

function createCookieStore(values: Record<string, string> = {}) {
  return {
    get: vi.fn((name: string) => (values[name] ? { value: values[name] } : undefined)),
    set: vi.fn(),
    delete: vi.fn(),
  }
}

async function createPayloadToken(
  overrides: Record<string, unknown> = {},
  secret = process.env.PAYLOAD_SECRET!,
) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({ id: '7', collection: 'users', ...overrides })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60)
    .sign(encoder.encode(secret))
}

const userRecord = {
  id: 7,
  email: 'admin@tenant.test',
  name: 'Tenant Admin',
  role: 'admin',
  tenant: { id: 'tenant-2' },
  is_active: true,
  session_version: 1,
}

describe('Session API Release A', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAYLOAD_SECRET = 'payload-secret-that-is-long-enough'
    process.env.SESSION_SIGNING_SECRET_CURRENT = 'current-session-secret-that-is-long-enough'
    delete process.env.SESSION_SIGNING_SECRET_PREVIOUS
    delete process.env.ENFORCE_HTTPS
    mockGetPayload.mockResolvedValue({
      findByID: vi.fn().mockResolvedValue(userRecord),
    })
  })

  it('GET returns unauthenticated without payload-token or v2', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await GET()

    expect(await response.json()).toEqual({ user: null, authenticated: false })
    expect(store.get).toHaveBeenCalledWith('payload-token')
    expect(store.get).toHaveBeenCalledWith(SESSION_V2_COOKIE)
    expect(store.get).not.toHaveBeenCalledWith('akademate_session')
    expect(store.get).not.toHaveBeenCalledWith('cep_session')
  })

  it('GET derives user data from a verified principal and server-side user lookup', async () => {
    const now = Math.floor(Date.now() / 1000)
    const principal: VerifiedPrincipal = {
      userId: '7',
      tenantId: 'tenant-2',
      roles: ['admin'],
      sessionVersion: 1,
      sessionId: 'v2-session-1',
      issuedAt: now,
      expiresAt: now + 60 * 60,
    }
    const store = createCookieStore({
      [SESSION_V2_COOKIE]: await signSessionV2(principal),
    })
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await GET()
    const body = await response.json()

    expect(body).toMatchObject({
      authenticated: true,
      user: {
        id: '7',
        email: userRecord.email,
        name: userRecord.name,
        role: 'admin',
        roles: ['admin'],
        tenantId: 'tenant-2',
      },
    })
    expect(body.socketToken).toBe('')
  })

  it('GET ignores a legacy JSON session even when it contains identity claims', async () => {
    const store = createCookieStore({
      akademate_session: JSON.stringify({
        user: { id: 'attacker', role: 'superadmin', tenantId: 'other' },
        token: 'not-a-jwt',
      }),
    })
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await GET()

    expect(await response.json()).toEqual({ user: null, authenticated: false })
  })

  it('GET rejects a v2 principal after version, role, tenant or active-state changes', async () => {
    const now = Math.floor(Date.now() / 1000)
    const token = await signSessionV2({
      userId: '7', tenantId: 'tenant-2', roles: ['admin'], sessionVersion: 1,
      sessionId: 'stale-session', issuedAt: now, expiresAt: now + 3600,
    })

    for (const changedUser of [
      { ...userRecord, session_version: 2 },
      { ...userRecord, role: 'gestor' },
      { ...userRecord, tenant: { id: 'tenant-9' } },
      { ...userRecord, is_active: false },
    ]) {
      mockGetPayload.mockResolvedValue({ findByID: vi.fn().mockResolvedValue(changedUser) })
      vi.mocked(cookies).mockResolvedValue(createCookieStore({
        [SESSION_V2_COOKIE]: token,
      }) as never)

      expect(await (await GET()).json()).toEqual({ user: null, authenticated: false })
    }
  })

  it('POST rejects arbitrary user and role body claims without a Payload token', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)
    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        user: { id: 'attacker', email: 'attacker@test', role: 'superadmin' },
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(store.set).not.toHaveBeenCalled()
  })

  it('POST exchanges only a cryptographically verified Payload token from the body', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)
    const token = await createPayloadToken()
    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        token,
        user: { id: 'attacker', role: 'superadmin', tenantId: 'other-tenant' },
      }),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect(store.set).toHaveBeenCalledWith(
      SESSION_V2_COOKIE,
      expect.any(String),
      expect.objectContaining({
        httpOnly: true,
        sameSite: 'lax',
        maxAge: 12 * 60 * 60,
      }),
    )
    expect(store.set).not.toHaveBeenCalledWith(
      'akademate_session',
      expect.anything(),
      expect.anything(),
    )
    expect(store.set).not.toHaveBeenCalledWith('cep_session', expect.anything(), expect.anything())
  })

  it('transparently exchanges a verified legacy embedded token and clears both legacy cookies', async () => {
    const token = await createPayloadToken()
    const store = createCookieStore({
      akademate_session: JSON.stringify({
        user: { id: 'forged-id', role: 'superadmin' },
        token,
      }),
    })
    vi.mocked(cookies).mockResolvedValue(store as never)
    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(200)
    expect((await response.json()).migratedLegacy).toBe(true)
    expect(store.set).toHaveBeenCalledWith(SESSION_V2_COOKIE, expect.any(String), expect.anything())
    expect(store.set).toHaveBeenCalledWith('payload-token', token, expect.anything())
    expect(store.delete).toHaveBeenCalledWith('akademate_session')
    expect(store.delete).toHaveBeenCalledWith('cep_session')
  })

  it('returns SESSION_REAUTH_REQUIRED for malformed or forged legacy sessions', async () => {
    const forgedToken = await createPayloadToken({}, 'attacker-controlled-secret')
    const store = createCookieStore({
      cep_session: JSON.stringify({ token: forgedToken, user: { role: 'superadmin' } }),
    })
    vi.mocked(cookies).mockResolvedValue(store as never)
    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({}),
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
    expect(await response.json()).toMatchObject({ code: 'SESSION_REAUTH_REQUIRED' })
    expect(store.set).not.toHaveBeenCalled()
  })

  it('POST rejects a Payload token whose persisted session version changed', async () => {
    const token = await createPayloadToken({
      tenant: 'tenant-2', role: 'admin', session_version: 1,
    })
    mockGetPayload.mockResolvedValue({
      findByID: vi.fn().mockResolvedValue({ ...userRecord, session_version: 2 }),
    })
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await POST(new Request('https://tenant.akademate.com/api/auth/session', {
      method: 'POST', headers: { host: 'tenant.akademate.com' }, body: JSON.stringify({ token }),
    }))

    expect(response.status).toBe(401)
    expect(store.set).not.toHaveBeenCalled()
  })

  it('DELETE preserves rollback compatibility by clearing v2 and both legacy names', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)

    const response = await DELETE()

    expect(response.status).toBe(200)
    expect(store.delete).toHaveBeenCalledWith(SESSION_V2_COOKIE)
    expect(store.delete).toHaveBeenCalledWith('akademate_session')
    expect(store.delete).toHaveBeenCalledWith('cep_session')
  })

  it('DELETE clears host-only and shared-domain variants', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as never)
    await DELETE(new Request('https://tenant.akademate.com/api/auth/session', {
      headers: { host: 'tenant.akademate.com' },
    }))

    for (const name of ['payload-token', SESSION_V2_COOKIE, 'akademate_session', 'cep_session']) {
      expect(store.delete).toHaveBeenCalledWith(name)
      expect(store.delete).toHaveBeenCalledWith({ name, path: '/', domain: '.akademate.com' })
    }
  })
})
