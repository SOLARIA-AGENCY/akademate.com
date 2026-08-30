import type {
  AdvertisingSpendSnapshot,
  CampaignFinanceSnapshot,
  EnrollmentFinanceSnapshot,
  EnrollmentPaymentEventSnapshot,
  FinanceSnapshotRelationship,
} from './operational-projection'
import type {
  FinanceReconciliationAccountingSnapshot,
  FinanceReconciliationPipelineInput,
} from './reconciliation-pipeline'
import { AccountingSyncError } from './sync-error'

export interface FinanceEntitySnapshotScope {
  readonly tenantId: string
  readonly legalEntityId: string
}

export interface FinanceAccountingSnapshotScope extends FinanceEntitySnapshotScope {
  readonly connectionId: string
}

export interface FinanceReconciliationSnapshotReaders {
  readonly readAccountingTransactions: (
    scope: FinanceAccountingSnapshotScope
  ) => Promise<readonly FinanceReconciliationAccountingSnapshot[]>
  readonly readEnrollments: (
    scope: FinanceEntitySnapshotScope
  ) => Promise<readonly EnrollmentFinanceSnapshot[]>
  readonly readPaymentEvents: (
    scope: FinanceEntitySnapshotScope
  ) => Promise<readonly EnrollmentPaymentEventSnapshot[]>
  readonly readCampaigns: (
    scope: FinanceEntitySnapshotScope
  ) => Promise<readonly CampaignFinanceSnapshot[]>
  readonly readAdvertisingSpend: (
    scope: FinanceEntitySnapshotScope
  ) => Promise<readonly AdvertisingSpendSnapshot[]>
}

export interface FinanceReconciliationSnapshotLoaderOptions {
  readonly scope: FinanceAccountingSnapshotScope
  readonly readers: FinanceReconciliationSnapshotReaders
  readonly maxAccountingTransactions?: number
  readonly maxSourceRecords?: number
  readonly maxRelationshipRecords?: number
  readonly dateWindowDays?: number
  readonly maxComparisons?: number
}

type SnapshotDataset =
  | 'accounting_transactions'
  | 'enrollments'
  | 'campaigns'
  | 'payment_events'
  | 'advertising_spend'

const DEFAULT_MAX_ACCOUNTING_TRANSACTIONS = 1_000
const HARD_MAX_ACCOUNTING_TRANSACTIONS = 1_000
const DEFAULT_MAX_SOURCE_RECORDS = 10_000
const HARD_MAX_SOURCE_RECORDS = 100_000
const DEFAULT_MAX_RELATIONSHIP_RECORDS = 20_000
const HARD_MAX_RELATIONSHIP_RECORDS = 200_000
const HARD_MAX_DATE_WINDOW_DAYS = 31
const HARD_MAX_COMPARISONS = 1_000_000

/**
 * Builds an injected loader compatible with the staging shadow runner. It does
 * not register or discover any data source by itself.
 */
export function createFinanceReconciliationSnapshotLoader(
  options: FinanceReconciliationSnapshotLoaderOptions
): () => Promise<FinanceReconciliationPipelineInput> {
  return () => loadFinanceReconciliationSnapshot(options)
}

/**
 * Loads one entity snapshot sequentially. Operational readers receive only the
 * tenant/entity scope; the accounting connection is disclosed exclusively to
 * the accounting reader.
 */
export async function loadFinanceReconciliationSnapshot(
  options: FinanceReconciliationSnapshotLoaderOptions
): Promise<FinanceReconciliationPipelineInput> {
  const limits = validateLoaderOptions(options)
  const accountingScope = Object.freeze({
    tenantId: options.scope.tenantId,
    legalEntityId: options.scope.legalEntityId,
    connectionId: options.scope.connectionId,
  })
  const entityScope = Object.freeze({
    tenantId: options.scope.tenantId,
    legalEntityId: options.scope.legalEntityId,
  })

  const accountingTransactions = await loadDataset(
    'accounting_transactions',
    () => options.readers.readAccountingTransactions(accountingScope),
    cloneAccountingTransaction
  )
  assertCountWithinLimit(
    accountingTransactions.length,
    limits.maxAccountingTransactions,
    'FINANCE_SNAPSHOT_ACCOUNTING_LIMIT_EXCEEDED',
    'Accounting snapshot exceeds its bounded size.'
  )

  const enrollments = await loadDataset(
    'enrollments',
    () => options.readers.readEnrollments(entityScope),
    cloneEnrollment
  )
  assertCountWithinLimit(
    enrollments.length,
    limits.maxRelationshipRecords,
    'FINANCE_SNAPSHOT_RELATIONSHIP_LIMIT_EXCEEDED',
    'Operational relationship snapshot exceeds its bounded size.'
  )

  const campaigns = await loadDataset(
    'campaigns',
    () => options.readers.readCampaigns(entityScope),
    cloneCampaign
  )
  assertCountWithinLimit(
    enrollments.length + campaigns.length,
    limits.maxRelationshipRecords,
    'FINANCE_SNAPSHOT_RELATIONSHIP_LIMIT_EXCEEDED',
    'Operational relationship snapshot exceeds its bounded size.'
  )

  const paymentEvents = await loadDataset(
    'payment_events',
    () => options.readers.readPaymentEvents(entityScope),
    clonePaymentEvent
  )
  assertCountWithinLimit(
    paymentEvents.length,
    limits.maxSourceRecords,
    'FINANCE_SNAPSHOT_SOURCE_LIMIT_EXCEEDED',
    'Operational movement snapshot exceeds its bounded size.'
  )

  const advertisingSpend = await loadDataset(
    'advertising_spend',
    () => options.readers.readAdvertisingSpend(entityScope),
    cloneAdvertisingSpend
  )
  assertCountWithinLimit(
    paymentEvents.length + advertisingSpend.length,
    limits.maxSourceRecords,
    'FINANCE_SNAPSHOT_SOURCE_LIMIT_EXCEEDED',
    'Operational movement snapshot exceeds its bounded size.'
  )

  return Object.freeze({
    tenantId: accountingScope.tenantId,
    legalEntityId: accountingScope.legalEntityId,
    connectionId: accountingScope.connectionId,
    accountingTransactions,
    operational: Object.freeze({
      targetTenantId: entityScope.tenantId,
      targetLegalEntityId: entityScope.legalEntityId,
      enrollments,
      paymentEvents,
      campaigns,
      advertisingSpend,
      maxSourceRecords: limits.maxSourceRecords,
      maxRelationshipRecords: limits.maxRelationshipRecords,
    }),
    ...(options.dateWindowDays === undefined ? {} : { dateWindowDays: options.dateWindowDays }),
    ...(options.maxComparisons === undefined ? {} : { maxComparisons: options.maxComparisons }),
  })
}

function validateLoaderOptions(options: FinanceReconciliationSnapshotLoaderOptions): {
  readonly maxAccountingTransactions: number
  readonly maxSourceRecords: number
  readonly maxRelationshipRecords: number
} {
  for (const [field, value] of [
    ['tenantId', options.scope.tenantId],
    ['legalEntityId', options.scope.legalEntityId],
    ['connectionId', options.scope.connectionId],
  ] as const) {
    if (!validIdentifier(value)) {
      throw snapshotError(
        'FINANCE_SNAPSHOT_INVALID_SCOPE',
        `Finance snapshot scope field ${field} is invalid.`
      )
    }
  }

  validateOptionalRange(options.dateWindowDays, 0, HARD_MAX_DATE_WINDOW_DAYS)
  validateOptionalRange(options.maxComparisons, 1, HARD_MAX_COMPARISONS)

  return {
    maxAccountingTransactions: validateLimit(
      options.maxAccountingTransactions,
      DEFAULT_MAX_ACCOUNTING_TRANSACTIONS,
      HARD_MAX_ACCOUNTING_TRANSACTIONS
    ),
    maxSourceRecords: validateLimit(
      options.maxSourceRecords,
      DEFAULT_MAX_SOURCE_RECORDS,
      HARD_MAX_SOURCE_RECORDS
    ),
    maxRelationshipRecords: validateLimit(
      options.maxRelationshipRecords,
      DEFAULT_MAX_RELATIONSHIP_RECORDS,
      HARD_MAX_RELATIONSHIP_RECORDS
    ),
  }
}

async function loadDataset<T extends object, U extends object>(
  dataset: SnapshotDataset,
  read: () => Promise<readonly T[]>,
  clone: (record: T) => U
): Promise<readonly U[]> {
  try {
    const records = await read()
    if (!Array.isArray(records)) throw datasetReadError(dataset)
    return Object.freeze(records.map(clone))
  } catch {
    throw datasetReadError(dataset)
  }
}

function cloneAccountingTransaction(
  record: FinanceReconciliationAccountingSnapshot
): FinanceReconciliationAccountingSnapshot {
  return Object.freeze({
    externalId: record.externalId,
    tenantId: record.tenantId,
    legalEntityId: record.legalEntityId,
    connectionId: record.connectionId,
    kind: record.kind,
    status: record.status,
    bookedOn: record.bookedOn,
    amount: record.amount,
    currency: record.currency,
    reference: record.reference,
  })
}

function cloneEnrollment(record: EnrollmentFinanceSnapshot): EnrollmentFinanceSnapshot {
  return Object.freeze({
    id: cloneRelationship(record.id),
    tenantId: record.tenantId,
    legalEntityId: record.legalEntityId,
    amountPaid: record.amountPaid,
  })
}

function cloneCampaign(record: CampaignFinanceSnapshot): CampaignFinanceSnapshot {
  return Object.freeze({
    id: cloneRelationship(record.id),
    tenantId: record.tenantId,
    legalEntityId: record.legalEntityId,
  })
}

function clonePaymentEvent(record: EnrollmentPaymentEventSnapshot): EnrollmentPaymentEventSnapshot {
  return Object.freeze({
    id: cloneRelationship(record.id),
    tenantId: record.tenantId,
    legalEntityId: record.legalEntityId,
    enrollment: cloneRelationship(record.enrollment),
    status: record.status,
    amount: record.amount,
    currency: record.currency,
    paidAt: record.paidAt instanceof Date ? new Date(record.paidAt.getTime()) : record.paidAt,
    transactionReference: record.transactionReference,
  })
}

function cloneAdvertisingSpend(record: AdvertisingSpendSnapshot): AdvertisingSpendSnapshot {
  return Object.freeze({
    id: cloneRelationship(record.id),
    tenantId: record.tenantId,
    legalEntityId: record.legalEntityId,
    campaign: cloneRelationship(record.campaign),
    rangeSince: record.rangeSince,
    rangeUntil: record.rangeUntil,
    amount: record.amount,
    currency: record.currency,
    metricState: record.metricState,
  })
}

function cloneRelationship(value: FinanceSnapshotRelationship): FinanceSnapshotRelationship {
  return typeof value === 'object' && value !== null ? Object.freeze({ id: value.id }) : value
}

function validateLimit(value: number | undefined, fallback: number, hardMaximum: number): number {
  const limit = value ?? fallback
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > hardMaximum) {
    throw snapshotError('FINANCE_SNAPSHOT_INVALID_LIMIT', 'Finance snapshot limit is invalid.')
  }
  return limit
}

function validateOptionalRange(value: number | undefined, minimum: number, maximum: number): void {
  if (value !== undefined && (!Number.isSafeInteger(value) || value < minimum || value > maximum)) {
    throw snapshotError(
      'FINANCE_SNAPSHOT_INVALID_RECONCILIATION_LIMIT',
      'Finance snapshot reconciliation limit is invalid.'
    )
  }
}

function assertCountWithinLimit(
  count: number,
  limit: number,
  code: string,
  safeSummary: string
): void {
  if (count > limit) throw snapshotError(code, safeSummary)
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 255 &&
    value.trim() === value
  )
}

function datasetReadError(dataset: SnapshotDataset): AccountingSyncError {
  return snapshotError(
    `FINANCE_SNAPSHOT_${dataset.toUpperCase()}_READ_FAILED`,
    `Finance snapshot ${dataset} read failed.`
  )
}

function snapshotError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
