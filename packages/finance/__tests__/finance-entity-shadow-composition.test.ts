import { describe, expect, it, vi } from 'vitest'
import {
  createExternalOperationalFinanceReaders,
  createFinanceEntityShadowComposition,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT,
  FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG,
  type FinanceEntityShadowConfiguration,
  type FinanceEntityShadowSourceReaders,
  type ImportedAccountingTransaction,
} from '../src'

const enabledEnvironment = {
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
  [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'staging',
}

const configuration: FinanceEntityShadowConfiguration = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  accountingConnectionId: 'accounting-sur',
  integrationMode: 'read_only',
  connectionStatus: 'active',
  reviewReference: 'review://finance/entity-sur/v1',
  rolloutStage: 'pre_pilot_validation',
}

const accountingTransaction: ImportedAccountingTransaction = {
  externalId: 'accounting-1',
  tenantId: configuration.tenantId,
  legalEntityId: configuration.legalEntityId,
  connectionId: configuration.accountingConnectionId,
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-22',
  valueOn: null,
  amount: '100.00',
  currency: 'EUR',
  description: null,
  counterpartyName: null,
  accountCode: null,
  costCenter: null,
  reference: 'receipt-1',
  sourceUpdatedAt: null,
  sourceHash: 'private-source-hash',
}

function sourceReaders(callOrder: string[] = []): FinanceEntityShadowSourceReaders {
  return {
    accounting: {
      readAccountingTransactions: vi.fn(async (scope) => {
        callOrder.push('accounting')
        expect(Object.isFrozen(scope)).toBe(true)
        return [accountingTransaction]
      }),
    },
    payloadRelationships: {
      readEnrollments: vi.fn(async (scope) => {
        callOrder.push('enrollments')
        expect(scope).not.toHaveProperty('connectionId')
        return [{ id: 101, ...scope, amountPaid: '100.00' }]
      }),
      readCampaigns: vi.fn(async (scope) => {
        callOrder.push('campaigns')
        expect(scope).not.toHaveProperty('connectionId')
        return []
      }),
    },
    externalOperations: {
      readPaymentEvents: vi.fn(async (scope) => {
        callOrder.push('payments')
        expect(scope).not.toHaveProperty('connectionId')
        return [
          {
            id: 'payment-1',
            ...scope,
            enrollment: 101,
            status: 'paid' as const,
            amount: '100.00',
            currency: 'EUR',
            paidAt: '2026-07-22',
            transactionReference: 'receipt-1',
          },
        ]
      }),
      readAdvertisingSpend: vi.fn(async (scope) => {
        callOrder.push('advertising')
        expect(scope).not.toHaveProperty('connectionId')
        return []
      }),
    },
  }
}

function allReaderMocks(sources: FinanceEntityShadowSourceReaders): ReturnType<typeof vi.mocked>[] {
  return [
    vi.mocked(sources.accounting.readAccountingTransactions),
    vi.mocked(sources.payloadRelationships.readEnrollments),
    vi.mocked(sources.payloadRelationships.readCampaigns),
    vi.mocked(sources.externalOperations.readPaymentEvents),
    vi.mocked(sources.externalOperations.readAdvertisingSpend),
  ]
}

describe('single-entity finance shadow composition', () => {
  it('keeps every source untouched when the shadow flag is disabled', async () => {
    const sources = sourceReaders()
    const composition = createFinanceEntityShadowComposition({ configuration, sources })

    await expect(composition.run({})).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    for (const reader of allReaderMocks(sources)) expect(reader).not.toHaveBeenCalled()
  })

  it('fails closed in production before any source is read', async () => {
    const sources = sourceReaders()
    const composition = createFinanceEntityShadowComposition({ configuration, sources })

    await expect(
      composition.run({
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_FLAG]: 'true',
        [FINANCE_RECONCILIATION_SHADOW_RUNNER_ENVIRONMENT]: 'production',
      })
    ).resolves.toMatchObject({ status: 'skipped', reason: 'production_forbidden' })
    for (const reader of allReaderMocks(sources)) expect(reader).not.toHaveBeenCalled()
  })

  it('loads all five readers sequentially for exactly one entity and emits redacted evidence', async () => {
    const callOrder: string[] = []
    const sources = sourceReaders(callOrder)
    const composition = createFinanceEntityShadowComposition({ configuration, sources })

    const result = await composition.run(enabledEnvironment)

    expect(callOrder).toEqual(['accounting', 'enrollments', 'campaigns', 'payments', 'advertising'])
    expect(vi.mocked(sources.accounting.readAccountingTransactions)).toHaveBeenCalledWith({
      tenantId: 'tenant-cep',
      legalEntityId: 'entity-sur',
      connectionId: 'accounting-sur',
    })
    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'planned',
        metrics: { accountingTransactions: 1, sourceRecords: 1, proposed: 1 },
      },
    })
    for (const privateValue of [
      'tenant-cep',
      'entity-sur',
      'accounting-sur',
      'receipt-1',
      '100.00',
      'private-source-hash',
    ]) {
      expect(JSON.stringify(result)).not.toContain(privateValue)
    }
  })

  it('exposes no configuration, batch execution or persistence surface', () => {
    const composition = createFinanceEntityShadowComposition({
      configuration,
      sources: sourceReaders(),
    })

    expect(Object.keys(composition).sort()).toEqual([
      'canApply',
      'canWrite',
      'mode',
      'rolloutStage',
      'run',
      'schemaVersion',
    ])
    expect(composition).toMatchObject({
      schemaVersion: 1,
      mode: 'single_entity_read_only_shadow',
      rolloutStage: 'pre_pilot_validation',
      canWrite: false,
      canApply: false,
    })
    expect(composition).not.toHaveProperty('runBatch')
    expect(composition).not.toHaveProperty('configuration')
    expect(composition).not.toHaveProperty('store')
  })

  it('keeps independent compositions isolated instead of aggregating entities', async () => {
    const surSources = sourceReaders()
    const norteSources = sourceReaders()
    const sur = createFinanceEntityShadowComposition({ configuration, sources: surSources })
    createFinanceEntityShadowComposition({
      configuration: {
        ...configuration,
        legalEntityId: 'entity-norte',
        accountingConnectionId: 'accounting-norte',
        reviewReference: 'review://finance/entity-norte/v1',
      },
      sources: norteSources,
    })

    await sur.run(enabledEnvironment)

    for (const reader of allReaderMocks(surSources)) expect(reader).toHaveBeenCalledOnce()
    for (const reader of allReaderMocks(norteSources)) expect(reader).not.toHaveBeenCalled()
  })

  it('composes the real external movement reader with relationship and accounting readers', async () => {
    const externalOperations = createExternalOperationalFinanceReaders({
      paymentSources: [
        {
          tenantId: 'tenant-cep',
          legalEntityId: 'entity-sur',
          sourceConnectionId: 'payment-connection-sur',
          provider: 'payment-provider',
          externalAccountId: 'payment-account-sur',
          integrationMode: 'read_only',
          connectionStatus: 'active',
          reviewReference: 'review://finance/entity-sur/payment/v1',
          enrollmentMappings: [{ externalId: 'external-enrollment-101', localId: 101 }],
          client: {
            provider: 'payment-provider',
            listPaymentEvents: vi.fn(async () => ({
              items: [
                {
                  externalId: 'payment-1',
                  externalEnrollmentId: 'external-enrollment-101',
                  status: 'paid' as const,
                  amount: '100.00',
                  currency: 'EUR',
                  paidAt: '2026-07-22',
                  transactionReference: 'receipt-1',
                },
              ],
              nextCursor: null,
              snapshotVersion: 'snapshot-v1',
            })),
          },
        },
      ],
      advertisingSpendSources: [
        {
          tenantId: 'tenant-cep',
          legalEntityId: 'entity-sur',
          sourceConnectionId: 'advertising-connection-sur',
          provider: 'ads-provider',
          externalAccountId: 'ads-account-sur',
          integrationMode: 'read_only',
          connectionStatus: 'active',
          reviewReference: 'review://finance/entity-sur/advertising/v1',
          campaignMappings: [],
          client: {
            provider: 'ads-provider',
            listDailyAdvertisingSpend: vi.fn(async () => ({
              items: [],
              nextCursor: null,
              snapshotVersion: 'snapshot-v1',
            })),
          },
        },
      ],
    })
    const base = sourceReaders()
    const composition = createFinanceEntityShadowComposition({
      configuration,
      sources: { ...base, externalOperations },
    })

    await expect(composition.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'observed',
      observation: { verdict: 'planned', metrics: { proposed: 1 } },
    })
  })

  it.each([
    [{ tenantId: ' tenant-cep ' }, 'FINANCE_ENTITY_SHADOW_CONFIGURATION_INVALID'],
    [{ integrationMode: 'write' as never }, 'FINANCE_ENTITY_SHADOW_CONFIGURATION_INVALID'],
    [{ connectionStatus: 'disabled' as never }, 'FINANCE_ENTITY_SHADOW_CONFIGURATION_INVALID'],
    [{ reviewReference: 'not-reviewed' }, 'FINANCE_ENTITY_SHADOW_CONFIGURATION_INVALID'],
    [{ rolloutStage: 'cep_sur_pilot' as const }, 'FINANCE_ENTITY_SHADOW_PILOT_REVIEW_INVALID'],
    [
      { pilotReviewReference: 'review://finance/entity-sur/pilot/v1' },
      'FINANCE_ENTITY_SHADOW_PILOT_REVIEW_INVALID',
    ],
    [
      {
        rolloutStage: 'cep_sur_pilot' as const,
        pilotReviewReference: configuration.reviewReference,
      },
      'FINANCE_ENTITY_SHADOW_PILOT_REVIEW_INVALID',
    ],
  ])('rejects invalid configuration before reader capture: %o', (change, code) => {
    const sources = sourceReaders()

    expect(() =>
      createFinanceEntityShadowComposition({
        configuration: { ...configuration, ...change },
        sources,
      })
    ).toThrowError(expect.objectContaining({ code }))
    for (const reader of allReaderMocks(sources)) expect(reader).not.toHaveBeenCalled()
  })

  it('requires a distinct reviewed approval before marking CEP Sur as pilot', () => {
    const composition = createFinanceEntityShadowComposition({
      configuration: {
        ...configuration,
        rolloutStage: 'cep_sur_pilot',
        pilotReviewReference: 'review://finance/entity-sur/pilot/v1',
      },
      sources: sourceReaders(),
    })

    expect(composition.rolloutStage).toBe('cep_sur_pilot')
    expect(JSON.stringify(composition)).not.toContain('pilot/v1')
    expect(JSON.stringify(composition)).not.toContain('entity-sur')
  })

  it('rejects malformed reader groups synchronously with a safe error', () => {
    expect(() =>
      createFinanceEntityShadowComposition({
        configuration,
        sources: null as never,
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ENTITY_SHADOW_READER_INVALID' }))

    expect(() =>
      createFinanceEntityShadowComposition({
        configuration,
        sources: {
          ...sourceReaders(),
          accounting: { readAccountingTransactions: null as never },
        },
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ENTITY_SHADOW_READER_INVALID' }))
  })

  it('redacts a source failure and prevents all later readers', async () => {
    const sources = sourceReaders()
    vi.mocked(sources.payloadRelationships.readEnrollments).mockRejectedValueOnce(
      new Error('database-password=must-not-leak')
    )
    const composition = createFinanceEntityShadowComposition({ configuration, sources })

    const result = await composition.run(enabledEnvironment)

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
    expect(sources.payloadRelationships.readCampaigns).not.toHaveBeenCalled()
    expect(sources.externalOperations.readPaymentEvents).not.toHaveBeenCalled()
  })

  it('applies loader limits before I/O and reports only a redacted load failure', async () => {
    const sources = sourceReaders()
    const composition = createFinanceEntityShadowComposition({
      configuration,
      sources,
      limits: { maxSourceRecords: 0 },
    })

    await expect(composition.run(enabledEnvironment)).resolves.toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    for (const reader of allReaderMocks(sources)) expect(reader).not.toHaveBeenCalled()
  })

  it('reports a blocked projection without exposing the mismatched entity data', async () => {
    const sources = sourceReaders()
    vi.mocked(sources.externalOperations.readPaymentEvents).mockResolvedValueOnce([
      {
        id: 'foreign-payment',
        tenantId: 'tenant-cep',
        legalEntityId: 'entity-norte',
        enrollment: 101,
        status: 'paid',
        amount: '100.00',
        currency: 'EUR',
        paidAt: '2026-07-22',
      },
    ])
    const composition = createFinanceEntityShadowComposition({ configuration, sources })

    const result = await composition.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      observation: { verdict: 'blocked', metrics: { projectionIssues: 2, proposed: 0 } },
    })
    expect(JSON.stringify(result)).not.toContain('entity-norte')
    expect(JSON.stringify(result)).not.toContain('foreign-payment')
  })
})
