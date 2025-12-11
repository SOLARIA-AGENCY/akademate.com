/**
 * Redis Cache Layer for CEP Comunicación CMS
 *
 * Provides query result caching with automatic invalidation
 * Pattern: Cache-Aside with TTL + Stale-While-Revalidate
 *
 * @module lib/cache
 * @version 1.0.0
 */

import Redis from 'ioredis'

// Redis connection (lazy initialization)
let redis: Redis | null = null

/**
 * Get or create Redis connection
 * Falls back gracefully if Redis unavailable
 */
export function getRedis(): Redis | null {
  if (redis) return redis

  try {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    redis = new Redis(redisUrl, {
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      enableReadyCheck: true,
      lazyConnect: true,
    })

    redis.on('error', (err) => {
      console.warn('[Cache] Redis connection error:', err.message)
      redis = null
    })

    return redis
  } catch (error) {
    console.warn('[Cache] Redis initialization failed, caching disabled')
    return null
  }
}

/**
 * Cache configuration by entity type
 * TTL in seconds, SWR (stale-while-revalidate) in seconds
 */
export const CACHE_CONFIG = {
  // Static data - long cache
  cycles: { ttl: 3600, swr: 7200 },        // 1h cache, 2h stale
  campuses: { ttl: 3600, swr: 7200 },      // 1h cache, 2h stale
  areas: { ttl: 3600, swr: 7200 },         // 1h cache, 2h stale

  // Semi-static data - medium cache
  courses: { ttl: 300, swr: 600 },         // 5min cache, 10min stale
  courseRuns: { ttl: 60, swr: 120 },       // 1min cache, 2min stale

  // Dynamic data - short cache
  leads: { ttl: 10, swr: 30 },             // 10s cache, 30s stale
  enrollments: { ttl: 30, swr: 60 },       // 30s cache, 1min stale

  // User-specific - no cache
  users: { ttl: 0, swr: 0 },
  auditLogs: { ttl: 0, swr: 0 },
} as const

type CacheKey = keyof typeof CACHE_CONFIG

/**
 * Generate cache key with namespace
 */
export function cacheKey(entity: CacheKey, identifier: string | number): string {
  return `cep:${entity}:${identifier}`
}

/**
 * Generate list cache key
 */
export function listCacheKey(entity: CacheKey, filters?: Record<string, unknown>): string {
  const filterHash = filters ? Buffer.from(JSON.stringify(filters)).toString('base64url').slice(0, 16) : 'all'
  return `cep:${entity}:list:${filterHash}`
}

/**
 * Get cached value with automatic deserialization
 */
export async function getCache<T>(key: string): Promise<T | null> {
  const client = getRedis()
  if (!client) return null

  try {
    const cached = await client.get(key)
    if (!cached) return null
    return JSON.parse(cached) as T
  } catch (error) {
    console.warn('[Cache] Get failed:', key, error)
    return null
  }
}

/**
 * Set cache value with TTL
 */
export async function setCache<T>(
  key: string,
  value: T,
  ttlSeconds: number
): Promise<void> {
  const client = getRedis()
  if (!client || ttlSeconds === 0) return

  try {
    await client.setex(key, ttlSeconds, JSON.stringify(value))
  } catch (error) {
    console.warn('[Cache] Set failed:', key, error)
  }
}

/**
 * Invalidate cache by pattern
 * Use after mutations (create, update, delete)
 */
export async function invalidateCache(entity: CacheKey, identifier?: string | number): Promise<void> {
  const client = getRedis()
  if (!client) return

  try {
    const pattern = identifier
      ? `cep:${entity}:${identifier}*`
      : `cep:${entity}:*`

    const keys = await client.keys(pattern)
    if (keys.length > 0) {
      await client.del(...keys)
      console.log(`[Cache] Invalidated ${keys.length} keys for ${entity}`)
    }
  } catch (error) {
    console.warn('[Cache] Invalidation failed:', entity, error)
  }
}

/**
 * Cache-aside pattern wrapper
 * Fetches from cache, falls back to loader, caches result
 */
export async function withCache<T>(
  entity: CacheKey,
  key: string,
  loader: () => Promise<T>
): Promise<T> {
  const config = CACHE_CONFIG[entity]

  // Skip cache for zero-TTL entities
  if (config.ttl === 0) {
    return loader()
  }

  const fullKey = cacheKey(entity, key)

  // Try cache first
  const cached = await getCache<T>(fullKey)
  if (cached !== null) {
    return cached
  }

  // Load from database
  const result = await loader()

  // Cache the result
  await setCache(fullKey, result, config.ttl)

  return result
}

/**
 * Bulk cache invalidation for related entities
 * Call after course mutations to invalidate related caches
 */
export async function invalidateRelated(entity: CacheKey): Promise<void> {
  const relations: Record<CacheKey, CacheKey[]> = {
    courses: ['courseRuns', 'cycles'],
    courseRuns: ['courses', 'enrollments'],
    cycles: ['courses'],
    campuses: ['courseRuns'],
    areas: ['courses'],
    leads: [],
    enrollments: ['courseRuns'],
    users: [],
    auditLogs: [],
  }

  const related = relations[entity] || []
  await Promise.all([
    invalidateCache(entity),
    ...related.map(rel => invalidateCache(rel))
  ])
}

/**
 * Health check for Redis connection
 */
export async function cacheHealthCheck(): Promise<{ status: 'ok' | 'error', latency?: number }> {
  const client = getRedis()
  if (!client) {
    return { status: 'error' }
  }

  try {
    const start = Date.now()
    await client.ping()
    return { status: 'ok', latency: Date.now() - start }
  } catch {
    return { status: 'error' }
  }
}
