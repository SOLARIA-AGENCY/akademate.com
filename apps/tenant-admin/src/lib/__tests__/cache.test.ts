/**
 * Unit Tests for Redis Cache Layer
 *
 * @module lib/__tests__/cache.test.ts
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'

// Mock ioredis before importing cache module
vi.mock('ioredis', () => {
  const mockRedis = {
    get: vi.fn(),
    setex: vi.fn(),
    del: vi.fn(),
    keys: vi.fn(),
    ping: vi.fn(),
    on: vi.fn(),
  }
  return {
    default: vi.fn(() => mockRedis),
  }
})

import {
  cacheKey,
  listCacheKey,
  CACHE_CONFIG,
  getCache,
  setCache,
  invalidateCache,
  withCache,
  cacheHealthCheck,
  getRedis,
} from '../cache'

describe('Cache Layer', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.resetModules()
  })

  describe('cacheKey', () => {
    it('generates correct cache key format', () => {
      expect(cacheKey('courses', 'abc123')).toBe('cep:courses:abc123')
      expect(cacheKey('cycles', 42)).toBe('cep:cycles:42')
    })

    it('handles numeric identifiers', () => {
      expect(cacheKey('leads', 999)).toBe('cep:leads:999')
    })
  })

  describe('listCacheKey', () => {
    it('generates key for all items', () => {
      const key = listCacheKey('courses')
      expect(key).toBe('cep:courses:list:all')
    })

    it('generates key with filter hash', () => {
      const key = listCacheKey('courses', { type: 'telematico' })
      expect(key).toMatch(/^cep:courses:list:[a-zA-Z0-9_-]+$/)
    })

    it('generates different keys for different filters', () => {
      const key1 = listCacheKey('courses', { type: 'telematico' })
      const key2 = listCacheKey('courses', { type: 'presencial' })
      expect(key1).not.toBe(key2)
    })
  })

  describe('CACHE_CONFIG', () => {
    it('has correct TTL for static data', () => {
      expect(CACHE_CONFIG.cycles.ttl).toBe(3600) // 1 hour
      expect(CACHE_CONFIG.campuses.ttl).toBe(3600)
      expect(CACHE_CONFIG.areas.ttl).toBe(3600)
    })

    it('has correct TTL for dynamic data', () => {
      expect(CACHE_CONFIG.leads.ttl).toBe(10) // 10 seconds
      expect(CACHE_CONFIG.enrollments.ttl).toBe(30)
    })

    it('has zero TTL for sensitive data', () => {
      expect(CACHE_CONFIG.users.ttl).toBe(0)
      expect(CACHE_CONFIG.auditLogs.ttl).toBe(0)
    })

    it('has SWR greater than TTL for all entities', () => {
      Object.entries(CACHE_CONFIG).forEach(([entity, config]) => {
        if (config.ttl > 0) {
          expect(config.swr).toBeGreaterThanOrEqual(config.ttl)
        }
      })
    })
  })

  describe('getCache', () => {
    it('returns null when Redis unavailable', async () => {
      // Redis mock returns null connection
      const result = await getCache('nonexistent:key')
      expect(result).toBeNull()
    })
  })

  describe('setCache', () => {
    it('does not cache when TTL is 0', async () => {
      // Should not throw and should not attempt to cache
      await expect(setCache('test:key', { data: 'test' }, 0)).resolves.toBeUndefined()
    })
  })

  describe('withCache', () => {
    it('calls loader directly for zero-TTL entities', async () => {
      const loader = vi.fn().mockResolvedValue({ id: 1, name: 'test' })

      const result = await withCache('users', 'user-1', loader)

      expect(loader).toHaveBeenCalled()
      expect(result).toEqual({ id: 1, name: 'test' })
    })

    it('respects entity-specific TTL configuration', async () => {
      const loader = vi.fn().mockResolvedValue([])

      // Users have TTL 0, should call loader directly
      await withCache('users', 'all', loader)
      expect(loader).toHaveBeenCalled()

      // AuditLogs have TTL 0, should call loader directly
      const auditLoader = vi.fn().mockResolvedValue([])
      await withCache('auditLogs', 'all', auditLoader)
      expect(auditLoader).toHaveBeenCalled()
    })
  })

  describe('cacheHealthCheck', () => {
    it('returns error status when Redis unavailable', async () => {
      const result = await cacheHealthCheck()
      // Since Redis is mocked but not connected, should return error
      expect(result.status).toBe('error')
    })
  })

  describe('Cache TTL Strategy', () => {
    it('static entities have long TTL (1h+)', () => {
      const staticEntities = ['cycles', 'campuses', 'areas']
      staticEntities.forEach((entity) => {
        const config = CACHE_CONFIG[entity as keyof typeof CACHE_CONFIG]
        expect(config.ttl).toBeGreaterThanOrEqual(3600)
      })
    })

    it('semi-static entities have medium TTL (1-5min)', () => {
      const semiStaticEntities = ['courses', 'courseRuns']
      semiStaticEntities.forEach((entity) => {
        const config = CACHE_CONFIG[entity as keyof typeof CACHE_CONFIG]
        expect(config.ttl).toBeGreaterThanOrEqual(60)
        expect(config.ttl).toBeLessThanOrEqual(300)
      })
    })

    it('dynamic entities have short TTL (<1min)', () => {
      const dynamicEntities = ['leads', 'enrollments']
      dynamicEntities.forEach((entity) => {
        const config = CACHE_CONFIG[entity as keyof typeof CACHE_CONFIG]
        expect(config.ttl).toBeLessThan(60)
      })
    })
  })
})

describe('Cache Key Generation', () => {
  it('produces URL-safe keys', () => {
    const key = cacheKey('courses', 'test-slug-123')
    expect(key).toMatch(/^[a-zA-Z0-9:_-]+$/)
  })

  it('handles special characters in filters', () => {
    const key = listCacheKey('courses', { search: 'formación profesional' })
    // Base64url encoding should handle UTF-8
    expect(key).toMatch(/^cep:courses:list:[a-zA-Z0-9_-]+$/)
  })
})
