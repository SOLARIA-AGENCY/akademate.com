import { describe, expect, it } from 'vitest'
import {
  planReadOnlyFinanceReconciliation,
  type FinanceReconciliationAccountingSnapshot,
  type FinanceReconciliationPipelineInput,
  type OperationalFinanceProjectionInput,
} from '../src'

const tenantId = 'cep'
const legalEntityId = 'entity-sur'
const connectionId = 'connection-sur'

const operational: OperationalFinanceProjectionInput = {
  targetTenantId: tenantId,
  targetLegalEntityId: legalEntityId,
  enrollments: [{ id: 'enrollment-1', tenantId, legalEntityId, amountPaid: '1250.50' }],
  paymentEvents: [
    {
      id: 'payment-1',
      tenantId,
      legalEntityId,
      enrollment: 'enrollment-1',
      status: 'paid',
      amount: '1250.50',
      currency: 'EUR',
      paidAt: '2026-07-21',
      transactionReference: 'MATRICULA-1',
    },
  ],
  campaigns: [{ id: 'campaign-1', tenantId, legalEntityId }],
  advertisingSpend: [
    {
      id: 'campaign-1:2026-07-21',
      tenantId,
      legalEntityId,
      campaign: 'campaign-1',
      rangeSince: '2026-07-21',
      rangeUntil: '2026-07-21',
      amount: '500.25',
      currency: 'EUR',
      metricState: 'loaded',
    },
  ],
}

function accountingTransaction(
  values: Partial<FinanceReconciliationAccountingSnapshot> = {}
): FinanceReconciliationAccountingSnapshot {
  return {
    externalId: 'accounting-income-1',
    tenantId,
    legalEntityId,
    connectionId,
    kind: 'income',
    status: 'posted',
    bookedOn: '2026-07-21',
    amount: '1250.50',
    currency: 'EUR',
    reference: 'matricula-1',
    ...values,
  }
}

const input: FinanceReconciliationPipelineInput = {
  tenantId,
  legalEntityId,
  connectionId,
  accountingTransactions: [
    accountingTransaction(),
    accountingTransaction({
      externalId: 'accounting-expense-1',
      kind: 'expense',
      amount: '-500.25',
      reference: 'meta:campaign-1:2026-07-21',
    }),
  ],
  operational,
}

describe('read-only finance reconciliation pipeline', () => {
  it('composes imported accounting data and operational snapshots deterministically', () => {
    const before = JSON.stringify(input)
    const result = planReadOnlyFinanceReconciliation(input)
    const reordered = planReadOnlyFinanceReconciliation({
      ...input,
      accountingTransactions: [...input.accountingTransactions].reverse(),
      operational: {
        ...input.operational,
        paymentEvents: [...input.operational.paymentEvents].reverse(),
        advertisingSpend: [...input.operational.advertisingSpend].reverse(),
      },
    })

    expect(result).toEqual(reordered)
    expect(result).toMatchObject({
      mode: 'read_only_reconciliation_pipeline',
      canWrite: false,
      canApply: false,
      status: 'planned',
      ready: true,
      tenantId,
      legalEntityId,
      connectionId,
      projection: { ready: true, summary: { projectedRecords: 2 } },
      reconciliation: {
        mode: 'read_only_reconciliation_batch',
        canWrite: false,
        canApply: false,
        summary: { total: 2, proposed: 2, unmatched: 0, ambiguous: 0, conflicted: 0 },
      },
    })
    expect(JSON.stringify(input)).toBe(before)
  })

  it('never reconciles partial records when the operational projection is blocked', () => {
    const result = planReadOnlyFinanceReconciliation({
      ...input,
      operational: {
        ...operational,
        advertisingSpend: [
          ...operational.advertisingSpend,
          { ...operational.advertisingSpend[0]!, id: 'foreign', legalEntityId: 'entity-norte' },
        ],
      },
    })

    expect(result).toMatchObject({
      status: 'blocked',
      ready: false,
      reconciliation: null,
      projection: {
        ready: false,
        records: expect.arrayContaining([expect.objectContaining({ id: 'payment:payment-1' })]),
        issues: expect.arrayContaining([expect.objectContaining({ code: 'scope_mismatch' })]),
      },
    })
  })

  it('rejects a disagreement between the pipeline and operational target scope', () => {
    expect(() =>
      planReadOnlyFinanceReconciliation({
        ...input,
        operational: { ...operational, targetLegalEntityId: 'entity-norte' },
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_PIPELINE_SCOPE_MISMATCH' })
    )
  })

  it('returns a safe pipeline scope error for non-text identifiers', () => {
    expect(() =>
      planReadOnlyFinanceReconciliation({ ...input, connectionId: null as never })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_PIPELINE_INVALID_SCOPE' })
    )
  })

  it.each([
    ['tenant', { tenantId: 'other-tenant' }, 'FINANCE_RECONCILIATION_PIPELINE_TENANT_MISMATCH'],
    [
      'legal entity',
      { legalEntityId: 'entity-norte' },
      'FINANCE_RECONCILIATION_PIPELINE_ENTITY_MISMATCH',
    ],
    [
      'connection',
      { connectionId: 'connection-norte' },
      'FINANCE_RECONCILIATION_PIPELINE_CONNECTION_MISMATCH',
    ],
  ])('rejects an accounting transaction from another %s', (_, change, code) => {
    expect(() =>
      planReadOnlyFinanceReconciliation({
        ...input,
        accountingTransactions: [accountingTransaction(change)],
      })
    ).toThrowError(expect.objectContaining({ code }))
  })

  it('delegates runtime transaction validation to the bounded reconciliation batch', () => {
    expect(() =>
      planReadOnlyFinanceReconciliation({
        ...input,
        accountingTransactions: [accountingTransaction({ kind: 'refund' } as never)],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_INVALID_TRANSACTION' })
    )
  })

  it('bounds accounting input before evaluating a blocked operational projection', () => {
    expect(() =>
      planReadOnlyFinanceReconciliation({
        ...input,
        accountingTransactions: Array.from({ length: 1_001 }, () => accountingTransaction()),
        operational: {
          ...operational,
          enrollments: [{ ...operational.enrollments[0]!, amountPaid: '1.00' }],
        },
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_PIPELINE_SIZE_EXCEEDED' })
    )
  })

  it('does not expose imported accounting descriptions, counterparties or account metadata', () => {
    const result = planReadOnlyFinanceReconciliation({
      ...input,
      accountingTransactions: [
        {
          ...accountingTransaction(),
          description: 'private-description',
          counterpartyName: 'private-counterparty',
          accountCode: 'private-account-code',
          costCenter: 'private-cost-center',
          sourceHash: 'private-source-hash',
        } as never,
      ],
    })
    const serialized = JSON.stringify(result)

    expect(serialized).not.toContain('private-description')
    expect(serialized).not.toContain('private-counterparty')
    expect(serialized).not.toContain('private-account-code')
    expect(serialized).not.toContain('private-cost-center')
    expect(serialized).not.toContain('private-source-hash')
  })

  it('keeps an empty accounting read model explicit and read-only', () => {
    const result = planReadOnlyFinanceReconciliation({
      ...input,
      accountingTransactions: [],
    })

    expect(result).toMatchObject({
      status: 'planned',
      ready: true,
      reconciliation: {
        canWrite: false,
        canApply: false,
        items: [],
        summary: { total: 0 },
      },
    })
  })
})
