/**
 * Redis Cache Layer for CEP Comunicación CMS
 *
 * Provides query result caching with automatic invalidation
 * Pattern: Cache-Aside with TTL + Stale-While-Revalidate
 *
 * @module lib/cache
 * @version 1.0.0
 */
import Redis from 'ioredis';
/**
 * Get or create Redis connection
 * Falls back gracefully if Redis unavailable
 */
export declare function getRedis(): Redis | null;
/**
 * Cache configuration by entity type
 * TTL in seconds, SWR (stale-while-revalidate) in seconds
 */
export declare const CACHE_CONFIG: {
    readonly cycles: {
        readonly ttl: 3600;
        readonly swr: 7200;
    };
    readonly campuses: {
        readonly ttl: 3600;
        readonly swr: 7200;
    };
    readonly areas: {
        readonly ttl: 3600;
        readonly swr: 7200;
    };
    readonly courses: {
        readonly ttl: 300;
        readonly swr: 600;
    };
    readonly courseRuns: {
        readonly ttl: 60;
        readonly swr: 120;
    };
    readonly leads: {
        readonly ttl: 10;
        readonly swr: 30;
    };
    readonly enrollments: {
        readonly ttl: 30;
        readonly swr: 60;
    };
    readonly users: {
        readonly ttl: 0;
        readonly swr: 0;
    };
    readonly auditLogs: {
        readonly ttl: 0;
        readonly swr: 0;
    };
};
type CacheKey = keyof typeof CACHE_CONFIG;
/**
 * Generate cache key with namespace
 */
export declare function cacheKey(entity: CacheKey, identifier: string | number): string;
/**
 * Generate list cache key
 */
export declare function listCacheKey(entity: CacheKey, filters?: Record<string, unknown>): string;
/**
 * Get cached value with automatic deserialization
 */
export declare function getCache<T>(key: string): Promise<T | null>;
/**
 * Set cache value with TTL
 */
export declare function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
/**
 * Invalidate cache by pattern
 * Use after mutations (create, update, delete)
 */
export declare function invalidateCache(entity: CacheKey, identifier?: string | number): Promise<void>;
/**
 * Cache-aside pattern wrapper
 * Fetches from cache, falls back to loader, caches result
 */
export declare function withCache<T>(entity: CacheKey, key: string, loader: () => Promise<T>): Promise<T>;
/**
 * Bulk cache invalidation for related entities
 * Call after course mutations to invalidate related caches
 */
export declare function invalidateRelated(entity: CacheKey): Promise<void>;
/**
 * Health check for Redis connection
 */
export declare function cacheHealthCheck(): Promise<{
    status: 'ok' | 'error';
    latency?: number;
}>;
export {};
//# sourceMappingURL=cache.d.ts.map