import type { PayloadRequest } from 'payload'
import type {
  MultiEntityPublicProjectionInput,
  PublicProjectionCampus,
  PublicProjectionCampusBinding,
  PublicProjectionCourse,
  PublicProjectionCourseRun,
  PublicProjectionCycle,
  PublicProjectionLegalEntity,
  PublicProjectionRunStatus,
} from '../../../../packages/tenant/src/multi-entity-public-projection'

export const PAYLOAD_PUBLIC_PROJECTION_COURSE_SELECT = Object.freeze({
  tenant: true,
  slug: true,
  name: true,
  active: true,
  modality: true,
} as const)

export const PAYLOAD_PUBLIC_PROJECTION_CAMPUS_SELECT = Object.freeze({
  tenant: true,
  slug: true,
  name: true,
  city: true,
  active: true,
} as const)

export const PAYLOAD_PUBLIC_PROJECTION_CYCLE_SELECT = Object.freeze({
  tenant: true,
  slug: true,
  name: true,
  active: true,
  duration: true,
} as const)

export const PAYLOAD_PUBLIC_PROJECTION_RUN_SELECT = Object.freeze({
  tenant: true,
  course: true,
  cycle: true,
  campus: true,
  codigo: true,
  status: true,
  start_date: true,
} as const)

export interface ReviewedPublicCourseRunEntityResolution {
  readonly courseRunId: string
  readonly legalEntityId: string
  readonly reviewReference: string
}

export interface PayloadPublicProjectionReaderOptions {
  readonly req: PayloadRequest
  readonly targetTenantId: string
  readonly legalEntities: readonly PublicProjectionLegalEntity[]
  readonly campusBindings: readonly PublicProjectionCampusBinding[]
  readonly reviewedEntityResolutions: readonly ReviewedPublicCourseRunEntityResolution[]
  readonly pageSize?: number
  readonly maxPages?: number
  readonly maxRecords?: number
}

export type PayloadPublicProjectionReaderErrorCode =
  | 'PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION'
  | 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_INVALID'
  | 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_DUPLICATE'
  | 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_ENTITY_INVALID'
  | 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_MISSING'
  | 'PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_RECORD_MISSING'
  | 'PUBLIC_PROJECTION_PAYLOAD_READ_FAILED'
  | 'PUBLIC_PROJECTION_PAYLOAD_INVALID_RESPONSE'
  | 'PUBLIC_PROJECTION_PAYLOAD_PAGINATION_CHANGED'
  | 'PUBLIC_PROJECTION_PAYLOAD_PAGE_LIMIT_EXCEEDED'
  | 'PUBLIC_PROJECTION_PAYLOAD_RECORD_LIMIT_EXCEEDED'
  | 'PUBLIC_PROJECTION_PAYLOAD_TENANT_BOUNDARY_VIOLATION'
  | 'PUBLIC_PROJECTION_PAYLOAD_DUPLICATE_RECORD'
  | 'PUBLIC_PROJECTION_PAYLOAD_RELATION_INVALID'
  | 'PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID'

export class PayloadPublicProjectionReaderError extends Error {
  constructor(readonly code: PayloadPublicProjectionReaderErrorCode) {
    super('Public projection Payload reading failed.')
    this.name = 'PayloadPublicProjectionReaderError'
  }
}

type PublicCollection = 'courses' | 'cycles' | 'campuses' | 'course-runs'

interface PayloadPage {
  readonly docs: readonly Readonly<Record<string, unknown>>[]
  readonly page: number
  readonly totalDocs: number
  readonly totalPages: number
  readonly hasNextPage: boolean
  readonly nextPage?: number | null
}

const DEFAULT_PAGE_SIZE = 100
const HARD_MAX_PAGE_SIZE = 1_000
const DEFAULT_MAX_PAGES = 100
const HARD_MAX_PAGES = 1_000
const DEFAULT_MAX_RECORDS = 10_000
const HARD_MAX_RECORDS = 100_000
const REVIEW_REFERENCE_PATTERN = /^review:\/\/[A-Za-z0-9][A-Za-z0-9._:/-]{2,497}$/
const ENTITY_KEYS = new Set(['id', 'tenantId', 'status'])
const BINDING_KEYS = new Set(['id', 'tenantId', 'legalEntityId', 'campusId', 'status'])
const RESOLUTION_KEYS = new Set(['courseRunId', 'legalEntityId', 'reviewReference'])
const RUN_STATUSES = new Set<PublicProjectionRunStatus>([
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
])

export function createPayloadPublicProjectionInputLoader(
  options: PayloadPublicProjectionReaderOptions
): () => Promise<MultiEntityPublicProjectionInput> {
  const configuration = validateConfiguration(options)
  const legalEntities = cloneLegalEntities(options.legalEntities)
  const campusBindings = cloneCampusBindings(options.campusBindings)
  const resolutions = validateResolutions(
    options.reviewedEntityResolutions,
    options.targetTenantId,
    legalEntities
  )

  return async () => {
    let remainingRecords = configuration.maxRecords - legalEntities.length - campusBindings.length
    if (remainingRecords < 0) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
    }
    const coursesSource = await readCollection(
      options,
      configuration,
      'courses',
      PAYLOAD_PUBLIC_PROJECTION_COURSE_SELECT,
      activeWhere(options.targetTenantId),
      remainingRecords
    )
    remainingRecords -= coursesSource.length
    const cyclesSource = await readCollection(
      options,
      configuration,
      'cycles',
      PAYLOAD_PUBLIC_PROJECTION_CYCLE_SELECT,
      activeWhere(options.targetTenantId),
      remainingRecords
    )
    remainingRecords -= cyclesSource.length
    const campusesSource = await readCollection(
      options,
      configuration,
      'campuses',
      PAYLOAD_PUBLIC_PROJECTION_CAMPUS_SELECT,
      activeWhere(options.targetTenantId),
      remainingRecords
    )
    remainingRecords -= campusesSource.length
    const runsSource = await readCollection(
      options,
      configuration,
      'course-runs',
      PAYLOAD_PUBLIC_PROJECTION_RUN_SELECT,
      publicRunsWhere(options.targetTenantId),
      remainingRecords
    )

    const { courses, modalities } = projectCourses(coursesSource, options.targetTenantId)
    const { cycles, modalities: cycleModalities } = projectCycles(
      cyclesSource,
      options.targetTenantId
    )
    const campuses = projectCampuses(campusesSource, options.targetTenantId)
    const courseRuns = projectCourseRuns(
      runsSource,
      options.targetTenantId,
      resolutions,
      modalities,
      cycleModalities
    )

    return Object.freeze({
      targetTenantId: options.targetTenantId,
      legalEntities,
      campusBindings,
      courses,
      cycles,
      campuses,
      courseRuns,
      maxRecords: configuration.maxRecords,
    })
  }
}

async function readCollection(
  options: PayloadPublicProjectionReaderOptions,
  configuration: { readonly pageSize: number; readonly maxPages: number },
  collection: PublicCollection,
  select: Readonly<Record<string, true>>,
  where: Readonly<Record<string, unknown>>,
  recordLimit: number
): Promise<readonly Readonly<Record<string, unknown>>[]> {
  const docs: Readonly<Record<string, unknown>>[] = []
  const ids = new Set<string>()
  let expectedTotalDocs: number | null = null
  let expectedTotalPages: number | null = null
  let pageNumber = 1

  while (true) {
    if (pageNumber > configuration.maxPages) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    let response: unknown
    try {
      response = await options.req.payload.find({
        collection,
        where,
        page: pageNumber,
        limit: configuration.pageSize,
        pagination: true,
        sort: 'id',
        depth: 0,
        overrideAccess: false,
        req: options.req,
        select,
        showHiddenFields: false,
        trash: false,
      } as never)
    } catch {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_READ_FAILED')
    }

    const page = normalizePage(response, pageNumber, configuration.pageSize)
    if (page.totalPages > configuration.maxPages) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PAGE_LIMIT_EXCEEDED')
    }
    if (page.totalDocs > recordLimit) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
    }
    if (expectedTotalDocs === null) {
      expectedTotalDocs = page.totalDocs
      expectedTotalPages = page.totalPages
    } else if (page.totalDocs !== expectedTotalDocs || page.totalPages !== expectedTotalPages) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PAGINATION_CHANGED')
    }

    for (const doc of page.docs) {
      const id = relationshipId(doc.id)
      if (id === null) throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_RESPONSE')
      if (ids.has(id)) throw readerError('PUBLIC_PROJECTION_PAYLOAD_DUPLICATE_RECORD')
      ids.add(id)
      docs.push(doc)
      if (docs.length > recordLimit) {
        throw readerError('PUBLIC_PROJECTION_PAYLOAD_RECORD_LIMIT_EXCEEDED')
      }
    }

    if (!page.hasNextPage) break
    pageNumber += 1
  }

  if (expectedTotalDocs === null || docs.length !== expectedTotalDocs) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_PAGINATION_CHANGED')
  }
  return Object.freeze(docs)
}

function projectCourses(
  docs: readonly Readonly<Record<string, unknown>>[],
  targetTenantId: string
): {
  readonly courses: readonly PublicProjectionCourse[]
  readonly modalities: ReadonlyMap<string, 'presential' | 'online' | 'hybrid'>
} {
  const courses: PublicProjectionCourse[] = []
  const modalities = new Map<string, 'presential' | 'online' | 'hybrid'>()
  for (const doc of docs) {
    const id = requiredRelationshipId(doc.id)
    assertTenant(doc.tenant, targetTenantId)
    const slug = publicString(doc.slug, 500)
    const title = publicString(doc.name, 500)
    const active = doc.active === true
    const modality = normalizeModality(doc.modality)
    if (!active || modality === null) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID')
    }
    courses.push(Object.freeze({ id, tenantId: targetTenantId, slug, title, active: true }))
    modalities.set(id, modality)
  }
  return { courses: Object.freeze(courses), modalities }
}

function projectCycles(
  docs: readonly Readonly<Record<string, unknown>>[],
  targetTenantId: string
): {
  readonly cycles: readonly PublicProjectionCycle[]
  readonly modalities: ReadonlyMap<string, 'presential' | 'online' | 'hybrid'>
} {
  const cycles: PublicProjectionCycle[] = []
  const modalities = new Map<string, 'presential' | 'online' | 'hybrid'>()
  for (const doc of docs) {
    const id = requiredRelationshipId(doc.id)
    assertTenant(doc.tenant, targetTenantId)
    const duration = isRecord(doc.duration) ? doc.duration : null
    const modality = normalizeCycleModality(duration?.modality)
    if (doc.active !== true || modality === null) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID')
    }
    cycles.push(
      Object.freeze({
        id,
        tenantId: targetTenantId,
        slug: publicString(doc.slug, 500),
        title: publicString(doc.name, 500),
        active: true,
      })
    )
    modalities.set(id, modality)
  }
  return { cycles: Object.freeze(cycles), modalities }
}

function projectCampuses(
  docs: readonly Readonly<Record<string, unknown>>[],
  targetTenantId: string
): readonly PublicProjectionCampus[] {
  return Object.freeze(
    docs.map((doc) => {
      const id = requiredRelationshipId(doc.id)
      assertTenant(doc.tenant, targetTenantId)
      if (doc.active !== true) {
        throw readerError('PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID')
      }
      return Object.freeze({
        id,
        tenantId: targetTenantId,
        slug: publicString(doc.slug, 500),
        name: publicString(doc.name, 200),
        city: doc.city === null || doc.city === undefined ? null : publicString(doc.city, 100),
        active: true,
      })
    })
  )
}

function projectCourseRuns(
  docs: readonly Readonly<Record<string, unknown>>[],
  targetTenantId: string,
  resolutions: ReadonlyMap<string, ReviewedPublicCourseRunEntityResolution>,
  modalities: ReadonlyMap<string, 'presential' | 'online' | 'hybrid'>,
  cycleModalities: ReadonlyMap<string, 'presential' | 'online' | 'hybrid'>
): readonly PublicProjectionCourseRun[] {
  const seenResolutions = new Set<string>()
  const result = docs.map((doc) => {
    const id = requiredRelationshipId(doc.id)
    assertTenant(doc.tenant, targetTenantId)
    const courseId = relationshipId(doc.course)
    const cycleId = relationshipId(doc.cycle)
    if ((courseId === null) === (cycleId === null)) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RELATION_INVALID')
    }
    const resolution = resolutions.get(id)
    if (!resolution) throw readerError('PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_MISSING')
    seenResolutions.add(id)
    const campusId = nullableRelationshipId(doc.campus)
    const catalogModality =
      courseId === null ? cycleModalities.get(cycleId!) : modalities.get(courseId)
    if (!catalogModality) throw readerError('PUBLIC_PROJECTION_PAYLOAD_RELATION_INVALID')
    if (
      typeof doc.status !== 'string' ||
      !RUN_STATUSES.has(doc.status as PublicProjectionRunStatus)
    ) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID')
    }
    return Object.freeze({
      id,
      tenantId: targetTenantId,
      legalEntityId: resolution.legalEntityId,
      courseId,
      cycleId,
      campusId,
      publicSlug: publicString(doc.codigo, 255),
      status: doc.status as PublicProjectionRunStatus,
      startDate:
        doc.start_date === null || doc.start_date === undefined
          ? null
          : publicString(doc.start_date, 64),
      modality: campusId === null ? catalogModality : 'presential',
    })
  })

  if (seenResolutions.size !== resolutions.size) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_RECORD_MISSING')
  }
  return Object.freeze(result)
}

function validateConfiguration(options: PayloadPublicProjectionReaderOptions): {
  readonly pageSize: number
  readonly maxPages: number
  readonly maxRecords: number
} {
  if (
    !validPayloadRequest(options?.req) ||
    !validIdentifier(options.targetTenantId) ||
    !Array.isArray(options.legalEntities) ||
    !Array.isArray(options.campusBindings) ||
    !Array.isArray(options.reviewedEntityResolutions)
  ) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION')
  }
  return {
    pageSize: limit(options.pageSize, DEFAULT_PAGE_SIZE, HARD_MAX_PAGE_SIZE),
    maxPages: limit(options.maxPages, DEFAULT_MAX_PAGES, HARD_MAX_PAGES),
    maxRecords: limit(options.maxRecords, DEFAULT_MAX_RECORDS, HARD_MAX_RECORDS),
  }
}

function cloneLegalEntities(
  entities: readonly PublicProjectionLegalEntity[]
): readonly PublicProjectionLegalEntity[] {
  return Object.freeze(
    entities.map((entity) => {
      if (!entity || !exactKeys(entity, ENTITY_KEYS)) {
        throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION')
      }
      return Object.freeze({ id: entity.id, tenantId: entity.tenantId, status: entity.status })
    })
  )
}

function cloneCampusBindings(
  bindings: readonly PublicProjectionCampusBinding[]
): readonly PublicProjectionCampusBinding[] {
  return Object.freeze(
    bindings.map((binding) => {
      if (!binding || !exactKeys(binding, BINDING_KEYS)) {
        throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION')
      }
      return Object.freeze({
        id: binding.id,
        tenantId: binding.tenantId,
        legalEntityId: binding.legalEntityId,
        campusId: binding.campusId,
        status: binding.status,
      })
    })
  )
}

function validateResolutions(
  resolutions: readonly ReviewedPublicCourseRunEntityResolution[],
  targetTenantId: string,
  entities: readonly PublicProjectionLegalEntity[]
): ReadonlyMap<string, ReviewedPublicCourseRunEntityResolution> {
  const entityMap = new Map(entities.map((entity) => [entity.id, entity]))
  const result = new Map<string, ReviewedPublicCourseRunEntityResolution>()
  for (const resolution of resolutions) {
    if (
      !resolution ||
      !exactKeys(resolution, RESOLUTION_KEYS) ||
      !validIdentifier(resolution.courseRunId) ||
      !validIdentifier(resolution.legalEntityId) ||
      !REVIEW_REFERENCE_PATTERN.test(resolution.reviewReference)
    ) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_INVALID')
    }
    if (result.has(resolution.courseRunId)) {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_DUPLICATE')
    }
    const entity = entityMap.get(resolution.legalEntityId)
    if (!entity || entity.tenantId !== targetTenantId || entity.status !== 'validated') {
      throw readerError('PUBLIC_PROJECTION_PAYLOAD_RESOLUTION_ENTITY_INVALID')
    }
    result.set(resolution.courseRunId, Object.freeze({ ...resolution }))
  }
  return result
}

function normalizePage(value: unknown, requestedPage: number, limit: number): PayloadPage {
  if (!value || typeof value !== 'object') {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_RESPONSE')
  }
  const page = value as Partial<Record<keyof PayloadPage, unknown>>
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
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_RESPONSE')
  }
  const validEmpty = page.totalDocs === 0 && (page.totalPages === 0 || page.totalPages === 1)
  const validNonEmpty = page.totalDocs > 0 && page.totalPages === Math.ceil(page.totalDocs / limit)
  const expectedHasNext = page.totalDocs > 0 && requestedPage < page.totalPages
  if (
    (!validEmpty && !validNonEmpty) ||
    page.hasNextPage !== expectedHasNext ||
    (expectedHasNext && page.nextPage !== requestedPage + 1) ||
    (!expectedHasNext && page.nextPage !== null && page.nextPage !== undefined)
  ) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_RESPONSE')
  }
  return page as unknown as PayloadPage
}

function activeWhere(tenantId: string): Readonly<Record<string, unknown>> {
  return { and: [{ tenant: { equals: tenantId } }, { active: { equals: true } }] }
}

function publicRunsWhere(tenantId: string): Readonly<Record<string, unknown>> {
  return {
    and: [{ tenant: { equals: tenantId } }, { status: { in: ['published', 'enrollment_open'] } }],
  }
}

function normalizeModality(value: unknown): 'presential' | 'online' | 'hybrid' | null {
  if (value === 'presencial') return 'presential'
  if (value === 'online') return 'online'
  if (value === 'hibrido') return 'hybrid'
  return null
}

function normalizeCycleModality(value: unknown): 'presential' | 'online' | 'hybrid' | null {
  if (value === 'presencial') return 'presential'
  if (value === 'online') return 'online'
  if (value === 'semipresencial' || value === 'mixto') return 'hybrid'
  return null
}

function assertTenant(value: unknown, targetTenantId: string): void {
  const tenantId = relationshipId(value)
  if (tenantId === null || tenantId !== targetTenantId) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_TENANT_BOUNDARY_VIOLATION')
  }
}

function requiredRelationshipId(value: unknown): string {
  const id = relationshipId(value)
  if (id === null) throw readerError('PUBLIC_PROJECTION_PAYLOAD_RELATION_INVALID')
  return id
}

function nullableRelationshipId(value: unknown): string | null {
  if (value === null || value === undefined) return null
  return requiredRelationshipId(value)
}

function relationshipId(value: unknown): string | null {
  if (typeof value === 'number' && Number.isSafeInteger(value) && value >= 0) return String(value)
  if (validIdentifier(value)) return value
  if (value && typeof value === 'object' && Object.prototype.hasOwnProperty.call(value, 'id')) {
    return relationshipId((value as { id?: unknown }).id)
  }
  return null
}

function publicString(value: unknown, maxLength: number): string {
  if (
    typeof value !== 'string' ||
    value.trim().length === 0 ||
    value !== value.trim() ||
    value.length > maxLength
  ) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_PUBLIC_FIELD_INVALID')
  }
  return value
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

function limit(value: number | undefined, fallback: number, hardMax: number): number {
  const result = value ?? fallback
  if (!Number.isSafeInteger(result) || result < 1 || result > hardMax) {
    throw readerError('PUBLIC_PROJECTION_PAYLOAD_INVALID_CONFIGURATION')
  }
  return result
}

function exactKeys(value: object, expected: ReadonlySet<string>): boolean {
  const keys = Object.keys(value)
  return (
    keys.length === expected.size &&
    keys.every((key) => expected.has(key)) &&
    [...expected].every((key) => Object.prototype.hasOwnProperty.call(value, key))
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
  code: PayloadPublicProjectionReaderErrorCode
): PayloadPublicProjectionReaderError {
  return new PayloadPublicProjectionReaderError(code)
}
