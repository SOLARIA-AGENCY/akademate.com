import { afterEach, describe, expect, it } from 'vitest'
import { NextRequest } from 'next/server'

import { GET as getHealth } from '@/app/api/health/route'
import { GET as getLive } from '@/app/api/health/live/route'
import { GET as getReady } from '@/app/api/health/ready/route'
import { GET as getDevAutoLogin } from '@/app/api/dev/auto-login/route'
import { GET as getDevLogin } from '@/app/api/auth/dev-login/route'
import { middleware } from '@/middleware'

const originalNodeEnv = process.env.NODE_ENV
const originalDevBypass = process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS
const originalAllowDevLogin = process.env.ALLOW_DEV_LOGIN
const originalAllowDevAutoLogin = process.env.ALLOW_DEV_AUTO_LOGIN
const originalAppRevision = process.env.APP_REVISION

function restoreEnvironment() {
  if (originalNodeEnv === undefined) delete process.env.NODE_ENV
  else process.env.NODE_ENV = originalNodeEnv

  if (originalDevBypass === undefined) delete process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS
  else process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS = originalDevBypass

  if (originalAllowDevLogin === undefined) delete process.env.ALLOW_DEV_LOGIN
  else process.env.ALLOW_DEV_LOGIN = originalAllowDevLogin

  if (originalAllowDevAutoLogin === undefined) delete process.env.ALLOW_DEV_AUTO_LOGIN
  else process.env.ALLOW_DEV_AUTO_LOGIN = originalAllowDevAutoLogin

  if (originalAppRevision === undefined) delete process.env.APP_REVISION
  else process.env.APP_REVISION = originalAppRevision
}

afterEach(restoreEnvironment)

describe('production hardening', () => {
  it('keeps the legacy health endpoint available', async () => {
    const response = getHealth()
    expect(response.status).toBe(200)
    expect((await response.json()).status).toBe('healthy')
  })

  it('returns live without consulting dependencies', async () => {
    process.env.APP_REVISION = '0123456789abcdef'
    const response = getLive()
    expect(response.status).toBe(200)
    expect(await response.json()).toMatchObject({
      status: 'ok',
      check: 'live',
      revision: '0123456789abcdef',
    })
  })

  it('fails readiness closed when the database is not configured', async () => {
    delete process.env.DATABASE_URL
    delete process.env.DATABASE_URI

    const response = await getReady()
    expect(response.status).toBe(503)
    expect(await response.json()).toMatchObject({
      status: 'not_ready',
      checks: { database: 'not_configured' },
    })
  })

  it('does not expose dev-login in production even when bypass flags are present', async () => {
    process.env.NODE_ENV = 'production'
    process.env.NEXT_PUBLIC_DEV_AUTH_BYPASS = 'true'
    process.env.ALLOW_DEV_LOGIN = 'true'

    const request = new NextRequest('https://example.test/api/auth/dev-login', { method: 'POST' })
    const response = await getDevLogin(request)

    expect(response.status).toBe(404)
  })

  it('does not expose auto-login in production', async () => {
    process.env.NODE_ENV = 'production'
    process.env.ALLOW_DEV_AUTO_LOGIN = 'true'

    const request = new NextRequest('https://example.test/api/dev/auto-login')
    const response = await getDevAutoLogin(request)

    expect(response.status).toBe(404)
  })

  it('returns 404 from middleware before production dev routes reach handlers', () => {
    process.env.NODE_ENV = 'production'

    const devLogin = middleware(new NextRequest('https://example.test/api/auth/dev-login'))
    const autoLogin = middleware(new NextRequest('https://example.test/api/dev/auto-login'))

    expect(devLogin.status).toBe(404)
    expect(autoLogin.status).toBe(404)
  })
})
