import type { AccountingTransactionKind, AccountingTransactionStatus } from './contracts'
import { AccountingSyncError } from './sync-error'

export type OperationalFinanceSource = 'enrollment_payment' | 'advertising_spend'
export type ReconciliationMatchReason =
  | 'exact_reference'
  | 'exact_amount_and_date'
  | 'exact_amount_date_window'

export interface ReconciliationAccountingTransaction {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly kind: AccountingTransactionKind
  readonly status: AccountingTransactionStatus
  readonly bookedOn: string
  readonly amount: string
  readonly currency: string
  readonly reference?: string | null
}

export interface OperationalFinanceRecord {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly source: OperationalFinanceSource
  readonly occurredOn: string
  /** Canonical positive amount. Direction is derived from source. */
  readonly amount: string
  readonly currency: string
  readonly reference?: string | null
}

export interface FinanceReconciliationProposal {
  readonly accountingTransactionId: string
  readonly operationalRecordId: string
  readonly operationalSource: OperationalFinanceSource
  readonly reason: ReconciliationMatchReason
  readonly score: 100 | 200 | 300
}

export interface FinanceReconciliationResult {
  readonly accountingTransactionId: string
  readonly status: 'unmatched' | 'proposed' | 'ambiguous'
  readonly recommendedProposal: FinanceReconciliationProposal | null
  readonly proposals: readonly FinanceReconciliationProposal[]
}

export interface FinanceReconciliationBatchInput {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly transactions: readonly ReconciliationAccountingTransaction[]
  readonly operationalRecords: readonly OperationalFinanceRecord[]
  readonly dateWindowDays?: number
  readonly maxComparisons?: number
}

export type FinanceReconciliationBatchItemStatus =
  | FinanceReconciliationResult['status']
  | 'conflicted'

export interface FinanceReconciliationBatchItem {
  readonly accountingTransactionId: string
  readonly status: FinanceReconciliationBatchItemStatus
  readonly recommendedProposal: FinanceReconciliationProposal | null
  readonly proposals: readonly FinanceReconciliationProposal[]
  readonly conflictOperationalRecordIds: readonly string[]
}

export interface FinanceReconciliationBatchSummary {
  readonly total: number
  readonly proposed: number
  readonly unmatched: number
  readonly ambiguous: number
  readonly conflicted: number
}

export interface FinanceReconciliationBatchPlan {
  readonly mode: 'read_only_reconciliation_batch'
  readonly canWrite: false
  readonly canApply: false
  readonly tenantId: string
  readonly legalEntityId: string
  readonly items: readonly FinanceReconciliationBatchItem[]
  readonly summary: FinanceReconciliationBatchSummary
}

const MONEY_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const POSITIVE_MONEY_PATTERN = /^(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/
const DAY_IN_MS = 86_400_000
const TRANSACTION_KINDS = new Set<AccountingTransactionKind>([
  'income',
  'expense',
  'transfer',
  'adjustment',
])
const TRANSACTION_STATUSES = new Set<AccountingTransactionStatus>(['pending', 'posted', 'voided'])
const OPERATIONAL_SOURCES = new Set<OperationalFinanceSource>([
  'enrollment_payment',
  'advertising_spend',
])
const MAX_BATCH_TRANSACTIONS = 1_000
const MAX_BATCH_OPERATIONAL_RECORDS = 10_000
const DEFAULT_MAX_BATCH_COMPARISONS = 250_000
const HARD_MAX_BATCH_COMPARISONS = 1_000_000

/**
 * Produces read-only reconciliation proposals. It never mutates input records,
 * persists a match, or considers a record from another tenant/legal entity.
 */
export function proposeFinanceReconciliation(
  transaction: ReconciliationAccountingTransaction,
  operationalRecords: readonly OperationalFinanceRecord[],
  dateWindowDays = 3
): FinanceReconciliationResult {
  assertValidTransaction(transaction)
  assertDateWindow(dateWindowDays)

  if (
    transaction.status !== 'posted' ||
    (transaction.kind !== 'income' && transaction.kind !== 'expense')
  ) {
    return unmatched(transaction.id)
  }

  const accountingAmount = absoluteMinorUnits(transaction.amount)
  const accountingDate = isoDateToEpoch(transaction.bookedOn, 'transaction.bookedOn')
  const transactionReference = normalizeReference(transaction.reference)
  const proposals: FinanceReconciliationProposal[] = []

  for (const record of operationalRecords) {
    if (
      record.tenantId !== transaction.tenantId ||
      record.legalEntityId !== transaction.legalEntityId
    ) {
      continue
    }

    assertValidOperationalRecord(record)

    if (
      record.currency !== transaction.currency ||
      !sourceMatchesKind(record.source, transaction.kind) ||
      positiveMinorUnits(record.amount) !== accountingAmount
    ) {
      continue
    }

    const recordReference = normalizeReference(record.reference)
    const dayDistance =
      Math.abs(
        accountingDate - isoDateToEpoch(record.occurredOn, `record ${record.id}.occurredOn`)
      ) / DAY_IN_MS

    if (transactionReference && recordReference === transactionReference) {
      proposals.push(proposal(transaction, record, 'exact_reference', 300))
    } else if (dayDistance === 0) {
      proposals.push(proposal(transaction, record, 'exact_amount_and_date', 200))
    } else if (dayDistance <= dateWindowDays) {
      proposals.push(proposal(transaction, record, 'exact_amount_date_window', 100))
    }
  }

  proposals.sort(
    (left, right) =>
      right.score - left.score || left.operationalRecordId.localeCompare(right.operationalRecordId)
  )

  if (proposals.length === 0) return unmatched(transaction.id)

  const bestScore = proposals[0]!.score
  const bestProposals = proposals.filter(({ score }) => score === bestScore)

  return {
    accountingTransactionId: transaction.id,
    status: bestProposals.length === 1 ? 'proposed' : 'ambiguous',
    recommendedProposal: bestProposals.length === 1 ? bestProposals[0]! : null,
    proposals,
  }
}

/**
 * Plans one bounded reconciliation batch for exactly one tenant and legal
 * entity. Any operational candidate reused across transactions removes every
 * affected recommendation and requires human review.
 */
export function planFinanceReconciliationBatch(
  input: FinanceReconciliationBatchInput
): FinanceReconciliationBatchPlan {
  const { transactions, operationalRecords, dateWindowDays } = validateBatch(input)
  const baseResults = transactions.map((transaction) =>
    proposeFinanceReconciliation(transaction, operationalRecords, dateWindowDays)
  )
  const candidateOwners = new Map<string, Set<string>>()

  for (const result of baseResults) {
    for (const proposal of result.proposals) {
      const owners = candidateOwners.get(proposal.operationalRecordId) ?? new Set<string>()
      owners.add(result.accountingTransactionId)
      candidateOwners.set(proposal.operationalRecordId, owners)
    }
  }

  const conflictsByTransaction = new Map<string, Set<string>>()
  for (const [operationalRecordId, transactionIds] of candidateOwners) {
    if (transactionIds.size < 2) continue
    for (const transactionId of transactionIds) {
      const conflicts = conflictsByTransaction.get(transactionId) ?? new Set<string>()
      conflicts.add(operationalRecordId)
      conflictsByTransaction.set(transactionId, conflicts)
    }
  }

  const items = baseResults.map((result): FinanceReconciliationBatchItem => {
    const conflictOperationalRecordIds = [
      ...(conflictsByTransaction.get(result.accountingTransactionId) ?? []),
    ].sort((left, right) => left.localeCompare(right))
    const conflicted = conflictOperationalRecordIds.length > 0

    return {
      accountingTransactionId: result.accountingTransactionId,
      status: conflicted ? 'conflicted' : result.status,
      recommendedProposal: conflicted ? null : result.recommendedProposal,
      proposals: result.proposals,
      conflictOperationalRecordIds,
    }
  })
  const count = (status: FinanceReconciliationBatchItemStatus): number =>
    items.filter((item) => item.status === status).length

  return {
    mode: 'read_only_reconciliation_batch',
    canWrite: false,
    canApply: false,
    tenantId: input.tenantId,
    legalEntityId: input.legalEntityId,
    items,
    summary: {
      total: items.length,
      proposed: count('proposed'),
      unmatched: count('unmatched'),
      ambiguous: count('ambiguous'),
      conflicted: count('conflicted'),
    },
  }
}

function validateBatch(input: FinanceReconciliationBatchInput): {
  readonly transactions: readonly ReconciliationAccountingTransaction[]
  readonly operationalRecords: readonly OperationalFinanceRecord[]
  readonly dateWindowDays: number
} {
  try {
    requireIdentifier(input.tenantId, 'batch.tenantId')
    requireIdentifier(input.legalEntityId, 'batch.legalEntityId')
  } catch {
    throw batchError(
      'FINANCE_RECONCILIATION_BATCH_INVALID_SCOPE',
      'Finance reconciliation batch scope is invalid.'
    )
  }

  const maxComparisons = input.maxComparisons ?? DEFAULT_MAX_BATCH_COMPARISONS
  if (
    !Number.isSafeInteger(maxComparisons) ||
    maxComparisons < 1 ||
    maxComparisons > HARD_MAX_BATCH_COMPARISONS
  ) {
    throw batchError(
      'FINANCE_RECONCILIATION_BATCH_INVALID_LIMIT',
      'Finance reconciliation batch comparison limit is invalid.'
    )
  }
  if (
    input.transactions.length > MAX_BATCH_TRANSACTIONS ||
    input.operationalRecords.length > MAX_BATCH_OPERATIONAL_RECORDS ||
    input.transactions.length * input.operationalRecords.length > maxComparisons
  ) {
    throw batchError(
      'FINANCE_RECONCILIATION_BATCH_SIZE_EXCEEDED',
      'Finance reconciliation batch exceeds its bounded size.'
    )
  }

  const dateWindowDays = input.dateWindowDays ?? 3
  assertDateWindow(dateWindowDays)
  const transactionIds = new Set<string>()
  for (const transaction of input.transactions) {
    if (transaction.tenantId !== input.tenantId) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_TENANT_MISMATCH',
        'Finance reconciliation batch contains another tenant.'
      )
    }
    if (transaction.legalEntityId !== input.legalEntityId) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_ENTITY_MISMATCH',
        'Finance reconciliation batch contains another legal entity.'
      )
    }
    try {
      assertValidTransaction(transaction)
    } catch {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_INVALID_TRANSACTION',
        'Finance reconciliation batch contains an invalid transaction.'
      )
    }
    if (transactionIds.has(transaction.id)) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_DUPLICATE_TRANSACTION',
        'Finance reconciliation batch contains a duplicate transaction.'
      )
    }
    transactionIds.add(transaction.id)
  }

  const operationalRecordIds = new Set<string>()
  for (const record of input.operationalRecords) {
    if (record.tenantId !== input.tenantId) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_TENANT_MISMATCH',
        'Finance reconciliation batch contains another tenant.'
      )
    }
    if (record.legalEntityId !== input.legalEntityId) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_ENTITY_MISMATCH',
        'Finance reconciliation batch contains another legal entity.'
      )
    }
    try {
      assertValidOperationalRecord(record)
    } catch {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_INVALID_OPERATIONAL_RECORD',
        'Finance reconciliation batch contains an invalid operational record.'
      )
    }
    if (operationalRecordIds.has(record.id)) {
      throw batchError(
        'FINANCE_RECONCILIATION_BATCH_DUPLICATE_OPERATIONAL_RECORD',
        'Finance reconciliation batch contains a duplicate operational record.'
      )
    }
    operationalRecordIds.add(record.id)
  }

  return {
    transactions: [...input.transactions].sort((left, right) => left.id.localeCompare(right.id)),
    operationalRecords: [...input.operationalRecords].sort((left, right) =>
      left.id.localeCompare(right.id)
    ),
    dateWindowDays,
  }
}

function proposal(
  transaction: ReconciliationAccountingTransaction,
  record: OperationalFinanceRecord,
  reason: ReconciliationMatchReason,
  score: 100 | 200 | 300
): FinanceReconciliationProposal {
  return {
    accountingTransactionId: transaction.id,
    operationalRecordId: record.id,
    operationalSource: record.source,
    reason,
    score,
  }
}

function unmatched(accountingTransactionId: string): FinanceReconciliationResult {
  return {
    accountingTransactionId,
    status: 'unmatched',
    recommendedProposal: null,
    proposals: [],
  }
}

function sourceMatchesKind(
  source: OperationalFinanceSource,
  kind: AccountingTransactionKind
): boolean {
  return (
    (kind === 'income' && source === 'enrollment_payment') ||
    (kind === 'expense' && source === 'advertising_spend')
  )
}

function assertValidTransaction(transaction: ReconciliationAccountingTransaction): void {
  requireIdentifier(transaction.id, 'transaction.id')
  requireIdentifier(transaction.tenantId, 'transaction.tenantId')
  requireIdentifier(transaction.legalEntityId, 'transaction.legalEntityId')
  if (!TRANSACTION_KINDS.has(transaction.kind)) {
    throw invalidInput('transaction.kind is invalid')
  }
  if (!TRANSACTION_STATUSES.has(transaction.status)) {
    throw invalidInput('transaction.status is invalid')
  }
  requireCurrency(transaction.currency, 'transaction.currency')
  absoluteMinorUnits(transaction.amount)
  isoDateToEpoch(transaction.bookedOn, 'transaction.bookedOn')
}

function assertValidOperationalRecord(record: OperationalFinanceRecord): void {
  requireIdentifier(record.id, 'record.id')
  requireIdentifier(record.tenantId, `record ${record.id}.tenantId`)
  requireIdentifier(record.legalEntityId, `record ${record.id}.legalEntityId`)
  if (!OPERATIONAL_SOURCES.has(record.source)) {
    throw invalidInput('record.source is invalid')
  }
  requireCurrency(record.currency, `record ${record.id}.currency`)
  positiveMinorUnits(record.amount)
  isoDateToEpoch(record.occurredOn, `record ${record.id}.occurredOn`)
}

function assertDateWindow(value: number): void {
  if (!Number.isInteger(value) || value < 0 || value > 31) {
    throw invalidInput('dateWindowDays must be an integer between 0 and 31')
  }
}

function requireIdentifier(value: string, field: string): void {
  if (value.trim().length === 0 || value.length > 255) {
    throw invalidInput(`${field} is invalid`)
  }
}

function requireCurrency(value: string, field: string): void {
  if (!CURRENCY_PATTERN.test(value)) throw invalidInput(`${field} is invalid`)
}

function absoluteMinorUnits(value: string): bigint {
  if (!MONEY_PATTERN.test(value)) throw invalidInput('transaction.amount is invalid')
  const minorUnits = decimalToMinorUnits(value)
  return minorUnits < 0n ? -minorUnits : minorUnits
}

function positiveMinorUnits(value: string): bigint {
  if (!POSITIVE_MONEY_PATTERN.test(value)) throw invalidInput('record.amount is invalid')
  return decimalToMinorUnits(value)
}

function decimalToMinorUnits(value: string): bigint {
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [integer, decimals = ''] = unsigned.split('.')
  const result = BigInt(integer!) * 100n + BigInt(decimals.padEnd(2, '0'))
  return negative ? -result : result
}

function isoDateToEpoch(value: string, field: string): number {
  if (!ISO_DATE_PATTERN.test(value)) throw invalidInput(`${field} is invalid`)
  const parsed = new Date(`${value}T00:00:00.000Z`)
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw invalidInput(`${field} is invalid`)
  }
  return parsed.getTime()
}

function normalizeReference(value: string | null | undefined): string | null {
  if (value == null) return null
  const normalized = value.trim().toLocaleLowerCase('es')
  return normalized.length === 0 ? null : normalized
}

function invalidInput(reason: string): AccountingSyncError {
  return new AccountingSyncError(
    'FINANCE_RECONCILIATION_INVALID_INPUT',
    `Finance reconciliation input is invalid: ${reason}.`
  )
}

function batchError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
