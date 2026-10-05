// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import { SESSION_V2_COOKIE, verifySessionV2 } from '@/lib/server/session'

const { mockGetPayload } = vi.hoisted(() => ({ mockGetPayload: vi.fn() }))
vi.mock('payload', () => ({ getPayload: mockGetPayload }))

import {
  GET as devLoginGet,
  POST as devLoginPost,
} from '@/app/api/auth/dev-login/route'
import { GET as apiAutoLoginGet } from '@/app/api/dev/auto-login/route'
import { GET as pageAutoLoginGet } from '@/app/(app)/dev/auto-login/route'

describe('development auth routes in production', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  for (const [name, handler, method] of [
    ['GET /api/auth/dev-login', devLoginGet, 'GET'],
    ['POST /api/auth/dev-login', devLoginPost, 'POST'],
    ['GET /api/dev/auto-login', apiAutoLoginGet, 'GET'],
    ['GET /dev/auto-login', pageAutoLoginGet, 'GET'],
  ] as const) {
    it(`${name} returns 404 without performing login`, async () => {
      vi.stubEnv('NODE_ENV', 'production')
      vi.stubEnv('ALLOW_DEV_AUTO_LOGIN', 'true')
      const path = name.slice(name.indexOf(' ') + 1)
      const response = await handler(
        new NextRequest(`https://app.akademate.com${path}`, { method }),
      )

      expect(response.status).toBe(404)
      expect(mockGetPayload).not.toHaveBeenCalled()
    })
  }

  it('dev-login emits a verified v2 cookie without recreating legacy cookies', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    vi.stubEnv('ALLOW_DEV_AUTO_LOGIN', 'true')
    vi.stubEnv('PAYLOAD_SUPERADMIN_EMAIL', 'dev-admin@tenant.test')
    vi.stubEnv('PAYLOAD_SUPERADMIN_PASSWORD', 'configured-only-in-env')
    vi.stubEnv('PAYLOAD_SECRET', 'payload-secret-that-is-long-enough')
    vi.stubEnv('SESSION_SIGNING_SECRET_CURRENT', 'current-session-secret-that-is-long-enough')
    const now = Math.floor(Date.now() / 1000)
    const payloadToken = await new SignJWT({
      id: 'dev-1', collection: 'users', session_version: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 60 * 60)
      .sign(new TextEncoder().encode(process.env.PAYLOAD_SECRET!))
    mockGetPayload.mockResolvedValue({
      login: vi.fn().mockResolvedValue({
        token: payloadToken,
        user: {
          id: 'dev-1',
          email: 'dev-admin@tenant.test',
          role: 'admin',
          tenant: { id: 'tenant-1' },
          is_active: true,
          session_version: 1,
        },
      }),
    })

    const response = await devLoginGet(
      new NextRequest('http://localhost:3009/api/auth/dev-login?redirect=/dashboard'),
    )

    expect(response.status).toBe(302)
    expect(response.cookies.get('payload-token')?.value).toBe(payloadToken)
    const sessionToken = response.cookies.get(SESSION_V2_COOKIE)?.value
    expect(sessionToken).toBeTruthy()
    await expect(verifySessionV2(sessionToken!)).resolves.toMatchObject({
      userId: 'dev-1',
      tenantId: 'tenant-1',
      roles: ['admin'],
      sessionVersion: 1,
    })
    expect(response.cookies.get('akademate_session')?.value).toBe('')
    expect(response.cookies.get('cep_session')?.value).toBe('')
  })
})
