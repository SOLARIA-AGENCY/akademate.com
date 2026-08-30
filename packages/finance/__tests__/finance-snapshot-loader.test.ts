import { describe, expect, it, vi } from 'vitest'
import {
  createFinanceReconciliationSnapshotLoader,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  loadFinanceReconciliationSnapshot,
  runFinanceReconciliationShadowEvidence,
  type FinanceReconciliationSnapshotLoaderOptions,
  type FinanceReconciliationSnapshotReaders,
  type ImportedAccountingTransaction,
} from '../src'

const scope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  connectionId: 'connection-sur',
}

const accountingTransaction: ImportedAccountingTransaction = {
  externalId: 'accounting-1',
  ...scope,
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-21',
  valueOn: null,
  amount: '1250.50',
  currency: 'EUR',
  description: 'private-description',
  counterpartyName: 'private-counterparty',
  accountCode: 'private-account-code',
  costCenter: 'private-cost-center',
  reference: 'matricula-1',
  sourceUpdatedAt: null,
  sourceHash: 'hash-1',
}

function createReaders(callOrder: string[] = []): FinanceReconciliationSnapshotReaders {
  return {
    readAccountingTransactions: vi.fn(async (receivedScope) => {
      callOrder.push('accounting')
      expect(Object.isFrozen(receivedScope)).toBe(true)
      expect(receivedScope).toEqual(scope)
      return [accountingTransaction]
    }),
    readEnrollments: vi.fn(async (receivedScope) => {
      callOrder.push('enrollments')
      expect(Object.isFrozen(receivedScope)).toBe(true)
      expect(receivedScope).toEqual({
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
      })
      expect(receivedScope).not.toHaveProperty('connectionId')
      return [{ id: 'enrollment-1', ...receivedScope, amountPaid: '1250.50' }]
    }),
    readCampaigns: vi.fn(async (receivedScope) => {
      callOrder.push('campaigns')
      expect(receivedScope).not.toHaveProperty('connectionId')
      return [{ id: 'campaign-1', ...receivedScope }]
    }),
    readPaymentEvents: vi.fn(async (receivedScope) => {
      callOrder.push('payments')
      expect(receivedScope).not.toHaveProperty('connectionId')
      return [
        {
          id: { id: 'payment-1' },
          ...receivedScope,
          enrollment: { id: 'enrollment-1' },
          status: 'paid' as const,
          amount: '1250.50',
          currency: 'EUR',
          paidAt: new Date('2026-07-21T12:00:00.000Z'),
          transactionReference: 'matricula-1',
        },
      ]
    }),
    readAdvertisingSpend: vi.fn(async (receivedScope) => {
      callOrder.push('advertising')
      expect(receivedScope).not.toHaveProperty('connectionId')
      return []
    }),
  }
}

function options(
  readers: FinanceReconciliationSnapshotReaders = createReaders()
): FinanceReconciliationSnapshotLoaderOptions {
  return { scope, readers }
}

describe('finance reconciliation snapshot loader', () => {
  it('loads sequentially with least-privilege scopes and immutable copies', async () => {
    const callOrder: string[] = []
    const readers = createReaders(callOrder)
    const result = await loadFinanceReconciliationSnapshot(options(readers))

    expect(callOrder).toEqual(['accounting', 'enrollments', 'campaigns', 'payments', 'advertising'])
    expect(result).toMatchObject({
      tenantId: scope.tenantId,
      legalEntityId: scope.legalEntityId,
      connectionId: scope.connectionId,
      operational: {
        targetTenantId: scope.tenantId,
        targetLegalEntityId: scope.legalEntityId,
        maxSourceRecords: 10_000,
        maxRelationshipRecords: 20_000,
      },
    })
    expect(Object.isFrozen(result)).toBe(true)
    expect(Object.isFrozen(result.accountingTransactions)).toBe(true)
    expect(Object.isFrozen(result.accountingTransactions[0])).toBe(true)
    expect(Object.isFrozen(result.operational)).toBe(true)
    expect(Object.isFrozen(result.operational.paymentEvents[0])).toBe(true)
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain('private-description')
    expect(serialized).not.toContain('private-counterparty')
    expect(serialized).not.toContain('private-account-code')
    expect(serialized).not.toContain('private-cost-center')
    expect(serialized).not.toContain('hash-1')
  })

  it('does not forward unexpected scope properties to any reader', async () => {
    const readers = createReaders()

    await loadFinanceReconciliationSnapshot({
      ...options(readers),
      scope: { ...scope, providerSecret: 'private-provider-secret' } as never,
    })

    expect(readers.readAccountingTransactions).toHaveBeenCalledWith(scope)
    expect(JSON.stringify(vi.mocked(readers.readAccountingTransactions).mock.calls)).not.toContain(
      'private-provider-secret'
    )
  })

  it.each([
    [{ ...scope, tenantId: ' tenant-cep ' }, {}, 'FINANCE_SNAPSHOT_INVALID_SCOPE'],
    [{ ...scope, tenantId: null as never }, {}, 'FINANCE_SNAPSHOT_INVALID_SCOPE'],
    [scope, { maxAccountingTransactions: 0 }, 'FINANCE_SNAPSHOT_INVALID_LIMIT'],
    [scope, { maxSourceRecords: 100_001 }, 'FINANCE_SNAPSHOT_INVALID_LIMIT'],
    [scope, { maxRelationshipRecords: 200_001 }, 'FINANCE_SNAPSHOT_INVALID_LIMIT'],
    [scope, { dateWindowDays: 32 }, 'FINANCE_SNAPSHOT_INVALID_RECONCILIATION_LIMIT'],
    [scope, { maxComparisons: 0 }, 'FINANCE_SNAPSHOT_INVALID_RECONCILIATION_LIMIT'],
  ])('rejects invalid scope or limits before any reader runs', async (badScope, change, code) => {
    const readers = createReaders()

    await expect(
      loadFinanceReconciliationSnapshot({ ...options(readers), scope: badScope, ...change })
    ).rejects.toMatchObject({ code })
    expect(readers.readAccountingTransactions).not.toHaveBeenCalled()
    expect(readers.readEnrollments).not.toHaveBeenCalled()
  })

  it('sanitizes a reader failure and does not call subsequent readers', async () => {
    const readers = createReaders()
    vi.mocked(readers.readEnrollments).mockRejectedValueOnce(
      new Error('database-password=private-value')
    )

    await expect(loadFinanceReconciliationSnapshot(options(readers))).rejects.toEqual(
      expect.objectContaining({
        code: 'FINANCE_SNAPSHOT_ENROLLMENTS_READ_FAILED',
        safeSummary: 'Finance snapshot enrollments read failed.',
      })
    )
    expect(readers.readCampaigns).not.toHaveBeenCalled()
    expect(readers.readPaymentEvents).not.toHaveBeenCalled()
    expect(readers.readAdvertisingSpend).not.toHaveBeenCalled()
  })

  it('stops after accounting when its bounded size is exceeded', async () => {
    const readers = createReaders()
    vi.mocked(readers.readAccountingTransactions).mockResolvedValueOnce([
      accountingTransaction,
      { ...accountingTransaction, externalId: 'accounting-2' },
    ])

    await expect(
      loadFinanceReconciliationSnapshot({ ...options(readers), maxAccountingTransactions: 1 })
    ).rejects.toMatchObject({ code: 'FINANCE_SNAPSHOT_ACCOUNTING_LIMIT_EXCEEDED' })
    expect(readers.readEnrollments).not.toHaveBeenCalled()
  })

  it('stops before movement readers when relationship size is exceeded', async () => {
    const readers = createReaders()

    await expect(
      loadFinanceReconciliationSnapshot({ ...options(readers), maxRelationshipRecords: 1 })
    ).rejects.toMatchObject({ code: 'FINANCE_SNAPSHOT_RELATIONSHIP_LIMIT_EXCEEDED' })
    expect(readers.readPaymentEvents).not.toHaveBeenCalled()
    expect(readers.readAdvertisingSpend).not.toHaveBeenCalled()
  })

  it('rejects the combined movement size after the final read', async () => {
    const readers = createReaders()
    vi.mocked(readers.readAdvertisingSpend).mockResolvedValueOnce([
      {
        id: 'spend-1',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        campaign: 'campaign-1',
        rangeSince: '2026-07-21',
        rangeUntil: '2026-07-21',
        amount: '1.00',
        currency: 'EUR',
        metricState: 'loaded',
      },
    ])

    await expect(
      loadFinanceReconciliationSnapshot({ ...options(readers), maxSourceRecords: 1 })
    ).rejects.toMatchObject({ code: 'FINANCE_SNAPSHOT_SOURCE_LIMIT_EXCEEDED' })
  })

  it('plugs into the disabled-by-default shadow runner without runtime registration', async () => {
    const loadSnapshot = createFinanceReconciliationSnapshotLoader(options())
    const result = await runFinanceReconciliationShadowEvidence({
      environment: {
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
      },
      loadSnapshot,
    })

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'planned',
        metrics: { accountingTransactions: 1, sourceRecords: 1, proposed: 1 },
      },
    })
  })

  it('treats a non-array reader result as a sanitized read failure', async () => {
    const readers = createReaders()
    vi.mocked(readers.readCampaigns).mockResolvedValueOnce(null as never)

    await expect(loadFinanceReconciliationSnapshot(options(readers))).rejects.toMatchObject({
      code: 'FINANCE_SNAPSHOT_CAMPAIGNS_READ_FAILED',
    })
    expect(readers.readPaymentEvents).not.toHaveBeenCalled()
  })
})
