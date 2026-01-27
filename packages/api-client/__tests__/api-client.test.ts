import { describe, expect, it } from 'vitest'
import { ApiClient, type ApiClientOptions, type RequestContext } from '../src/index'

describe('ApiClient', () => {
  describe('constructor', () => {
    it('initializes with minimal options', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      expect(client).toBeInstanceOf(ApiClient)
    })

    it('initializes with all options', () => {
      const options: ApiClientOptions = {
        baseUrl: 'https://api.akademate.com',
        tenantId: 'tenant-1',
        token: 'jwt-token',
      }
      const client = new ApiClient(options)
      expect(client).toBeInstanceOf(ApiClient)
    })
  })

  describe('resolveTenant', () => {
    it('resolves tenant from host or option', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const res = client.resolveTenant('tenant123.akademate.com')
      expect(res.tenantId).toBe('tenant123')
    })

    it('respects provided tenantId option', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'forced' })
      const res = client.resolveTenant('foo.akademate.com')
      expect(res.tenantId).toBe('forced')
    })

    it('normalizes host to lowercase', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const res = client.resolveTenant('TENANT123.Akademate.COM')
      expect(res.host).toBe('tenant123.akademate.com')
    })

    it('trims whitespace from host', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const res = client.resolveTenant('  tenant123.akademate.com  ')
      expect(res.tenantId).toBe('tenant123')
    })

    it('returns cleaned host in resolution', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const res = client.resolveTenant('tenant.sub.akademate.com')
      expect(res.host).toBe('tenant.sub.akademate.com')
      expect(res.tenantId).toBe('tenant')
    })
  })

  describe('buildTenantHeaders', () => {
    it('builds headers with token and tenant', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'abc', token: 'tok' })
      const headers = client.buildTenantHeaders()
      expect(headers['x-tenant-id']).toBe('abc')
      expect(headers.Authorization).toBe('Bearer tok')
    })

    it('builds headers without token', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'abc' })
      const headers = client.buildTenantHeaders()
      expect(headers['x-tenant-id']).toBe('abc')
      expect(headers.Authorization).toBeUndefined()
    })

    it('uses provided tenantId over default', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'default' })
      const headers = client.buildTenantHeaders('override')
      expect(headers['x-tenant-id']).toBe('override')
    })

    it('returns empty object when no tenant', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const headers = client.buildTenantHeaders()
      expect(headers).toEqual({})
    })
  })

  describe('placeholderRequest', () => {
    it('builds placeholder request with sanitized path', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const req = client.placeholderRequest({ path: '/courses', tenantId: 't1', traceId: 'trace-1' })
      expect(req.url).toBe('https://api.akademate.com/courses')
      expect(req.headers['x-tenant-id']).toBe('t1')
      expect(req.traceId).toBe('trace-1')
    })

    it('handles path without leading slash', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const req = client.placeholderRequest({ path: 'courses', tenantId: 't1' })
      expect(req.url).toBe('https://api.akademate.com/courses')
    })

    it('handles baseUrl with trailing slash', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com/' })
      const req = client.placeholderRequest({ path: '/courses', tenantId: 't1' })
      expect(req.url).toBe('https://api.akademate.com/courses')
    })

    it('handles deeply nested paths', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const req = client.placeholderRequest({ path: '/api/v1/courses/123/lessons', tenantId: 't1' })
      expect(req.url).toBe('https://api.akademate.com/api/v1/courses/123/lessons')
    })

    it('includes note about implementation', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
      const req = client.placeholderRequest({ path: '/courses', tenantId: 't1' })
      expect(req.note).toContain('Implement real fetch')
    })

    it('falls back to options tenantId when context tenantId not provided', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'default-tenant' })
      const req = client.placeholderRequest({ path: '/courses' })
      expect(req.tenantId).toBe('default-tenant')
      expect(req.headers['x-tenant-id']).toBe('default-tenant')
    })

    it('handles optional traceId', () => {
      const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 't1' })
      const req = client.placeholderRequest({ path: '/courses' })
      expect(req.traceId).toBeUndefined()
    })
  })

  describe('type exports', () => {
    it('exports ApiClientOptions type', () => {
      const options: ApiClientOptions = {
        baseUrl: 'https://api.akademate.com',
        tenantId: 'tenant-1',
        token: 'token',
      }
      expect(options.baseUrl).toBe('https://api.akademate.com')
    })

    it('exports RequestContext type', () => {
      const context: RequestContext = {
        path: '/courses',
        tenantId: 'tenant-1',
        traceId: 'trace-123',
      }
      expect(context.path).toBe('/courses')
    })
  })
})
