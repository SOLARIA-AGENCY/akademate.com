/**
 * @module @akademate/api/middleware/rateLimit
 * Rate limiting middleware with fixed window algorithm
 */

import { ApiError } from '../errors'
import type { ApiContext } from '../context'

// ============================================================================
// Rate Limit Configuration
// ============================================================================

export interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  maxRequests: number // Max requests per window
  keyGenerator?: (context: ApiContext) => string
  skipSuccessfulRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  remaining: number
  resetTime: number
  retryAfter?: number
}

// ============================================================================
// In-Memory Rate Limiter (for single instance)
// ============================================================================

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

export function checkRateLimit(
  key: string,
  config: RateLimitConfig
): RateLimitResult {
  const now = Date.now()
  const entry = rateLimitStore.get(key)

  // Clean up expired entries periodically
  if (Math.random() < 0.01) {
    cleanupExpiredEntries(now)
  }

  // New window or expired entry
  if (!entry || entry.resetTime <= now) {
    const resetTime = now + config.windowMs
    rateLimitStore.set(key, { count: 1, resetTime })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetTime,
    }
  }

  // Within window
  if (entry.count < config.maxRequests) {
    entry.count++
    return {
      allowed: true,
      remaining: config.maxRequests - entry.count,
      resetTime: entry.resetTime,
    }
  }

  // Rate limit exceeded
  return {
    allowed: false,
    remaining: 0,
    resetTime: entry.resetTime,
    retryAfter: Math.ceil((entry.resetTime - now) / 1000),
  }
}

function cleanupExpiredEntries(now: number): void {
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
}

// ============================================================================
// Rate Limit Middleware
// ============================================================================

export function createRateLimiter(config: RateLimitConfig) {
  const defaultKeyGenerator = (context: ApiContext) =>
    `${context.tenant.tenantId}:${context.user?.userId || context.ip || 'anonymous'}`

  const keyGenerator = config.keyGenerator || defaultKeyGenerator

  return function rateLimit(context: ApiContext): RateLimitResult {
    const key = keyGenerator(context)
    const result = checkRateLimit(key, config)

    if (!result.allowed) {
      throw ApiError.rateLimit(result.retryAfter)
    }

    return result
  }
}

// ============================================================================
// Preset Configurations
// ============================================================================

export const RateLimitPresets = {
  // Standard API - 100 requests per minute
  standard: {
    windowMs: 60 * 1000,
    maxRequests: 100,
  } as RateLimitConfig,

  // Auth endpoints - 10 requests per minute
  auth: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  } as RateLimitConfig,

  // Public endpoints - 30 requests per minute
  public: {
    windowMs: 60 * 1000,
    maxRequests: 30,
  } as RateLimitConfig,

  // Bulk operations - 10 requests per minute
  bulk: {
    windowMs: 60 * 1000,
    maxRequests: 10,
  } as RateLimitConfig,

  // Search - 60 requests per minute
  search: {
    windowMs: 60 * 1000,
    maxRequests: 60,
  } as RateLimitConfig,

  // Webhooks - 1000 requests per minute
  webhooks: {
    windowMs: 60 * 1000,
    maxRequests: 1000,
  } as RateLimitConfig,
} as const

// ============================================================================
// Rate Limit Headers
// ============================================================================

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.remaining + (result.allowed ? 1 : 0)),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    ...(result.retryAfter ? { 'Retry-After': String(result.retryAfter) } : {}),
  }
}

// ============================================================================
// Redis Rate Limiter (for distributed systems)
// ============================================================================

export interface RedisRateLimitConfig extends RateLimitConfig {
  redis: {
    get(key: string): Promise<string | null>
    setex(key: string, seconds: number, value: string): Promise<void>
    incr(key: string): Promise<number>
    ttl(key: string): Promise<number>
  }
  keyPrefix?: string
}

export async function checkRedisRateLimit(
  key: string,
  config: RedisRateLimitConfig
): Promise<RateLimitResult> {
  const redisKey = `${config.keyPrefix || 'ratelimit'}:${key}`
  const windowSeconds = Math.ceil(config.windowMs / 1000)

  // Increment counter
  const count = await config.redis.incr(redisKey)

  // Set TTL on first request
  if (count === 1) {
    await config.redis.setex(redisKey, windowSeconds, '1')
  }

  // Get TTL for reset time
  const ttl = await config.redis.ttl(redisKey)
  const resetTime = Date.now() + ttl * 1000

  if (count <= config.maxRequests) {
    return {
      allowed: true,
      remaining: config.maxRequests - count,
      resetTime,
    }
  }

  return {
    allowed: false,
    remaining: 0,
    resetTime,
    retryAfter: ttl,
  }
}
