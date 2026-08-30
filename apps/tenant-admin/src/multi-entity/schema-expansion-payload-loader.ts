import type { PayloadRequest } from 'payload'
import type {
  MultiEntitySchemaCollection,
  MultiEntitySchemaExpansionRecord,
} from '../../../../packages/tenant/src/multi-entity-schema-expansion-plan'

export type PayloadSchemaExpansionReadableCollection = Exclude<
  MultiEntitySchemaCollection,
  'staff' | 'media'
>

export interface ReviewedSchemaExpansionOwnerBinding {
  readonly collection: PayloadSchemaExpansionReadableCollection
  readonly recordId: string
  readonly tenantId: string
  readonly role: 'owner' | 'dependency_owner'
  readonly legalEntityId: string
  readonly reviewReference: string
}

export interface PayloadSchemaExpansionSnapshotContext {
  readonly environment: 'staging'
  readonly tenantId: string
  readonly reviewReference: string
}

export interface PayloadSchemaExpansionCollectionSource {
  readonly collection: PayloadSchemaExpansionReadableCollection
  /** Set only after the nullable relationship exists in the inspected Payload schema. */
  readonly legalEntityFieldAvailable: boolean
}

export interface PayloadSchemaExpansionRecordLoaderOptions {
  /** Authenticated request injected by a caller; the loader creates no request or auth context. */
  readonly req: PayloadRequest
  readonly context: PayloadSchemaExpansionSnapshotContext
  readonly sources: readonly PayloadSchemaExpansionCollectionSource[]
  readonly reviewedOwnerBindings: readonly ReviewedSchemaExpansionOwnerBinding[]
  readonly pageSize?: number
  readonly maxPagesPerCollection?: number
  readonly maxRecords?: number
}

export type PayloadSchemaExpansionRecordLoaderErrorCode =
  | 'SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION'
  | 'SCHEMA_EXPANSION_PAYLOAD_STAGING_REQUIRED'
  | 'SCHEMA_EXPANSION_PAYLOAD_REQUEST_SCOPE_MISMATCH'
  | 'SCHEMA_EXPANSION_PAYLOAD_CONTEXT_INVALID'
  | 'SCHEMA_EXPANSION_PAYLOAD_UNSUPPORTED_COLLECTION'
  | 'SCHEMA_EXPANSION_PAYLOAD_BINDING_INVALID'
  | 'SCHEMA_EXPANSION_PAYLOAD_BINDING_DUPLICATE'
  | 'SCHEMA_EXPANSION_PAYLOAD_READ_FAILED'
  | 'SCHEMA_EXPANSION_PAYLOAD_PAGE_INVALID'
  | 'SCHEMA_EXPANSION_PAYLOAD_PAGINATION_CHANGED'
  | 'SCHEMA_EXPANSION_PAYLOAD_PAGE_LIMIT_EXCEEDED'
  | 'SCHEMA_EXPANSION_PAYLOAD_RECORD_LIMIT_EXCEEDED'
  | 'SCHEMA_EXPANSION_PAYLOAD_DUPLICATE_RECORD'
  | 'SCHEMA_EXPANSION_PAYLOAD_RECORD_INVALID'
  | 'SCHEMA_EXPANSION_PAYLOAD_TENANT_BOUNDARY_VIOLATION'

export class PayloadSchemaExpansionRecordLoaderError extends Error {
  constructor(readonly code: PayloadSchemaExpansionRecordLoaderErrorCode) {
    super('Schema expansion Payload snapshot loading failed.')
    this.name = 'PayloadSchemaExpansionRecordLoaderError'
  }
}

export const PAYLOAD_SCHEMA_EXPANSION_LEGACY_SELECT = Object.freeze({ tenant: true } as const)
export const PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_LEGACY_SELECT = Object.freeze({
  course_run: true,
} as const)
export const PAYLOAD_SCHEMA_EXPANSION_WITH_OWNER_SELECT = Object.freeze({
  tenant: true,
  legal_entity: true,
} as const)
export const PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_WITH_OWNER_SELECT = Object.freeze({
  course_run: true,
  legal_entity: true,
} as const)

const READABLE_COLLECTIONS: readonly PayloadSchemaExpansionReadableCollection[] = [
  'campuses',
  'classrooms',
  'course-runs',
  'enrollments',
  'campaigns',
  'leads',
]
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const MAX_IDS_PER_QUERY = 1_000

interface PayloadPage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

interface Configuration {
  readonly req: PayloadRequest
  readonly tenantId: string
  readonly sources: readonly PayloadSchemaExpansionCollectionSource[]
  readonly bindingsByRecord: ReadonlyMap<string, readonly ReviewedSchemaExpansionOwnerBinding[]>
  readonly pageSize: number
  readonly maxPagesPerCollection: number
  readonly maxRecords: number
}

/**
 * Creates a bounded source-level loader for records accepted by
 * `planMultiEntitySchemaExpansion`. It reads only through the injected request,
 * always preserves effective access, and has no registration or mutation side effect.
 */
export function createPayloadSchemaExpansionRecordLoader(
  options: PayloadSchemaExpansionRecordLoaderOptions
): () => Promise<readonly MultiEntitySchemaExpansionRecord[]> {
  const configuration = validateConfiguration(options)
  return () => loadRecords(configuration)
}

async function loadRecords(
  configuration: Configuration
): Promise<readonly MultiEntitySchemaExpansionRecord[]> {
  const records: MultiEntitySchemaExpansionRecord[] = []
  const seen = new Set<string>()
  const enrollmentCourseRunIds = new Set<string>()

  for (const source of configuration.sources) {
    const documents = await readCollection(configuration, source)
    for (const document of documents) {
      const recordId = relationshipId(document.id)
      if (recordId === null) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_INVALID')
      const key = recordKey(source.collection, recordId)
      if (seen.has(key)) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_DUPLICATE_RECORD')
      seen.add(key)

      if (source.collection === 'enrollments') {
        const courseRunId = relationshipId(document.course_run)
        if (courseRunId === null) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_INVALID')
        enrollmentCourseRunIds.add(courseRunId)
      } else if (relationshipId(document.tenant) !== configuration.tenantId) {
        throw loaderError('SCHEMA_EXPANSION_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
      }

      const bindings = configuration.bindingsByRecord.get(key) ?? []
      records.push(
        Object.freeze({
          collection: source.collection,
          recordId,
          tenantId: configuration.tenantId,
          currentLegalEntityId: source.legalEntityFieldAvailable
            ? nullableRelationshipId(document.legal_entity)
            : null,
          reviewedLegalEntityIds: Object.freeze(
            bindings
              .filter((binding) => binding.role === 'owner')
              .map((binding) => binding.legalEntityId)
              .sort()
          ),
          dependencyLegalEntityIds: Object.freeze(
            bindings
              .filter((binding) => binding.role === 'dependency_owner')
              .map((binding) => binding.legalEntityId)
              .sort()
          ),
        })
      )
      if (records.length > configuration.maxRecords) {
        throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
      }
    }
  }

  await assertEnrollmentCourseRunsBelongToTenant(configuration, enrollmentCourseRunIds)
  assertEveryBindingTargetsSnapshot(configuration.bindingsByRecord, seen)

  return Object.freeze(
    records.sort(
      (left, right) =>
        READABLE_COLLECTIONS.indexOf(left.collection as PayloadSchemaExpansionReadableCollection) -
          READABLE_COLLECTIONS.indexOf(
            right.collection as PayloadSchemaExpansionReadableCollection
          ) || left.recordId.localeCompare(right.recordId)
    )
  )
}

async function readCollection(
  configuration: Configuration,
  source: PayloadSchemaExpansionCollectionSource
): Promise<readonly Readonly<Record<string, unknown>>[]> {
  return readPages(configuration, {
    collection: source.collection,
    where: tenantWhere(source.collection, configuration.tenantId),
    select: selectFor(source),
  })
}

async function assertEnrollmentCourseRunsBelongToTenant(
  configuration: Configuration,
  courseRunIds: ReadonlySet<string>
): Promise<void> {
  if (courseRunIds.size === 0) return
  const ids = [...courseRunIds].sort()
  const returned = new Set<string>()
  for (let offset = 0; offset < ids.length; offset += MAX_IDS_PER_QUERY) {
    const chunk = ids.slice(offset, offset + MAX_IDS_PER_QUERY)
    const documents = await readPages(configuration, {
      collection: 'course-runs',
      where: {
        and: [{ tenant: { equals: configuration.tenantId } }, { id: { in: chunk } }],
      },
      select: PAYLOAD_SCHEMA_EXPANSION_LEGACY_SELECT,
    })
    for (const document of documents) {
      const id = relationshipId(document.id)
      if (
        id === null ||
        !courseRunIds.has(id) ||
        returned.has(id) ||
        relationshipId(document.tenant) !== configuration.tenantId
      ) {
        throw loaderError('SCHEMA_EXPANSION_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
      }
      returned.add(id)
    }
  }
  if (returned.size !== courseRunIds.size) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
  }
}

async function readPages(
  configuration: Configuration,
  query: {
    readonly collection: PayloadSchemaExpansionReadableCollection
    readonly where: Readonly<Record<string, unknown>>
    readonly select: Readonly<Record<string, true>>
  }
): Promise<readonly Readonly<Record<string, unknown>>[]> {
  const documents: Readonly<Record<string, unknown>>[] = []
  const seenIds = new Set<string>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1

  while (true) {
    if (pageNumber > configuration.maxPagesPerCollection) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    let response: unknown
    try {
      response = await configuration.req.payload.find({
        collection: query.collection,
        where: query.where,
        page: pageNumber,
        limit: configuration.pageSize,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req: configuration.req,
        select: query.select,
        showHiddenFields: false,
        trash: false,
      } as never)
    } catch {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_READ_FAILED')
    }

    const page = normalizePage(response, pageNumber, configuration.pageSize)
    if (page.totalPages > configuration.maxPagesPerCollection) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    if (page.totalDocs > configuration.maxRecords) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
    }
    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGINATION_CHANGED')
    }

    for (const document of page.docs) {
      const id = relationshipId(document.id)
      if (id === null) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_INVALID')
      if (seenIds.has(id)) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_DUPLICATE_RECORD')
      seenIds.add(id)
      documents.push(projectDocument(document, query.select))
      if (documents.length > configuration.maxRecords) {
        throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
      }
    }
    if (!page.hasNextPage) break
    pageNumber += 1
  }

  if (expectedTotalDocs === null || documents.length !== expectedTotalDocs) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGINATION_CHANGED')
  }
  return Object.freeze(documents)
}

function validateConfiguration(options: PayloadSchemaExpansionRecordLoaderOptions): Configuration {
  if (!isRecord(options) || !validPayloadRequest(options.req)) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION')
  }
  if (!isRecord(options.context) || options.context.environment !== 'staging') {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_STAGING_REQUIRED')
  }
  if (
    !hasOnlyKeys(options.context, ['environment', 'tenantId', 'reviewReference']) ||
    !validIdentifier(options.context.tenantId) ||
    !REVIEW_REFERENCE_PATTERN.test(options.context.reviewReference)
  ) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_CONTEXT_INVALID')
  }
  if (!hasTenantScopedAuthenticatedUser(options.req, options.context.tenantId)) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_REQUEST_SCOPE_MISMATCH')
  }
  if (!Array.isArray(options.sources) || !Array.isArray(options.reviewedOwnerBindings)) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION')
  }

  const sources: PayloadSchemaExpansionCollectionSource[] = []
  const sourceCollections = new Set<PayloadSchemaExpansionReadableCollection>()
  for (const source of options.sources) {
    if (
      !isRecord(source) ||
      !hasOnlyKeys(source, ['collection', 'legalEntityFieldAvailable']) ||
      !READABLE_COLLECTIONS.includes(
        source.collection as PayloadSchemaExpansionReadableCollection
      ) ||
      typeof source.legalEntityFieldAvailable !== 'boolean'
    ) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_UNSUPPORTED_COLLECTION')
    }
    const collection = source.collection as PayloadSchemaExpansionReadableCollection
    if (sourceCollections.has(collection)) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION')
    }
    sourceCollections.add(collection)
    sources.push(
      Object.freeze({ collection, legalEntityFieldAvailable: source.legalEntityFieldAvailable })
    )
  }
  if (sources.length === 0) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION')
  }

  const bindingsByRecord = new Map<string, ReviewedSchemaExpansionOwnerBinding[]>()
  const bindingKeys = new Set<string>()
  for (const binding of options.reviewedOwnerBindings) {
    if (
      !validBinding(binding, options.context.tenantId) ||
      !sourceCollections.has(binding.collection)
    ) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_BINDING_INVALID')
    }
    const bindingKey = `${recordKey(binding.collection, binding.recordId)}\u0000${binding.role}\u0000${binding.legalEntityId}`
    if (bindingKeys.has(bindingKey)) {
      throw loaderError('SCHEMA_EXPANSION_PAYLOAD_BINDING_DUPLICATE')
    }
    bindingKeys.add(bindingKey)
    const key = recordKey(binding.collection, binding.recordId)
    const current = bindingsByRecord.get(key) ?? []
    current.push(Object.freeze({ ...binding }))
    bindingsByRecord.set(key, current)
  }

  return Object.freeze({
    req: options.req,
    tenantId: options.context.tenantId,
    sources: Object.freeze(sources),
    bindingsByRecord,
    pageSize: limit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE),
    maxPagesPerCollection: limit(options.maxPagesPerCollection, DEFAULT_MAX_PAGES, HARD_MAX_PAGES),
    maxRecords: limit(options.maxRecords, DEFAULT_MAX_RECORDS, HARD_MAX_RECORDS),
  })
}

function validBinding(
  value: unknown,
  tenantId: string
): value is ReviewedSchemaExpansionOwnerBinding {
  if (!isRecord(value)) return false
  return (
    hasOnlyKeys(value, [
      'collection',
      'recordId',
      'tenantId',
      'role',
      'legalEntityId',
      'reviewReference',
    ]) &&
    READABLE_COLLECTIONS.includes(value.collection as PayloadSchemaExpansionReadableCollection) &&
    validIdentifier(value.recordId) &&
    value.tenantId === tenantId &&
    (value.role === 'owner' || value.role === 'dependency_owner') &&
    validIdentifier(value.legalEntityId) &&
    typeof value.reviewReference === 'string' &&
    REVIEW_REFERENCE_PATTERN.test(value.reviewReference)
  )
}

function tenantWhere(collection: PayloadSchemaExpansionReadableCollection, tenantId: string) {
  return collection === 'enrollments'
    ? { 'course_run.tenant': { equals: tenantId } }
    : { tenant: { equals: tenantId } }
}

function selectFor(source: PayloadSchemaExpansionCollectionSource) {
  if (source.collection === 'enrollments') {
    return source.legalEntityFieldAvailable
      ? PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_WITH_OWNER_SELECT
      : PAYLOAD_SCHEMA_EXPANSION_ENROLLMENT_LEGACY_SELECT
  }
  return source.legalEntityFieldAvailable
    ? PAYLOAD_SCHEMA_EXPANSION_WITH_OWNER_SELECT
    : PAYLOAD_SCHEMA_EXPANSION_LEGACY_SELECT
}

function projectDocument(
  source: Readonly<Record<string, unknown>>,
  select: Readonly<Record<string, true>>
): Readonly<Record<string, unknown>> {
  const result: Record<string, unknown> = { id: source.id }
  for (const field of Object.keys(select)) {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field]
  }
  return Object.freeze(result)
}

function assertEveryBindingTargetsSnapshot(
  bindingsByRecord: ReadonlyMap<string, readonly ReviewedSchemaExpansionOwnerBinding[]>,
  seen: ReadonlySet<string>
): void {
  for (const key of bindingsByRecord.keys()) {
    if (!seen.has(key)) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_BINDING_INVALID')
  }
}

function normalizePage(value: unknown, requestedPage: number, pageSize: number): PayloadPage {
  if (!isRecord(value)) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGE_INVALID')
  const page = value as Partial<PayloadPage>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > pageSize ||
    !positiveInteger(page.page) ||
    page.page !== requestedPage ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean' ||
    !validNextPage(page.nextPage)
  ) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGE_INVALID')
  }
  const validEmpty = page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmpty =
    page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / pageSize)
  const expectedHasNext = page.totalDocs > 0 && requestedPage < page.totalPages
  if (
    (!validEmpty && !validNonEmpty) ||
    page.hasNextPage !== expectedHasNext ||
    (expectedHasNext && page.nextPage !== requestedPage + 1) ||
    (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined)
  ) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_PAGE_INVALID')
  }
  return page as PayloadPage
}

function hasTenantScopedAuthenticatedUser(req: PayloadRequest, tenantId: string): boolean {
  if (!isRecord(req.user) || typeof req.user.role !== 'string' || req.user.role === 'superadmin') {
    return false
  }
  return relationshipId(req.user.tenant) === tenantId
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  return Boolean(
    isRecord(value) && isRecord(value.payload) && typeof value.payload.find === 'function'
  )
}

function nullableRelationshipId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  const id = relationshipId(value)
  if (id === null) throw loaderError('SCHEMA_EXPANSION_PAYLOAD_RECORD_INVALID')
  return id
}

function relationshipId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && validIdentifier(value)) return value
  if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'id')) {
    return relationshipId(value.id)
  }
  return null
}

function recordKey(collection: PayloadSchemaExpansionReadableCollection, recordId: string): string {
  return `${collection}\u0000${recordId}`
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value === value.trim() &&
    /^[A-Za-z0-9][A-Za-z0-9._:-]{0,127}$/.test(value)
  )
}

function limit(value: number | undefined, fallback: number, maximum: number): number {
  const result = value ?? fallback
  if (!Number.isSafeInteger(result) || result < 1 || result > maximum) {
    throw loaderError('SCHEMA_EXPANSION_PAYLOAD_INVALID_CONFIGURATION')
  }
  return result
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function validNextPage(value: unknown): boolean {
  return value === null || value === undefined || positiveInteger(value)
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function hasOnlyKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const allowed = new Set(keys)
  return Object.keys(value).every((key) => allowed.has(key))
}

function loaderError(
  code: PayloadSchemaExpansionRecordLoaderErrorCode
): PayloadSchemaExpansionRecordLoaderError {
  return new PayloadSchemaExpansionRecordLoaderError(code)
}
