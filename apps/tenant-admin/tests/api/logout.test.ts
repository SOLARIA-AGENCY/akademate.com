import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '@/app/api/auth/logout/route'
import { NextResponse } from 'next/server'
import { SESSION_V2_COOKIE } from '@/lib/server/session'

// Mock next/headers
vi.mock('next/headers', () => ({
  cookies: vi.fn(() => Promise.resolve({
    get: vi.fn(),
    set: vi.fn(),
    delete: vi.fn(),
  })),
}))

describe('Logout API', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns success response on POST', async () => {
    const response = await POST()
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.success).toBe(true)
    expect(data.message).toBe('Logged out successfully')
  })

  it('returns JSON response', async () => {
    const response = await POST()
    expect(response).toBeInstanceOf(NextResponse)

    const contentType = response.headers.get('content-type')
    expect(contentType).toContain('application/json')
  })

  it('clears cookies on logout', async () => {
    const { cookies } = await import('next/headers')
    const mockCookieStore = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
    }
    vi.mocked(cookies).mockResolvedValue(mockCookieStore as any)

    await POST(new Request('https://tenant.akademate.com/api/auth/logout', {
      headers: { host: 'tenant.akademate.com' },
    }))

    expect(mockCookieStore.delete).toHaveBeenCalledWith('payload-token')
    expect(mockCookieStore.delete).toHaveBeenCalledWith(SESSION_V2_COOKIE)
    expect(mockCookieStore.delete).toHaveBeenCalledWith('akademate_session')
    expect(mockCookieStore.delete).toHaveBeenCalledWith('cep_session')
    for (const name of ['payload-token', SESSION_V2_COOKIE, 'akademate_session', 'cep_session']) {
      expect(mockCookieStore.delete).toHaveBeenCalledWith({
        name,
        path: '/',
        domain: '.akademate.com',
      })
    }
  })
})
