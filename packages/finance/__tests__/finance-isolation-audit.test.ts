import { describe, expect, it, vi } from 'vitest'
import {
  createFinanceIsolationAudit,
  FINANCE_ISOLATION_AUDIT_ENVIRONMENT,
  FINANCE_ISOLATION_AUDIT_FLAG,
  resolveFinanceIsolationAuditGate,
  type FinanceAccountingSnapshotScope,
  type FinanceIsolationAuditCandidate,
  type FinanceReconciliationSnapshotReaders,
} from '../src'

const scopes = {
  norte: {
    tenantId: 'tenant-cep',
    legalEntityId: 'entity-norte',
    connectionId: 'accounting-norte',
  },
  santa: {
    tenantId: 'tenant-cep',
    legalEntityId: 'entity-santa-cruz',
    connectionId: 'accounting-santa-cruz',
  },
  sur: {
    tenantId: 'tenant-cep',
    legalEntityId: 'entity-sur',
    connectionId: 'accounting-sur',
  },
} as const

const enabledEnvironment = {
  [FINANCE_ISOLATION_AUDIT_FLAG]: 'true',
  [FINANCE_ISOLATION_AUDIT_ENVIRONMENT]: 'staging',
}

type ReaderOverrides = Partial<{
  accounting: FinanceReconciliationSnapshotReaders['readAccountingTransactions']
  enrollments: FinanceReconciliationSnapshotReaders['readEnrollments']
  campaigns: FinanceReconciliationSnapshotReaders['readCampaigns']
  payments: FinanceReconciliationSnapshotReaders['readPaymentEvents']
  advertising: FinanceReconciliationSnapshotReaders['readAdvertisingSpend']
}>

function readersFor(
  scope: FinanceAccountingSnapshotScope,
  label: string,
  callOrder: string[] = [],
  overrides: ReaderOverrides = {}
): FinanceReconciliationSnapshotReaders {
  return {
    readAccountingTransactions: vi.fn(
      overrides.accounting ??
        (async (received) => {
          callOrder.push(`${label}:accounting`)
          expect(received).toEqual(scope)
          return [
            {
              externalId: `transaction-${label}`,
              ...scope,
              kind: 'income',
              status: 'posted',
              bookedOn: '2026-07-22',
              amount: '100.00',
              currency: 'EUR',
              reference: `receipt-${label}`,
            },
          ]
        })
    ),
    readEnrollments: vi.fn(
      overrides.enrollments ??
        (async (received) => {
          callOrder.push(`${label}:enrollments`)
          expect(received).toEqual({
            tenantId: scope.tenantId,
            legalEntityId: scope.legalEntityId,
          })
          expect(received).not.toHaveProperty('connectionId')
          return [{ id: 101, ...received, amountPaid: '100.00' }]
        })
    ),
    readCampaigns: vi.fn(
      overrides.campaigns ??
        (async (received) => {
          callOrder.push(`${label}:campaigns`)
          return [{ id: 301, ...received }]
        })
    ),
    readPaymentEvents: vi.fn(
      overrides.payments ??
        (async (received) => {
          callOrder.push(`${label}:payments`)
          return [
            {
              id: `payment-${label}`,
              ...received,
              enrollment: 101,
              status: 'paid',
              amount: '100.00',
              currency: 'EUR',
              paidAt: '2026-07-22',
              transactionReference: `receipt-${label}`,
            },
          ]
        })
    ),
    readAdvertisingSpend: vi.fn(
      overrides.advertising ??
        (async (received) => {
          callOrder.push(`${label}:advertising`)
          return [
            {
              id: `spend-${label}`,
              ...received,
              campaign: 301,
              rangeSince: '2026-07-22',
              rangeUntil: '2026-07-22',
              amount: '10.00',
              currency: 'EUR',
              metricState: 'loaded',
            },
          ]
        })
    ),
  }
}

function candidate(
  name: keyof typeof scopes,
  readers: FinanceReconciliationSnapshotReaders = readersFor(scopes[name], name),
  change: Partial<FinanceIsolationAuditCandidate> = {}
): FinanceIsolationAuditCandidate {
  const pilot = name === 'sur'
  return {
    scope: scopes[name],
    integrationMode: 'read_only',
    connectionStatus: 'active',
    role: pilot ? 'cep_sur_pilot_candidate' : 'existing_entity',
    reviewReference: `review://finance/isolation/${name}/v1`,
    ...(pilot ? { pilotReviewReference: 'review://finance/isolation/sur/pilot/v1' } : {}),
    readers,
    ...change,
  }
}

function candidates(
  overrides: Partial<Record<keyof typeof scopes, FinanceIsolationAuditCandidate>> = {}
): readonly FinanceIsolationAuditCandidate[] {
  return [
    overrides.norte ?? candidate('norte'),
    overrides.santa ?? candidate('santa'),
    overrides.sur ?? candidate('sur'),
  ]
}

function readerMocks(
  candidateValue: FinanceIsolationAuditCandidate
): ReturnType<typeof vi.mocked>[] {
  return [
    vi.mocked(candidateValue.readers.readAccountingTransactions),
    vi.mocked(candidateValue.readers.readEnrollments),
    vi.mocked(candidateValue.readers.readCampaigns),
    vi.mocked(candidateValue.readers.readPaymentEvents),
    vi.mocked(candidateValue.readers.readAdvertisingSpend),
  ]
}

describe('three-entity finance isolation audit', () => {
  it('does not touch any reader while its independent flag is disabled', async () => {
    const plan = candidates()
    const audit = createFinanceIsolationAudit({ candidates: plan })

    await expect(audit.run({})).resolves.toEqual({
      status: 'skipped',
      reason: 'flag_disabled',
      canWrite: false,
      canApply: false,
    })
    for (const current of plan) {
      for (const reader of readerMocks(current)) expect(reader).not.toHaveBeenCalled()
    }
  })

  it.each([
    [{ [FINANCE_ISOLATION_AUDIT_FLAG]: 'true' }, 'environment_missing_or_invalid'],
    [
      {
        [FINANCE_ISOLATION_AUDIT_FLAG]: 'true',
        [FINANCE_ISOLATION_AUDIT_ENVIRONMENT]: 'development',
      },
      'environment_missing_or_invalid',
    ],
    [
      {
        [FINANCE_ISOLATION_AUDIT_FLAG]: 'true',
        [FINANCE_ISOLATION_AUDIT_ENVIRONMENT]: 'production',
      },
      'production_forbidden',
    ],
  ])('fails closed outside explicit staging: %o', async (environment, reason) => {
    const plan = candidates()
    const audit = createFinanceIsolationAudit({ candidates: plan })

    expect(resolveFinanceIsolationAuditGate(environment)).toEqual({ enabled: false, reason })
    await expect(audit.run(environment)).resolves.toMatchObject({ status: 'skipped', reason })
    for (const current of plan) {
      for (const reader of readerMocks(current)) expect(reader).not.toHaveBeenCalled()
    }
  })

  it('evaluates three entities sequentially and emits only redacted conformance counters', async () => {
    const callOrder: string[] = []
    const norte = candidate('norte', readersFor(scopes.norte, 'norte', callOrder))
    const santa = candidate('santa', readersFor(scopes.santa, 'santa', callOrder))
    const sur = candidate('sur', readersFor(scopes.sur, 'sur', callOrder))
    const audit = createFinanceIsolationAudit({ candidates: [sur, norte, santa] })

    const result = await audit.run(enabledEnvironment)

    expect(callOrder).toEqual([
      'norte:accounting',
      'norte:enrollments',
      'norte:campaigns',
      'norte:payments',
      'norte:advertising',
      'santa:accounting',
      'santa:enrollments',
      'santa:campaigns',
      'santa:payments',
      'santa:advertising',
      'sur:accounting',
      'sur:enrollments',
      'sur:campaigns',
      'sur:payments',
      'sur:advertising',
    ])
    expect(result).toEqual({
      status: 'observed',
      reason: 'isolation_observed',
      canWrite: false,
      canApply: false,
      observation: {
        schemaVersion: 1,
        mode: 'three_entity_finance_isolation_audit',
        verdict: 'isolated',
        canWrite: false,
        canApply: false,
        metrics: {
          expectedEntities: 3,
          evaluatedEntities: 3,
          evaluatedSurfaces: 15,
          isolationBreaches: 0,
        },
      },
      serializedObservation:
        '{"schemaVersion":1,"mode":"three_entity_finance_isolation_audit","verdict":"isolated","canWrite":false,"canApply":false,"metrics":{"expectedEntities":3,"evaluatedEntities":3,"evaluatedSurfaces":15,"isolationBreaches":0}}',
    })
    for (const privateValue of [
      'tenant-cep',
      'entity-norte',
      'entity-santa-cruz',
      'entity-sur',
      'accounting-norte',
      'transaction-norte',
      'receipt-sur',
      '100.00',
      'EUR',
    ]) {
      expect(JSON.stringify(result)).not.toContain(privateValue)
    }
  })

  it('stops at the first cross-entity record and never reads the next entity', async () => {
    const sur = candidate('sur')
    const santa = candidate(
      'santa',
      readersFor(scopes.santa, 'santa', [], {
        enrollments: async () => [
          {
            id: 101,
            tenantId: 'tenant-cep',
            legalEntityId: 'entity-norte',
            amountPaid: '100.00',
          },
        ],
      })
    )
    const audit = createFinanceIsolationAudit({
      candidates: [candidate('norte'), santa, sur],
    })

    const result = await audit.run(enabledEnvironment)

    expect(result).toMatchObject({
      status: 'observed',
      observation: {
        verdict: 'breach_detected',
        metrics: { evaluatedEntities: 2, evaluatedSurfaces: 10, isolationBreaches: 1 },
      },
    })
    for (const reader of readerMocks(sur)) expect(reader).not.toHaveBeenCalled()
    expect(JSON.stringify(result)).not.toContain('entity-norte')
    expect(JSON.stringify(result)).not.toContain('entity-santa-cruz')
  })

  it.each([
    ['tenant', { tenantId: 'other-tenant' }],
    ['entity', { legalEntityId: 'entity-sur' }],
    ['connection', { connectionId: 'accounting-sur' }],
  ])('detects a cross-scope accounting %s', async (_label, change) => {
    const norte = candidate(
      'norte',
      readersFor(scopes.norte, 'norte', [], {
        accounting: async () => [
          {
            externalId: 'transaction-crossed',
            ...scopes.norte,
            ...change,
            kind: 'income',
            status: 'posted',
            bookedOn: '2026-07-22',
            amount: '1.00',
            currency: 'EUR',
          },
        ],
      })
    )
    const audit = createFinanceIsolationAudit({ candidates: candidates({ norte }) })

    await expect(audit.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'observed',
      observation: { verdict: 'breach_detected', metrics: { isolationBreaches: 1 } },
    })
  })

  it('detects duplicate IDs and relationships to parents outside the entity snapshot', async () => {
    const norte = candidate(
      'norte',
      readersFor(scopes.norte, 'norte', [], {
        enrollments: async (scope) => [
          { id: 101, ...scope },
          { id: 101, ...scope },
        ],
        payments: async (scope) => [
          {
            id: 'payment-norte',
            ...scope,
            enrollment: 999,
            status: 'paid',
            amount: '1.00',
            currency: 'EUR',
            paidAt: '2026-07-22',
          },
        ],
        advertising: async (scope) => [
          {
            id: 'spend-norte',
            ...scope,
            campaign: 999,
            rangeSince: '2026-07-22',
            rangeUntil: '2026-07-22',
            amount: '1.00',
            currency: 'EUR',
            metricState: 'loaded',
          },
        ],
      })
    )
    const audit = createFinanceIsolationAudit({ candidates: candidates({ norte }) })

    await expect(audit.run(enabledEnvironment)).resolves.toMatchObject({
      status: 'observed',
      observation: { verdict: 'breach_detected', metrics: { isolationBreaches: 3 } },
    })
  })

  it('sanitizes a reader failure and stops every later reader and entity', async () => {
    const secret = 'database-password=must-not-leak'
    const norte = candidate(
      'norte',
      readersFor(scopes.norte, 'norte', [], {
        enrollments: async () => {
          throw new Error(secret)
        },
      })
    )
    const santa = candidate('santa')
    const sur = candidate('sur')
    const audit = createFinanceIsolationAudit({ candidates: [norte, santa, sur] })

    const result = await audit.run(enabledEnvironment)

    expect(result).toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    expect(JSON.stringify(result)).not.toContain(secret)
    expect(norte.readers.readCampaigns).not.toHaveBeenCalled()
    for (const reader of readerMocks(santa)) expect(reader).not.toHaveBeenCalled()
    for (const reader of readerMocks(sur)) expect(reader).not.toHaveBeenCalled()
  })

  it.each([[0], [2]])('requires exactly three reviewed candidates, received %i', (count) => {
    expect(() =>
      createFinanceIsolationAudit({ candidates: candidates().slice(0, count) })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_ENTITY_COUNT_INVALID' })
    )
  })

  it('rejects more than three candidates before reader I/O', () => {
    expect(() =>
      createFinanceIsolationAudit({ candidates: [...candidates(), candidate('norte')] })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_ENTITY_COUNT_INVALID' })
    )
  })

  it('rejects tenant mismatch, duplicate entities and shared connections before I/O', () => {
    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          santa: candidate('santa', undefined, {
            scope: { ...scopes.santa, tenantId: 'other-tenant' },
          }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_TENANT_MISMATCH' }))

    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          santa: candidate('santa', undefined, { scope: scopes.norte }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_DUPLICATE_ENTITY' }))

    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          santa: candidate('santa', undefined, {
            scope: { ...scopes.santa, connectionId: scopes.norte.connectionId },
          }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_SHARED_CONNECTION' }))
  })

  it('requires exactly one explicitly reviewed CEP Sur pilot candidate', () => {
    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          sur: candidate('sur', undefined, {
            role: 'existing_entity',
            pilotReviewReference: undefined,
          }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_PILOT_COUNT_INVALID' }))

    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          norte: candidate('norte', undefined, {
            role: 'cep_sur_pilot_candidate',
            pilotReviewReference: 'review://finance/isolation/norte/pilot/v1',
          }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_PILOT_COUNT_INVALID' }))
  })

  it.each([
    [{ integrationMode: 'write' as never }],
    [{ connectionStatus: 'inactive' as never }],
    [{ reviewReference: 'not-reviewed' }],
    [
      {
        role: 'cep_sur_pilot_candidate' as const,
        pilotReviewReference: 'review://finance/isolation/norte/v1',
      },
    ],
  ])('rejects an invalid candidate contract: %o', (change) => {
    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({ norte: candidate('norte', undefined, change) }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_CANDIDATE_INVALID' }))
  })

  it('rejects reused review references and malformed readers', () => {
    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          santa: candidate('santa', undefined, {
            reviewReference: 'review://finance/isolation/norte/v1',
          }),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_REVIEW_REUSED' }))

    expect(() =>
      createFinanceIsolationAudit({
        candidates: candidates({
          norte: candidate('norte', null as never),
        }),
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_ISOLATION_AUDIT_READER_INVALID' }))
  })

  it('exposes no candidate configuration, batch reconciliation or persistence API', () => {
    const audit = createFinanceIsolationAudit({ candidates: candidates() })

    expect(Object.keys(audit).sort()).toEqual([
      'canApply',
      'canWrite',
      'expectedEntities',
      'mode',
      'run',
      'schemaVersion',
    ])
    expect(audit).not.toHaveProperty('candidates')
    expect(audit).not.toHaveProperty('reconcile')
    expect(audit).not.toHaveProperty('store')
  })

  it('applies invalid loader limits before the first source read', async () => {
    const plan = candidates()
    const audit = createFinanceIsolationAudit({
      candidates: plan,
      limits: { maxSourceRecords: 0 },
    })

    await expect(audit.run(enabledEnvironment)).resolves.toEqual({
      status: 'failed',
      reason: 'snapshot_load_failed',
      canWrite: false,
      canApply: false,
    })
    for (const current of plan) {
      for (const reader of readerMocks(current)) expect(reader).not.toHaveBeenCalled()
    }
  })
})
