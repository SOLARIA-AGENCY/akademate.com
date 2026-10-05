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

describe('Public website routing middleware', () => {
  it('redirects legacy /p/formacion to canonical root', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/p/formacion')
    const response = await middleware(request)

    expect(response.status).toBe(301)
    expect(getHeader(response, 'location')).toBe('https://cepformacion.akademate.com/')
  })

  it('serves auth login path directly on CEP host', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/auth/login')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('rewrites anonymous canonical /cursos to legacy public source /p/cursos', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/cursos')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/cursos'
    )
  })

  it('rewrites anonymous canonical /ciclos to legacy public source /p/ciclos', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/ciclos')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/ciclos'
    )
  })

  it('serves canonical /convocatorias directly without legacy rewrite', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/convocatorias')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe('')
  })

  it('serves public convocation detail pages without redirecting to login', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/convocatorias/SC-2026-009')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('keeps legacy public convocation detail pages public', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/p/convocatorias/SC-2026-009')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('keeps canonical website routes public on CEP host even for authenticated users', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/cursos', {
      headers: { cookie: await authenticatedCookie() },
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/cursos'
    )
  })

  it('redirects legacy internal catalog URLs to /dashboard/* on non-CEP hosts', async () => {
    const request = new NextRequest('https://app.akademate.com/cursos', {
      headers: { cookie: await authenticatedCookie() },
    })
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toBe('https://app.akademate.com/dashboard/cursos')
  })

  it('keeps root as public page without redirecting to login', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('keeps CEP static website assets public', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/website/cep/hero/cepformacion-hero-01.png')
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('keeps CEP root public for HEAD checks', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/', {
      method: 'HEAD',
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('rewrites authenticated dashboard-prefixed internal routes to legacy dashboard pages', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: { cookie: await authenticatedCookie() },
    })
    const response = await middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/cursos'
    )
  })

  it('keeps dashboard-prefixed internal routes protected without auth', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos')
    const response = await middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toContain('/login?redirect=%2Fdashboard%2Fcursos')
  })
})
