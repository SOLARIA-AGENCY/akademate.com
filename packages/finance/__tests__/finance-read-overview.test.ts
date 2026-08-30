import { describe, expect, it } from 'vitest'

import {
  projectFinanceReadOverview,
  type FinanceReadAuthorizationDecision,
  type FinanceReadAuthorizationScope,
  type FinanceReconciliationPipelineInput,
} from '../src'

const scope: FinanceReadAuthorizationScope = {
  tenantId: 'tenant-cep',
  legalEntityId: 'entity-sur',
  connectionId: 'connection-sur',
}

const allowed: FinanceReadAuthorizationDecision = {
  allowed: true,
  reason: 'membership_allows',
}

function snapshot(
  overrides: Partial<FinanceReconciliationPipelineInput> = {}
): FinanceReconciliationPipelineInput {
  return {
    tenantId: scope.tenantId,
    legalEntityId: scope.legalEntityId,
    connectionId: scope.connectionId,
    accountingTransactions: [
      {
        externalId: 'acc-income',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        connectionId: scope.connectionId,
        kind: 'income',
        status: 'posted',
        bookedOn: '2026-07-01',
        amount: '100.00',
        currency: 'EUR',
        reference: 'payment:payment-1',
      },
      {
        externalId: 'acc-expense',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        connectionId: scope.connectionId,
        kind: 'expense',
        status: 'posted',
        bookedOn: '2026-07-02',
        amount: '20.00',
        currency: 'EUR',
        reference: 'meta:campaign-1:2026-07-02',
      },
      {
        externalId: 'acc-transfer',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        connectionId: scope.connectionId,
        kind: 'transfer',
        status: 'posted',
        bookedOn: '2026-07-03',
        amount: '5.00',
        currency: 'EUR',
      },
      {
        externalId: 'acc-pending',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        connectionId: scope.connectionId,
        kind: 'income',
        status: 'pending',
        bookedOn: '2026-07-04',
        amount: '4.00',
        currency: 'EUR',
      },
      {
        externalId: 'acc-usd',
        tenantId: scope.tenantId,
        legalEntityId: scope.legalEntityId,
        connectionId: scope.connectionId,
        kind: 'income',
        status: 'posted',
        bookedOn: '2026-07-05',
        amount: '10.00',
        currency: 'USD',
      },
    ],
    operational: {
      targetTenantId: scope.tenantId,
      targetLegalEntityId: scope.legalEntityId,
      enrollments: [
        {
          id: 'enrollment-1',
          tenantId: scope.tenantId,
          legalEntityId: scope.legalEntityId,
          amountPaid: '100.00',
        },
      ],
      paymentEvents: [
        {
          id: 'payment-1',
          tenantId: scope.tenantId,
          legalEntityId: scope.legalEntityId,
          enrollment: 'enrollment-1',
          status: 'paid',
          amount: '100.00',
          currency: 'EUR',
          paidAt: '2026-07-01',
        },
      ],
      campaigns: [
        { id: 'campaign-1', tenantId: scope.tenantId, legalEntityId: scope.legalEntityId },
      ],
      advertisingSpend: [
        {
          id: 'spend-1',
          tenantId: scope.tenantId,
          legalEntityId: scope.legalEntityId,
          campaign: 'campaign-1',
          rangeSince: '2026-07-02',
          rangeUntil: '2026-07-02',
          amount: '20.00',
          currency: 'EUR',
          metricState: 'loaded',
        },
      ],
    },
    ...overrides,
  }
}

function project(
  overrides: Partial<FinanceReconciliationPipelineInput> = {},
  authorization: FinanceReadAuthorizationDecision = allowed,
  authorizationScope: FinanceReadAuthorizationScope = scope
) {
  return projectFinanceReadOverview({
    authorization,
    authorizationScope,
    snapshot: snapshot(overrides),
  })
}

describe('finance read overview projection', () => {
  it('returns one-entity currency totals without source transaction identifiers', () => {
    const result = project()

    expect(result.status).toBe('ready')
    if (result.status !== 'ready') return

    expect(result.overview.accounting).toMatchObject({
      transactions: 5,
      posted: 4,
      pending: 1,
      voided: 0,
      byCurrency: [
        {
          currency: 'EUR',
          postedIncome: '100.00',
          postedExpense: '20.00',
          postedOther: '5.00',
          net: '80.00',
        },
        {
          currency: 'USD',
          postedIncome: '10.00',
          postedExpense: '0.00',
          postedOther: '0.00',
          net: '10.00',
        },
      ],
    })
    expect(result.overview.operational).toMatchObject({
      sourceRecords: 2,
      projectedRecords: 2,
      ignoredRecords: 0,
      payments: 1,
      advertisingSpendRecords: 1,
      byCurrency: [
        {
          currency: 'EUR',
          enrollmentPayments: '100.00',
          advertisingSpend: '20.00',
          net: '80.00',
        },
      ],
    })
    expect(result.overview.reconciliation).toMatchObject({
      total: 5,
      proposed: 2,
      unmatched: 3,
      ambiguous: 0,
      conflicted: 0,
    })
    const serialized = JSON.stringify(result)
    expect(serialized).not.toContain('acc-income')
    expect(serialized).not.toContain('payment-1')
    expect(serialized).not.toContain('campaign-1')
  })

  it('does not inspect or expose a snapshot when authorization is denied', () => {
    const result = project({}, { allowed: false, reason: 'capability_missing' }, scope)

    expect(result).toEqual({
      status: 'blocked',
      reason: 'authorization_denied',
      canWrite: false,
      canApply: false,
    })
  })

  it('blocks a decision bound to another entity or connection', () => {
    expect(project({}, allowed, { ...scope, legalEntityId: 'entity-north' })).toEqual({
      status: 'blocked',
      reason: 'authorization_scope_mismatch',
      canWrite: false,
      canApply: false,
    })
    expect(project({}, allowed, { ...scope, connectionId: 'connection-north' })).toMatchObject({
      status: 'blocked',
      reason: 'authorization_scope_mismatch',
    })
  })

  it('fails closed on cross-tenant accounting data', () => {
    const source = snapshot()
    const result = project({
      accountingTransactions: [{ ...source.accountingTransactions[0]!, tenantId: 'tenant-other' }],
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'snapshot_invalid' })
    expect(JSON.stringify(result)).not.toContain('tenant-other')
  })

  it('blocks a partial operational projection instead of publishing partial totals', () => {
    const source = snapshot()
    const result = project({
      operational: {
        ...source.operational,
        enrollments: [{ ...source.operational.enrollments[0]!, amountPaid: '999.00' }],
      },
    })

    expect(result).toEqual({
      status: 'blocked',
      reason: 'reconciliation_blocked',
      canWrite: false,
      canApply: false,
    })
  })

  it('rejects non-canonical accounting values before aggregation', () => {
    const source = snapshot()
    const result = project({
      accountingTransactions: [{ ...source.accountingTransactions[0]!, amount: '01.00' }],
    })

    expect(result).toMatchObject({ status: 'blocked', reason: 'snapshot_invalid' })
  })
})
