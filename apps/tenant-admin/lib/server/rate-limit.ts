import IoRedis from 'ioredis'
import { NextResponse } from 'next/server'
import {
  checkRateLimit,
  composeRateLimitKey,
  getRateLimitHeaders,
  RateLimitPresets,
  type RateLimitAction,
  type RateLimitResult,
  type RedisRateLimitClient,
} from '@akademate/api'

export type SensitiveRateLimitAction =
  | 'login'
  | 'email'
  | 'invitation'
  | 'impersonation'
  | 'gdpr'
  | 'upload'

export type SensitiveRateLimitOutcome =
  | { allowed: true; headers: Record<string, string>; result: RateLimitResult }
  | {
      allowed: false
      status: 429 | 503
      code: 'RATE_LIMIT_EXCEEDED' | 'SERVICE_UNAVAILABLE'
      retryAfter: number
      headers: Record<string, string>
    }

let testClient: RedisRateLimitClient | undefined
let sharedClient: Promise<RedisRateLimitClient> | undefined

export function setRateLimitRedisForTests(client?: RedisRateLimitClient): void {
  testClient = client
  sharedClient = undefined
}

async function createSharedClient(): Promise<RedisRateLimitClient> {
  const upstashUrl = process.env.UPSTASH_REDIS_REST_URL?.trim()
  const upstashToken = process.env.UPSTASH_REDIS_REST_TOKEN?.trim()
  if (upstashUrl && upstashToken) {
    const moduleName = '@upstash/redis'
    const { Redis } = await import(/* @vite-ignore */ moduleName) as typeof import('@upstash/redis')
    return new Redis({ url: upstashUrl, token: upstashToken })
  }

  const redisUrl = process.env.REDIS_URL?.trim()
  if (redisUrl) {
    const client = new IoRedis(redisUrl, {
      enableReadyCheck: true,
      lazyConnect: true,
      maxRetriesPerRequest: 1,
    })
    return {
      async eval(script, keys, args) {
        return client.eval(script, keys.length, ...keys, ...args)
      },
    }
  }

  throw new Error('Rate limiting requires REDIS_URL or UPSTASH_REDIS_REST_URL/TOKEN')
}

async function getSharedClient(): Promise<RedisRateLimitClient> {
  if (testClient) return testClient
  sharedClient ??= createSharedClient()
  return sharedClient
}

function platformIp(request: Request): string | undefined {
  const value = (request as Request & { ip?: string }).ip
  return typeof value === 'string' && value.trim() ? value.trim() : undefined
}

export function resolveRateLimitIp(request: Request): string {
  if (process.env.TRUST_PROXY_HEADERS === 'true') {
    const cloudflare = request.headers.get('cf-connecting-ip')?.trim()
    if (cloudflare) return cloudflare
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    if (forwarded) return forwarded
    const realIp = request.headers.get('x-real-ip')?.trim()
    if (realIp) return realIp
  }
  return platformIp(request) ?? 'unknown'
}

export async function rateLimitPrincipalFromJson(
  request: Request,
  fields: string[] = ['email'],
): Promise<string | undefined> {
  try {
    const body = await request.clone().json() as Record<string, unknown>
    for (const field of fields) {
      const value = body[field]
      if (typeof value === 'string' && value.trim()) return value.trim().toLowerCase()
    }
  } catch {
    // Malformed bodies are still limited by action and IP/unknown identity.
  }
  return undefined
}

export async function enforceSensitiveRateLimit(
  request: Request,
  input: {
    action: SensitiveRateLimitAction
    tenantId?: string | number
    principalId?: string | number
  },
): Promise<SensitiveRateLimitOutcome> {
  const preset = RateLimitPresets[input.action]
  const key = composeRateLimitKey({
    action: input.action,
    tenantId: input.tenantId === undefined ? undefined : String(input.tenantId),
    principalId: input.principalId === undefined ? undefined : String(input.principalId),
    ip: resolveRateLimitIp(request),
  })

  try {
    const result = await checkRateLimit(key, {
      ...preset,
      redis: await getSharedClient(),
      action: input.action as RateLimitAction,
      keyPrefix: 'akademate:ratelimit',
    })
    const headers = getRateLimitHeaders(result)
    if (result.allowed) return { allowed: true, headers, result }
    return {
      allowed: false,
      status: 429,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: result.retryAfter ?? 1,
      headers,
    }
  } catch (error) {
    console.error('[rate-limit] shared backend unavailable', {
      action: input.action,
      error: error instanceof Error ? error.message : 'unknown error',
    })
    const retryAfter = 1
    const result: RateLimitResult = {
      allowed: false,
      limit: preset.maxRequests,
      remaining: 0,
      resetTime: Date.now() + 1_000,
      retryAfter,
      degraded: true,
      backendStatus: 'unavailable',
    }
    return {
      allowed: false,
      status: 503,
      code: 'SERVICE_UNAVAILABLE',
      retryAfter,
      headers: getRateLimitHeaders(result),
    }
  }
}

export function sensitiveRateLimitResponse(
  outcome: SensitiveRateLimitOutcome,
  exhaustedMessage = 'Too many requests. Please try again later.',
): NextResponse {
  if (!('status' in outcome)) {
    throw new TypeError('Cannot create a rejection response for an allowed request')
  }
  return NextResponse.json(
    {
      error: outcome.status === 429 ? exhaustedMessage : 'Service temporarily unavailable',
      code: outcome.code,
      retryAfter: outcome.retryAfter,
    },
    { status: outcome.status, headers: outcome.headers },
  )
}
