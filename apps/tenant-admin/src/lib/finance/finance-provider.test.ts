import { describe, expect, it } from 'vitest'

import {
  FINANCE_PROVIDER_KEYS,
  FinanceProviderError,
  createDisabledFinanceProviderAdapter,
  createFinanceProviderAdapter,
  financeProviderCatalog,
} from './finance-provider.ts'

const disabledRuntime = {
  mode: 'disabled' as const,
  externalIo: false,
  realData: false,
  webhooks: false,
  writeback: false,
}

describe('finance provider boundary', () => {
  it('keeps the initial provider catalogue explicit and not claim-ready', () => {
    expect(financeProviderCatalog.map(({ key }) => key)).toEqual([...FINANCE_PROVIDER_KEYS])
    expect(financeProviderCatalog.every(({ availability }) => availability === 'coming_soon')).toBe(true)
    expect(financeProviderCatalog.every(({ supportedModes }) => supportedModes.includes('read_only'))).toBe(true)
  })

  it('fails closed without invoking a transport', async () => {
    let calls = 0
    const adapter = createDisabledFinanceProviderAdapter('holded', disabledRuntime)
    const transport = async () => {
      calls += 1
      return { items: [], hasMore: false }
    }

    await expect(adapter.readPage({ tenantId: 'tenant-a', connectionId: 'connection-a', resource: 'accounts' })).rejects.toMatchObject({
      code: 'finance_provider_disabled',
    } satisfies Partial<FinanceProviderError>)
    expect(calls).toBe(0)
    expect(adapter.discoverCapabilities().length).toBeGreaterThan(0)
    expect(transport).toBeDefined()
  })

  it('does not silently implement a connected provider before its adapter contract exists', () => {
    expect(() => createFinanceProviderAdapter('xero', {
      mode: 'connected',
      externalIo: true,
      realData: true,
      webhooks: false,
      writeback: false,
    })).toThrowError(new FinanceProviderError('finance_provider_not_implemented'))
  })
})
