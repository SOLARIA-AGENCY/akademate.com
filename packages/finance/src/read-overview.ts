import type {
  FinanceReadAuthorizationDecision,
  FinanceReadAuthorizationScope,
} from './read-authorization'
import {
  planReadOnlyFinanceReconciliation,
  type FinanceReconciliationPipelineInput,
} from './reconciliation-pipeline'

export interface FinanceReadOverviewInput {
  readonly authorization: FinanceReadAuthorizationDecision
  readonly authorizationScope: FinanceReadAuthorizationScope
  readonly snapshot: FinanceReconciliationPipelineInput
}

export interface FinanceReadCurrencyTotals {
  readonly currency: string
  readonly postedIncome: string
  readonly postedExpense: string
  readonly postedOther: string
  readonly net: string
}

export interface FinanceReadOperationalCurrencyTotals {
  readonly currency: string
  readonly enrollmentPayments: string
  readonly advertisingSpend: string
  readonly net: string
}

export interface FinanceReadOverview {
  readonly mode: 'read_only_finance_overview'
  readonly canWrite: false
  readonly canApply: false
  readonly status: 'ready'
  readonly scope: FinanceReadAuthorizationScope
  readonly accounting: {
    readonly transactions: number
    readonly posted: number
    readonly pending: number
    readonly voided: number
    readonly byCurrency: readonly FinanceReadCurrencyTotals[]
  }
  readonly operational: {
    readonly sourceRecords: number
    readonly projectedRecords: number
    readonly ignoredRecords: number
    readonly payments: number
    readonly advertisingSpendRecords: number
    readonly byCurrency: readonly FinanceReadOperationalCurrencyTotals[]
  }
  readonly reconciliation: {
    readonly total: number
    readonly proposed: number
    readonly unmatched: number
    readonly ambiguous: number
    readonly conflicted: number
  }
}

export type FinanceReadOverviewBlockedReason =
  | 'authorization_denied'
  | 'authorization_scope_mismatch'
  | 'snapshot_invalid'
  | 'reconciliation_blocked'

export type FinanceReadOverviewResult =
  | {
      readonly status: 'blocked'
      readonly reason: FinanceReadOverviewBlockedReason
      readonly canWrite: false
      readonly canApply: false
    }
  | {
      readonly status: 'ready'
      readonly canWrite: false
      readonly canApply: false
      readonly overview: FinanceReadOverview
    }

const ACCOUNTING_KINDS = new Set(['income', 'expense', 'transfer', 'adjustment'])
const ACCOUNTING_STATUSES = new Set(['pending', 'posted', 'voided'])
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const MONEY_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

class FinanceReadOverviewInputError extends Error {
  constructor(readonly code: 'scope_invalid' | 'scope_mismatch') {
    super(code)
  }
}

/**
 * Projects one already loaded entity snapshot into a bounded read model.
 * Authorization is required before any snapshot is inspected, and blocked
 * projections never expose partial financial values or source identifiers.
 */
export function projectFinanceReadOverview(
  input: FinanceReadOverviewInput
): FinanceReadOverviewResult {
  if (!input?.authorization?.allowed) return blocked('authorization_denied')
  if (input.authorization.reason !== 'membership_allows') {
    return blocked('authorization_denied')
  }

  try {
    assertScopeBinding(input.authorizationScope, input.snapshot)
    assertAccountingSnapshot(input.snapshot)
    const pipeline = planReadOnlyFinanceReconciliation(input.snapshot)
    if (pipeline.status !== 'planned' || !pipeline.reconciliation) {
      return blocked('reconciliation_blocked')
    }

    const accounting = aggregateAccounting(input.snapshot)
    const operational = aggregateOperational(pipeline.projection.records)
    return {
      status: 'ready',
      canWrite: false,
      canApply: false,
      overview: {
        mode: 'read_only_finance_overview',
        canWrite: false,
        canApply: false,
        status: 'ready',
        scope: Object.freeze({ ...input.authorizationScope }),
        accounting: Object.freeze({
          ...accounting,
          byCurrency: Object.freeze(accounting.byCurrency),
        }),
        operational: Object.freeze({
          sourceRecords: pipeline.projection.summary.sourceRecords,
          projectedRecords: pipeline.projection.summary.projectedRecords,
          ignoredRecords: pipeline.projection.summary.ignoredRecords,
          payments: pipeline.projection.records.filter(
            ({ source }) => source === 'enrollment_payment'
          ).length,
          advertisingSpendRecords: pipeline.projection.records.filter(
            ({ source }) => source === 'advertising_spend'
          ).length,
          byCurrency: Object.freeze(operational),
        }),
        reconciliation: Object.freeze({ ...pipeline.reconciliation.summary }),
      },
    }
  } catch (error) {
    if (error instanceof FinanceReadOverviewInputError && error.code === 'scope_mismatch') {
      return blocked('authorization_scope_mismatch')
    }
    return blocked('snapshot_invalid')
  }
}

function assertScopeBinding(
  authorizationScope: FinanceReadAuthorizationScope,
  snapshot: FinanceReconciliationPipelineInput
): void {
  for (const value of [
    authorizationScope.tenantId,
    authorizationScope.legalEntityId,
    authorizationScope.connectionId,
  ]) {
    if (!validIdentifier(value)) throw new FinanceReadOverviewInputError('scope_invalid')
  }
  if (
    authorizationScope.tenantId !== snapshot.tenantId ||
    authorizationScope.legalEntityId !== snapshot.legalEntityId ||
    authorizationScope.connectionId !== snapshot.connectionId
  ) {
    throw new FinanceReadOverviewInputError('scope_mismatch')
  }
}

function assertAccountingSnapshot(snapshot: FinanceReconciliationPipelineInput): void {
  if (!Array.isArray(snapshot.accountingTransactions)) {
    throw new Error('FINANCE_OVERVIEW_ACCOUNTING_INVALID')
  }
  for (const transaction of snapshot.accountingTransactions) {
    if (
      transaction.tenantId !== snapshot.tenantId ||
      transaction.legalEntityId !== snapshot.legalEntityId ||
      transaction.connectionId !== snapshot.connectionId ||
      !ACCOUNTING_KINDS.has(transaction.kind) ||
      !ACCOUNTING_STATUSES.has(transaction.status) ||
      !MONEY_PATTERN.test(transaction.amount) ||
      !CURRENCY_PATTERN.test(transaction.currency) ||
      !isRealIsoDate(transaction.bookedOn)
    ) {
      throw new Error('FINANCE_OVERVIEW_ACCOUNTING_INVALID')
    }
  }
}

function aggregateAccounting(snapshot: FinanceReconciliationPipelineInput): {
  readonly transactions: number
  readonly posted: number
  readonly pending: number
  readonly voided: number
  readonly byCurrency: readonly FinanceReadCurrencyTotals[]
} {
  const buckets = new Map<string, { income: bigint; expense: bigint; other: bigint }>()
  let posted = 0
  let pending = 0
  let voided = 0

  for (const transaction of snapshot.accountingTransactions) {
    if (transaction.status === 'posted') posted += 1
    if (transaction.status === 'pending') pending += 1
    if (transaction.status === 'voided') voided += 1
    if (transaction.status !== 'posted') continue

    const bucket = buckets.get(transaction.currency) ?? {
      income: 0n,
      expense: 0n,
      other: 0n,
    }
    const amount = absoluteMinorUnits(transaction.amount)
    if (transaction.kind === 'income') bucket.income += amount
    else if (transaction.kind === 'expense') bucket.expense += amount
    else bucket.other += amount
    buckets.set(transaction.currency, bucket)
  }

  const byCurrency = [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, bucket]) => ({
      currency,
      postedIncome: formatMinorUnits(bucket.income),
      postedExpense: formatMinorUnits(bucket.expense),
      postedOther: formatMinorUnits(bucket.other),
      net: formatMinorUnits(bucket.income - bucket.expense),
    }))

  return {
    transactions: snapshot.accountingTransactions.length,
    posted,
    pending,
    voided,
    byCurrency,
  }
}

function aggregateOperational(
  records: readonly {
    readonly source: 'enrollment_payment' | 'advertising_spend'
    readonly amount: string
    readonly currency: string
  }[]
): readonly FinanceReadOperationalCurrencyTotals[] {
  const buckets = new Map<string, { payments: bigint; spend: bigint }>()
  for (const record of records) {
    const bucket = buckets.get(record.currency) ?? { payments: 0n, spend: 0n }
    const amount = absoluteMinorUnits(record.amount)
    if (record.source === 'enrollment_payment') bucket.payments += amount
    else bucket.spend += amount
    buckets.set(record.currency, bucket)
  }

  return [...buckets.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([currency, bucket]) => ({
      currency,
      enrollmentPayments: formatMinorUnits(bucket.payments),
      advertisingSpend: formatMinorUnits(bucket.spend),
      net: formatMinorUnits(bucket.payments - bucket.spend),
    }))
}

function absoluteMinorUnits(value: string): bigint {
  const normalized = value.startsWith('-') ? value.slice(1) : value
  const [integer, decimals = ''] = normalized.split('.')
  return BigInt(integer!) * 100n + BigInt(decimals.padEnd(2, '0'))
}

function formatMinorUnits(value: bigint): string {
  const sign = value < 0n ? '-' : ''
  const absolute = value < 0n ? -value : value
  return `${sign}${absolute / 100n}.${String(absolute % 100n).padStart(2, '0')}`
}

function isRealIsoDate(value: string): boolean {
  if (!ISO_DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.length <= 255 &&
    value.trim() === value &&
    !/\s/.test(value)
  )
}

function blocked(reason: FinanceReadOverviewBlockedReason): FinanceReadOverviewResult {
  return Object.freeze({
    status: 'blocked',
    reason,
    canWrite: false,
    canApply: false,
  })
}
