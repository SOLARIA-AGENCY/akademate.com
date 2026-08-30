import { describe, expect, it } from 'vitest'
import {
  planFinanceReconciliationBatch,
  type OperationalFinanceRecord,
  type ReconciliationAccountingTransaction,
} from '../src'

const tenantId = 'cep'
const legalEntityId = 'entity-sur'

const paymentOne: OperationalFinanceRecord = {
  id: 'payment-1',
  tenantId,
  legalEntityId,
  source: 'enrollment_payment',
  occurredOn: '2026-07-21',
  amount: '1250.50',
  currency: 'EUR',
  reference: 'matricula-100',
}

const paymentTwo: OperationalFinanceRecord = {
  ...paymentOne,
  id: 'payment-2',
  amount: '800.00',
  reference: 'matricula-200',
}

const transactionOne: ReconciliationAccountingTransaction = {
  id: 'accounting-1',
  tenantId,
  legalEntityId,
  kind: 'income',
  status: 'posted',
  bookedOn: '2026-07-22',
  amount: '1250.50',
  currency: 'EUR',
  reference: 'MATRICULA-100',
}

const transactionTwo: ReconciliationAccountingTransaction = {
  ...transactionOne,
  id: 'accounting-2',
  amount: '800.00',
  reference: 'MATRICULA-200',
}

describe('read-only finance batch reconciliation', () => {
  it('produces deterministic independent proposals without mutating inputs', () => {
    const transactions = Object.freeze([transactionTwo, transactionOne])
    const records = Object.freeze([paymentTwo, paymentOne])
    const beforeTransactions = JSON.stringify(transactions)
    const beforeRecords = JSON.stringify(records)

    const first = planFinanceReconciliationBatch({
      tenantId,
      legalEntityId,
      transactions,
      operationalRecords: records,
    })
    const second = planFinanceReconciliationBatch({
      tenantId,
      legalEntityId,
      transactions: [...transactions].reverse(),
      operationalRecords: [...records].reverse(),
    })

    expect(first).toEqual(second)
    expect(first).toMatchObject({
      mode: 'read_only_reconciliation_batch',
      canWrite: false,
      canApply: false,
      summary: { total: 2, proposed: 2, unmatched: 0, ambiguous: 0, conflicted: 0 },
    })
    expect(first.items.map(({ accountingTransactionId }) => accountingTransactionId)).toEqual([
      'accounting-1',
      'accounting-2',
    ])
    expect(JSON.stringify(transactions)).toBe(beforeTransactions)
    expect(JSON.stringify(records)).toBe(beforeRecords)
  })

  it('removes every recommendation when one payment is a candidate for two transactions', () => {
    const duplicateMovement = { ...transactionOne, id: 'accounting-duplicate' }
    const result = planFinanceReconciliationBatch({
      tenantId,
      legalEntityId,
      transactions: [transactionOne, duplicateMovement],
      operationalRecords: [paymentOne],
    })

    expect(result.summary).toMatchObject({ total: 2, proposed: 0, conflicted: 2 })
    for (const item of result.items) {
      expect(item).toMatchObject({
        status: 'conflicted',
        recommendedProposal: null,
        conflictOperationalRecordIds: ['payment-1'],
      })
    }
  })

  it('blocks reuse even when the shared payment is only a weaker candidate for one transaction', () => {
    const weakCandidate = {
      ...transactionOne,
      id: 'accounting-weak',
      reference: null,
      bookedOn: '2026-07-21',
    }
    const result = planFinanceReconciliationBatch({
      tenantId,
      legalEntityId,
      transactions: [transactionOne, weakCandidate],
      operationalRecords: [paymentOne],
    })

    expect(result.items.every(({ status }) => status === 'conflicted')).toBe(true)
    expect(result.items.every(({ recommendedProposal }) => recommendedProposal === null)).toBe(true)
  })

  it('applies the same collision rule to advertising expenses', () => {
    const adSpend: OperationalFinanceRecord = {
      ...paymentOne,
      id: 'ad-spend-1',
      source: 'advertising_spend',
      amount: '500.00',
      reference: 'meta-july',
    }
    const expenseOne: ReconciliationAccountingTransaction = {
      ...transactionOne,
      id: 'expense-1',
      kind: 'expense',
      amount: '-500.00',
      reference: 'META-JULY',
    }
    const expenseTwo = { ...expenseOne, id: 'expense-2' }

    const result = planFinanceReconciliationBatch({
      tenantId,
      legalEntityId,
      transactions: [expenseOne, expenseTwo],
      operationalRecords: [adSpend],
    })

    expect(result.summary.conflicted).toBe(2)
    expect(result.items.every(({ recommendedProposal }) => recommendedProposal === null)).toBe(true)
  })

  it('rejects cross-entity or cross-tenant input before producing a plan', () => {
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [{ ...transactionOne, legalEntityId: 'entity-norte' }],
        operationalRecords: [paymentOne],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_ENTITY_MISMATCH' })
    )
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [transactionOne],
        operationalRecords: [{ ...paymentOne, tenantId: 'other-tenant' }],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_TENANT_MISMATCH' })
    )
  })

  it('rejects duplicate transaction and operational record identifiers', () => {
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [transactionOne, { ...transactionOne }],
        operationalRecords: [paymentOne],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_DUPLICATE_TRANSACTION' })
    )
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [transactionOne],
        operationalRecords: [paymentOne, { ...paymentOne }],
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'FINANCE_RECONCILIATION_BATCH_DUPLICATE_OPERATIONAL_RECORD',
      })
    )
  })

  it('rejects non-canonical transaction and operational source values at runtime', () => {
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [{ ...transactionOne, kind: 'refund' } as never],
        operationalRecords: [paymentOne],
      })
    ).toThrowError(
      expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_INVALID_TRANSACTION' })
    )
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [transactionOne],
        operationalRecords: [{ ...paymentOne, source: 'manual_cash' } as never],
      })
    ).toThrowError(
      expect.objectContaining({
        code: 'FINANCE_RECONCILIATION_BATCH_INVALID_OPERATIONAL_RECORD',
      })
    )
  })

  it('bounds comparison cost before reconciliation begins', () => {
    expect(() =>
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [transactionOne, transactionTwo],
        operationalRecords: [paymentOne],
        maxComparisons: 1,
      })
    ).toThrowError(expect.objectContaining({ code: 'FINANCE_RECONCILIATION_BATCH_SIZE_EXCEEDED' }))
  })

  it('keeps an empty batch explicitly read-only and empty', () => {
    expect(
      planFinanceReconciliationBatch({
        tenantId,
        legalEntityId,
        transactions: [],
        operationalRecords: [],
      })
    ).toEqual({
      mode: 'read_only_reconciliation_batch',
      canWrite: false,
      canApply: false,
      tenantId,
      legalEntityId,
      items: [],
      summary: { total: 0, proposed: 0, unmatched: 0, ambiguous: 0, conflicted: 0 },
    })
  })
})
