import { describe, expect, it, vi } from 'vitest'
import {
  assertTenantContext,
  getCurrentTenantId,
  withTenantContext,
  withTenantRead,
} from '../src/rls'

type TenantDb = Parameters<typeof withTenantContext>[0]

function createFakeDb() {
  const execute = vi.fn().mockResolvedValue([])
  const transaction = vi.fn(
    async (callback: (tx: { execute: typeof execute }) => Promise<unknown>) => callback({ execute })
  )

  return {
    db: { transaction } as unknown as TenantDb,
    execute,
    transaction,
  }
}

describe('RLS tenant context unit contract', () => {
  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY, '', '0', '1.5', '1abc', '  '])(
    'rejects malformed tenant id %s before opening a transaction',
    async (tenantId) => {
      const { db, transaction } = createFakeDb()

      const result = await withTenantContext(db, { tenantId }, async () => 'unreachable')

      expect(result.success).toBe(false)
      expect(transaction).not.toHaveBeenCalled()
    }
  )

  it('normalizes a valid string id and sets optional request context', async () => {
    const { db, execute, transaction } = createFakeDb()

    const result = await withTenantContext(
      db,
      { tenantId: ' 42 ', userId: 7, siteId: '8', role: 'manager' },
      async (tx) => getCurrentTenantId(tx)
    )

    expect(result).toEqual({ success: true, data: null })
    expect(transaction).toHaveBeenCalledOnce()
    expect(execute).toHaveBeenCalledTimes(5)
  })

  it('returns callback failures without leaking them as successful scope results', async () => {
    const { db, transaction } = createFakeDb()
    const failure = new Error('query failed')

    const result = await withTenantContext(db, { tenantId: 42 }, async () => {
      throw failure
    })

    expect(result).toEqual({ success: false, error: failure })
    expect(transaction).toHaveBeenCalledOnce()
  })

  it('supports read-only delegation and both database result formats', async () => {
    const first = createFakeDb()
    first.execute.mockResolvedValueOnce([]).mockResolvedValueOnce([{ tenant_id: '42' }])
    const firstResult = await withTenantRead(first.db, 42, async (tx) => getCurrentTenantId(tx))

    const second = createFakeDb()
    second.execute.mockResolvedValueOnce([]).mockResolvedValueOnce({ rows: [{ tenant_id: '84' }] })
    const secondResult = await withTenantContext(second.db, { tenantId: 84 }, async (tx) =>
      getCurrentTenantId(tx)
    )

    expect(firstResult).toEqual({ success: true, data: '42' })
    expect(secondResult).toEqual({ success: true, data: '84' })
  })

  it('asserts that missing tenant context is rejected', async () => {
    const { execute } = createFakeDb()

    await expect(assertTenantContext({ execute } as never)).rejects.toThrow(
      'Tenant context not set'
    )
  })
})
