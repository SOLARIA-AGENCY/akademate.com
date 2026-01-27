import { describe, expect, it } from 'vitest'
import {
  resolveTenantFromHost,
  parseTenantCookie,
  getFullTenantResolution,
  TENANT_HEADER,
  TENANT_COOKIE,
} from '../src/resolver'

describe('resolveTenantFromHost', () => {
  describe('subdomain resolution', () => {
    it('resolves tenant from subdomain on akademate.io', () => {
      const result = resolveTenantFromHost('demo.akademate.io')
      expect(result.tenantSlug).toBe('demo')
      expect(result.source).toBe('subdomain')
      expect(result.isValid).toBe(true)
    })

    it('resolves tenant from subdomain on akademate.com', () => {
      const result = resolveTenantFromHost('customer.akademate.com')
      expect(result.tenantSlug).toBe('customer')
      expect(result.source).toBe('subdomain')
      expect(result.isValid).toBe(true)
    })

    it('resolves tenant from subdomain on localhost', () => {
      const result = resolveTenantFromHost('demo.localhost')
      expect(result.tenantSlug).toBe('demo')
      expect(result.source).toBe('subdomain')
      expect(result.isValid).toBe(true)
    })

    it('handles port in hostname', () => {
      const result = resolveTenantFromHost('demo.localhost:3000')
      expect(result.tenantSlug).toBe('demo')
      expect(result.isValid).toBe(true)
    })
  })

  describe('system subdomains', () => {
    const systemSubdomains = ['www', 'api', 'admin', 'app', 'dashboard', 'docs', 'status', 'mail']

    systemSubdomains.forEach((subdomain) => {
      it(`rejects system subdomain: ${subdomain}`, () => {
        const result = resolveTenantFromHost(`${subdomain}.akademate.io`)
        expect(result.isValid).toBe(false)
        expect(result.tenantSlug).toBe(null)
      })
    })
  })

  describe('main domain', () => {
    it('returns invalid for base domain akademate.io', () => {
      const result = resolveTenantFromHost('akademate.io')
      expect(result.isValid).toBe(false)
      expect(result.tenantSlug).toBe(null)
    })

    it('returns invalid for base domain localhost', () => {
      const result = resolveTenantFromHost('localhost')
      expect(result.isValid).toBe(false)
      expect(result.tenantSlug).toBe(null)
    })

    it('returns invalid for localhost with port', () => {
      const result = resolveTenantFromHost('localhost:3000')
      expect(result.isValid).toBe(false)
      expect(result.tenantSlug).toBe(null)
    })
  })

  describe('custom domains', () => {
    it('resolves custom domain when mapping exists', () => {
      const customDomains = new Map([['custom-academy.com', 'custom-academy']])
      const result = resolveTenantFromHost('custom-academy.com', customDomains)
      expect(result.tenantSlug).toBe('custom-academy')
      expect(result.source).toBe('domain')
      expect(result.isValid).toBe(true)
    })

    it('returns invalid for unknown custom domain', () => {
      const customDomains = new Map<string, string>()
      const result = resolveTenantFromHost('unknown.com', customDomains)
      expect(result.isValid).toBe(false)
    })
  })
})

describe('parseTenantCookie', () => {
  it('returns null for null input', () => {
    expect(parseTenantCookie(null)).toBe(null)
  })

  it('returns null for empty string', () => {
    expect(parseTenantCookie('')).toBe(null)
  })

  it('parses tenant cookie from cookie string', () => {
    const cookies = `other=value; ${TENANT_COOKIE}=tenant-123; another=test`
    expect(parseTenantCookie(cookies)).toBe('tenant-123')
  })

  it('returns null when tenant cookie not present', () => {
    const cookies = 'other=value; another=test'
    expect(parseTenantCookie(cookies)).toBe(null)
  })
})

describe('getFullTenantResolution', () => {
  const createMockHeaders = (headers: Record<string, string>) => ({
    get: (name: string) => headers[name.toLowerCase()] ?? null,
  })

  it('prioritizes header over cookie', () => {
    const headers = createMockHeaders({
      [TENANT_HEADER]: 'header-tenant',
      cookie: `${TENANT_COOKIE}=cookie-tenant`,
      host: 'demo.akademate.io',
    })

    const result = getFullTenantResolution(headers)
    expect(result.tenantId).toBe('header-tenant')
    expect(result.source).toBe('header')
  })

  it('prioritizes cookie over subdomain', () => {
    const headers = createMockHeaders({
      cookie: `${TENANT_COOKIE}=cookie-tenant`,
      host: 'demo.akademate.io',
    })

    const result = getFullTenantResolution(headers)
    expect(result.tenantId).toBe('cookie-tenant')
    expect(result.source).toBe('cookie')
  })

  it('falls back to subdomain when no header or cookie', () => {
    const headers = createMockHeaders({
      host: 'demo.akademate.io',
    })

    const result = getFullTenantResolution(headers)
    expect(result.tenantSlug).toBe('demo')
    expect(result.source).toBe('subdomain')
  })

  it('returns invalid when no tenant source available', () => {
    const headers = createMockHeaders({
      host: 'akademate.io',
    })

    const result = getFullTenantResolution(headers)
    expect(result.isValid).toBe(false)
    expect(result.source).toBe('none')
  })
})
