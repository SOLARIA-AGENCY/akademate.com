/**
 * @module @akademate/api/__tests__/rateLimit
 * Tests for rate limiting middleware
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  checkRateLimit,
  createRateLimiter,
  getRateLimitHeaders,
  RateLimitPresets,
  type RateLimitConfig,
} from '../src/middleware/rateLimit'
import type { ApiContext } from '../src/context'
import { ApiError } from '../src/errors'

// Mock context factory
function createMockContext(overrides?: Partial<ApiContext>): ApiContext {
  return {
    tenant: { tenantId: '550e8400-e29b-41d4-a716-446655440001' },
    user: { userId: '550e8400-e29b-41d4-a716-446655440002', email: 'test@example.com', roles: ['user'] },
    requestId: 'req_test123',
    timestamp: new Date(),
    ip: '192.168.1.1',
    ...overrides,
  }
}

describe('RateLimitPresets', () => {
  it('should have standard preset (100 req/min)', () => {
    expect(RateLimitPresets.standard.windowMs).toBe(60000)
    expect(RateLimitPresets.standard.maxRequests).toBe(100)
  })

  it('should have auth preset (10 req/min)', () => {
    expect(RateLimitPresets.auth.windowMs).toBe(60000)
    expect(RateLimitPresets.auth.maxRequests).toBe(10)
  })

  it('should have public preset (30 req/min)', () => {
    expect(RateLimitPresets.public.windowMs).toBe(60000)
    expect(RateLimitPresets.public.maxRequests).toBe(30)
  })

  it('should have bulk preset (10 req/min)', () => {
    expect(RateLimitPresets.bulk.windowMs).toBe(60000)
    expect(RateLimitPresets.bulk.maxRequests).toBe(10)
  })

  it('should have search preset (60 req/min)', () => {
    expect(RateLimitPresets.search.windowMs).toBe(60000)
    expect(RateLimitPresets.search.maxRequests).toBe(60)
  })

  it('should have webhooks preset (1000 req/min)', () => {
    expect(RateLimitPresets.webhooks.windowMs).toBe(60000)
    expect(RateLimitPresets.webhooks.maxRequests).toBe(1000)
  })
})

describe('checkRateLimit', () => {
  const config: RateLimitConfig = {
    windowMs: 1000, // 1 second
    maxRequests: 5,
  }

  beforeEach(() => {
    // Reset rate limit store between tests
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should allow first request', () => {
    const result = checkRateLimit('test-key-1', config)

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
    expect(result.resetTime).toBeGreaterThan(Date.now())
  })

  it('should track remaining requests', () => {
    const key = 'test-key-2'

    checkRateLimit(key, config) // 1
    checkRateLimit(key, config) // 2
    const result = checkRateLimit(key, config) // 3

    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(2)
  })

  it('should block requests when limit exceeded', () => {
    const key = 'test-key-3'

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, config)
    }

    const result = checkRateLimit(key, config)

    expect(result.allowed).toBe(false)
    expect(result.remaining).toBe(0)
    expect(result.retryAfter).toBeDefined()
    expect(result.retryAfter).toBeGreaterThan(0)
  })

  it('should reset after window expires', () => {
    const key = 'test-key-4'

    // Exhaust the limit
    for (let i = 0; i < 5; i++) {
      checkRateLimit(key, config)
    }

    expect(checkRateLimit(key, config).allowed).toBe(false)

    // Advance time past window
    vi.advanceTimersByTime(1100)

    // Should allow requests again
    const result = checkRateLimit(key, config)
    expect(result.allowed).toBe(true)
    expect(result.remaining).toBe(4)
  })

  it('should use separate counters for different keys', () => {
    const result1 = checkRateLimit('user-1', config)
    const result2 = checkRateLimit('user-2', config)

    expect(result1.remaining).toBe(4)
    expect(result2.remaining).toBe(4)
  })
})

describe('createRateLimiter', () => {
  const config: RateLimitConfig = {
    windowMs: 60000,
    maxRequests: 3,
  }

  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should create limiter with default key generator', () => {
    const limiter = createRateLimiter(config)
    const context = createMockContext()

    const result = limiter(context)

    expect(result.allowed).toBe(true)
  })

  it('should use custom key generator', () => {
    const customConfig = {
      ...config,
      keyGenerator: (ctx: ApiContext) => `custom:${ctx.ip}`,
    }

    const limiter = createRateLimiter(customConfig)
    const context = createMockContext({ ip: '10.0.0.1' })

    // Should use IP-based key
    const result = limiter(context)
    expect(result.allowed).toBe(true)
  })

  it('should throw ApiError when limit exceeded', () => {
    const limiter = createRateLimiter(config)
    const context = createMockContext({
      tenant: { tenantId: 'rate-limit-test-tenant' },
      user: { userId: 'rate-limit-test-user', email: 'test@test.com', roles: [] },
    })

    // Exhaust limit
    limiter(context)
    limiter(context)
    limiter(context)

    expect(() => limiter(context)).toThrow(ApiError)
  })

  it('should track by tenant + user combination', () => {
    const limiter = createRateLimiter(config)

    const context1 = createMockContext({
      tenant: { tenantId: 'tenant-a' },
      user: { userId: 'user-1', email: 'a@test.com', roles: [] },
    })

    const context2 = createMockContext({
      tenant: { tenantId: 'tenant-a' },
      user: { userId: 'user-2', email: 'b@test.com', roles: [] },
    })

    // Same tenant, different users
    limiter(context1)
    limiter(context1)
    limiter(context1)

    // User 1 is now limited
    expect(() => limiter(context1)).toThrow(ApiError)

    // User 2 should still have quota
    expect(limiter(context2).allowed).toBe(true)
  })

  it('should fall back to IP for anonymous users', () => {
    const limiter = createRateLimiter(config)

    const context = createMockContext({
      tenant: { tenantId: 'public-tenant' },
      user: undefined,
      ip: '203.0.113.1',
    })

    const result = limiter(context)
    expect(result.allowed).toBe(true)
  })

  it('should use anonymous fallback when no user or IP', () => {
    const limiter = createRateLimiter(config)

    const context = createMockContext({
      tenant: { tenantId: 'anon-tenant' },
      user: undefined,
      ip: undefined,
    })

    const result = limiter(context)
    expect(result.allowed).toBe(true)
  })
})

describe('getRateLimitHeaders', () => {
  it('should generate headers for successful request', () => {
    const result = {
      allowed: true,
      remaining: 99,
      resetTime: Date.now() + 60000,
    }

    const headers = getRateLimitHeaders(result)

    expect(headers['X-RateLimit-Limit']).toBe('100')
    expect(headers['X-RateLimit-Remaining']).toBe('99')
    expect(headers['X-RateLimit-Reset']).toBeDefined()
    expect(headers['Retry-After']).toBeUndefined()
  })

  it('should include Retry-After for blocked requests', () => {
    const result = {
      allowed: false,
      remaining: 0,
      resetTime: Date.now() + 30000,
      retryAfter: 30,
    }

    const headers = getRateLimitHeaders(result)

    expect(headers['X-RateLimit-Remaining']).toBe('0')
    expect(headers['Retry-After']).toBe('30')
  })

  it('should calculate correct reset timestamp', () => {
    const resetTime = Date.now() + 60000
    const result = {
      allowed: true,
      remaining: 50,
      resetTime,
    }

    const headers = getRateLimitHeaders(result)

    expect(parseInt(headers['X-RateLimit-Reset'])).toBe(Math.ceil(resetTime / 1000))
  })
})

describe('Rate Limit Integration', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('should work with auth preset for login attempts', () => {
    const limiter = createRateLimiter(RateLimitPresets.auth)

    const context = createMockContext({
      tenant: { tenantId: 'auth-test-tenant' },
      user: undefined,
      ip: '198.51.100.1',
    })

    // Allow 10 attempts
    for (let i = 0; i < 10; i++) {
      expect(limiter(context).allowed).toBe(true)
    }

    // 11th should be blocked
    expect(() => limiter(context)).toThrow(ApiError)
  })

  it('should handle high-volume webhooks', () => {
    const limiter = createRateLimiter(RateLimitPresets.webhooks)

    const context = createMockContext({
      tenant: { tenantId: 'webhook-test-tenant' },
    })

    // Allow 1000 webhook calls
    for (let i = 0; i < 1000; i++) {
      const result = limiter(context)
      expect(result.allowed).toBe(true)
    }

    // 1001st should be blocked
    expect(() => limiter(context)).toThrow(ApiError)
  })
})
