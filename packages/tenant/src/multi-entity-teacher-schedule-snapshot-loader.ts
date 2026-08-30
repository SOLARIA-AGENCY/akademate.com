import type { PayloadShadowRelationship } from './multi-entity-payload-projection'
import type {
  PayloadTeacherScheduleCourseRunRecord,
  PayloadTeacherScheduleSnapshot,
} from './multi-entity-teacher-schedule-projection'
import type { MultiEntityTopology } from './multi-entity-topology'

export interface TeacherScheduleSnapshotPageRequest {
  readonly tenantId: string
  readonly page: number
  readonly limit: number
  readonly depth: 0
  readonly overrideAccess: false
  readonly accessMode: 'current_effective_access'
}

export interface TeacherScheduleSnapshotPage {
  readonly docs: readonly PayloadTeacherScheduleCourseRunRecord[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

export interface ReviewedCourseRunEntityResolution {
  readonly courseRunId: string
  readonly legalEntityId: string
  readonly reviewReference: string
}

export interface TeacherScheduleSnapshotLoaderOptions {
  readonly targetTenantId: string
  readonly topology: MultiEntityTopology
  readonly reviewedEntityResolutions: readonly ReviewedCourseRunEntityResolution[]
  readonly readCourseRunsPage: (
    request: TeacherScheduleSnapshotPageRequest
  ) => Promise<TeacherScheduleSnapshotPage>
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type TeacherScheduleSnapshotLoaderErrorCode =
  | 'TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION'
  | 'TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_INVALID'
  | 'TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_DUPLICATE'
  | 'TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_ENTITY_INVALID'
  | 'TEACHER_SCHEDULE_SNAPSHOT_READ_FAILED'
  | 'TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID'
  | 'TEACHER_SCHEDULE_SNAPSHOT_PAGINATION_CHANGED'
  | 'TEACHER_SCHEDULE_SNAPSHOT_PAGE_LIMIT_EXCEEDED'
  | 'TEACHER_SCHEDULE_SNAPSHOT_RECORD_LIMIT_EXCEEDED'
  | 'TEACHER_SCHEDULE_SNAPSHOT_TENANT_BOUNDARY_VIOLATION'
  | 'TEACHER_SCHEDULE_SNAPSHOT_DUPLICATE_COURSE_RUN'
  | 'TEACHER_SCHEDULE_SNAPSHOT_ENTITY_RELATION_INVALID'
  | 'TEACHER_SCHEDULE_SNAPSHOT_ENTITY_RESOLUTION_CONFLICT'

export class TeacherScheduleSnapshotLoaderError extends Error {
  constructor(readonly code: TeacherScheduleSnapshotLoaderErrorCode) {
    super('Teacher schedule snapshot loading failed.')
    this.name = 'TeacherScheduleSnapshotLoaderError'
  }
}

const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/

/**
 * Builds a loader compatible with the staging-only shadow runner. The caller
 * supplies the read function; this module does not import Payload, register a
 * job, bypass access control or perform writes.
 */
export function createTeacherScheduleSnapshotLoader(
  options: TeacherScheduleSnapshotLoaderOptions
): () => Promise<PayloadTeacherScheduleSnapshot> {
  return () => loadTeacherScheduleSnapshot(options)
}

/**
 * Reads a stable, bounded snapshot sequentially. Every returned record must
 * remain inside the requested tenant. Legal entity enrichment is accepted only
 * from the record itself or a unique reviewed resolution.
 */
export async function loadTeacherScheduleSnapshot(
  options: TeacherScheduleSnapshotLoaderOptions
): Promise<PayloadTeacherScheduleSnapshot> {
  const configuration = validateConfiguration(options)
  const resolutions = validateResolutions(
    options.reviewedEntityResolutions,
    options.targetTenantId,
    options.topology
  )
  const records: PayloadTeacherScheduleCourseRunRecord[] = []
  const seenCourseRunIds = new Set<string>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1

  while (true) {
    if (pageNumber > configuration.maxPages) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_LIMIT_EXCEEDED')
    }

    let page: TeacherScheduleSnapshotPage
    try {
      page = await options.readCourseRunsPage(
        Object.freeze({
          tenantId: options.targetTenantId,
          page: pageNumber,
          limit: configuration.pageSize,
          depth: 0,
          overrideAccess: false,
          accessMode: 'current_effective_access',
        })
      )
    } catch {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_READ_FAILED')
    }

    validatePage(page, pageNumber, configuration.pageSize)
    if (page.totalPages > configuration.maxPages) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_LIMIT_EXCEEDED')
    }
    if (page.totalDocs > configuration.maxRecords) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RECORD_LIMIT_EXCEEDED')
    }

    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGINATION_CHANGED')
    }

    for (const source of page.docs) {
      const id = relationshipId(source.id as PayloadShadowRelationship)
      const tenant = relationshipId(source.tenant)
      if (id.kind !== 'valid') {
        throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
      }
      if (tenant.kind !== 'valid' || tenant.id !== options.targetTenantId) {
        throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_TENANT_BOUNDARY_VIOLATION')
      }
      if (seenCourseRunIds.has(id.id)) {
        throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_DUPLICATE_COURSE_RUN')
      }
      seenCourseRunIds.add(id.id)

      records.push(cloneAndEnrichRecord(source, id.id, resolutions.get(id.id)))
      if (records.length > configuration.maxRecords) {
        throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RECORD_LIMIT_EXCEEDED')
      }
    }

    if (!page.hasNextPage) break
    pageNumber += 1
  }

  if (expectedTotalDocs === null || records.length !== expectedTotalDocs) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGINATION_CHANGED')
  }

  return Object.freeze({
    targetTenantId: options.targetTenantId,
    topology: options.topology,
    courseRuns: Object.freeze(records),
    maxCourseRuns: configuration.maxRecords,
  })
}

function validateConfiguration(options: TeacherScheduleSnapshotLoaderOptions): {
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
} {
  if (
    !validIdentifier(options.targetTenantId) ||
    typeof options.readCourseRunsPage !== 'function' ||
    !validTopologyShape(options.topology)
  ) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION')
  }

  return {
    pageSize: validatedLimit(
      options.pageSize,
      DEFAULT_PAGE_SIZE,
      HARD_MAX_PAGE_SIZE,
      'TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION'
    ),
    maxPages: validatedLimit(
      options.maxPages,
      DEFAULT_MAX_PAGES,
      HARD_MAX_PAGES,
      'TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION'
    ),
    maxRecords: validatedLimit(
      options.maxRecords,
      DEFAULT_MAX_RECORDS,
      HARD_MAX_RECORDS,
      'TEACHER_SCHEDULE_SNAPSHOT_INVALID_CONFIGURATION'
    ),
  }
}

function validTopologyShape(value: unknown): value is MultiEntityTopology {
  if (!value || typeof value !== 'object') return false
  const topology = value as Partial<MultiEntityTopology>
  return (
    Array.isArray(topology.legalEntities) &&
    Array.isArray(topology.campuses) &&
    Array.isArray(topology.campusBindings) &&
    Array.isArray(topology.staffAssignments) &&
    Array.isArray(topology.accountingConnections)
  )
}

function validateResolutions(
  resolutions: readonly ReviewedCourseRunEntityResolution[],
  targetTenantId: string,
  topology: MultiEntityTopology
): ReadonlyMap<string, ReviewedCourseRunEntityResolution> {
  if (!Array.isArray(resolutions)) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_INVALID')
  }
  const entityById = new Map(topology.legalEntities.map((entity) => [entity.id, entity]))
  const result = new Map<string, ReviewedCourseRunEntityResolution>()

  for (const resolution of resolutions) {
    if (
      !validIdentifier(resolution.courseRunId) ||
      !validIdentifier(resolution.legalEntityId) ||
      !REVIEW_REFERENCE_PATTERN.test(resolution.reviewReference)
    ) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_INVALID')
    }
    if (result.has(resolution.courseRunId)) {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_DUPLICATE')
    }
    const entity = entityById.get(resolution.legalEntityId)
    if (!entity || entity.tenantId !== targetTenantId || entity.status === 'inactive') {
      throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_RESOLUTION_ENTITY_INVALID')
    }
    result.set(resolution.courseRunId, Object.freeze({ ...resolution }))
  }

  return result
}

function validatePage(
  page: TeacherScheduleSnapshotPage,
  requestedPage: number,
  limit: number
): void {
  if (
    !page ||
    !Array.isArray(page.docs) ||
    !Number.isSafeInteger(page.page) ||
    page.page !== requestedPage ||
    !Number.isSafeInteger(page.totalDocs) ||
    page.totalDocs < 0 ||
    !Number.isSafeInteger(page.totalPages) ||
    page.totalPages < 0 ||
    typeof page.hasNextPage !== 'boolean' ||
    page.docs.length > limit
  ) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
  }

  const validEmptyTotalPages =
    page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmptyTotalPages =
    page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / limit)
  if (!validEmptyTotalPages && !validNonEmptyTotalPages) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
  }

  const isLastPage = page.totalDocs === 0 || requestedPage === page.totalPages
  const expectedHasNext = !isLastPage
  if (page.hasNextPage !== expectedHasNext) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
  }
  if (expectedHasNext && page.nextPage !== requestedPage + 1) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
  }
  if (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_PAGE_INVALID')
  }
}

function cloneAndEnrichRecord(
  source: PayloadTeacherScheduleCourseRunRecord,
  courseRunId: string,
  resolution: ReviewedCourseRunEntityResolution | undefined
): PayloadTeacherScheduleCourseRunRecord {
  const existingEntity = relationshipId(source.legalEntity)
  if (existingEntity.kind === 'invalid') {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_ENTITY_RELATION_INVALID')
  }
  if (
    existingEntity.kind === 'valid' &&
    resolution &&
    existingEntity.id !== resolution.legalEntityId
  ) {
    throw loaderError('TEACHER_SCHEDULE_SNAPSHOT_ENTITY_RESOLUTION_CONFLICT')
  }
  const legalEntityId =
    existingEntity.kind === 'valid' ? existingEntity.id : resolution?.legalEntityId

  return Object.freeze({
    id: courseRunId,
    tenant: cloneRelationship(source.tenant),
    ...(legalEntityId === undefined ? {} : { legalEntity: legalEntityId }),
    ...(source.campus === undefined ? {} : { campus: cloneRelationship(source.campus) }),
    ...(source.instructor === undefined
      ? {}
      : { instructor: cloneRelationship(source.instructor) }),
    ...(source.instructors === undefined
      ? {}
      : { instructors: cloneInstructorCollection(source.instructors) }),
    start_date: cloneScalar(source.start_date),
    end_date: cloneScalar(source.end_date),
    schedule_days: cloneArrayOrScalar(source.schedule_days),
    schedule_time_start: cloneScalar(source.schedule_time_start),
    schedule_time_end: cloneScalar(source.schedule_time_end),
    planning_status: cloneScalar(source.planning_status),
  })
}

function cloneRelationship(value: PayloadShadowRelationship): PayloadShadowRelationship {
  if (typeof value !== 'object' || value === null) return value
  return Object.freeze(
    Object.prototype.hasOwnProperty.call(value, 'id') ? { id: cloneScalar(value.id) } : {}
  )
}

function cloneInstructorCollection(value: unknown): unknown {
  if (!Array.isArray(value)) return cloneArrayOrScalar(value)
  return Object.freeze(value.map((item) => cloneRelationship(item as PayloadShadowRelationship)))
}

function cloneArrayOrScalar(value: unknown): unknown {
  if (Array.isArray(value)) return Object.freeze(value.map(cloneScalar))
  return cloneScalar(value)
}

function cloneScalar(value: unknown): unknown {
  return typeof value === 'string' ||
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    value === null ||
    value === undefined
    ? value
    : Object.freeze({})
}

function validatedLimit(
  value: number | undefined,
  fallback: number,
  hardMaximum: number,
  code: TeacherScheduleSnapshotLoaderErrorCode
): number {
  const limit = value ?? fallback
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > hardMaximum) {
    throw loaderError(code)
  }
  return limit
}

type RelationshipResult =
  | { readonly kind: 'missing' }
  | { readonly kind: 'invalid' }
  | { readonly kind: 'valid'; readonly id: string }

function relationshipId(value: PayloadShadowRelationship): RelationshipResult {
  if (value === null || value === undefined) return { kind: 'missing' }
  if (typeof value === 'object') {
    if (!Object.prototype.hasOwnProperty.call(value, 'id')) return { kind: 'invalid' }
    return relationshipId(value.id as PayloadShadowRelationship)
  }
  if (typeof value === 'number') {
    return Number.isSafeInteger(value) && value >= 0
      ? { kind: 'valid', id: String(value) }
      : { kind: 'invalid' }
  }
  return validIdentifier(value) ? { kind: 'valid', id: value } : { kind: 'invalid' }
}

function validIdentifier(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.trim().length > 0 &&
    value.length <= 255 &&
    value.trim() === value
  )
}

function loaderError(
  code: TeacherScheduleSnapshotLoaderErrorCode
): TeacherScheduleSnapshotLoaderError {
  return new TeacherScheduleSnapshotLoaderError(code)
}
