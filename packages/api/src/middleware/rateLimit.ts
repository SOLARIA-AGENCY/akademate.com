/**
 * @module @akademate/api/middleware/rateLimit
 * Shared fixed-window rate limiting backed by an atomic Redis operation.
 */

import { createHash } from 'node:crypto'
import { ApiError } from '../errors'
import type { ApiContext } from '../context'

export type RateLimitFailurePolicy = 'failClosed' | 'degrade'

export interface RedisRateLimitClient {
  eval(
    script: string,
    keys: string[],
    args: string[]
  ): Promise<unknown>
}

export interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  redis: RedisRateLimitClient
  action?: RateLimitAction
  keyGenerator?: (context: ApiContext) => string | RateLimitKeyParts
  keyPrefix?: string
  failurePolicy?: RateLimitFailurePolicy
  onDegraded?: (event: RateLimitDegradedEvent) => void
  skipSuccessfulRequests?: boolean
  message?: string
}

export interface RateLimitResult {
  allowed: boolean
  limit: number
  remaining: number
  resetTime: number
  retryAfter?: number
  degraded?: boolean
  backendStatus: 'ok' | 'unavailable'
}

export interface RateLimitKeyParts {
  action: string
  tenantId?: string
  principalId?: string
  ip?: string
}

export interface RateLimitDegradedEvent {
  action: string
  policy: RateLimitFailurePolicy
  error: unknown
}

export type RateLimitApiError = ApiError & { rateLimitResult: RateLimitResult }

export type RateLimitAction =
  | 'login'
  | 'email'
  | 'invitation'
  | 'impersonation'
  | 'gdpr'
  | 'upload'
  | 'standard'
  | 'public'
  | 'bulk'
  | 'search'
  | 'webhooks'

const FAIL_CLOSED_ACTIONS = new Set<RateLimitAction>([
  'login',
  'email',
  'invitation',
  'impersonation',
  'gdpr',
  'upload',
])

const ATOMIC_FIXED_WINDOW_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if not current then
  redis.call('PSETEX', KEYS[1], ARGV[1], 1)
  return {1, tonumber(ARGV[1])}
end
local count = redis.call('INCR', KEYS[1])
local ttl = redis.call('PTTL', KEYS[1])
if ttl < 0 then
  redis.call('PEXPIRE', KEYS[1], ARGV[1])
  ttl = tonumber(ARGV[1])
end
return {count, ttl}
`

export function hashRateLimitKeyPart(value: string): string {
  return createHash('sha256').update(value).digest('hex').slice(0, 32)
}

function normalizeAction(action: string): string {
  const normalized = action.toLowerCase().replace(/[^a-z0-9_-]/g, '_').slice(0, 64)
  return normalized || 'unknown'
}

/** Builds a stable key without placing raw tenant, principal, IP, email, or secret data in Redis. */
export function composeRateLimitKey(parts: RateLimitKeyParts): string {
  const principal = parts.principalId ?? 'anonymous'
  const ip = parts.ip ?? 'unknown'
  const tenant = parts.tenantId ?? 'unknown'

  return [
    'v1',
    normalizeAction(parts.action),
    `t_${hashRateLimitKeyPart(tenant)}`,
    `p_${hashRateLimitKeyPart(principal)}`,
    `i_${hashRateLimitKeyPart(ip)}`,
  ].join(':')
}

export function rateLimitKeyFromContext(
  context: ApiContext,
  action: RateLimitAction = 'standard'
): string {
  return composeRateLimitKey({
    action,
    tenantId: context.tenant.tenantId,
    principalId: context.user?.userId,
    ip: context.ip,
  })
}

function parseAtomicResult(value: unknown): [number, number] {
  if (!Array.isArray(value) || value.length < 2) {
    throw new Error('Redis rate-limit script returned an invalid result')
  }
  const count = Number(value[0])
  const ttlMs = Number(value[1])
  if (!Number.isSafeInteger(count) || count < 1 || !Number.isFinite(ttlMs) || ttlMs <= 0) {
    throw new Error('Redis rate-limit script returned invalid count or TTL')
  }
  return [count, ttlMs]
}

export async function checkRateLimit(
  key: string,
  config: RateLimitConfig
): Promise<RateLimitResult> {
  if (!Number.isSafeInteger(config.maxRequests) || config.maxRequests <= 0) {
    throw new TypeError('maxRequests must be a positive integer')
  }
  if (!Number.isSafeInteger(config.windowMs) || config.windowMs <= 0) {
    throw new TypeError('windowMs must be a positive integer')
  }

  const redisKey = `${config.keyPrefix ?? 'ratelimit'}:${hashRateLimitKeyPart(key)}`
  const [count, ttlMs] = parseAtomicResult(
    await config.redis.eval(ATOMIC_FIXED_WINDOW_SCRIPT, [redisKey], [String(config.windowMs)])
  )
  const now = Date.now()
  const resetTime = now + ttlMs
  const allowed = count <= config.maxRequests

  return {
    allowed,
    limit: config.maxRequests,
    remaining: Math.max(0, config.maxRequests - count),
    resetTime,
    retryAfter: allowed ? undefined : Math.max(1, Math.ceil(ttlMs / 1000)),
    backendStatus: 'ok',
  }
}

export async function checkRedisRateLimit(
  key: string,
  config: RedisRateLimitConfig
): Promise<RateLimitResult> {
  return checkRateLimit(key, config)
}

export function createRateLimiter(config: RateLimitConfig) {
  const action = config.action ?? 'standard'
  const keyGenerator = config.keyGenerator ?? ((context: ApiContext) => ({
    action,
    tenantId: context.tenant.tenantId,
    principalId: context.user?.userId,
    ip: context.ip,
  }))

  return async function rateLimit(context: ApiContext): Promise<RateLimitResult> {
    const generatedKey = keyGenerator(context)
    const key = typeof generatedKey === 'string'
      ? composeRateLimitKey({
          action,
          tenantId: context.tenant.tenantId,
          principalId: generatedKey,
          ip: context.ip,
        })
      : composeRateLimitKey(generatedKey)

    try {
      const result = await checkRateLimit(key, config)
      if (!result.allowed) throw createRateLimitError(result)
      return result
    } catch (error) {
      if (error instanceof ApiError) throw error

      const failurePolicy = FAIL_CLOSED_ACTIONS.has(action)
        ? 'failClosed'
        : config.failurePolicy ?? 'failClosed'
      config.onDegraded?.({ action, policy: failurePolicy, error })
      if (failurePolicy === 'failClosed') {
        const result: RateLimitResult = {
          allowed: false,
          limit: config.maxRequests,
          remaining: 0,
          resetTime: Date.now() + 1_000,
          retryAfter: 1,
          degraded: true,
          backendStatus: 'unavailable',
        }
        throw Object.assign(
          ApiError.serviceUnavailable('Rate limit service temporarily unavailable', error as Error),
          { rateLimitResult: result },
        ) as RateLimitApiError
      }

      return {
        allowed: true,
        limit: config.maxRequests,
        remaining: 0,
        resetTime: Date.now() + config.windowMs,
        degraded: true,
        backendStatus: 'unavailable',
      }
    }
  }
}

function createRateLimitError(result: RateLimitResult): RateLimitApiError {
  return Object.assign(ApiError.rateLimit(result.retryAfter), { rateLimitResult: result })
}

type RateLimitPreset = Omit<RateLimitConfig, 'redis' | 'keyGenerator' | 'onDegraded'>

export const RateLimitPresets = {
  login: { action: 'login', windowMs: 15 * 60_000, maxRequests: 5, failurePolicy: 'failClosed' },
  email: { action: 'email', windowMs: 60 * 60_000, maxRequests: 3, failurePolicy: 'failClosed' },
  invitation: { action: 'invitation', windowMs: 60 * 60_000, maxRequests: 5, failurePolicy: 'failClosed' },
  impersonation: { action: 'impersonation', windowMs: 15 * 60_000, maxRequests: 3, failurePolicy: 'failClosed' },
  gdpr: { action: 'gdpr', windowMs: 60 * 60_000, maxRequests: 3, failurePolicy: 'failClosed' },
  upload: { action: 'upload', windowMs: 60 * 60_000, maxRequests: 10, failurePolicy: 'failClosed' },
  standard: { action: 'standard', windowMs: 60_000, maxRequests: 100, failurePolicy: 'degrade' },
  auth: { action: 'login', windowMs: 60_000, maxRequests: 10, failurePolicy: 'failClosed' },
  public: { action: 'public', windowMs: 60_000, maxRequests: 30, failurePolicy: 'degrade' },
  bulk: { action: 'bulk', windowMs: 60_000, maxRequests: 10, failurePolicy: 'failClosed' },
  search: { action: 'search', windowMs: 60_000, maxRequests: 60, failurePolicy: 'degrade' },
  webhooks: { action: 'webhooks', windowMs: 60_000, maxRequests: 1000, failurePolicy: 'failClosed' },
} as const satisfies Record<string, RateLimitPreset>

export function getRateLimitHeaders(result: RateLimitResult): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(result.limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(Math.ceil(result.resetTime / 1000)),
    'X-RateLimit-Backend': result.backendStatus,
    ...(result.degraded ? { 'X-RateLimit-Policy': 'degraded' } : {}),
    ...(result.retryAfter !== undefined ? { 'Retry-After': String(result.retryAfter) } : {}),
  }
}

/** @deprecated Use RateLimitConfig. Kept as a source-compatible alias. */
export type RedisRateLimitConfig = RateLimitConfig
