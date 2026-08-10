import { describe, expect, it } from 'vitest'

import {
  disabledFinanceRuntime,
  resolveFinanceRuntime,
} from './finance-runtime.ts'

describe('finance runtime', () => {
  it('fails closed when runtime or mode is absent', () => {
    expect(resolveFinanceRuntime({})).toEqual(disabledFinanceRuntime)
    expect(resolveFinanceRuntime({ AKADEMATE_RUNTIME: 'legacy', AKADEMATE_NEXT_FINANCE_MODE: 'connected' })).toEqual(disabledFinanceRuntime)
    expect(resolveFinanceRuntime({ AKADEMATE_RUNTIME: 'next', AKADEMATE_NEXT_FINANCE_MODE: 'unknown' })).toEqual(disabledFinanceRuntime)
  })

  it('scaffold rejects every external capability', () => {
    expect(resolveFinanceRuntime({
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_FINANCE_MODE: 'scaffold',
    })).toEqual({ mode: 'scaffold', externalIo: false, realData: false, webhooks: false, writeback: false })

    expect(resolveFinanceRuntime({
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_FINANCE_MODE: 'scaffold',
      AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED: 'true',
    })).toEqual(disabledFinanceRuntime)
  })

  it('connected requires external IO and real data, while writeback and webhooks stay explicit', () => {
    expect(resolveFinanceRuntime({
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_FINANCE_MODE: 'connected',
      AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED: 'true',
      AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED: 'true',
    })).toEqual({ mode: 'connected', externalIo: true, realData: true, webhooks: false, writeback: false })

    expect(resolveFinanceRuntime({
      AKADEMATE_RUNTIME: 'next',
      AKADEMATE_NEXT_FINANCE_MODE: 'connected',
      AKADEMATE_NEXT_FINANCE_EXTERNAL_IO_ENABLED: 'true',
      AKADEMATE_NEXT_FINANCE_REAL_DATA_ENABLED: 'true',
      AKADEMATE_NEXT_FINANCE_WEBHOOKS_ENABLED: 'true',
      AKADEMATE_NEXT_FINANCE_WRITEBACK_ENABLED: 'true',
    })).toEqual({ mode: 'connected', externalIo: true, realData: true, webhooks: true, writeback: true })
  })
})
