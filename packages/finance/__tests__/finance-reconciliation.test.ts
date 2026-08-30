import { describe, expect, it } from 'vitest'
import {
  proposeFinanceReconciliation,
  type OperationalFinanceRecord,
  type ReconciliationAccountingTransaction,
} from '../src'

const transaction: ReconciliationAccountingTransaction = {
  id: 'accounting-1',
  tenantId: 'cep',
  legalEntityId: 'entity-sur',
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-22',
  amount: '1250.50',
  currency: 'EUR',
  reference: 'MATRICULA-100',
}

const enrollmentPayment: OperationalFinanceRecord = {
  id: 'payment-1',
  tenantId: 'cep',
  legalEntityId: 'entity-sur',
  source: 'enrollment_payment',
  occurredOn: '2026-07-21',
  amount: '1250.50',
  currency: 'EUR',
  reference: 'matricula-100',
}

describe('read-only finance reconciliation proposals', () => {
  it('proposes one exact-reference enrollment match without mutating either input', () => {
    const frozenTransaction = Object.freeze({ ...transaction })
    const frozenPayment = Object.freeze({ ...enrollmentPayment })

    expect(proposeFinanceReconciliation(frozenTransaction, [frozenPayment])).toMatchObject({
      status: 'proposed',
      recommendedProposal: {
        accountingTransactionId: 'accounting-1',
        operationalRecordId: 'payment-1',
        operationalSource: 'enrollment_payment',
        reason: 'exact_reference',
        score: 300,
      },
    })
    expect(frozenTransaction).toEqual(transaction)
    expect(frozenPayment).toEqual(enrollmentPayment)
  })

  it('never considers an identical record from another legal entity', () => {
    const result = proposeFinanceReconciliation(transaction, [
      { ...enrollmentPayment, id: 'payment-norte', legalEntityId: 'entity-norte' },
    ])

    expect(result).toEqual({
      accountingTransactionId: 'accounting-1',
      status: 'unmatched',
      recommendedProposal: null,
      proposals: [],
    })
  })

  it('never considers an identical record from another tenant', () => {
    expect(
      proposeFinanceReconciliation(transaction, [
        { ...enrollmentPayment, id: 'payment-other', tenantId: 'other-tenant' },
      ]).status
    ).toBe('unmatched')
  })

  it('cannot be disrupted by malformed financial data from another entity', () => {
    const malformedCrossEntity = {
      ...enrollmentPayment,
      id: 'malformed-norte',
      legalEntityId: 'entity-norte',
      amount: 'not-money',
      occurredOn: 'not-a-date',
      currency: 'invalid',
    }

    expect(() => proposeFinanceReconciliation(transaction, [malformedCrossEntity])).not.toThrow()
    expect(proposeFinanceReconciliation(transaction, [malformedCrossEntity]).status).toBe(
      'unmatched'
    )
  })

  it('leaves equal best candidates ambiguous instead of selecting one automatically', () => {
    const result = proposeFinanceReconciliation(transaction, [
      enrollmentPayment,
      { ...enrollmentPayment, id: 'payment-2' },
    ])

    expect(result.status).toBe('ambiguous')
    expect(result.recommendedProposal).toBeNull()
    expect(result.proposals).toHaveLength(2)
  })

  it('matches accounting expenses only against advertising spend', () => {
    const expense = { ...transaction, kind: 'expense' as const, amount: '-500.00' }
    const advertisingSpend: OperationalFinanceRecord = {
      ...enrollmentPayment,
      id: 'ad-spend-1',
      source: 'advertising_spend',
      amount: '500.00',
    }

    expect(proposeFinanceReconciliation(expense, [enrollmentPayment]).status).toBe('unmatched')
    expect(proposeFinanceReconciliation(expense, [advertisingSpend]).status).toBe('proposed')
  })

  it('uses exact amount and date only within the configured window', () => {
    const noReference = { ...transaction, reference: null }
    const nearby = { ...enrollmentPayment, reference: null, occurredOn: '2026-07-24' }

    expect(proposeFinanceReconciliation(noReference, [nearby], 3)).toMatchObject({
      status: 'proposed',
      recommendedProposal: { reason: 'exact_amount_date_window', score: 100 },
    })
    expect(proposeFinanceReconciliation(noReference, [nearby], 1).status).toBe('unmatched')
  })

  it.each([
    { field: 'currency', value: 'eur' },
    { field: 'amount', value: '12.345' },
    { field: 'bookedOn', value: '2026-02-30' },
  ] as const)('fails closed for invalid transaction $field', ({ field, value }) => {
    expect(() =>
      proposeFinanceReconciliation({ ...transaction, [field]: value }, [enrollmentPayment])
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_RECONCILIATION_INVALID_INPUT' }))
  })

  it('does not propose pending, voided, transfer or adjustment movements', () => {
    expect(
      proposeFinanceReconciliation({ ...transaction, status: 'pending' }, [enrollmentPayment])
        .status
    ).toBe('unmatched')
    expect(
      proposeFinanceReconciliation({ ...transaction, kind: 'transfer' }, [enrollmentPayment]).status
    ).toBe('unmatched')
  })
})
