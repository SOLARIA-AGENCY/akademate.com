import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  checkRateLimit,
  composeRateLimitKey,
  createRateLimiter,
  getRateLimitHeaders,
  RateLimitPresets,
  type RateLimitConfig,
  type RedisRateLimitClient,
} from '../src/middleware/rateLimit'
import type { ApiContext } from '../src/context'
import { ApiError } from '../src/errors'

class FakeRedis implements RedisRateLimitClient {
  private readonly entries = new Map<string, { count: number; expiresAt: number }>()
  outage = false
  missingTtl = false
  calls: Array<{ key: string; windowMs: number }> = []

  async eval(_script: string, keys: string[], args: string[]): Promise<unknown> {
    if (this.outage) throw new Error('redis unavailable')
    const key = keys[0]!
    const windowMs = Number(args[0])
    const now = Date.now()
    const existing = this.entries.get(key)
    const entry = !existing || existing.expiresAt <= now
      ? { count: 1, expiresAt: now + windowMs }
      : { count: existing.count + 1, expiresAt: this.missingTtl ? now + windowMs : existing.expiresAt }
    this.missingTtl = false
    this.entries.set(key, entry)
    this.calls.push({ key, windowMs })
    return [entry.count, entry.expiresAt - now]
  }
}

function createMockContext(overrides?: Partial<ApiContext>): ApiContext {
  return {
    tenant: { tenantId: 'tenant-a' },
    user: { userId: 'user-a', email: 'test@example.com', roles: ['user'] },
    requestId: 'req_test123',
    timestamp: new Date(),
    ip: '192.168.1.1',
    ...overrides,
  }
}

function config(redis: RedisRateLimitClient, overrides: Partial<RateLimitConfig> = {}): RateLimitConfig {
  return { redis, windowMs: 1_000, maxRequests: 2, action: 'login', ...overrides }
}

describe('RateLimitPresets', () => {
  it.each(['login', 'email', 'invitation', 'impersonation', 'gdpr', 'upload'] as const)(
    'defines fail-closed sensitive action %s',
    (action) => {
      expect(RateLimitPresets[action].action).toBe(action)
      expect(RateLimitPresets[action].failurePolicy).toBe('failClosed')
    }
  )

  it.each(['standard', 'public', 'search'] as const)('makes low-risk %s degradation explicit', (name) => {
    expect(RateLimitPresets[name].failurePolicy).toBe('degrade')
  })
})

describe('atomic Redis counter', () => {
  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  it('counts requests atomically and preserves the original fixed window', async () => {
    const redis = new FakeRedis()
    vi.setSystemTime(10_000)

    expect((await checkRateLimit('shared', config(redis))).remaining).toBe(1)
    vi.advanceTimersByTime(400)
    expect((await checkRateLimit('shared', config(redis))).remaining).toBe(0)
    const denied = await checkRateLimit('shared', config(redis))

    expect(denied).toMatchObject({ allowed: false, remaining: 0, retryAfter: 1 })
    expect(denied.resetTime).toBe(11_000)
    expect(redis.calls).toHaveLength(3)
  })

  it('opens a new counter only after expiry', async () => {
    const redis = new FakeRedis()
    vi.setSystemTime(20_000)
    await checkRateLimit('shared', config(redis))
    vi.advanceTimersByTime(1_001)

    expect(await checkRateLimit('shared', config(redis))).toMatchObject({ allowed: true, remaining: 1 })
  })

  it('counts concurrent replica requests without lost updates', async () => {
    const redis = new FakeRedis()
    const results = await Promise.all(
      Array.from({ length: 25 }, () => checkRateLimit('concurrent', config(redis, { maxRequests: 10 }))),
    )
    expect(results.filter((result) => result.allowed)).toHaveLength(10)
    expect(results.filter((result) => !result.allowed)).toHaveLength(15)
    expect(redis.calls).toHaveLength(25)
  })

  it('repairs a missing TTL during the atomic operation', async () => {
    const redis = new FakeRedis()
    vi.setSystemTime(30_000)
    await checkRateLimit('ttl-repair', config(redis))
    redis.missingTtl = true
    vi.advanceTimersByTime(250)
    const result = await checkRateLimit('ttl-repair', config(redis))
    expect(result.resetTime).toBe(31_250)
  })

  it('keeps tenants separated for the same principal and IP', async () => {
    const redis = new FakeRedis()
    const limiter = createRateLimiter(config(redis, { maxRequests: 1 }))
    const tenantA = createMockContext()
    const tenantB = createMockContext({ tenant: { tenantId: 'tenant-b' } })

    await limiter(tenantA)
    await expect(limiter(tenantA)).rejects.toBeInstanceOf(ApiError)
    await expect(limiter(tenantB)).resolves.toMatchObject({ allowed: true })
    expect(redis.calls[0]!.key).not.toBe(redis.calls[2]!.key)
  })
})

describe('privacy-safe keys', () => {
  it('hashes tenant, principal and IP while retaining only a normalized action label', () => {
    const key = composeRateLimitKey({
      action: 'Login Attempt',
      tenantId: 'tenant-secret',
      principalId: 'person@example.com',
      ip: '203.0.113.4',
    })

    expect(key).toMatch(/^v1:login_attempt:t_[a-f0-9]{32}:p_[a-f0-9]{32}:i_[a-f0-9]{32}$/)
    expect(key).not.toContain('tenant-secret')
    expect(key).not.toContain('person@example.com')
    expect(key).not.toContain('203.0.113.4')
  })

  it('rehashes custom keys before sending them to Redis', async () => {
    const redis = new FakeRedis()
    const limiter = createRateLimiter(config(redis, {
      keyGenerator: () => 'raw-email@example.com',
    }))
    await limiter(createMockContext())

    expect(redis.calls[0]!.key).not.toContain('raw-email@example.com')
  })
})

describe('backend outage policy', () => {
  it('fails closed for sensitive actions and emits an observable event', async () => {
    const redis = new FakeRedis()
    redis.outage = true
    const onDegraded = vi.fn()
    const limiter = createRateLimiter(config(redis, { failurePolicy: 'failClosed', onDegraded }))

    await expect(limiter(createMockContext())).rejects.toMatchObject({
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
    })
    expect(onDegraded).toHaveBeenCalledWith(expect.objectContaining({
      action: 'login',
      policy: 'failClosed',
      error: expect.any(Error),
    }))
  })

  it('allows explicit low-risk degradation and marks result and headers', async () => {
    const redis = new FakeRedis()
    redis.outage = true
    const onDegraded = vi.fn()
    const limiter = createRateLimiter(config(redis, {
      action: 'search',
      failurePolicy: 'degrade',
      onDegraded,
    }))

    const result = await limiter(createMockContext())
    expect(result).toMatchObject({ allowed: true, degraded: true, backendStatus: 'unavailable' })
    expect(getRateLimitHeaders(result)).toMatchObject({
      'X-RateLimit-Backend': 'unavailable',
      'X-RateLimit-Policy': 'degraded',
    })
    expect(onDegraded).toHaveBeenCalledOnce()
  })

  it('defaults to fail closed when no outage policy is supplied', async () => {
    const redis = new FakeRedis()
    redis.outage = true
    const limiter = createRateLimiter(config(redis, { failurePolicy: undefined }))
    await expect(limiter(createMockContext())).rejects.toBeInstanceOf(ApiError)
  })

  it('cannot degrade a sensitive action through a configuration mistake', async () => {
    const redis = new FakeRedis()
    redis.outage = true
    const onDegraded = vi.fn()
    const limiter = createRateLimiter(config(redis, {
      action: 'impersonation',
      failurePolicy: 'degrade',
      onDegraded,
    }))

    await expect(limiter(createMockContext())).rejects.toBeInstanceOf(ApiError)
    expect(onDegraded).toHaveBeenCalledWith(expect.objectContaining({ policy: 'failClosed' }))
  })
})

describe('rate-limit headers', () => {
  it('reports the configured limit, remaining count, reset and retry values', () => {
    const headers = getRateLimitHeaders({
      allowed: false,
      limit: 5,
      remaining: 0,
      resetTime: 30_001,
      retryAfter: 30,
      backendStatus: 'ok',
    })

    expect(headers).toEqual({
      'X-RateLimit-Limit': '5',
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': '31',
      'X-RateLimit-Backend': 'ok',
      'Retry-After': '30',
    })
  })
})
