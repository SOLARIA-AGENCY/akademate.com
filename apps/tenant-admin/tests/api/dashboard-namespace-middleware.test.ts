// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'
import { signSessionV2 } from '@/lib/server/session'

function getHeader(response: Response, key: string): string {
  return response.headers.get(key) || ''
}

async function authenticatedCookie() {
  process.env.SESSION_SIGNING_SECRET_CURRENT = 'middleware-test-secret-that-is-long-enough'
  const now = Math.floor(Date.now() / 1000)
  const token = await signSessionV2({
    userId: 'user-1',
    tenantId: 'tenant-1',
    roles: ['admin'],
    sessionVersion: 1,
    sessionId: 'middleware-session',
    issuedAt: now,
    expiresAt: now + 60 * 60,
  })
  return `akademate_session_v2=${token}`
}

describe('Dashboard namespace middleware compatibility', () => {
  it('rewrites authenticated /dashboard/cursos to internal /cursos page', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: {
        cookie: await authenticatedCookie(),
        host: 'cepformacion.akademate.com',
      },
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/cursos',
    )
  })

  it('rewrites authenticated /dashboard/ciclos to internal /ciclos page', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/ciclos', {
      headers: {
        cookie: await authenticatedCookie(),
        host: 'cepformacion.akademate.com',
      },
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/ciclos',
    )
  })

  it('rewrites authenticated /dashboard/convocatorias to internal /programacion page', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/convocatorias', {
      headers: {
        cookie: await authenticatedCookie(),
        host: 'cepformacion.akademate.com',
      },
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/programacion',
    )
  })

  it('keeps /dashboard/* protected when unauthenticated', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: { host: 'cepformacion.akademate.com' },
    })
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toContain('/auth/login?redirect=%2Fdashboard%2Fcursos')
  })
})
