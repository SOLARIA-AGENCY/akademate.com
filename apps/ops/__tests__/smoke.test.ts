/**
 * @module @akademate/ops/__tests__/smoke
 * Smoke tests for the Ops dashboard app
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

describe('Ops App — next.config', () => {
  it('exports a valid Next.js configuration', async () => {
    const config = await import('../next.config')

    expect(config.default).toBeDefined()
    expect(config.default.reactStrictMode).toBe(true)
    expect(config.default.typedRoutes).toBe(true)
  })
})

describe('Ops App — Database Module', () => {
  beforeEach(() => {
    vi.resetModules()
  })

  it('getDb throws when DATABASE_URL is not set', async () => {
    const originalUrl = process.env.DATABASE_URL
    delete process.env.DATABASE_URL

    try {
      const { getDb } = await import('../lib/db')
      // Reset singleton state so a fresh connection is attempted
      const { closeDatabaseConnection } = await import('../lib/db')
      await closeDatabaseConnection()

      expect(() => getDb()).toThrow('DATABASE_URL is not set')
    } finally {
      if (originalUrl !== undefined) {
        process.env.DATABASE_URL = originalUrl
      }
    }
  })

  it('closeDatabaseConnection resolves safely when no connection exists', async () => {
    const { closeDatabaseConnection } = await import('../lib/db')
    // Ensure internal state is cleared
    await closeDatabaseConnection()
    // Calling again with no active connection should not throw
    await expect(closeDatabaseConnection()).resolves.toBeUndefined()
  })

  it('re-exports schema tables (users, tenants, subscriptions)', async () => {
    const mod = await import('../lib/db')

    expect(mod.users).toBeDefined()
    expect(mod.tenants).toBeDefined()
    expect(mod.subscriptions).toBeDefined()
  })
})
