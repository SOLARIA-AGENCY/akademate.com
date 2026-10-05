import { describe, expect, it } from 'vitest'

import {
  dashboardNavigation,
  dashboardNavigationUrls,
  flattenNavigation,
  visibleNavigationForRole,
} from '@/lib/navigation/dashboard'

function urlsForRole(role: string): string[] {
  return flattenNavigation(visibleNavigationForRole(role))
    .map((item) => item.url)
    .filter((url): url is string => Boolean(url))
}

describe('dashboard navigation contract', () => {
  it('uses one catalog with valid, unique routes', () => {
    expect(dashboardNavigation.length).toBeGreaterThan(10)
    expect(dashboardNavigationUrls.every((url) => url.startsWith('/'))).toBe(true)
    expect(new Set(dashboardNavigationUrls).size).toBe(dashboardNavigationUrls.length)
  })

  it('exposes the sensitive administration and finance sections only to admin roles', () => {
    const readerUrls = urlsForRole('lectura')
    const adminUrls = urlsForRole('admin')

    expect(readerUrls).not.toContain('/administracion/usuarios')
    expect(readerUrls).not.toContain('/finanzas')
    expect(adminUrls).toContain('/administracion/usuarios')
    expect(adminUrls).toContain('/finanzas')
  })

  it('keeps marketing and content routes visible to marketing, without admin controls', () => {
    const marketingUrls = urlsForRole('marketing')

    expect(marketingUrls).toContain('/campanas')
    expect(marketingUrls).toContain('/contenido/blog')
    expect(marketingUrls).not.toContain('/administracion/roles')
    expect(marketingUrls).not.toContain('/finanzas/facturacion')
  })

  it('fails closed for an unknown role', () => {
    expect(urlsForRole('unknown-role')).toEqual([])
  })

  it('keeps the navigation catalog separate from server authorization', () => {
    const text = JSON.stringify(dashboardNavigation)
    expect(text).not.toContain('tenantId')
    expect(text).not.toContain('permissionBypass')
  })
})
