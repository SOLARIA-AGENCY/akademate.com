import type {
  AdvertisingSpendSnapshot,
  EnrollmentPaymentEventSnapshot,
  FinanceSnapshotRelationship,
} from './operational-projection'
import type {
  FinanceEntitySnapshotScope,
  FinanceReconciliationSnapshotReaders,
} from './snapshot-loader'
import { AccountingSyncError } from './sync-error'

export type ExternalPaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue' | 'refunded'
export type ExternalAdvertisingMetricState = 'loaded' | 'zero_real' | 'not_available' | 'api_error'

export interface ExternalPaymentEvent {
  readonly externalId: string
  readonly externalEnrollmentId: string
  readonly status: ExternalPaymentStatus
  readonly amount: string | number
  readonly currency: string
  readonly paidAt?: string | null
  readonly transactionReference?: string | null
}

export interface ExternalPaymentEventPage {
  readonly items: readonly ExternalPaymentEvent[]
  readonly nextCursor: string | null
  /** Stable provider snapshot/revision shared by every page in one read. */
  readonly snapshotVersion: string
}

/** Credentials remain encapsulated by the injected client. */
export interface ExternalPaymentReadClient {
  readonly provider: string
  listPaymentEvents(input: {
    readonly externalAccountId: string
    readonly cursor: string | null
    readonly pageSize: number
  }): Promise<ExternalPaymentEventPage>
}

export interface ExternalDailyAdvertisingSpend {
  readonly externalCampaignId: string
  readonly spendDate: string
  readonly amount: string | number | null
  readonly currency: string
  readonly metricState: ExternalAdvertisingMetricState
}

export interface ExternalDailyAdvertisingSpendPage {
  readonly items: readonly ExternalDailyAdvertisingSpend[]
  readonly nextCursor: string | null
  /** Stable provider snapshot/revision shared by every page in one read. */
  readonly snapshotVersion: string
}

/** Credentials remain encapsulated by the injected client. */
export interface ExternalAdvertisingSpendReadClient {
  readonly provider: string
  listDailyAdvertisingSpend(input: {
    readonly externalAccountId: string
    readonly cursor: string | null
    readonly pageSize: number
  }): Promise<ExternalDailyAdvertisingSpendPage>
}

export interface ReviewedExternalRelationshipMapping {
  readonly externalId: string
  readonly localId: string | number
}

interface ReviewedExternalSourceBinding {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly sourceConnectionId: string
  readonly provider: string
  readonly externalAccountId: string
  readonly integrationMode: 'read_only'
  readonly connectionStatus: 'active'
  readonly reviewReference: string
}

export interface ReviewedPaymentSourceBinding extends ReviewedExternalSourceBinding {
  readonly client: ExternalPaymentReadClient
  readonly enrollmentMappings: readonly ReviewedExternalRelationshipMapping[]
}

export interface ReviewedAdvertisingSpendSourceBinding extends ReviewedExternalSourceBinding {
  readonly client: ExternalAdvertisingSpendReadClient
  readonly campaignMappings: readonly ReviewedExternalRelationshipMapping[]
}

export interface ExternalOperationalFinanceReadersOptions {
  readonly paymentSources: readonly ReviewedPaymentSourceBinding[]
  readonly advertisingSpendSources: readonly ReviewedAdvertisingSpendSourceBinding[]
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type ExternalOperationalFinanceReaders = Pick<
  FinanceReconciliationSnapshotReaders,
  'readPaymentEvents' | 'readAdvertisingSpend'
>

interface PreparedSource<TClient> {
  readonly tenantId: string
  readonly legalEntityId: string
  readonly sourceConnectionId: string
  readonly provider: string
  readonly externalAccountId: string
  readonly reviewReference: string
  readonly client: TClient
  readonly relationships: ReadonlyMap<string, FinanceSnapshotRelationship>
}

const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const HARD_MAX_SOURCES = 100
const HARD_MAX_RELATIONSHIPS_PER_SOURCE = 100_000
const PAYMENT_STATUSES = new Set<ExternalPaymentStatus>([
  'pending',
  'partial',
  'paid',
  'overdue',
  'refunded',
])
const ADVERTISING_METRIC_STATES = new Set<ExternalAdvertisingMetricState>([
  'loaded',
  'zero_real',
  'not_available',
  'api_error',
])

/**
 * Creates disconnected read-only readers for event-level payments and daily
 * advertising spend. Every external account and relationship must be bound to
 * exactly one reviewed tenant/legal-entity scope before any provider call.
 */
export function createExternalOperationalFinanceReaders(
  options: ExternalOperationalFinanceReadersOptions
): ExternalOperationalFinanceReaders {
  const pageSize = validateBoundedOption(
    options.pageSize,
    DEFAULT_PAGE_SIZE,
    HARD_MAX_PAGE_SIZE,
    'FINANCE_EXTERNAL_SOURCE_INVALID_PAGE_SIZE'
  )
  const maxPages = validateBoundedOption(
    options.maxPages,
    DEFAULT_MAX_PAGES,
    HARD_MAX_PAGES,
    'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_PAGES'
  )
  const maxRecords = validateBoundedOption(
    options.maxRecords,
    DEFAULT_MAX_RECORDS,
    HARD_MAX_RECORDS,
    'FINANCE_EXTERNAL_SOURCE_INVALID_MAX_RECORDS'
  )
  const paymentSources = prepareSources<ExternalPaymentReadClient, ReviewedPaymentSourceBinding>(
    options.paymentSources,
    (source) => source.enrollmentMappings
  )
  const advertisingSpendSources = prepareSources<
    ExternalAdvertisingSpendReadClient,
    ReviewedAdvertisingSpendSourceBinding
  >(options.advertisingSpendSources, (source) => source.campaignMappings)

  return Object.freeze({
    readPaymentEvents: async (scope) => {
      const source = requireSource(paymentSources, scope, 'payment')
      const seenExternalIds = new Set<string>()

      return readAllPages<
        ExternalPaymentEvent,
        ExternalPaymentEventPage,
        EnrollmentPaymentEventSnapshot
      >(
        'payment',
        maxPages,
        maxRecords,
        (cursor) =>
          source.client.listPaymentEvents({
            externalAccountId: source.externalAccountId,
            cursor,
            pageSize,
          }),
        (record) => {
          if (!record || typeof record !== 'object') {
            throw externalSourceError(
              'FINANCE_EXTERNAL_PAYMENT_RECORD_INVALID',
              'External payment record is invalid.'
            )
          }
          const externalId = requireIdentifier(
            record.externalId,
            'FINANCE_EXTERNAL_PAYMENT_RECORD_INVALID',
            'External payment record is invalid.'
          )
          if (seenExternalIds.has(externalId)) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_PAYMENT_DUPLICATE_RECORD',
              'External payment source returned a duplicate record.'
            )
          }
          seenExternalIds.add(externalId)
          const enrollmentId = requireRelationship(
            source.relationships,
            record.externalEnrollmentId,
            'payment'
          )
          if (!PAYMENT_STATUSES.has(record.status)) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_PAYMENT_RECORD_INVALID',
              'External payment record is invalid.'
            )
          }
          if (
            !validAmountPrimitive(record.amount) ||
            !validIdentifier(record.currency) ||
            !validNullableIdentifier(record.paidAt) ||
            !validNullableIdentifier(record.transactionReference)
          ) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_PAYMENT_RECORD_INVALID',
              'External payment record is invalid.'
            )
          }

          return Object.freeze({
            id: externalRecordId('payment', source.provider, source.externalAccountId, externalId),
            tenantId: source.tenantId,
            legalEntityId: source.legalEntityId,
            enrollment: enrollmentId,
            status: record.status,
            amount: record.amount,
            currency: record.currency,
            paidAt: record.paidAt ?? null,
            transactionReference: record.transactionReference ?? null,
          }) satisfies EnrollmentPaymentEventSnapshot
        }
      )
    },

    readAdvertisingSpend: async (scope) => {
      const source = requireSource(advertisingSpendSources, scope, 'advertising')
      const seenDailyRecords = new Set<string>()

      return readAllPages<
        ExternalDailyAdvertisingSpend,
        ExternalDailyAdvertisingSpendPage,
        AdvertisingSpendSnapshot
      >(
        'advertising',
        maxPages,
        maxRecords,
        (cursor) =>
          source.client.listDailyAdvertisingSpend({
            externalAccountId: source.externalAccountId,
            cursor,
            pageSize,
          }),
        (record) => {
          if (!record || typeof record !== 'object') {
            throw externalSourceError(
              'FINANCE_EXTERNAL_ADVERTISING_RECORD_INVALID',
              'External advertising spend record is invalid.'
            )
          }
          const externalCampaignId = requireIdentifier(
            record.externalCampaignId,
            'FINANCE_EXTERNAL_ADVERTISING_RECORD_INVALID',
            'External advertising spend record is invalid.'
          )
          const spendDate = requireIdentifier(
            record.spendDate,
            'FINANCE_EXTERNAL_ADVERTISING_RECORD_INVALID',
            'External advertising spend record is invalid.'
          )
          const dailyKey = `${externalCampaignId}\u0000${spendDate}`
          if (seenDailyRecords.has(dailyKey)) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_ADVERTISING_DUPLICATE_RECORD',
              'External advertising source returned a duplicate daily record.'
            )
          }
          seenDailyRecords.add(dailyKey)
          const campaignId = requireRelationship(
            source.relationships,
            externalCampaignId,
            'advertising'
          )
          if (!ADVERTISING_METRIC_STATES.has(record.metricState)) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_ADVERTISING_RECORD_INVALID',
              'External advertising spend record is invalid.'
            )
          }
          if (!validNullableAmountPrimitive(record.amount) || !validIdentifier(record.currency)) {
            throw externalSourceError(
              'FINANCE_EXTERNAL_ADVERTISING_RECORD_INVALID',
              'External advertising spend record is invalid.'
            )
          }

          return Object.freeze({
            id: externalRecordId(
              'advertising',
              source.provider,
              source.externalAccountId,
              `${externalCampaignId}/${spendDate}`
            ),
            tenantId: source.tenantId,
            legalEntityId: source.legalEntityId,
            campaign: campaignId,
            rangeSince: spendDate,
            rangeUntil: spendDate,
            amount: record.amount,
            currency: record.currency,
            metricState: record.metricState,
          }) satisfies AdvertisingSpendSnapshot
        }
      )
    },
  })
}

function prepareSources<
  TClient extends { readonly provider: string },
  TSource extends ReviewedExternalSourceBinding & { readonly client: TClient },
>(
  sources: readonly TSource[],
  relationshipsFor: (source: TSource) => readonly ReviewedExternalRelationshipMapping[]
): ReadonlyMap<string, PreparedSource<TClient>> {
  if (sources.length > HARD_MAX_SOURCES) throw invalidPlanError()
  const prepared = new Map<string, PreparedSource<TClient>>()
  const externalAccounts = new Set<string>()
  const sourceConnectionIds = new Set<string>()

  for (const source of sources) {
    const tenantId = requirePlanIdentifier(source.tenantId)
    const legalEntityId = requirePlanIdentifier(source.legalEntityId)
    const sourceConnectionId = requirePlanIdentifier(source.sourceConnectionId)
    const provider = requirePlanIdentifier(source.provider)
    const externalAccountId = requirePlanIdentifier(source.externalAccountId)
    if (
      !validIdentifier(source.reviewReference) ||
      source.reviewReference === 'review://' ||
      !source.reviewReference.startsWith('review://')
    ) {
      throw invalidPlanError()
    }
    if (source.integrationMode !== 'read_only' || source.connectionStatus !== 'active') {
      throw invalidPlanError()
    }
    if (source.client.provider !== provider) {
      throw externalSourceError(
        'FINANCE_EXTERNAL_SOURCE_PROVIDER_MISMATCH',
        'External source client does not match its reviewed provider.'
      )
    }

    const scopeKey = entityScopeKey({ tenantId, legalEntityId })
    if (prepared.has(scopeKey)) {
      throw externalSourceError(
        'FINANCE_EXTERNAL_SOURCE_DUPLICATE_SCOPE',
        'External source plan contains a duplicate entity scope.'
      )
    }
    if (sourceConnectionIds.has(sourceConnectionId)) {
      throw externalSourceError(
        'FINANCE_EXTERNAL_SOURCE_DUPLICATE_CONNECTION',
        'External source connection is assigned more than once.'
      )
    }
    sourceConnectionIds.add(sourceConnectionId)
    const accountKey = `${provider}\u0000${externalAccountId}`
    if (externalAccounts.has(accountKey)) {
      throw externalSourceError(
        'FINANCE_EXTERNAL_SOURCE_SHARED_ACCOUNT',
        'External source account is assigned to more than one entity.'
      )
    }
    externalAccounts.add(accountKey)

    const relationships = prepareRelationships(relationshipsFor(source))
    prepared.set(
      scopeKey,
      Object.freeze({
        tenantId,
        legalEntityId,
        sourceConnectionId,
        provider,
        externalAccountId,
        reviewReference: source.reviewReference,
        client: source.client,
        relationships,
      })
    )
  }

  return prepared
}

function prepareRelationships(
  mappings: readonly ReviewedExternalRelationshipMapping[]
): ReadonlyMap<string, FinanceSnapshotRelationship> {
  if (mappings.length > HARD_MAX_RELATIONSHIPS_PER_SOURCE) throw invalidPlanError()
  const relationships = new Map<string, FinanceSnapshotRelationship>()
  const localIds = new Set<string>()

  for (const mapping of mappings) {
    const externalId = requirePlanIdentifier(mapping.externalId)
    const localId = validateLocalId(mapping.localId)
    const localKey = String(localId)
    if (relationships.has(externalId) || localIds.has(localKey)) throw invalidPlanError()
    relationships.set(externalId, localId)
    localIds.add(localKey)
  }

  return relationships
}

function requireSource<TClient>(
  sources: ReadonlyMap<string, PreparedSource<TClient>>,
  scope: FinanceEntitySnapshotScope,
  dataset: 'payment' | 'advertising'
): PreparedSource<TClient> {
  validateRuntimeScope(scope)
  const source = sources.get(entityScopeKey(scope))
  if (!source) {
    throw externalSourceError(
      `FINANCE_EXTERNAL_${dataset.toUpperCase()}_SCOPE_NOT_REVIEWED`,
      'External source scope has not been reviewed.'
    )
  }
  return source
}

async function readAllPages<
  TRecord,
  TPage extends {
    readonly items: readonly TRecord[]
    readonly nextCursor: string | null
    readonly snapshotVersion: string
  },
  TSnapshot,
>(
  dataset: 'payment' | 'advertising',
  maxPages: number,
  maxRecords: number,
  readPage: (cursor: string | null) => Promise<TPage>,
  project: (record: TRecord) => TSnapshot
): Promise<readonly TSnapshot[]> {
  const snapshots: TSnapshot[] = []
  const seenCursors = new Set<string>()
  let cursor: string | null = null
  let snapshotVersion: string | null = null

  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    let page: TPage
    try {
      page = await readPage(cursor)
    } catch (error) {
      if (error instanceof AccountingSyncError) throw error
      throw externalSourceError(
        `FINANCE_EXTERNAL_${dataset.toUpperCase()}_READ_FAILED`,
        'External operational finance read failed.'
      )
    }
    if (!page || !Array.isArray(page.items)) {
      throw externalSourceError(
        `FINANCE_EXTERNAL_${dataset.toUpperCase()}_PAGE_INVALID`,
        'External operational finance page is invalid.'
      )
    }
    const currentSnapshotVersion = requireIdentifier(
      page.snapshotVersion,
      `FINANCE_EXTERNAL_${dataset.toUpperCase()}_PAGE_INVALID`,
      'External operational finance page snapshot version is invalid.'
    )
    if (snapshotVersion === null) snapshotVersion = currentSnapshotVersion
    else if (snapshotVersion !== currentSnapshotVersion) {
      throw externalSourceError(
        `FINANCE_EXTERNAL_${dataset.toUpperCase()}_SNAPSHOT_VERSION_CHANGED`,
        'External operational finance snapshot version changed during pagination.'
      )
    }
    if (snapshots.length + page.items.length > maxRecords) {
      throw externalSourceError(
        `FINANCE_EXTERNAL_${dataset.toUpperCase()}_RECORD_LIMIT_EXCEEDED`,
        'External operational finance record limit exceeded.'
      )
    }
    for (const record of page.items) snapshots.push(project(record))

    if (page.nextCursor === null) return Object.freeze(snapshots)
    const nextCursor = requireIdentifier(
      page.nextCursor,
      `FINANCE_EXTERNAL_${dataset.toUpperCase()}_CURSOR_INVALID`,
      'External operational finance cursor is invalid.'
    )
    if (seenCursors.has(nextCursor)) {
      throw externalSourceError(
        `FINANCE_EXTERNAL_${dataset.toUpperCase()}_CURSOR_CYCLE`,
        'External operational finance cursor cycle detected.'
      )
    }
    seenCursors.add(nextCursor)
    cursor = nextCursor
  }

  throw externalSourceError(
    `FINANCE_EXTERNAL_${dataset.toUpperCase()}_PAGE_LIMIT_EXCEEDED`,
    'External operational finance page limit exceeded.'
  )
}

function requireRelationship(
  relationships: ReadonlyMap<string, FinanceSnapshotRelationship>,
  externalId: string,
  dataset: 'payment' | 'advertising'
): FinanceSnapshotRelationship {
  const canonicalExternalId = requireIdentifier(
    externalId,
    `FINANCE_EXTERNAL_${dataset.toUpperCase()}_RELATIONSHIP_UNREVIEWED`,
    'External source relationship has not been reviewed.'
  )
  const localId = relationships.get(canonicalExternalId)
  if (localId === undefined) {
    throw externalSourceError(
      `FINANCE_EXTERNAL_${dataset.toUpperCase()}_RELATIONSHIP_UNREVIEWED`,
      'External source relationship has not been reviewed.'
    )
  }
  return localId
}

function validateRuntimeScope(scope: FinanceEntitySnapshotScope): void {
  if (!validIdentifier(scope.tenantId) || !validIdentifier(scope.legalEntityId)) {
    throw externalSourceError(
      'FINANCE_EXTERNAL_SOURCE_INVALID_SCOPE',
      'External source scope is invalid.'
    )
  }
}

function validateLocalId(value: string | number): string | number {
  if (typeof value === 'number') {
    if (!Number.isSafeInteger(value) || value < 1) throw invalidPlanError()
    return value
  }
  return requirePlanIdentifier(value)
}

function requirePlanIdentifier(value: string): string {
  if (!validIdentifier(value)) throw invalidPlanError()
  return value
}

function requireIdentifier(value: string, code: string, summary: string): string {
  if (!validIdentifier(value)) throw externalSourceError(code, summary)
  return value
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 500 && value.trim() === value
  )
}

function validNullableIdentifier(value: unknown): value is string | null | undefined {
  return value == null || validIdentifier(value)
}

function validAmountPrimitive(value: unknown): value is string | number {
  return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
}

function validNullableAmountPrimitive(value: unknown): value is string | number | null {
  return value === null || validAmountPrimitive(value)
}

function validateBoundedOption(
  value: number | undefined,
  fallback: number,
  maximum: number,
  code: string
): number {
  const resolved = value ?? fallback
  if (!Number.isSafeInteger(resolved) || resolved < 1 || resolved > maximum) {
    throw externalSourceError(code, 'External source pagination limit is invalid.')
  }
  return resolved
}

function entityScopeKey(scope: FinanceEntitySnapshotScope): string {
  return `${scope.tenantId}\u0000${scope.legalEntityId}`
}

function externalRecordId(
  dataset: 'payment' | 'advertising',
  provider: string,
  externalAccountId: string,
  recordKey: string
): string {
  return [dataset, provider, externalAccountId, recordKey].map(encodeURIComponent).join('/')
}

function invalidPlanError(): AccountingSyncError {
  return externalSourceError(
    'FINANCE_EXTERNAL_SOURCE_PLAN_INVALID',
    'External source plan is invalid.'
  )
}

function externalSourceError(code: string, summary: string): AccountingSyncError {
  return new AccountingSyncError(code, summary)
}
