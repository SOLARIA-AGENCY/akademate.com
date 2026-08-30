import type { PayloadRequest } from 'payload'
import type {
  MultiEntityRuntimeResourceType,
  MultiEntityRuntimeScopeContext,
} from '../../../../packages/tenant/src/multi-entity-runtime-scope'
import type {
  MultiEntityRuntimeScopeShadowRecord,
  MultiEntityRuntimeScopeShadowSnapshot,
} from '../../../../packages/tenant/src/multi-entity-runtime-scope-runner'
import {
  validateMultiEntityTopology,
  type MultiEntityTopology,
} from '../../../../packages/tenant/src/multi-entity-topology'

export interface ReviewedRuntimeScopeContext extends MultiEntityRuntimeScopeContext {
  readonly reviewReference: string
}

/**
 * A reviewed owner is evidence for a proposed shadow decision only. It never
 * becomes a Payload field, membership, or authorization input.
 */
export interface ReviewedRuntimeScopeResourceResolution {
  readonly resourceType: MultiEntityRuntimeResourceType
  readonly resourceId: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId: string
  readonly status: 'validated'
  readonly reviewReference: string
  /** Required for an enrollment because its current schema owns a course run. */
  readonly courseRunId?: string
  /** Optional reviewed campaign relation for a lead. */
  readonly campaignId?: string
}

export interface PayloadRuntimeScopeSnapshotLoaderOptions {
  /** Existing request preserves the current transaction and effective access. */
  readonly req: PayloadRequest
  readonly targetTenantId: string
  readonly context: ReviewedRuntimeScopeContext
  /** Reviewed immutable topology; no schema record is read or written here. */
  readonly topology: MultiEntityTopology
  readonly reviewedResourceResolutions: readonly ReviewedRuntimeScopeResourceResolution[]
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type PayloadRuntimeScopeSnapshotLoaderErrorCode =
  | 'RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION'
  | 'RUNTIME_SCOPE_PAYLOAD_REQUEST_SCOPE_MISMATCH'
  | 'RUNTIME_SCOPE_PAYLOAD_CONTEXT_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_UNSUPPORTED_RESOURCE'
  | 'RUNTIME_SCOPE_PAYLOAD_RESOLUTION_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_RESOLUTION_DUPLICATE'
  | 'RUNTIME_SCOPE_PAYLOAD_READ_FAILED'
  | 'RUNTIME_SCOPE_PAYLOAD_PAGE_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_PAGINATION_CHANGED'
  | 'RUNTIME_SCOPE_PAYLOAD_PAGE_LIMIT_EXCEEDED'
  | 'RUNTIME_SCOPE_PAYLOAD_RECORD_LIMIT_EXCEEDED'
  | 'RUNTIME_SCOPE_PAYLOAD_UNEXPECTED_RECORD'
  | 'RUNTIME_SCOPE_PAYLOAD_TENANT_BOUNDARY_VIOLATION'
  | 'RUNTIME_SCOPE_PAYLOAD_CAMPUS_RELATION_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_CLASSROOM_RELATION_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_ENROLLMENT_RELATION_INVALID'
  | 'RUNTIME_SCOPE_PAYLOAD_LEAD_RELATION_INVALID'

export class PayloadRuntimeScopeSnapshotLoaderError extends Error {
  constructor(readonly code: PayloadRuntimeScopeSnapshotLoaderErrorCode) {
    super('Runtime scope Payload snapshot loading failed.')
    this.name = 'PayloadRuntimeScopeSnapshotLoaderError'
  }
}

export const PAYLOAD_RUNTIME_SCOPE_COURSE_RUN_SELECT = Object.freeze({
  tenant: true,
  campus: true,
} as const)
export const PAYLOAD_RUNTIME_SCOPE_ENROLLMENT_SELECT = Object.freeze({ course_run: true } as const)
export const PAYLOAD_RUNTIME_SCOPE_CAMPAIGN_SELECT = Object.freeze({ tenant: true } as const)
export const PAYLOAD_RUNTIME_SCOPE_LEAD_SELECT = Object.freeze({
  tenant: true,
  campus: true,
  campaign: true,
} as const)
/** Minimal owner fields for shadow-only campus snapshots. */
export const PAYLOAD_RUNTIME_SCOPE_CAMPUS_SELECT = Object.freeze({ tenant: true } as const)
/** Minimal owner fields for shadow-only classroom snapshots. */
export const PAYLOAD_RUNTIME_SCOPE_CLASSROOM_SELECT = Object.freeze({
  tenant: true,
  campus: true,
} as const)

const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const RUNNER_MAX_RECORDS = 10_000
const MAX_IDS_PER_QUERY = 1_000
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const RESOURCE_TYPES: readonly MultiEntityRuntimeResourceType[] = [
  'course_run',
  'enrollment',
  'campaign',
  'lead',
  'campus',
  'classroom',
  'media',
]

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
  readonly targetTenantId: string
  readonly context: MultiEntityRuntimeScopeContext
  readonly topology: MultiEntityTopology
  readonly resolutionsByKey: ReadonlyMap<string, ReviewedRuntimeScopeResourceResolution>
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
}

/**
 * Builds a bounded, read-only snapshot from the current request. It has no
 * registration side effect and does not call any mutation-capable Payload API.
 */
export function createPayloadRuntimeScopeSnapshotLoader(
  options: PayloadRuntimeScopeSnapshotLoaderOptions
): () => Promise<MultiEntityRuntimeScopeShadowSnapshot> {
  const configuration = validateConfiguration(options)
  return () => loadPayloadRuntimeScopeSnapshot(configuration)
}

async function loadPayloadRuntimeScopeSnapshot(
  configuration: Configuration
): Promise<MultiEntityRuntimeScopeShadowSnapshot> {
  const recordsByKey = new Map<string, MultiEntityRuntimeScopeShadowRecord>()
  const courseRunOwners = new Map<string, MultiEntityRuntimeScopeShadowRecord>()
  const campaignOwners = new Map<string, MultiEntityRuntimeScopeShadowRecord>()

  for (const resourceType of RESOURCE_TYPES) {
    // Media has no tenant-safe owner source. Do not fabricate a legacy
    // decision from its current ACL or emit it as entity-scoped evidence.
    if (resourceType === 'media') continue
    const resolutions = resolutionsFor(configuration.resolutionsByKey, resourceType)
    const documents = await readDocuments(configuration, resourceType, resolutions)
    const documentById = new Map(documents.map((document) => [recordId(document.id)!, document]))

    for (const resolution of resolutions) {
      const source = documentById.get(resolution.resourceId)
      const legacyAllowed = source !== undefined
      const resource = source
        ? projectOwner(configuration, resolution, source, courseRunOwners, campaignOwners)
        : reviewedOwner(resolution)
      const record = Object.freeze({
        context: configuration.context,
        resourceType,
        resourceId: resolution.resourceId,
        resource,
        legacyAllowed,
      })
      recordsByKey.set(resolutionKey(resourceType, resolution.resourceId), record)
      if (resourceType === 'course_run' && resource !== null) {
        courseRunOwners.set(resolution.resourceId, record)
      }
      if (resourceType === 'campaign' && resource !== null) {
        campaignOwners.set(resolution.resourceId, record)
      }
    }
  }

  return Object.freeze({
    records: Object.freeze(
      Array.from(recordsByKey.values()).sort((left, right) =>
        resolutionKey(left.resourceType, left.resourceId).localeCompare(
          resolutionKey(right.resourceType, right.resourceId)
        )
      )
    ),
  })
}

async function readDocuments(
  configuration: Configuration,
  resourceType: MultiEntityRuntimeResourceType,
  resolutions: readonly ReviewedRuntimeScopeResourceResolution[]
): Promise<readonly Readonly<Record<string, unknown>>[]> {
  if (resolutions.length === 0) return Object.freeze([])

  const documents: Readonly<Record<string, unknown>>[] = []
  for (const chunk of chunkResolutions(resolutions)) {
    documents.push(...(await readDocumentChunk(configuration, resourceType, chunk)))
  }
  return Object.freeze(documents)
}

async function readDocumentChunk(
  configuration: Configuration,
  resourceType: MultiEntityRuntimeResourceType,
  resolutions: readonly ReviewedRuntimeScopeResourceResolution[]
): Promise<readonly Readonly<Record<string, unknown>>[]> {
  const collection = collectionFor(resourceType)
  const ids = resolutions.map((resolution) => resolution.resourceId)
  const documents: Readonly<Record<string, unknown>>[] = []
  const seenIds = new Set<string>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1

  while (true) {
    if (pageNumber > configuration.maxPages) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    let response: unknown
    try {
      response = await configuration.req.payload.find({
        collection,
        where: whereFor(resourceType, configuration.targetTenantId, ids),
        page: pageNumber,
        limit: configuration.pageSize,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req: configuration.req,
        select: selectFor(resourceType),
        showHiddenFields: false,
        trash: false,
      } as never)
    } catch {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_READ_FAILED')
    }

    const page = normalizePage(response, pageNumber, configuration.pageSize)
    if (page.totalPages > configuration.maxPages) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    if (page.totalDocs > configuration.maxRecords) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_RECORD_LIMIT_EXCEEDED')
    }
    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGINATION_CHANGED')
    }

    for (const document of page.docs) {
      const id = recordId(document.id)
      if (!id || !ids.includes(id)) {
        throw loaderError('RUNTIME_SCOPE_PAYLOAD_UNEXPECTED_RECORD')
      }
      if (seenIds.has(id)) throw loaderError('RUNTIME_SCOPE_PAYLOAD_UNEXPECTED_RECORD')
      seenIds.add(id)
      documents.push(projectDocument(resourceType, document))
      if (documents.length > configuration.maxRecords) {
        throw loaderError('RUNTIME_SCOPE_PAYLOAD_RECORD_LIMIT_EXCEEDED')
      }
    }

    if (!page.hasNextPage) break
    pageNumber += 1
  }

  if (expectedTotalDocs === null || documents.length !== expectedTotalDocs) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGINATION_CHANGED')
  }
  return Object.freeze(documents)
}

function projectOwner(
  configuration: Configuration,
  resolution: ReviewedRuntimeScopeResourceResolution,
  source: Readonly<Record<string, unknown>>,
  courseRunOwners: ReadonlyMap<string, MultiEntityRuntimeScopeShadowRecord>,
  campaignOwners: ReadonlyMap<string, MultiEntityRuntimeScopeShadowRecord>
) {
  if (resolution.resourceType === 'media') {
    // No tenant/entity field exists in the active Media schema. Do not guess.
    return null
  }

  if (
    resolution.resourceType === 'course_run' ||
    resolution.resourceType === 'campaign' ||
    resolution.resourceType === 'lead' ||
    resolution.resourceType === 'campus' ||
    resolution.resourceType === 'classroom'
  ) {
    assertTenant(source.tenant, configuration.targetTenantId)
  }
  if (resolution.resourceType === 'campus') {
    if (resolution.resourceId !== resolution.campusId) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_CAMPUS_RELATION_INVALID')
    }
  }
  if (resolution.resourceType === 'classroom') {
    if (relationshipId(source.campus) !== resolution.campusId) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_CLASSROOM_RELATION_INVALID')
    }
  }
  if (resolution.resourceType === 'course_run') {
    if (relationshipId(source.campus) !== resolution.campusId) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_ENROLLMENT_RELATION_INVALID')
    }
  }
  if (resolution.resourceType === 'enrollment') {
    const courseRunId = relationshipId(source.course_run)
    const courseRunRecord = courseRunId ? courseRunOwners.get(courseRunId) : undefined
    if (
      !courseRunId ||
      courseRunId !== resolution.courseRunId ||
      !courseRunRecord?.resource ||
      courseRunRecord.resource.legalEntityId !== resolution.legalEntityId ||
      courseRunRecord.resource.campusId !== resolution.campusId
    ) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_ENROLLMENT_RELATION_INVALID')
    }
  }
  if (resolution.resourceType === 'lead') {
    if (relationshipId(source.campus) !== resolution.campusId) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_LEAD_RELATION_INVALID')
    }
    const campaignId = relationshipId(source.campaign)
    if (campaignId) {
      const campaignRecord = campaignOwners.get(campaignId)
      if (
        !resolution.campaignId ||
        campaignId !== resolution.campaignId ||
        !campaignRecord?.resource ||
        campaignRecord.resource.tenantId !== configuration.targetTenantId ||
        campaignRecord.resource.legalEntityId !== resolution.legalEntityId ||
        campaignRecord.resource.campusId !== resolution.campusId
      ) {
        throw loaderError('RUNTIME_SCOPE_PAYLOAD_LEAD_RELATION_INVALID')
      }
    }
  }

  return Object.freeze({
    resourceType: resolution.resourceType,
    resourceId: resolution.resourceId,
    tenantId: configuration.targetTenantId,
    legalEntityId: resolution.legalEntityId,
    campusId: resolution.campusId,
  })
}

/**
 * A reviewed, validated resolution is evidence for the proposed owner even
 * when current effective access does not return the record. This preserves a
 * would-grant observation instead of conflating legacy visibility with future
 * ownership. Media is excluded because it has no tenant-safe owner source.
 */
function reviewedOwner(resolution: ReviewedRuntimeScopeResourceResolution) {
  if (resolution.resourceType === 'media') return null
  return Object.freeze({
    resourceType: resolution.resourceType,
    resourceId: resolution.resourceId,
    tenantId: resolution.tenantId,
    legalEntityId: resolution.legalEntityId,
    campusId: resolution.campusId,
  })
}

function validateConfiguration(options: PayloadRuntimeScopeSnapshotLoaderOptions): Configuration {
  if (!validPayloadRequest(options?.req) || !validIdentifier(options.targetTenantId)) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION')
  }
  if (!hasCurrentTenantScopedUser(options.req, options.targetTenantId)) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_REQUEST_SCOPE_MISMATCH')
  }
  if (
    !validContext(options.context) ||
    options.context.tenantId !== options.targetTenantId ||
    !REVIEW_REFERENCE_PATTERN.test(options.context.reviewReference)
  ) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_CONTEXT_INVALID')
  }
  if (!Array.isArray(options.reviewedResourceResolutions)) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION')
  }

  const maxRecords = Math.min(
    limit(options.maxRecords, DEFAULT_MAX_RECORDS, HARD_MAX_RECORDS),
    RUNNER_MAX_RECORDS
  )
  if (options.reviewedResourceResolutions.length > maxRecords) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_RECORD_LIMIT_EXCEEDED')
  }
  if (!validTopology(options.topology, options.targetTenantId)) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION')
  }
  if (!contextHasValidatedTopologyBinding(options.context, options.topology)) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_CONTEXT_INVALID')
  }

  const resolutionsByKey = new Map<string, ReviewedRuntimeScopeResourceResolution>()
  for (const resolution of options.reviewedResourceResolutions) {
    if (isRecord(resolution) && resolution.resourceType === 'media') {
      // The active Media collection has no tenant-safe ownership source.
      // Refuse the request rather than silently dropping coverage or deriving
      // a legacy decision from its current ACL.
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_UNSUPPORTED_RESOURCE')
    }
    if (!validResolution(resolution, options.targetTenantId)) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_RESOLUTION_INVALID')
    }
    if (!resolutionHasValidatedTopologyBinding(resolution, options.topology)) {
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_RESOLUTION_INVALID')
    }
    const key = resolutionKey(resolution.resourceType, resolution.resourceId)
    if (resolutionsByKey.has(key)) throw loaderError('RUNTIME_SCOPE_PAYLOAD_RESOLUTION_DUPLICATE')
    resolutionsByKey.set(key, Object.freeze({ ...resolution }))
  }

  return {
    req: options.req,
    targetTenantId: options.targetTenantId,
    context: Object.freeze({
      tenantId: options.context.tenantId,
      legalEntityId: options.context.legalEntityId,
      campusId: options.context.campusId,
    }),
    topology: options.topology,
    resolutionsByKey,
    pageSize: limit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE),
    maxPages: limit(options.maxPages, DEFAULT_MAX_PAGES, HARD_MAX_PAGES),
    maxRecords,
  }
}

function validResolution(
  value: unknown,
  targetTenantId: string
): value is ReviewedRuntimeScopeResourceResolution {
  if (!isRecord(value) || !isResourceType(value.resourceType)) return false
  if (
    !hasOnlyKeys(value, [
      'resourceType',
      'resourceId',
      'tenantId',
      'legalEntityId',
      'campusId',
      'status',
      'reviewReference',
      'courseRunId',
      'campaignId',
    ])
  ) {
    return false
  }
  return (
    validIdentifier(value.resourceId) &&
    value.tenantId === targetTenantId &&
    validIdentifier(value.legalEntityId) &&
    validIdentifier(value.campusId) &&
    value.status === 'validated' &&
    typeof value.reviewReference === 'string' &&
    REVIEW_REFERENCE_PATTERN.test(value.reviewReference) &&
    (value.resourceType !== 'enrollment' || validIdentifier(value.courseRunId)) &&
    (value.resourceType === 'enrollment' || value.courseRunId === undefined) &&
    (value.resourceType !== 'campus' || value.resourceId === value.campusId) &&
    (value.resourceType !== 'lead' ||
      value.campaignId === undefined ||
      validIdentifier(value.campaignId)) &&
    (value.resourceType === 'lead' || value.campaignId === undefined)
  )
}

function validContext(value: unknown): value is ReviewedRuntimeScopeContext {
  return (
    isRecord(value) &&
    hasOnlyKeys(value, ['tenantId', 'legalEntityId', 'campusId', 'reviewReference']) &&
    validIdentifier(value.tenantId) &&
    validIdentifier(value.legalEntityId) &&
    validIdentifier(value.campusId) &&
    typeof value.reviewReference === 'string'
  )
}

function hasCurrentTenantScopedUser(req: PayloadRequest, targetTenantId: string): boolean {
  const user = req.user
  if (!isRecord(user) || user.role === 'superadmin' || typeof user.role !== 'string') return false
  return relationshipId(user.tenant) === targetTenantId
}

function validTopology(value: unknown, targetTenantId: string): value is MultiEntityTopology {
  if (!isRecord(value)) return false
  const topology = value as Partial<MultiEntityTopology>
  const hasValidShape =
    Array.isArray(topology.legalEntities) &&
    Array.isArray(topology.campuses) &&
    Array.isArray(topology.campusBindings) &&
    Array.isArray(topology.staffAssignments) &&
    Array.isArray(topology.accountingConnections) &&
    topology.legalEntities.every(
      (entity) =>
        isRecord(entity) &&
        validIdentifier(entity.id) &&
        entity.tenantId === targetTenantId &&
        (entity.status === 'validated' ||
          entity.status === 'proposed' ||
          entity.status === 'inactive')
    ) &&
    topology.campuses.every(
      (campus) =>
        isRecord(campus) && validIdentifier(campus.id) && campus.tenantId === targetTenantId
    ) &&
    topology.campusBindings.every(
      (binding) =>
        isRecord(binding) &&
        validIdentifier(binding.id) &&
        binding.tenantId === targetTenantId &&
        validIdentifier(binding.legalEntityId) &&
        validIdentifier(binding.campusId) &&
        (binding.status === 'validated' ||
          binding.status === 'proposed' ||
          binding.status === 'inactive')
    )
  if (!hasValidShape) return false

  try {
    return validateMultiEntityTopology(topology as MultiEntityTopology).length === 0
  } catch {
    return false
  }
}

function contextHasValidatedTopologyBinding(
  context: ReviewedRuntimeScopeContext,
  topology: MultiEntityTopology
): boolean {
  const entity = topology.legalEntities.find((candidate) => candidate.id === context.legalEntityId)
  const campus = topology.campuses.find((candidate) => candidate.id === context.campusId)
  const bindings = topology.campusBindings.filter(
    (binding) =>
      binding.campusId === context.campusId &&
      binding.legalEntityId === context.legalEntityId &&
      binding.status === 'validated'
  )

  return (
    entity?.tenantId === context.tenantId &&
    entity.status === 'validated' &&
    campus?.tenantId === context.tenantId &&
    bindings.length === 1
  )
}

function resolutionHasValidatedTopologyBinding(
  resolution: ReviewedRuntimeScopeResourceResolution,
  topology: MultiEntityTopology
): boolean {
  const entity = topology.legalEntities.find(
    (candidate) => candidate.id === resolution.legalEntityId
  )
  const campus = topology.campuses.find((candidate) => candidate.id === resolution.campusId)
  const bindings = topology.campusBindings.filter(
    (binding) =>
      binding.legalEntityId === resolution.legalEntityId &&
      binding.campusId === resolution.campusId &&
      binding.status === 'validated'
  )
  return (
    entity?.tenantId === resolution.tenantId &&
    entity.status === 'validated' &&
    campus?.tenantId === resolution.tenantId &&
    bindings.length === 1
  )
}

function resolutionsFor(
  resolutionsByKey: ReadonlyMap<string, ReviewedRuntimeScopeResourceResolution>,
  resourceType: MultiEntityRuntimeResourceType
): readonly ReviewedRuntimeScopeResourceResolution[] {
  return Array.from(resolutionsByKey.values()).filter(
    (resolution) => resolution.resourceType === resourceType
  )
}

function chunkResolutions(
  resolutions: readonly ReviewedRuntimeScopeResourceResolution[]
): readonly (readonly ReviewedRuntimeScopeResourceResolution[])[] {
  const chunks: ReviewedRuntimeScopeResourceResolution[][] = []
  for (let index = 0; index < resolutions.length; index += MAX_IDS_PER_QUERY) {
    chunks.push(resolutions.slice(index, index + MAX_IDS_PER_QUERY))
  }
  return chunks
}

function collectionFor(
  resourceType: MultiEntityRuntimeResourceType
): 'course-runs' | 'enrollments' | 'campaigns' | 'leads' | 'campuses' | 'classrooms' | 'media' {
  switch (resourceType) {
    case 'course_run':
      return 'course-runs'
    case 'enrollment':
      return 'enrollments'
    case 'campaign':
      return 'campaigns'
    case 'lead':
      return 'leads'
    case 'campus':
      return 'campuses'
    case 'classroom':
      return 'classrooms'
    case 'media':
      return 'media'
  }
}

function whereFor(
  resourceType: MultiEntityRuntimeResourceType,
  tenantId: string,
  ids: readonly string[]
) {
  const idsWhere = { id: { in: ids } }
  return resourceType === 'course_run' ||
    resourceType === 'campaign' ||
    resourceType === 'lead' ||
    resourceType === 'campus' ||
    resourceType === 'classroom'
    ? { and: [{ tenant: { equals: tenantId } }, idsWhere] }
    : resourceType === 'enrollment'
      ? { and: [{ 'course_run.tenant': { equals: tenantId } }, idsWhere] }
      : idsWhere
}

function selectFor(resourceType: MultiEntityRuntimeResourceType) {
  switch (resourceType) {
    case 'course_run':
      return PAYLOAD_RUNTIME_SCOPE_COURSE_RUN_SELECT
    case 'enrollment':
      return PAYLOAD_RUNTIME_SCOPE_ENROLLMENT_SELECT
    case 'campaign':
      return PAYLOAD_RUNTIME_SCOPE_CAMPAIGN_SELECT
    case 'lead':
      return PAYLOAD_RUNTIME_SCOPE_LEAD_SELECT
    case 'campus':
      return PAYLOAD_RUNTIME_SCOPE_CAMPUS_SELECT
    case 'classroom':
      return PAYLOAD_RUNTIME_SCOPE_CLASSROOM_SELECT
    case 'media':
      throw loaderError('RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION')
  }
}

function projectDocument(
  resourceType: MultiEntityRuntimeResourceType,
  source: Readonly<Record<string, unknown>>
): Readonly<Record<string, unknown>> {
  const fields = ['id', ...Object.keys(selectFor(resourceType))]
  const result: Record<string, unknown> = {}
  for (const field of fields) {
    if (Object.prototype.hasOwnProperty.call(source, field)) result[field] = source[field]
  }
  return Object.freeze(result)
}

function normalizePage(value: unknown, requestedPage: number, limitValue: number): PayloadPage {
  if (!isRecord(value)) throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGE_INVALID')
  const page = value as Partial<PayloadPage>
  if (
    !Array.isArray(page.docs) ||
    !page.docs.every(isRecord) ||
    page.docs.length > limitValue ||
    !positiveInteger(page.page) ||
    page.page !== requestedPage ||
    !nonNegativeInteger(page.totalDocs) ||
    !nonNegativeInteger(page.totalPages) ||
    typeof page.hasNextPage !== 'boolean' ||
    !validNextPage(page.nextPage)
  ) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGE_INVALID')
  }
  const validEmpty = page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmpty =
    page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / limitValue)
  const expectedHasNext = page.totalDocs > 0 && requestedPage < page.totalPages
  if (
    (!validEmpty && !validNonEmpty) ||
    page.hasNextPage !== expectedHasNext ||
    (expectedHasNext && page.nextPage !== requestedPage + 1) ||
    (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined)
  ) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_PAGE_INVALID')
  }
  return page as PayloadPage
}

function assertTenant(value: unknown, targetTenantId: string): void {
  if (relationshipId(value) !== targetTenantId) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
  }
}

function relationshipId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (typeof value === 'string' && validIdentifier(value)) return value
  if (isRecord(value) && Object.prototype.hasOwnProperty.call(value, 'id'))
    return relationshipId(value.id)
  return null
}

function recordId(value: unknown): string | null {
  return relationshipId(value)
}

function resolutionKey(resourceType: MultiEntityRuntimeResourceType, resourceId: string): string {
  return `${resourceType}:${resourceId}`
}

function validPayloadRequest(value: unknown): value is PayloadRequest {
  return Boolean(
    isRecord(value) && isRecord(value.payload) && typeof value.payload.find === 'function'
  )
}

function isResourceType(value: unknown): value is MultiEntityRuntimeResourceType {
  return RESOURCE_TYPES.includes(value as MultiEntityRuntimeResourceType)
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' && value.length > 0 && value.length <= 255 && value.trim() === value
  )
}

function limit(value: number | undefined, fallback: number, maximum: number): number {
  const result = value ?? fallback
  if (!Number.isSafeInteger(result) || result < 1 || result > maximum) {
    throw loaderError('RUNTIME_SCOPE_PAYLOAD_INVALID_CONFIGURATION')
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
  code: PayloadRuntimeScopeSnapshotLoaderErrorCode
): PayloadRuntimeScopeSnapshotLoaderError {
  return new PayloadRuntimeScopeSnapshotLoaderError(code)
}
