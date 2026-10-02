import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_ORIGIN,
  dashboardVisitorRedirect,
  isDashboardHostname,
  isDashboardVisitorPath,
  rewriteDashboardLocation,
  stripCookieDomain,
} from './dashboard-proxy'

describe('dashboard hostname', () => {
  it('matches only the canonical CEP dashboard host', () => {
    expect(isDashboardHostname('dashboard.cepformacion.com')).toBe(true)
    expect(isDashboardHostname('DASHBOARD.cepformacion.com:443')).toBe(true)
    expect(isDashboardHostname('cepformacion.com')).toBe(false)
    expect(isDashboardHostname('cepformacion-app.akademate.com')).toBe(false)
  })
})

describe('dashboard location rewrite', () => {
  it('rewrites absolute origin redirects onto the canonical dashboard host', () => {
    expect(rewriteDashboardLocation('https://cepformacion-app.akademate.com/dashboard', 'https://cepformacion-app.akademate.com')).toBe(
      `${DASHBOARD_ORIGIN}/dashboard`,
    )
    expect(rewriteDashboardLocation('https://cepformacion-app.akademate.com/dashboard', 'https://origin.cepformacion.com')).toBe(
      `${DASHBOARD_ORIGIN}/dashboard`,
    )
    expect(rewriteDashboardLocation('https://origin.cepformacion.com/auth/login', 'https://origin.cepformacion.com')).toBe(
      `${DASHBOARD_ORIGIN}/auth/login`,
    )
    expect(rewriteDashboardLocation('/auth/login', 'https://cepformacion-app.akademate.com')).toBe('/auth/login')
  })
})

describe('dashboard visitor paths', () => {
  it('keeps the public site off the canonical admin host', () => {
    expect(isDashboardVisitorPath('/')).toBe(true)
    expect(isDashboardVisitorPath('/p/cursos')).toBe(true)
    expect(isDashboardVisitorPath('/auth/login')).toBe(false)
    expect(isDashboardVisitorPath('/dashboard')).toBe(false)

    const redirect = dashboardVisitorRedirect(new Request(`${DASHBOARD_ORIGIN}/`))
    expect(redirect?.status).toBe(307)
    expect(redirect?.headers.get('location')).toBe(`${DASHBOARD_ORIGIN}/dashboard`)
    expect(dashboardVisitorRedirect(new Request(`${DASHBOARD_ORIGIN}/auth/login`))).toBeNull()
  })
})

describe('dashboard cookies', () => {
  it('drops Domain so the browser scopes the cookie to dashboard.cepformacion.com', () => {
    expect(stripCookieDomain('payload-token=abc; Path=/; Domain=.akademate.com; HttpOnly')).toBe(
      'payload-token=abc; Path=/; HttpOnly',
    )
  })
})
