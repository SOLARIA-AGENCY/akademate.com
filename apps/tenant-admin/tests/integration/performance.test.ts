/**
 * Integration Tests for Performance Optimizations
 *
 * These tests verify that the performance optimizations
 * are correctly configured and functioning.
 *
 * @module tests/integration/performance.test.ts
 */

import { describe, it, expect, vi, beforeAll } from 'vitest'
import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'

const rootDir = resolve(__dirname, '../..')

describe('Performance Configuration', () => {
  describe('next.config.js', () => {
    let nextConfig: string

    beforeAll(() => {
      const configPath = resolve(rootDir, 'next.config.js')
      nextConfig = readFileSync(configPath, 'utf-8')
    })

    it('has image optimization enabled', () => {
      expect(nextConfig).toContain('images:')
      expect(nextConfig).toContain("'image/avif'")
      expect(nextConfig).toContain("'image/webp'")
    })

    it('has compression enabled', () => {
      expect(nextConfig).toContain('compress: true')
    })

    it('has ETags enabled', () => {
      expect(nextConfig).toContain('generateEtags: true')
    })

    it('has cache control headers configured', () => {
      expect(nextConfig).toContain('Cache-Control')
      expect(nextConfig).toContain('s-maxage')
      expect(nextConfig).toContain('stale-while-revalidate')
    })

    it('has webpack optimizations for bundle splitting', () => {
      expect(nextConfig).toContain('splitChunks')
      expect(nextConfig).toContain('cacheGroups')
    })

    it('has security headers configured', () => {
      expect(nextConfig).toContain('X-Frame-Options')
      expect(nextConfig).toContain('X-Content-Type-Options')
      expect(nextConfig).toContain('Referrer-Policy')
    })

    it('has modularizeImports for lucide-react', () => {
      expect(nextConfig).toContain('lucide-react')
      expect(nextConfig).toContain('transform')
    })
  })

  describe('payload.config.ts', () => {
    let payloadConfig: string

    beforeAll(() => {
      const configPath = resolve(rootDir, 'src/payload.config.ts')
      payloadConfig = readFileSync(configPath, 'utf-8')
    })

    it('has PostgreSQL pool optimizations', () => {
      expect(payloadConfig).toContain('max: 20')
      expect(payloadConfig).toContain('min: 2')
      expect(payloadConfig).toContain('idleTimeoutMillis')
      expect(payloadConfig).toContain('connectionTimeoutMillis')
    })

    it('has statement timeout configured', () => {
      expect(payloadConfig).toContain('statement_timeout')
    })

    it('uses postgresAdapter', () => {
      expect(payloadConfig).toContain('postgresAdapter')
    })
  })

  describe('Cache Layer Files', () => {
    it('cache.ts exists', () => {
      const cachePath = resolve(rootDir, 'src/lib/cache.ts')
      expect(existsSync(cachePath)).toBe(true)
    })

    it('cache.ts exports required functions', () => {
      const cachePath = resolve(rootDir, 'src/lib/cache.ts')
      const cacheContent = readFileSync(cachePath, 'utf-8')

      expect(cacheContent).toContain('export function getRedis')
      expect(cacheContent).toContain('export function cacheKey')
      expect(cacheContent).toContain('export function listCacheKey')
      expect(cacheContent).toContain('export async function getCache')
      expect(cacheContent).toContain('export async function setCache')
      expect(cacheContent).toContain('export async function invalidateCache')
      expect(cacheContent).toContain('export async function withCache')
      expect(cacheContent).toContain('export async function cacheHealthCheck')
    })

    it('cache.ts has CACHE_CONFIG with all required entities', () => {
      const cachePath = resolve(rootDir, 'src/lib/cache.ts')
      const cacheContent = readFileSync(cachePath, 'utf-8')

      const requiredEntities = [
        'cycles',
        'campuses',
        'areas',
        'courses',
        'courseRuns',
        'leads',
        'enrollments',
        'users',
        'auditLogs',
      ]

      requiredEntities.forEach((entity) => {
        expect(cacheContent).toContain(`${entity}:`)
      })
    })
  })

  describe('Database Indexes', () => {
    it('performance-indexes.sql exists', () => {
      const indexPath = resolve(rootDir, '../../infra/database/performance-indexes.sql')
      expect(existsSync(indexPath)).toBe(true)
    })

    it('contains indexes for main tables', () => {
      const indexPath = resolve(rootDir, '../../infra/database/performance-indexes.sql')
      const sqlContent = readFileSync(indexPath, 'utf-8')

      // Check for critical indexes
      expect(sqlContent).toContain('idx_courses_type_status')
      expect(sqlContent).toContain('idx_course_runs_course_status')
      expect(sqlContent).toContain('idx_leads_campaign')
      expect(sqlContent).toContain('idx_enrollments_course_run')
    })

    it('uses CONCURRENTLY for non-blocking index creation', () => {
      const indexPath = resolve(rootDir, '../../infra/database/performance-indexes.sql')
      const sqlContent = readFileSync(indexPath, 'utf-8')

      // Count CREATE INDEX CONCURRENTLY statements
      const concurrentlyMatches = sqlContent.match(/CREATE INDEX CONCURRENTLY/g) || []
      expect(concurrentlyMatches.length).toBeGreaterThan(10)
    })

    it('includes ANALYZE commands for statistics', () => {
      const indexPath = resolve(rootDir, '../../infra/database/performance-indexes.sql')
      const sqlContent = readFileSync(indexPath, 'utf-8')

      expect(sqlContent).toContain('ANALYZE courses')
      expect(sqlContent).toContain('ANALYZE leads')
    })
  })

  describe('Documentation', () => {
    it('PERFORMANCE_OPTIMIZATION.md exists', () => {
      const docPath = resolve(rootDir, '../../docs/PERFORMANCE_OPTIMIZATION.md')
      expect(existsSync(docPath)).toBe(true)
    })

    it('DEPLOYMENT_PLAN.md exists', () => {
      const planPath = resolve(rootDir, '../../DEPLOYMENT_PLAN.md')
      expect(existsSync(planPath)).toBe(true)
    })
  })
})

describe('API Cache Headers', () => {
  describe('Route Handlers', () => {
    it('cursos route has cache headers', () => {
      const routePath = resolve(rootDir, 'app/api/cursos/route.ts')
      if (existsSync(routePath)) {
        const routeContent = readFileSync(routePath, 'utf-8')
        expect(routeContent).toContain('Cache-Control')
        expect(routeContent).toContain('s-maxage')
      }
    })

    it('areas-formativas route has cache headers', () => {
      const routePath = resolve(rootDir, 'app/api/areas-formativas/route.ts')
      if (existsSync(routePath)) {
        const routeContent = readFileSync(routePath, 'utf-8')
        expect(routeContent).toContain('Cache-Control')
      }
    })
  })
})

describe('Nginx Configuration', () => {
  it('nginx.conf exists in infra/nginx', () => {
    const nginxPath = resolve(rootDir, '../../infra/nginx/nginx.conf')
    expect(existsSync(nginxPath)).toBe(true)
  })

  it('nginx.conf has gzip enabled', () => {
    const nginxPath = resolve(rootDir, '../../infra/nginx/nginx.conf')
    const nginxContent = readFileSync(nginxPath, 'utf-8')
    expect(nginxContent).toContain('gzip on')
  })

  it('nginx.conf has security headers', () => {
    const nginxPath = resolve(rootDir, '../../infra/nginx/nginx.conf')
    const nginxContent = readFileSync(nginxPath, 'utf-8')
    expect(nginxContent).toContain('X-Frame-Options')
    expect(nginxContent).toContain('X-Content-Type-Options')
  })
})
