import { describe, expect, it, vi } from 'vitest'

import {
  FINANCE_ISOLATION_AUDIT_ENVIRONMENT,
  FINANCE_ISOLATION_AUDIT_FLAG,
  createFinanceEntityIsolationNegativeAudit,
  createFinanceIsolationScopeDigest,
  type FinanceAccountingSnapshotScope,
  type FinanceEntityIsolationNegativeAuditOptions,
  type FinanceEntityIsolationNegativeCaseRole,
  type FinanceReconciliationSnapshotReaders,
} from '../src'

const scope = {
  tenantId: 'tenant-private',
  legalEntityId: 'entity-private',
  connectionId: 'connection-private',
} as const
const roles = [
  'cross_scope_rejected',
  'payment_relationship_rejected',
  'advertising_relationship_rejected',
] as const
const enabledEnvironment = {
  [FINANCE_ISOLATION_AUDIT_FLAG]: 'true',
  [FINANCE_ISOLATION_AUDIT_ENVIRONMENT]: 'staging',
}

function readers(
  target: FinanceAccountingSnapshotScope,
  role: FinanceEntityIsolationNegativeCaseRole,
  fail = false
): FinanceReconciliationSnapshotReaders {
  const crossScope = role === 'cross_scope_rejected'
  const badPayment = role === 'payment_relationship_rejected'
  const badAdvertising = role === 'advertising_relationship_rejected'
  return {
    readAccountingTransactions: vi.fn(async () => {
      if (fail) throw new Error('password=must-not-leak')
      return [
        {
          externalId: `transaction-${role}`,
          ...target,
          ...(crossScope ? { legalEntityId: 'other-private' } : {}),
          kind: 'income',
          status: 'posted',
          bookedOn: '2026-07-25',
          amount: '100.00',
          currency: 'EUR',
        },
      ]
    }),
    readEnrollments: vi.fn(async (entityScope) => [{ id: 101, ...entityScope }]),
    readCampaigns: vi.fn(async (entityScope) => [{ id: 301, ...entityScope }]),
    readPaymentEvents: vi.fn(async (entityScope) => [
      {
        id: `payment-${role}`,
        ...entityScope,
        enrollment: badPayment ? 999 : 101,
        status: 'paid',
        amount: '100.00',
        currency: 'EUR',
        paidAt: '2026-07-25',
      },
    ]),
    readAdvertisingSpend: vi.fn(async (entityScope) => [
      {
        id: `spend-${role}`,
        ...entityScope,
        campaign: badAdvertising ? 999 : 301,
        rangeSince: '2026-07-25',
        rangeUntil: '2026-07-25',
        amount: '10.00',
        currency: 'EUR',
        metricState: 'loaded',
      },
    ]),
  }
}

function options(
  change: Partial<FinanceEntityIsolationNegativeAuditOptions> = {}
): FinanceEntityIsolationNegativeAuditOptions {
  return {
    scope,
    integrationMode: 'read_only',
    connectionStatus: 'active',
    role: 'existing_entity',
    entityReviewReference: 'review://finance/entity/private/v1',
    cases: roles.map((role) => ({
      role,
      runReviewReference: `review://finance/entity/private/${role}/v1`,
      readers: readers(scope, role),
    })),
    ...change,
  }
}

describe('finance entity isolation negative audit', () => {
  it('does not touch readers unless the independent audit gate is enabled in staging', async () => {
    const source = options()
    const audit = createFinanceEntityIsolationNegativeAudit(source)

    await expect(audit.run({})).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    for (const current of source.cases) {
      expect(current.readers.readAccountingTransactions).not.toHaveBeenCalled()
    }
  })

  it('binds three distinct negative cases to one redacted entity scope', async () => {
    const result =
      await createFinanceEntityIsolationNegativeAudit(options()).run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      reason: 'negative_cases_observed',
      canWrite: false,
      canApply: false,
      observation: {
        schemaVersion: 1,
        mode: 'three_case_entity_finance_isolation_negative_audit',
        scopeDigest: createFinanceIsolationScopeDigest(scope),
        verdict: 'all_breaches_rejected',
        canWrite: false,
        canApply: false,
        metrics: {
          expectedCases: 3,
          evaluatedCases: 3,
          rejectedCases: 3,
          gapCases: 0,
          isolationBreaches: 3,
        },
      },
    })
    if (result.status !== 'observed') throw new Error('TEST_OBSERVATION_REQUIRED')
    expect(result.observation.cases.map(({ role }) => role)).toEqual([...roles].sort())
    expect(result.observation.cases.every(({ verdict }) => verdict === 'breach_detected')).toBe(
      true
    )
    for (const privateValue of Object.values(scope)) {
      expect(result.serializedObservation).not.toContain(privateValue)
    }
    expect(Object.isFrozen(result.observation.cases)).toBe(true)
  })

  it('reports a fail-closed gap when a declared negative case does not breach isolation', async () => {
    const source = options()
    const cases = source.cases.map((current) =>
      current.role === 'payment_relationship_rejected'
        ? {
            ...current,
            readers: {
              ...readers(scope, 'payment_relationship_rejected'),
              readPaymentEvents: vi.fn(async (entityScope) => [
                {
                  id: 'payment-valid',
                  ...entityScope,
                  enrollment: 101,
                  status: 'paid',
                  amount: '100.00',
                  currency: 'EUR',
                  paidAt: '2026-07-25',
                },
              ]),
            },
          }
        : current
    )
    const result = await createFinanceEntityIsolationNegativeAudit({ ...source, cases }).run(
      enabledEnvironment
    )

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'gap_detected',
        metrics: { rejectedCases: 2, gapCases: 1, isolationBreaches: 2 },
      },
    })
  })

  it('sanitizes a reader failure without leaking provider details', async () => {
    const source = options()
    const cases = source.cases.map((current) =>
      current.role === 'cross_scope_rejected'
        ? { ...current, readers: readers(scope, current.role, true) }
        : current
    )
    const result = await createFinanceEntityIsolationNegativeAudit({ ...source, cases }).run(
      enabledEnvironment
    )

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain('must-not-leak')
  })

  it('requires the complete unique case matrix and an explicit pilot shape', () => {
    const source = options()
    expect(() =>
      createFinanceEntityIsolationNegativeAudit({ ...source, cases: source.cases.slice(1) })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_OPTIONS_INVALID' })
    )
    expect(() =>
      createFinanceEntityIsolationNegativeAudit({
        ...source,
        cases: [source.cases[0]!, source.cases[0]!, source.cases[2]!],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_CASE_INVALID' })
    )
    expect(() =>
      createFinanceEntityIsolationNegativeAudit({
        ...source,
        role: 'cep_sur_pilot_candidate',
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ENTITY_ISOLATION_NEGATIVE_AUDIT_OPTIONS_INVALID' })
    )
  })

  it('changes the scope binding for tenant, entity and connection variants', () => {
    const baseline = createFinanceIsolationScopeDigest(scope)
    for (const change of [
      { tenantId: 'other-private' },
      { legalEntityId: 'other-private' },
      { connectionId: 'other-private' },
    ]) {
      expect(createFinanceIsolationScopeDigest({ ...scope, ...change })).not.toBe(baseline)
    }
  })

  it('exports no persistence, activation or permission mutation operation', async () => {
    const module = await import('../src/entity-isolation-negative-audit')
    expect(
      Object.keys(module).filter((key) =>
        /persist|apply|activate|deploy|changePermission|markVerified/i.test(key)
      )
    ).toEqual([])
  })
})
