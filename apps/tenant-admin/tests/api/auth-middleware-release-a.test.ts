// @vitest-environment node

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { SignJWT } from 'jose'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { SESSION_V2_COOKIE, signSessionV2, type VerifiedPrincipal } from '@/lib/server/session'

const encoder = new TextEncoder()
async function v2Cookie(overrides: Partial<VerifiedPrincipal> = {}) {
  const now = Math.floor(Date.now() / 1000)
  const token = await signSessionV2({
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
    sessionVersion: 1,
    sessionId: 'session-1',
    issuedAt: now,
    expiresAt: now + 60 * 60,
    ...overrides,
  })
  return `${SESSION_V2_COOKIE}=${token}`
}

async function payloadToken(secret = process.env.PAYLOAD_SECRET!) {
  const now = Math.floor(Date.now() / 1000)
  return new SignJWT({
    id: 'user-1',
    collection: 'users',
    tenant: 'tenant-1',
    role: 'admin',
    session_version: 1,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt(now)
    .setExpirationTime(now + 60 * 60)
    .sign(encoder.encode(secret))
}

describe('middleware auth Release A', () => {
  beforeEach(() => {
    process.env.PAYLOAD_SECRET = 'payload-secret-that-is-long-enough'
    process.env.SESSION_SIGNING_SECRET_CURRENT = 'current-session-secret-that-is-long-enough'
    delete process.env.SESSION_SIGNING_SECRET_PREVIOUS
    process.env.ALLOW_DEV_AUTO_LOGIN = 'true'
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('allows a protected route with a cryptographically verified v2 cookie', async () => {
    const request = new NextRequest('https://app.akademate.com/dashboard', {
      headers: { cookie: await v2Cookie() },
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  it('allows a protected route with a cryptographically verified Payload token', async () => {
    const request = new NextRequest('https://app.akademate.com/dashboard', {
      headers: { cookie: `payload-token=${await payloadToken()}` },
    })

    const response = await middleware(request)

    expect(response.status).toBe(200)
  })

  it('rejects token-presence JSON in legacy cookies', async () => {
    const legacy = encodeURIComponent(JSON.stringify({ token: await payloadToken() }))
    const request = new NextRequest('https://app.akademate.com/api/internal/users', {
      headers: { cookie: `akademate_session=${legacy}` },
    })

    const response = await middleware(request)

    expect(response.status).toBe(401)
  })

  it('routes a legacy browser session through the public exchange without authenticating it', async () => {
    const legacy = encodeURIComponent(JSON.stringify({ token: await payloadToken() }))
    const request = new NextRequest('https://app.akademate.com/dashboard/cursos?view=list', {
      headers: { cookie: `akademate_session=${legacy}` },
    })

    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      'https://app.akademate.com/auth/session-exchange?redirect=%2Fdashboard%2Fcursos%3Fview%3Dlist',
    )
  })

  it('rejects a forged Payload token', async () => {
    const request = new NextRequest('https://app.akademate.com/api/internal/users', {
      headers: { cookie: `payload-token=${await payloadToken('attacker-controlled-secret')}` },
    })

    const response = await middleware(request)

    expect(response.status).toBe(401)
  })

  for (const path of ['/api/auth/dev-login', '/api/dev/auto-login', '/dev/auto-login']) {
    it(`returns 404 for ${path} in production`, async () => {
      vi.stubEnv('NODE_ENV', 'production')
      const request = new NextRequest(`https://app.akademate.com${path}`)

      const response = await middleware(request)

      expect(response.status).toBe(404)
    })
  }
})
