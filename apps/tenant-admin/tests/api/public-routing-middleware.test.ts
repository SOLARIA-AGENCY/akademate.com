import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

function getHeader(response: Response, key: string): string {
  return response.headers.get(key) || ''
}

describe('Public website routing middleware', () => {
  it('redirects legacy /p/formacion to canonical root', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/p/formacion')
    const response = middleware(request)

    expect(response.status).toBe(301)
    expect(getHeader(response, 'location')).toBe('https://cepformacion.akademate.com/')
  })

  it('redirects auth login path to canonical /login', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/auth/login')
    const response = middleware(request)

    expect(response.status).toBe(301)
    expect(getHeader(response, 'location')).toBe('https://cepformacion.akademate.com/login')
  })

  it('rewrites anonymous canonical /cursos to legacy public source /p/cursos', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/cursos')
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/cursos'
    )
  })

  it('rewrites anonymous canonical /ciclos to legacy public source /p/ciclos', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/ciclos')
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/ciclos'
    )
  })

  it('serves canonical /convocatorias directly without legacy rewrite', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/convocatorias')
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe('')
  })

  it('keeps canonical website routes public on CEP host even for authenticated users', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/cursos', {
      headers: { cookie: 'payload-token=session-token' },
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/p/cursos'
    )
  })

  it('redirects legacy internal catalog URLs to /dashboard/* on non-CEP hosts', () => {
    const request = new NextRequest('https://app.akademate.com/cursos', {
      headers: { cookie: 'payload-token=session-token' },
    })
    const response = middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toBe('https://app.akademate.com/dashboard/cursos')
  })

  it('keeps root as public page without redirecting to login', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/')
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'location')).toBe('')
  })

  it('rewrites authenticated dashboard-prefixed internal routes to legacy dashboard pages', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: { cookie: 'payload-token=session-token' },
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/cursos'
    )
  })

  it('keeps dashboard-prefixed internal routes protected without auth', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos')
    const response = middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toContain('/login?redirect=%2Fdashboard%2Fcursos')
  })
})
