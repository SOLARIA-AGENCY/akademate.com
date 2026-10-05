import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextResponse } from 'next/server'

const mocks = vi.hoisted(() => ({
  enforce: vi.fn(),
  sendMail: vi.fn(),
}))

vi.mock('@/lib/server/rate-limit', () => ({
  enforceSensitiveRateLimit: mocks.enforce,
  sensitiveRateLimitResponse: (outcome: { status: number; code: string; retryAfter: number; headers: Record<string, string> }) =>
    NextResponse.json(
      { error: outcome.status === 429 ? 'Too many requests' : 'Service temporarily unavailable', code: outcome.code },
      { status: outcome.status, headers: outcome.headers },
    ),
}))

vi.mock('@/src/lib/email', () => ({
  sendMail: mocks.sendMail,
  welcomeUserEmail: () => ({ subject: 'subject', html: 'html' }),
}))

import { POST } from '@/app/api/email/send-welcome/route'

function request(): Request {
  return new Request('https://tenant.test/api/email/send-welcome', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ name: 'User', email: 'person@example.com', password: 'secret' }),
  })
}

describe('sensitive route rate-limit integration', () => {
  beforeEach(() => vi.clearAllMocks())

  it('invokes the shared limiter and preserves a 429 rejection', async () => {
    mocks.enforce.mockResolvedValue({
      allowed: false,
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 30,
      headers: { 'Retry-After': '30', 'X-RateLimit-Remaining': '0' },
    })

    const response = await POST(request() as never)
    expect(mocks.enforce).toHaveBeenCalledWith(expect.any(Request), {
      action: 'email', principalId: 'person@example.com',
    })
    expect(response.status).toBe(429)
    expect(response.headers.get('retry-after')).toBe('30')
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })

  it('preserves a 503 backend outage and does not execute the route action', async () => {
    mocks.enforce.mockResolvedValue({
      allowed: false,
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      retryAfter: 1,
      headers: { 'Retry-After': '1', 'X-RateLimit-Backend': 'unavailable' },
    })

    const response = await POST(request() as never)
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({ code: 'SERVICE_UNAVAILABLE' })
    expect(mocks.sendMail).not.toHaveBeenCalled()
  })
})
