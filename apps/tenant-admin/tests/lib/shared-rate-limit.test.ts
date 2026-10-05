import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import {
  enforceSensitiveRateLimit,
  rateLimitPrincipalFromJson,
  resolveRateLimitIp,
  setRateLimitRedisForTests,
  type SensitiveRateLimitOutcome,
} from '@/lib/server/rate-limit'
import type { RedisRateLimitClient } from '@akademate/api'

class FakeRedis implements RedisRateLimitClient {
  count = 0
  outage = false

  async eval(): Promise<unknown> {
    if (this.outage) throw new Error('offline')
    this.count += 1
    return [this.count, 60_000]
  }
}

describe('tenant-admin shared rate limiter', () => {
  beforeEach(() => {
    delete process.env.TRUST_PROXY_HEADERS
    setRateLimitRedisForTests(undefined)
  })

  it('does not trust spoofable forwarded IP headers by default', () => {
    const request = new Request('https://tenant.test/api/users/login', {
      headers: { 'x-forwarded-for': '198.51.100.9', 'cf-connecting-ip': '198.51.100.10' },
    })
    expect(resolveRateLimitIp(request)).toBe('unknown')
  })

  it('uses forwarded IP only when explicitly trusted', () => {
    process.env.TRUST_PROXY_HEADERS = 'true'
    const request = new Request('https://tenant.test/api/users/login', {
      headers: { 'x-forwarded-for': '198.51.100.9, 10.0.0.2' },
    })
    expect(resolveRateLimitIp(request)).toBe('198.51.100.9')
  })

  it('discovers a principal without consuming the original request body', async () => {
    const request = new Request('https://tenant.test/api/users/login', {
      method: 'POST', body: JSON.stringify({ email: ' Person@Example.com ', password: 'secret' }),
    })
    expect(await rateLimitPrincipalFromJson(request)).toBe('person@example.com')
    expect(await request.json()).toMatchObject({ email: ' Person@Example.com ' })
  })

  it('returns 429 with headers when quota is exhausted', async () => {
    const redis = new FakeRedis()
    redis.count = 5
    setRateLimitRedisForTests(redis)
    const outcome = await enforceSensitiveRateLimit(new Request('https://tenant.test'), { action: 'login' })
    expect(outcome).toMatchObject({ allowed: false, status: 429, code: 'RATE_LIMIT_EXCEEDED' })
    expect((outcome as Extract<SensitiveRateLimitOutcome, { allowed: false }>).headers['Retry-After']).toBeDefined()
  })

  it('returns 503 without a memory fallback when Redis is unavailable', async () => {
    const redis = new FakeRedis()
    redis.outage = true
    setRateLimitRedisForTests(redis)
    const outcome = await enforceSensitiveRateLimit(new Request('https://tenant.test'), { action: 'gdpr' })
    expect(outcome).toMatchObject({ allowed: false, status: 503, code: 'SERVICE_UNAVAILABLE' })
    expect(outcome.headers['X-RateLimit-Backend']).toBe('unavailable')
  })
})
