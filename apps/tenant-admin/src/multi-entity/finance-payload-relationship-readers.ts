import type { PayloadRequest } from 'payload'

export interface PayloadFinanceEntityScope {
  readonly tenantId: string
  readonly legalEntityId: string
}

export interface ReviewedPayloadFinanceEntityPlan extends PayloadFinanceEntityScope {
  /** Numeric tenant relationship used exclusively for current Payload reads. */
  readonly payloadTenantId: string
  readonly reviewReference: string
  readonly enrollmentIds: readonly number[]
  readonly courseRunIds: readonly number[]
  readonly campaignIds: readonly number[]
}

export interface PayloadEnrollmentFinanceSnapshot extends PayloadFinanceEntityScope {
  readonly id: number
  readonly amountPaid?: string | number | null
}

export interface PayloadCampaignFinanceSnapshot extends PayloadFinanceEntityScope {
  readonly id: number
}

export interface PayloadFinanceRelationshipReaders {
  readonly readEnrollments: (
    scope: PayloadFinanceEntityScope
  ) => Promise<readonly PayloadEnrollmentFinanceSnapshot[]>
  readonly readCampaigns: (
    scope: PayloadFinanceEntityScope
  ) => Promise<readonly PayloadCampaignFinanceSnapshot[]>
}

export interface PayloadFinanceRelationshipReaderOptions {
  readonly req: PayloadRequest
  readonly reviewedPlans: readonly ReviewedPayloadFinanceEntityPlan[]
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type PayloadFinanceRelationshipReaderErrorCode =
  | 'FINANCE_PAYLOAD_RELATIONSHIP_INVALID_CONFIGURATION'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_PLAN_INVALID'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_PLAN_DUPLICATE'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MISSING'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_ENROLLMENTS_READ_FAILED'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_CAMPAIGNS_READ_FAILED'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_PAGINATION_CHANGED'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_LIMIT_EXCEEDED'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_COVERAGE_MISMATCH'
  | 'FINANCE_PAYLOAD_RELATIONSHIP_RECORD_SCOPE_MISMATCH'

export class PayloadFinanceRelationshipReaderError extends Error {
  constructor(readonly code: PayloadFinanceRelationshipReaderErrorCode) {
    super('Finance Payload relationship reading failed.')
    this.name = 'PayloadFinanceRelationshipReaderError'
  }
}

const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

export const PAYLOAD_FINANCE_ENROLLMENT_SELECT = Object.freeze({
  course_run: true,
  amount_paid: true,
} as const)

export const PAYLOAD_FINANCE_CAMPAIGN_SELECT = Object.freeze({
  tenant: true,
} as const)

interface ValidatedConfiguration {
  readonly req: PayloadRequest
  readonly plans: ReadonlyMap<string, ReviewedPayloadFinanceEntityPlan>
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
}

interface PayloadPage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

/**
 * Creates only the Payload relationship readers required by the finance
 * snapshot loader. Payment events and daily advertising spend intentionally
 * remain separate sources because the current Payload schema does not contain
 * those event-level datasets.
 */
export function createPayloadFinanceRelationshipReaders(
  options: PayloadFinanceRelationshipReaderOptions
): PayloadFinanceRelationshipReaders {
  const configuration = validateConfiguration(options)

  return Object.freeze({
    readEnrollments: (scope) => readEnrollments(configuration, scope),
    readCampaigns: (scope) => readCampaigns(configuration, scope),
  })
}

async function readEnrollments(
  configuration: ValidatedConfiguration,
  scope: PayloadFinanceEntityScope
): Promise<readonly PayloadEnrollmentFinanceSnapshot[]> {
  const plan = resolvePlan(configuration.plans, scope)
  if (plan.courseRunIds.length === 0) return Object.freeze([])

  const courseRunIds = new Set(plan.courseRunIds)
  const tenantId = payloadTenantId(plan.payloadTenantId)
  return loadPagedDataset({
    expectedIds: new Set(plan.enrollmentIds),
    pageSize: configuration.pageSize,
    maxPages: configuration.maxPages,
    maxRecords: configuration.maxRecords,
    readPage: async (page) => {
      let response: unknown
      try {
        response = await configuration.req.payload.find({
          collection: 'enrollments',
          where: {
            and: [
              { course_run: { in: plan.courseRunIds } },
              { 'course_run.tenant': { equals: tenantId } },
            ],
          },
          page,
          limit: configuration.pageSize,
          pagination: true,
          sort: 'id',
          depth: 0,
          overrideAccess: false,
          req: configuration.req,
          select: PAYLOAD_FINANCE_ENROLLMENT_SELECT,
          showHiddenFields: false,
          trash: false,
        })
      } catch {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_ENROLLMENTS_READ_FAILED')
      }
      return normalizePage(response, page, configuration.pageSize)
    },
    project: (record) => {
      const id = recordId(record.id)
      const courseRunId = relationshipId(record.course_run)
      if (id === null || courseRunId === null || !courseRunIds.has(courseRunId)) {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_RECORD_SCOPE_MISMATCH')
      }
      if (!validOptionalAmount(record.amount_paid)) {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID')
      }
      return Object.freeze({
        id,
        tenantId: plan.tenantId,
        legalEntityId: plan.legalEntityId,
        ...(record.amount_paid === undefined ? {} : { amountPaid: record.amount_paid }),
      })
    },
  })
}

async function readCampaigns(
  configuration: ValidatedConfiguration,
  scope: PayloadFinanceEntityScope
): Promise<readonly PayloadCampaignFinanceSnapshot[]> {
  const plan = resolvePlan(configuration.plans, scope)
  if (plan.campaignIds.length === 0) return Object.freeze([])
  const tenantId = payloadTenantId(plan.payloadTenantId)

  return loadPagedDataset({
    expectedIds: new Set(plan.campaignIds),
    pageSize: configuration.pageSize,
    maxPages: configuration.maxPages,
    maxRecords: configuration.maxRecords,
    readPage: async (page) => {
      let response: unknown
      try {
        response = await configuration.req.payload.find({
          collection: 'campaigns',
          where: {
            and: [{ tenant: { equals: tenantId } }, { id: { in: plan.campaignIds } }],
          },
          page,
          limit: configuration.pageSize,
          pagination: true,
          sort: 'id',
          depth: 0,
          overrideAccess: false,
          req: configuration.req,
          select: PAYLOAD_FINANCE_CAMPAIGN_SELECT,
          showHiddenFields: false,
          trash: false,
        })
      } catch {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_CAMPAIGNS_READ_FAILED')
      }
      return normalizePage(response, page, configuration.pageSize)
    },
    project: (record) => {
      const id = recordId(record.id)
      const tenantId = relationshipId(record.tenant)
      if (id === null || tenantId === null || String(tenantId) !== plan.payloadTenantId) {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_RECORD_SCOPE_MISMATCH')
      }
      return Object.freeze({
        id,
        tenantId: plan.tenantId,
        legalEntityId: plan.legalEntityId,
      })
    },
  })
}

async function loadPagedDataset<T extends Readonly<Record<string, unknown>>>(options: {
  readonly expectedIds: ReadonlySet<number>
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
  readonly readPage: (page: number) => Promise<PayloadPage>
  readonly project: (record: Readonly<Record<string, unknown>>) => T
}): Promise<readonly T[]> {
  if (options.expectedIds.size === 0) return Object.freeze([])
  if (options.expectedIds.size > options.maxRecords) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_LIMIT_EXCEEDED')
  }

  const records: T[] = []
  const seenIds = new Set<number>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1

  while (true) {
    if (pageNumber > options.maxPages) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_LIMIT_EXCEEDED')
    }
    const page = await options.readPage(pageNumber)
    if (page.totalPages > options.maxPages || page.totalDocs > options.maxRecords) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_LIMIT_EXCEEDED')
    }

    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PAGINATION_CHANGED')
    }

    for (const source of page.docs) {
      const projected = options.project(source)
      const id = recordId(projected.id)
      if (id === null || !options.expectedIds.has(id) || seenIds.has(id)) {
        throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_COVERAGE_MISMATCH')
      }
      seenIds.add(id)
      records.push(projected)
    }

    if (!page.hasNextPage) break
    pageNumber += 1
  }

  if (
    expectedTotalDocs !== options.expectedIds.size ||
    records.length !== options.expectedIds.size ||
    [...options.expectedIds].some((id) => !seenIds.has(id))
  ) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_COVERAGE_MISMATCH')
  }

  records.sort((left, right) => Number(left.id) - Number(right.id))
  return Object.freeze(records)
}

function normalizePage(value: unknown, requestedPage: number, limit: number): PayloadPage {
  if (!value || typeof value !== 'object') {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID')
  }
  const page = value as Partial<{
    docs: unknown
    page: unknown
    totalDocs: unknown
    totalPages: unknown
    hasNextPage: unknown
    nextPage: unknown
  }>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > limit ||
    !positiveInteger(page.page) ||
    page.page !== requestedPage ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean' ||
    !validNextPage(page.nextPage)
  ) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID')
  }

  const validEmptyTotalPages =
    page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmptyTotalPages =
    page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / limit)
  const expectedHasNext = page.totalDocs > 0 && requestedPage < page.totalPages
  if (
    (!validEmptyTotalPages && !validNonEmptyTotalPages) ||
    page.hasNextPage !== expectedHasNext ||
    (expectedHasNext && page.nextPage !== requestedPage + 1) ||
    (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined)
  ) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PAGE_INVALID')
  }

  return Object.freeze({
    docs: Object.freeze([...page.docs]),
    page: page.page,
    totalDocs: page.totalDocs,
    totalPages: page.totalPages,
    hasNextPage: page.hasNextPage,
    nextPage: page.nextPage,
  })
}

function validateConfiguration(
  options: PayloadFinanceRelationshipReaderOptions
): ValidatedConfiguration {
  if (
    !validPayloadRequest(options?.req) ||
    !options.req.user ||
    !Array.isArray(options.reviewedPlans)
  ) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_INVALID_CONFIGURATION')
  }
  const requestTenantId = authenticatedRequestTenantId(options.req)
  if (requestTenantId === null) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH')
  }
  const pageSize = validateLimit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE)
  const maxPages = validateLimit(options.maxPages, DEFAULT_MAX_PAGES, HARD_MAX_PAGES)
  const maxRecords = validateLimit(options.maxRecords, DEFAULT_MAX_RECORDS, HARD_MAX_RECORDS)
  const plans = new Map<string, ReviewedPayloadFinanceEntityPlan>()
  const enrollmentOwners = new Map<number, string>()
  const courseRunOwners = new Map<number, string>()
  const campaignOwners = new Map<number, string>()

  for (const source of options.reviewedPlans) {
    validatePlan(source, maxRecords)
    if (source.payloadTenantId !== requestTenantId) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_REQUEST_SCOPE_MISMATCH')
    }
    const key = scopeKey(source)
    if (plans.has(key)) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PLAN_DUPLICATE')
    }
    const plan = Object.freeze({
      tenantId: source.tenantId,
      payloadTenantId: source.payloadTenantId,
      legalEntityId: source.legalEntityId,
      reviewReference: source.reviewReference,
      enrollmentIds: Object.freeze([...source.enrollmentIds]),
      courseRunIds: Object.freeze([...source.courseRunIds]),
      campaignIds: Object.freeze([...source.campaignIds]),
    })
    assertUniqueOwnership(enrollmentOwners, plan.enrollmentIds, key)
    assertUniqueOwnership(courseRunOwners, plan.courseRunIds, key)
    assertUniqueOwnership(campaignOwners, plan.campaignIds, key)
    plans.set(key, plan)
  }

  return Object.freeze({ req: options.req, plans, pageSize, maxPages, maxRecords })
}

function validatePlan(plan: ReviewedPayloadFinanceEntityPlan, maxRecords: number): void {
  if (
    !plan ||
    !validIdentifier(plan.tenantId) ||
    !validPayloadTenantId(plan.payloadTenantId) ||
    !validIdentifier(plan.legalEntityId) ||
    !REVIEW_REFERENCE_PATTERN.test(plan.reviewReference) ||
    !validIdList(plan.enrollmentIds, maxRecords) ||
    !validIdList(plan.courseRunIds, maxRecords) ||
    !validIdList(plan.campaignIds, maxRecords) ||
    (plan.enrollmentIds.length > 0 && plan.courseRunIds.length === 0)
  ) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PLAN_INVALID')
  }
}

function validIdList(value: readonly number[], maxRecords: number): boolean {
  return (
    Array.isArray(value) &&
    value.length <= maxRecords &&
    value.every(positiveInteger) &&
    new Set(value).size === value.length
  )
}

function assertUniqueOwnership(
  owners: Map<number, string>,
  ids: readonly number[],
  ownerKey: string
): void {
  for (const id of ids) {
    const existing = owners.get(id)
    if (existing && existing !== ownerKey) {
      throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PLAN_DUPLICATE')
    }
    owners.set(id, ownerKey)
  }
}

function resolvePlan(
  plans: ReadonlyMap<string, ReviewedPayloadFinanceEntityPlan>,
  scope: PayloadFinanceEntityScope
): ReviewedPayloadFinanceEntityPlan {
  if (!scope || !validIdentifier(scope.tenantId) || !validIdentifier(scope.legalEntityId)) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MISSING')
  }
  const plan = plans.get(scopeKey(scope))
  if (!plan) throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_SCOPE_MISSING')
  return plan
}

function scopeKey(scope: PayloadFinanceEntityScope): string {
  return `${scope.tenantId}\u0000${scope.legalEntityId}`
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  if (!value || typeof value !== 'object') return false
  const payload = (value as { payload?: unknown }).payload
  return Boolean(
    payload &&
    typeof payload === 'object' &&
    typeof (payload as { find?: unknown }).find === 'function'
  )
}

function authenticatedRequestTenantId(req: PayloadRequest): string | null {
  const user = req.user as { readonly role?: unknown; readonly tenant?: unknown } | null | undefined
  if (!user || user.role === 'superadmin') return null
  const tenantId = relationshipId(user.tenant)
  return tenantId === null ? null : String(tenantId)
}

function validPayloadTenantId(value: unknown): value is string {
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return false
  return Number.isSafeInteger(Number(value))
}

function payloadTenantId(value: string): number {
  if (!validPayloadTenantId(value)) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_PLAN_INVALID')
  }
  return Number(value)
}

function validateLimit(value: number | undefined, fallback: number, maximum: number): number {
  const resolved = value ?? fallback
  if (!positiveInteger(resolved) || resolved > maximum) {
    throw readerError('FINANCE_PAYLOAD_RELATIONSHIP_INVALID_CONFIGURATION')
  }
  return resolved
}

function recordId(value: unknown): number | null {
  return positiveInteger(value) ? value : null
}

function relationshipId(value: unknown): number | null {
  if (positiveInteger(value)) return value
  if (!value || typeof value !== 'object' || !Object.prototype.hasOwnProperty.call(value, 'id')) {
    return null
  }
  return recordId((value as { id: unknown }).id)
}

function validOptionalAmount(value: unknown): value is string | number | null | undefined {
  return (
    value === undefined ||
    value === null ||
    typeof value === 'string' ||
    (typeof value === 'number' && Number.isFinite(value))
  )
}

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value))
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
}

function positiveInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) > 0
}

function nonNegativeInteger(value: unknown): value is number {
  return Number.isSafeInteger(value) && Number(value) >= 0
}

function validNextPage(value: unknown): value is number | null | undefined {
  return value === null || value === undefined || positiveInteger(value)
}

function readerError(
  code: PayloadFinanceRelationshipReaderErrorCode
): PayloadFinanceRelationshipReaderError {
  return new PayloadFinanceRelationshipReaderError(code)
}
