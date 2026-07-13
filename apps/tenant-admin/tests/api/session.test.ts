import { beforeEach, describe, expect, it, vi } from 'vitest'
import { cookies } from 'next/headers'
import { NextRequest } from 'next/server'

const { getPayloadMock, getAuthenticatedUserContextMock } = vi.hoisted(() => ({
  getPayloadMock: vi.fn(),
  getAuthenticatedUserContextMock: vi.fn(),
}))

vi.mock('payload', () => ({ getPayload: getPayloadMock }))
vi.mock('@payload-config', () => ({ default: {} }))
vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: getAuthenticatedUserContextMock,
}))

import { DELETE, GET, POST } from '@/app/api/auth/session/route'

vi.mock('next/headers', () => ({
  cookies: vi.fn(),
}))

function createCookieStore() {
  return {
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  }
}

describe('Session API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.ENFORCE_HTTPS
    getPayloadMock.mockResolvedValue({
      findByID: vi.fn().mockResolvedValue({
        id: 'verified-user',
        email: 'verified@akademate.com',
        name: 'Verified User',
        role: 'gestor',
        tenantId: 1,
      }),
    })
    getAuthenticatedUserContextMock.mockResolvedValue({ userId: 'verified-user', tenantId: 1 })
  })

  it('GET returns unauthenticated when no session cookie exists', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const response = await GET()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ user: null, authenticated: false })
    expect(store.get).toHaveBeenCalledWith('akademate_session')
    expect(store.get).toHaveBeenCalledWith('cep_session')
  })

  it('GET reads akademate_session first', async () => {
    const store = createCookieStore()
    const sessionValue = JSON.stringify({
      user: { id: 'u1', email: 'ops@akademate.com' },
      token: 'socket-token',
    })

    store.get.mockImplementation((name: string) =>
      name === 'akademate_session' ? { value: sessionValue } : undefined
    )
    vi.mocked(cookies).mockResolvedValue(store as any)

    const response = await GET()
    const payload = await response.json()

    expect(payload.authenticated).toBe(true)
    expect(payload.user).toEqual({ id: 'u1', email: 'ops@akademate.com' })
    expect(payload.socketToken).toBe('socket-token')
  })

  it('GET falls back to legacy cep_session when akademate_session is absent', async () => {
    const store = createCookieStore()
    const sessionValue = JSON.stringify({
      user: { id: 'u2', email: 'legacy@akademate.com' },
      token: 'legacy-token',
    })

    store.get.mockImplementation((name: string) =>
      name === 'cep_session' ? { value: sessionValue } : undefined
    )
    vi.mocked(cookies).mockResolvedValue(store as any)

    const response = await GET()
    const payload = await response.json()

    expect(payload.authenticated).toBe(true)
    expect(payload.user).toEqual({ id: 'u2', email: 'legacy@akademate.com' })
    expect(payload.socketToken).toBe('legacy-token')
  })

  it('GET returns unauthenticated on invalid JSON cookie content', async () => {
    const store = createCookieStore()
    store.get.mockImplementation((name: string) =>
      name === 'akademate_session' ? { value: '{invalid-json' } : undefined
    )
    vi.mocked(cookies).mockResolvedValue(store as any)

    const response = await GET()
    const payload = await response.json()

    expect(payload).toEqual({ user: null, authenticated: false })
  })

  it('GET rejects stale session metadata when the server cannot validate its token', async () => {
    const store = createCookieStore()
    const sessionValue = JSON.stringify({
      user: { id: 'u7', email: 'stale@akademate.com' },
      token: 'expired-token',
    })
    store.get.mockImplementation((name: string) =>
      name === 'akademate_session' ? { value: sessionValue } : undefined
    )
    vi.mocked(cookies).mockResolvedValue(store as any)
    getAuthenticatedUserContextMock.mockResolvedValue(null)

    const response = await GET(new NextRequest('http://localhost/api/auth/session', {
      headers: { cookie: `akademate_session=${encodeURIComponent(sessionValue)}` },
    }))

    expect(await response.json()).toEqual({ user: null, authenticated: false })
  })

  it('GET returns the current database user after validating the token', async () => {
    const store = createCookieStore()
    store.get.mockImplementation((name: string) =>
      name === 'payload-token' ? { value: 'fresh-token' } : undefined
    )
    vi.mocked(cookies).mockResolvedValue(store as any)
    const findByID = vi.fn().mockResolvedValue({
      id: 7,
      email: 'veronica.chacare@cursostenerife.es',
      name: 'Verónica Chacare',
      role: 'gestor',
    })
    getPayloadMock.mockResolvedValue({ findByID })
    getAuthenticatedUserContextMock.mockResolvedValue({ userId: 7, tenantId: 1 })

    const response = await GET(new NextRequest('http://localhost/api/auth/session', {
      headers: { cookie: 'payload-token=fresh-token' },
    }))
    const payload = await response.json()

    expect(payload).toMatchObject({
      authenticated: true,
      user: { id: 7, email: 'veronica.chacare@cursostenerife.es', role: 'gestor' },
      socketToken: 'fresh-token',
    })
    expect(findByID).toHaveBeenCalledWith(expect.objectContaining({ id: 7, overrideAccess: true }))
  })

  it('POST rejects a body without a verifiable token', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({ user: { id: 'u1' } }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error).toBe('Invalid session token')
    expect(store.set).not.toHaveBeenCalled()
  })

  it('POST writes both cookies using the verified database user', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        user: { id: 'attacker', email: 'attacker@akademate.com', role: 'superadmin' },
        token: 'socket-123',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(store.set).toHaveBeenCalledTimes(2)

    const firstCall = store.set.mock.calls[0]
    const secondCall = store.set.mock.calls[1]
    expect(firstCall[0]).toBe('akademate_session')
    expect(secondCall[0]).toBe('cep_session')
    expect(firstCall[1]).toContain('verified@akademate.com')
    expect(firstCall[1]).not.toContain('attacker@akademate.com')
    expect(firstCall[2]).toMatchObject({
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12,
    })
  })

  it('POST sets secure cookies when ENFORCE_HTTPS=true', async () => {
    process.env.ENFORCE_HTTPS = 'true'
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        user: { id: 'attacker', email: 'attacker@akademate.com' },
        token: 'socket-456',
      }),
    })

    await POST(request)

    expect(store.set).toHaveBeenCalledTimes(2)
    expect(store.set.mock.calls[0][2]).toMatchObject({ secure: true })
    expect(store.set.mock.calls[1][2]).toMatchObject({ secure: true })
  })

  it('POST rejects a token that Payload cannot authenticate', async () => {
    getAuthenticatedUserContextMock.mockResolvedValue(null)
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const request = new Request('http://localhost/api/auth/session', {
      method: 'POST',
      body: JSON.stringify({
        user: { id: 'attacker', email: 'attacker@akademate.com', role: 'superadmin' },
        token: 'forged-or-expired-token',
      }),
    })

    const response = await POST(request)
    expect(response.status).toBe(401)
    expect(store.set).not.toHaveBeenCalled()
  })

  it('DELETE removes both session cookie names', async () => {
    const store = createCookieStore()
    vi.mocked(cookies).mockResolvedValue(store as any)

    const response = await DELETE()
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(store.delete).toHaveBeenCalledWith('akademate_session')
    expect(store.delete).toHaveBeenCalledWith('cep_session')
  })
})
