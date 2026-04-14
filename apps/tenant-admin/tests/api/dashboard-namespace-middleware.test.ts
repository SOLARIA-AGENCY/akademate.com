import { describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'
import { middleware } from '@/middleware'

function getHeader(response: Response, key: string): string {
  return response.headers.get(key) || ''
}

describe('Dashboard namespace middleware compatibility', () => {
  it('rewrites authenticated /dashboard/cursos to internal /cursos page', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: {
        cookie: 'payload-token=session-token',
        host: 'cepformacion.akademate.com',
      },
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/cursos',
    )
  })

  it('rewrites authenticated /dashboard/ciclos to internal /ciclos page', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/ciclos', {
      headers: {
        cookie: 'payload-token=session-token',
        host: 'cepformacion.akademate.com',
      },
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/ciclos',
    )
  })

  it('rewrites authenticated /dashboard/convocatorias to internal /programacion page', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/convocatorias', {
      headers: {
        cookie: 'payload-token=session-token',
        host: 'cepformacion.akademate.com',
      },
    })
    const response = middleware(request)

    expect(response.status).toBe(200)
    expect(getHeader(response, 'x-middleware-rewrite')).toBe(
      'https://cepformacion.akademate.com/programacion',
    )
  })

  it('keeps /dashboard/* protected when unauthenticated', () => {
    const request = new NextRequest('https://cepformacion.akademate.com/dashboard/cursos', {
      headers: { host: 'cepformacion.akademate.com' },
    })
    const response = middleware(request)

    expect(response.status).toBe(307)
    expect(getHeader(response, 'location')).toContain('/auth/login?redirect=%2Fdashboard%2Fcursos')
  })
})
