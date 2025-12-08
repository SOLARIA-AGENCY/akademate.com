import { describe, expect, it } from 'vitest'
import { ApiClient } from '../src/index'

describe('ApiClient', () => {
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

  it('builds headers with token and tenant', () => {
    const client = new ApiClient({ baseUrl: 'https://api.akademate.com', tenantId: 'abc', token: 'tok' })
    const headers = client.buildTenantHeaders()
    expect(headers['x-tenant-id']).toBe('abc')
    expect(headers['Authorization']).toBe('Bearer tok')
  })

  it('builds placeholder request with sanitized path', () => {
    const client = new ApiClient({ baseUrl: 'https://api.akademate.com' })
    const req = client.placeholderRequest({ path: '/courses', tenantId: 't1', traceId: 'trace-1' })
    expect(req.url).toBe('https://api.akademate.com/courses')
    expect(req.headers['x-tenant-id']).toBe('t1')
    expect(req.traceId).toBe('trace-1')
  })
})
