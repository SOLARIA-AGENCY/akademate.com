// @vitest-environment node

import { afterEach, describe, expect, it, vi } from 'vitest'
import { resolveClientIp } from '@/lib/server/request-metadata'

describe('proxy-aware request metadata', () => {
  afterEach(() => vi.unstubAllEnvs())

  it('does not trust forwarded IP headers by default', () => {
    const request = new Request('https://tenant.akademate.com/api/auth/impersonate', {
      headers: { 'x-forwarded-for': '203.0.113.9', 'x-real-ip': '198.51.100.8' },
    })

    expect(resolveClientIp(request)).toEqual({ address: null, source: 'untrusted' })
  })

  it('records the first forwarded IP only when explicitly trusted', () => {
    vi.stubEnv('TRUST_PROXY_HEADERS', 'true')
    const request = new Request('https://tenant.akademate.com/api/auth/impersonate', {
      headers: { 'x-forwarded-for': '203.0.113.9, 10.0.0.2' },
    })

    expect(resolveClientIp(request)).toEqual({
      address: '203.0.113.9',
      source: 'x-forwarded-for',
    })
  })
})
