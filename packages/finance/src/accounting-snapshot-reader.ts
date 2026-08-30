import type { AccountingTransactionKind, AccountingTransactionStatus } from './contracts'
import type { FinanceReconciliationAccountingSnapshot } from './reconciliation-pipeline'
import type {
  FinanceAccountingSnapshotScope,
  FinanceReconciliationSnapshotReaders,
} from './snapshot-loader'
import { AccountingSyncError } from './sync-error'

export interface ReviewedAccountingSnapshotBinding extends FinanceAccountingSnapshotScope {
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly reviewReference: string
}

export interface AccountingReconciliationSnapshotPage {
  readonly items: readonly FinanceReconciliationAccountingSnapshot[]
  readonly nextCursor: string | null
  /** Stable repository snapshot/revision shared by every page in one read. */
  readonly snapshotVersion: string
}

/** Repository implementations must perform a read-only, scope-filtered query. */
export interface AccountingReconciliationReadRepository {
  listReconciliationTransactions(input: {
    readonly tenantId: string
    readonly legalEntityId: string
    readonly connectionId: string
    readonly cursor: string | null
    readonly pageSize: number
    readonly orderBy: 'external_id_asc'
  }): Promise<AccountingReconciliationSnapshotPage>
}

export interface AccountingSnapshotReaderOptions {
  readonly repository: AccountingReconciliationReadRepository
  readonly reviewedBindings: readonly ReviewedAccountingSnapshotBinding[]
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type AccountingSnapshotReader = Pick<
  FinanceReconciliationSnapshotReaders,
  'readAccountingTransactions'
>

const DEFAULT_PAGE_SIZE = 200
const HARD_MAX_PAGE_SIZE = 500
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 1_000
const HARD_MAX_RECORDS = 1_000
const HARD_MAX_BINDINGS = 100
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const TRANSACTION_KINDS = new Set<AccountingTransactionKind>([
  'income',
  'expense',
  'transfer',
  'adjustment',
])
const TRANSACTION_STATUSES = new Set<AccountingTransactionStatus>(['pending', 'posted', 'voided'])
const AMOUNT_PATTERN = /^-?(?:0|[1-9]\d*)(?:\.\d{1,2})?$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

/**
 * Reads the minimal accounting projection required by reconciliation. The
 * repository remains injected and no persistence or source discovery occurs.
 */
export function createAccountingSnapshotReader(
  options: AccountingSnapshotReaderOptions
): AccountingSnapshotReader {
  const repository = validateRepository(options.repository)
  const bindings = prepareBindings(options.reviewedBindings)
  const pageSize = validateBoundedOption(
    options.pageSize,
    DEFAULT_PAGE_SIZE,
    HARD_MAX_PAGE_SIZE,
    'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_PAGE_SIZE'
  )
  const maxPages = validateBoundedOption(
    options.maxPages,
    DEFAULT_MAX_PAGES,
    HARD_MAX_PAGES,
    'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_MAX_PAGES'
  )
  const maxRecords = validateBoundedOption(
    options.maxRecords,
    DEFAULT_MAX_RECORDS,
    HARD_MAX_RECORDS,
    'FINANCE_ACCOUNTING_SNAPSHOT_INVALID_MAX_RECORDS'
  )

  return Object.freeze({
    readAccountingTransactions: (scope) =>
      readAccountingTransactions({ repository, bindings, pageSize, maxPages, maxRecords }, scope),
  })
}

interface ValidatedReaderConfiguration {
  readonly repository: AccountingReconciliationReadRepository
  readonly bindings: ReadonlyMap<string, ReviewedAccountingSnapshotBinding>
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
}

async function readAccountingTransactions(
  configuration: ValidatedReaderConfiguration,
  scope: FinanceAccountingSnapshotScope
): Promise<readonly FinanceReconciliationAccountingSnapshot[]> {
  validateScope(scope)
  const binding = configuration.bindings.get(scopeKey(scope))
  if (!binding) {
    throw readerError(
      'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_NOT_REVIEWED',
      'Accounting snapshot scope has not been reviewed.'
    )
  }

  const records: FinanceReconciliationAccountingSnapshot[] = []
  const seenExternalIds = new Set<string>()
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  let snapshotVersion: string | null = null
  let lastExternalId: string | null = null

  for (let pageNumber = 1; pageNumber <= configuration.maxPages; pageNumber += 1) {
    let page: AccountingReconciliationSnapshotPage
    try {
      page = await configuration.repository.listReconciliationTransactions({
        tenantId: binding.tenantId,
        legalEntityId: binding.legalEntityId,
        connectionId: binding.connectionId,
        cursor,
        pageSize: configuration.pageSize,
        orderBy: 'external_id_asc',
      })
    } catch {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_READ_FAILED',
        'Accounting snapshot repository read failed.'
      )
    }

    validatePage(page)
    if (snapshotVersion === null) snapshotVersion = page.snapshotVersion
    else if (snapshotVersion !== page.snapshotVersion) {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_VERSION_CHANGED',
        'Accounting snapshot repository version changed during pagination.'
      )
    }

    if (records.length + page.items.length > configuration.maxRecords) {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_RECORD_LIMIT_EXCEEDED',
        'Accounting snapshot record limit exceeded.'
      )
    }
    for (const source of page.items) {
      const record = projectRecord(source, binding)
      if (seenExternalIds.has(record.externalId)) {
        throw readerError(
          'FINANCE_ACCOUNTING_SNAPSHOT_DUPLICATE_RECORD',
          'Accounting snapshot contains a duplicate transaction.'
        )
      }
      if (lastExternalId !== null && lastExternalId.localeCompare(record.externalId) >= 0) {
        throw readerError(
          'FINANCE_ACCOUNTING_SNAPSHOT_ORDER_INVALID',
          'Accounting snapshot repository order is invalid.'
        )
      }
      seenExternalIds.add(record.externalId)
      lastExternalId = record.externalId
      records.push(record)
    }

    if (page.nextCursor === null) return Object.freeze(records)
    const nextCursor = requireIdentifier(
      page.nextCursor,
      'FINANCE_ACCOUNTING_SNAPSHOT_CURSOR_INVALID',
      'Accounting snapshot cursor is invalid.'
    )
    if (seenCursors.has(nextCursor)) {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_CURSOR_CYCLE',
        'Accounting snapshot cursor cycle detected.'
      )
    }
    seenCursors.add(nextCursor)
    cursor = nextCursor
  }

  throw readerError(
    'FINANCE_ACCOUNTING_SNAPSHOT_PAGE_LIMIT_EXCEEDED',
    'Accounting snapshot page limit exceeded.'
  )
}

function prepareBindings(
  bindings: readonly ReviewedAccountingSnapshotBinding[]
): ReadonlyMap<string, ReviewedAccountingSnapshotBinding> {
  if (!Array.isArray(bindings) || bindings.length > HARD_MAX_BINDINGS) throw invalidPlanError()
  const prepared = new Map<string, ReviewedAccountingSnapshotBinding>()
  const entityKeys = new Set<string>()
  const connectionIds = new Set<string>()

  for (const binding of bindings) {
    if (
      !binding ||
      typeof binding !== 'object' ||
      !validIdentifier(binding.tenantId) ||
      !validIdentifier(binding.legalEntityId) ||
      !validIdentifier(binding.connectionId) ||
      binding.integrationMode !== 'read_only' ||
      binding.connectionStatus !== 'active' ||
      !validReviewReference(binding.reviewReference)
    ) {
      throw invalidPlanError()
    }

    const key = scopeKey(binding)
    const entityKey = `${binding.tenantId}\u0000${binding.legalEntityId}`
    if (prepared.has(key) || entityKeys.has(entityKey)) {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_DUPLICATE_ENTITY',
        'Accounting snapshot plan contains more than one connection for an entity.'
      )
    }
    if (connectionIds.has(binding.connectionId)) {
      throw readerError(
        'FINANCE_ACCOUNTING_SNAPSHOT_SHARED_CONNECTION',
        'Accounting snapshot connection is assigned to more than one entity.'
      )
    }

    prepared.set(key, Object.freeze({ ...binding }))
    entityKeys.add(entityKey)
    connectionIds.add(binding.connectionId)
  }

  return prepared
}

function projectRecord(
  source: FinanceReconciliationAccountingSnapshot,
  binding: ReviewedAccountingSnapshotBinding
): FinanceReconciliationAccountingSnapshot {
  if (!source || typeof source !== 'object') throw invalidRecordError()
  const externalId = requireIdentifier(
    source.externalId,
    'FINANCE_ACCOUNTING_SNAPSHOT_RECORD_INVALID',
    'Accounting snapshot record is invalid.'
  )
  if (
    source.tenantId !== binding.tenantId ||
    source.legalEntityId !== binding.legalEntityId ||
    source.connectionId !== binding.connectionId
  ) {
    throw readerError(
      'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_MISMATCH',
      'Accounting snapshot record belongs to another scope.'
    )
  }
  if (
    !TRANSACTION_KINDS.has(source.kind) ||
    !TRANSACTION_STATUSES.has(source.status) ||
    !validIsoDate(source.bookedOn) ||
    typeof source.amount !== 'string' ||
    !AMOUNT_PATTERN.test(source.amount) ||
    typeof source.currency !== 'string' ||
    !CURRENCY_PATTERN.test(source.currency) ||
    !validNullableIdentifier(source.reference)
  ) {
    throw invalidRecordError()
  }

  return Object.freeze({
    externalId,
    tenantId: binding.tenantId,
    legalEntityId: binding.legalEntityId,
    connectionId: binding.connectionId,
    kind: source.kind,
    status: source.status,
    bookedOn: source.bookedOn,
    amount: source.amount,
    currency: source.currency,
    reference: source.reference ?? null,
  })
}

function validatePage(page: AccountingReconciliationSnapshotPage): void {
  if (
    !page ||
    typeof page !== 'object' ||
    !Array.isArray(page.items) ||
    !validIdentifier(page.snapshotVersion) ||
    (page.nextCursor !== null && !validIdentifier(page.nextCursor))
  ) {
    throw readerError(
      'FINANCE_ACCOUNTING_SNAPSHOT_PAGE_INVALID',
      'Accounting snapshot repository page is invalid.'
    )
  }
}

function validateRepository(
  repository: AccountingReconciliationReadRepository
): AccountingReconciliationReadRepository {
  if (!repository || typeof repository.listReconciliationTransactions !== 'function') {
    throw readerError(
      'FINANCE_ACCOUNTING_SNAPSHOT_REPOSITORY_INVALID',
      'Accounting snapshot repository is invalid.'
    )
  }
  return Object.freeze({
    listReconciliationTransactions: repository.listReconciliationTransactions.bind(repository),
  })
}

function validateScope(scope: FinanceAccountingSnapshotScope): void {
  if (
    !scope ||
    typeof scope !== 'object' ||
    !validIdentifier(scope.tenantId) ||
    !validIdentifier(scope.legalEntityId) ||
    !validIdentifier(scope.connectionId)
  ) {
    throw readerError(
      'FINANCE_ACCOUNTING_SNAPSHOT_SCOPE_INVALID',
      'Accounting snapshot scope is invalid.'
    )
  }
}

function validateBoundedOption(
  value: number | undefined,
  fallback: number,
  maximum: number,
  code: string
): number {
  const resolved = value ?? fallback
  if (!Number.isSafeInteger(resolved) || resolved < 1 || resolved > maximum) {
    throw readerError(code, 'Accounting snapshot limit is invalid.')
  }
  return resolved
}

function scopeKey(scope: FinanceAccountingSnapshotScope): string {
  return `${scope.tenantId}\u0000${scope.legalEntityId}\u0000${scope.connectionId}`
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validNullableIdentifier(value: unknown): value is string | null | undefined {
  return value == null || validIdentifier(value)
}

function validIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !ISO_DATE_PATTERN.test(value)) return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function validReviewReference(value: unknown): value is string {
  return typeof value === 'string' && REVIEW_REFERENCE_PATTERN.test(value)
}

function requireIdentifier(value: unknown, code: string, summary: string): string {
  if (!validIdentifier(value)) throw readerError(code, summary)
  return value
}

function invalidPlanError(): AccountingSyncError {
  return readerError(
    'FINANCE_ACCOUNTING_SNAPSHOT_PLAN_INVALID',
    'Accounting snapshot plan is invalid.'
  )
}

function invalidRecordError(): AccountingSyncError {
  return readerError(
    'FINANCE_ACCOUNTING_SNAPSHOT_RECORD_INVALID',
    'Accounting snapshot record is invalid.'
  )
}

function readerError(code: string, safeSummary: string): AccountingSyncError {
  return new AccountingSyncError(code, safeSummary)
}
