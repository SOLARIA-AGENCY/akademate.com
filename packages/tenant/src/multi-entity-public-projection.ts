export type PublicProjectionEntityStatus = 'proposed' | 'validated' | 'inactive'
export type PublicProjectionBindingStatus = 'proposed' | 'validated' | 'inactive'
export type PublicProjectionRunStatus =
  | 'draft'
  | 'published'
  | 'enrollment_open'
  | 'enrollment_closed'
  | 'in_progress'
  | 'completed'
  | 'cancelled'

export interface PublicProjectionLegalEntity {
  readonly id: string
  readonly tenantId: string
  readonly status: PublicProjectionEntityStatus
}

export interface PublicProjectionCampusBinding {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId: string
  readonly status: PublicProjectionBindingStatus
}

export interface PublicProjectionCourse {
  readonly id: string
  readonly tenantId: string
  readonly slug: string
  readonly title: string
  readonly active: boolean
}

export interface PublicProjectionCycle {
  readonly id: string
  readonly tenantId: string
  readonly slug: string
  readonly title: string
  readonly active: boolean
}

export interface PublicProjectionCampus {
  readonly id: string
  readonly tenantId: string
  readonly slug: string
  readonly name: string
  readonly city: string | null
  readonly active: boolean
}

export interface PublicProjectionCourseRun {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly courseId: string | null
  readonly cycleId: string | null
  readonly campusId: string | null
  readonly publicSlug: string
  readonly status: PublicProjectionRunStatus
  readonly startDate: string | null
  readonly modality: 'presential' | 'online' | 'hybrid'
}

export interface MultiEntityPublicProjectionInput {
  readonly targetTenantId: string
  readonly legalEntities: readonly PublicProjectionLegalEntity[]
  readonly campusBindings: readonly PublicProjectionCampusBinding[]
  readonly courses: readonly PublicProjectionCourse[]
  readonly cycles: readonly PublicProjectionCycle[]
  readonly campuses: readonly PublicProjectionCampus[]
  readonly courseRuns: readonly PublicProjectionCourseRun[]
  readonly maxRecords?: number
}

export type MultiEntityPublicProjectionIssueCode =
  | 'identifier_invalid'
  | 'tenant_mismatch'
  | 'duplicate_record_id'
  | 'duplicate_public_slug'
  | 'legal_entity_missing_or_not_validated'
  | 'campus_binding_missing_or_not_validated'
  | 'campus_binding_ambiguous'
  | 'catalog_relation_invalid'
  | 'course_missing_or_inactive'
  | 'cycle_missing_or_inactive'
  | 'campus_missing_or_inactive'
  | 'campus_entity_mismatch'
  | 'public_field_invalid'

export type MultiEntityPublicProjectionRecordType =
  | 'legal_entity'
  | 'campus_binding'
  | 'course'
  | 'cycle'
  | 'campus'
  | 'course_run'

export interface MultiEntityPublicProjectionIssue {
  readonly code: MultiEntityPublicProjectionIssueCode
  readonly recordType: MultiEntityPublicProjectionRecordType
  readonly recordId: string
  readonly relatedId?: string
}

export interface UnifiedPublicRunProjection {
  readonly slug: string
  readonly status: 'published' | 'enrollment_open'
  readonly startDate: string | null
  readonly modality: 'presential' | 'online' | 'hybrid'
  readonly campus: {
    readonly slug: string
    readonly name: string
    readonly city: string | null
  } | null
}

export interface UnifiedPublicCourseProjection {
  readonly slug: string
  readonly title: string
  readonly runs: readonly UnifiedPublicRunProjection[]
}

export interface UnifiedPublicCycleProjection {
  readonly slug: string
  readonly title: string
  readonly runs: readonly UnifiedPublicRunProjection[]
}

export interface UnifiedPublicCampusProjection {
  readonly slug: string
  readonly name: string
  readonly city: string | null
  readonly courseSlugs: readonly string[]
  readonly cycleSlugs: readonly string[]
  readonly openRuns: number
}

export interface MultiEntityPublicProjectionPlan {
  readonly mode: 'unified_public_projection_shadow'
  readonly canPublish: false
  readonly canActivate: false
  readonly ready: boolean
  readonly courses: readonly UnifiedPublicCourseProjection[]
  readonly cycles: readonly UnifiedPublicCycleProjection[]
  readonly campuses: readonly UnifiedPublicCampusProjection[]
  readonly issues: readonly MultiEntityPublicProjectionIssue[]
  readonly summary: {
    readonly sourceCourses: number
    readonly sharedPublicCourses: number
    readonly sourceCycles: number
    readonly sharedPublicCycles: number
    readonly sourceCampuses: number
    readonly publicCampuses: number
    readonly sourceRuns: number
    readonly projectedRuns: number
    readonly ignoredNonPublicRuns: number
    readonly blockedIssues: number
  }
}

export interface RedactedMultiEntityPublicProjectionObservation {
  readonly schemaVersion: 1
  readonly kind: 'cep_unified_public_projection_shadow'
  readonly verdict: 'ready_for_shadow_comparison' | 'blocked'
  readonly canPublish: false
  readonly canActivate: false
  readonly metrics: MultiEntityPublicProjectionPlan['summary']
}

const PUBLIC_RUN_STATUSES = new Set<PublicProjectionRunStatus>(['published', 'enrollment_open'])
const ENTITY_STATUSES = new Set<PublicProjectionEntityStatus>(['proposed', 'validated', 'inactive'])
const BINDING_STATUSES = new Set<PublicProjectionBindingStatus>([
  'proposed',
  'validated',
  'inactive',
])
const RUN_STATUSES = new Set<PublicProjectionRunStatus>([
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
])
const MODALITIES = new Set(['presential', 'online', 'hybrid'])
const DEFAULT_MAX_RECORDS = 100_000
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const INPUT_KEYS = new Set([
  'targetTenantId',
  'legalEntities',
  'campusBindings',
  'courses',
  'cycles',
  'campuses',
  'courseRuns',
  'maxRecords',
])
const ENTITY_KEYS = new Set(['id', 'tenantId', 'status'])
const BINDING_KEYS = new Set(['id', 'tenantId', 'legalEntityId', 'campusId', 'status'])
const COURSE_KEYS = new Set(['id', 'tenantId', 'slug', 'title', 'active'])
const CYCLE_KEYS = new Set(['id', 'tenantId', 'slug', 'title', 'active'])
const CAMPUS_KEYS = new Set(['id', 'tenantId', 'slug', 'name', 'city', 'active'])
const RUN_KEYS = new Set([
  'id',
  'tenantId',
  'legalEntityId',
  'courseId',
  'cycleId',
  'campusId',
  'publicSlug',
  'status',
  'startDate',
  'modality',
])

/**
 * Produces a public-only, entity-safe view of the shared catalog and local
 * course runs. It is deliberately disconnected from the current website and
 * Public course/campus views expose no legal-entity, tenant, binding or source
 * record identifiers. Diagnostic issues remain internal; only the redacted
 * observation is safe to persist as telemetry.
 */
export function planMultiEntityPublicProjection(
  input: MultiEntityPublicProjectionInput
): MultiEntityPublicProjectionPlan {
  validateInputShape(input)

  const issues: MultiEntityPublicProjectionIssue[] = []
  const entities = buildEntityMap(input, issues)
  const courses = buildCourseMap(input, issues)
  const cycles = buildCycleMap(input, issues)
  const campuses = buildCampusMap(input, issues)
  const bindings = buildCampusBindingMap(input, entities, campuses, issues)
  const publicRunSlugs = new Map<string, string>()
  const runIds = new Set<string>()
  const runsByCourse = new Map<string, UnifiedPublicRunProjection[]>()
  const runsByCycle = new Map<string, UnifiedPublicRunProjection[]>()
  const campusCourseSlugs = new Map<string, Set<string>>()
  const campusCycleSlugs = new Map<string, Set<string>>()
  const campusRunCounts = new Map<string, number>()
  let ignoredNonPublicRuns = 0
  let candidateRuns = 0

  for (const run of sortedById(input.courseRuns)) {
    if (!validRun(run)) {
      issues.push(issue('public_field_invalid', 'course_run', safeRecordId(run.id)))
      continue
    }
    if (runIds.has(run.id)) {
      issues.push(issue('duplicate_record_id', 'course_run', run.id))
      continue
    }
    runIds.add(run.id)
    if (run.tenantId !== input.targetTenantId) {
      issues.push(issue('tenant_mismatch', 'course_run', run.id))
      continue
    }
    if (!isPublicRunStatus(run.status)) {
      ignoredNonPublicRuns += 1
      continue
    }

    const existingSlugOwner = publicRunSlugs.get(run.publicSlug)
    if (existingSlugOwner) {
      issues.push(issue('duplicate_public_slug', 'course_run', run.id, existingSlugOwner))
      continue
    }
    publicRunSlugs.set(run.publicSlug, run.id)

    const entity = entities.get(run.legalEntityId)
    if (!entity || entity.status !== 'validated') {
      issues.push(
        issue('legal_entity_missing_or_not_validated', 'course_run', run.id, run.legalEntityId)
      )
      continue
    }

    const hasCourse = run.courseId !== null
    const hasCycle = run.cycleId !== null
    if (hasCourse === hasCycle) {
      issues.push(issue('catalog_relation_invalid', 'course_run', run.id))
      continue
    }
    const course = run.courseId === null ? undefined : courses.get(run.courseId)
    const cycle = run.cycleId === null ? undefined : cycles.get(run.cycleId)
    if (hasCourse && (!course || !course.active)) {
      issues.push(issue('course_missing_or_inactive', 'course_run', run.id, run.courseId!))
      continue
    }
    if (hasCycle && (!cycle || !cycle.active)) {
      issues.push(issue('cycle_missing_or_inactive', 'course_run', run.id, run.cycleId!))
      continue
    }

    let publicCampus: UnifiedPublicRunProjection['campus'] = null
    if (run.campusId !== null) {
      const campus = campuses.get(run.campusId)
      if (!campus || !campus.active) {
        issues.push(issue('campus_missing_or_inactive', 'course_run', run.id, run.campusId))
        continue
      }
      const campusBindings = bindings.get(run.campusId) ?? []
      if (campusBindings.length === 0) {
        issues.push(
          issue('campus_binding_missing_or_not_validated', 'course_run', run.id, run.campusId)
        )
        continue
      }
      if (campusBindings.length > 1) {
        issues.push(issue('campus_binding_ambiguous', 'course_run', run.id, run.campusId))
        continue
      }
      if (campusBindings[0]!.legalEntityId !== run.legalEntityId) {
        issues.push(issue('campus_entity_mismatch', 'course_run', run.id, run.campusId))
        continue
      }
      publicCampus = Object.freeze({ slug: campus.slug, name: campus.name, city: campus.city })
      if (course) {
        const courseSlugs = campusCourseSlugs.get(campus.id) ?? new Set<string>()
        courseSlugs.add(course.slug)
        campusCourseSlugs.set(campus.id, courseSlugs)
      } else if (cycle) {
        const cycleSlugs = campusCycleSlugs.get(campus.id) ?? new Set<string>()
        cycleSlugs.add(cycle.slug)
        campusCycleSlugs.set(campus.id, cycleSlugs)
      }
      campusRunCounts.set(campus.id, (campusRunCounts.get(campus.id) ?? 0) + 1)
    }

    const projectedRun: UnifiedPublicRunProjection = Object.freeze({
      slug: run.publicSlug,
      status: run.status,
      startDate: run.startDate,
      modality: run.modality,
      campus: publicCampus,
    })
    if (course) {
      const existingRuns = runsByCourse.get(course.id) ?? []
      existingRuns.push(projectedRun)
      runsByCourse.set(course.id, existingRuns)
    } else if (cycle) {
      const existingRuns = runsByCycle.get(cycle.id) ?? []
      existingRuns.push(projectedRun)
      runsByCycle.set(cycle.id, existingRuns)
    }
    candidateRuns += 1
  }

  for (const campus of campuses.values()) {
    if (!campus.active) continue
    const validatedBindings = bindings.get(campus.id) ?? []
    if (validatedBindings.length === 0) {
      issues.push(issue('campus_binding_missing_or_not_validated', 'campus', campus.id, campus.id))
    } else if (validatedBindings.length > 1) {
      issues.push(issue('campus_binding_ambiguous', 'campus', campus.id, campus.id))
    }
  }

  const sortedIssues = issues.sort(compareIssues)
  const ready = sortedIssues.length === 0
  const projectedCourses = ready
    ? [...courses.values()]
        .filter(({ active }) => active)
        .sort((left, right) => left.slug.localeCompare(right.slug))
        .map((course) =>
          Object.freeze({
            slug: course.slug,
            title: course.title,
            runs: Object.freeze([...(runsByCourse.get(course.id) ?? [])].sort(comparePublicRuns)),
          })
        )
    : []
  const projectedCycles = ready
    ? [...cycles.values()]
        .filter(({ active }) => active)
        .sort((left, right) => left.slug.localeCompare(right.slug))
        .map((cycle) =>
          Object.freeze({
            slug: cycle.slug,
            title: cycle.title,
            runs: Object.freeze([...(runsByCycle.get(cycle.id) ?? [])].sort(comparePublicRuns)),
          })
        )
    : []
  const projectedCampuses = ready
    ? [...campuses.values()]
        .filter(({ active }) => active)
        .sort((left, right) => left.slug.localeCompare(right.slug))
        .map((campus) =>
          Object.freeze({
            slug: campus.slug,
            name: campus.name,
            city: campus.city,
            courseSlugs: Object.freeze(
              [...(campusCourseSlugs.get(campus.id) ?? [])].sort((left, right) =>
                left.localeCompare(right)
              )
            ),
            cycleSlugs: Object.freeze(
              [...(campusCycleSlugs.get(campus.id) ?? [])].sort((left, right) =>
                left.localeCompare(right)
              )
            ),
            openRuns: campusRunCounts.get(campus.id) ?? 0,
          })
        )
    : []

  const summary = Object.freeze({
    sourceCourses: input.courses.length,
    sharedPublicCourses: ready ? projectedCourses.length : 0,
    sourceCycles: input.cycles.length,
    sharedPublicCycles: ready ? projectedCycles.length : 0,
    sourceCampuses: input.campuses.length,
    publicCampuses: ready ? projectedCampuses.length : 0,
    sourceRuns: input.courseRuns.length,
    projectedRuns: ready ? candidateRuns : 0,
    ignoredNonPublicRuns,
    blockedIssues: sortedIssues.length,
  })

  return Object.freeze({
    mode: 'unified_public_projection_shadow',
    canPublish: false,
    canActivate: false,
    ready,
    courses: Object.freeze(projectedCourses),
    cycles: Object.freeze(projectedCycles),
    campuses: Object.freeze(projectedCampuses),
    issues: Object.freeze(sortedIssues.map((entry) => Object.freeze(entry))),
    summary,
  })
}

export function createRedactedMultiEntityPublicProjectionObservation(
  plan: MultiEntityPublicProjectionPlan
): RedactedMultiEntityPublicProjectionObservation {
  validatePlan(plan)
  return Object.freeze({
    schemaVersion: 1,
    kind: 'cep_unified_public_projection_shadow',
    verdict: plan.ready ? 'ready_for_shadow_comparison' : 'blocked',
    canPublish: false,
    canActivate: false,
    metrics: Object.freeze({ ...plan.summary }),
  })
}

export function serializeMultiEntityPublicProjectionObservation(
  input: MultiEntityPublicProjectionInput
): string {
  return JSON.stringify(
    createRedactedMultiEntityPublicProjectionObservation(planMultiEntityPublicProjection(input))
  )
}

function validateInputShape(input: MultiEntityPublicProjectionInput): void {
  if (
    !input ||
    typeof input !== 'object' ||
    !exactKeys(input, INPUT_KEYS, 'maxRecords') ||
    !validIdentifier(input.targetTenantId) ||
    !Array.isArray(input.legalEntities) ||
    !Array.isArray(input.campusBindings) ||
    !Array.isArray(input.courses) ||
    !Array.isArray(input.cycles) ||
    !Array.isArray(input.campuses) ||
    !Array.isArray(input.courseRuns)
  ) {
    throw new Error('MULTI_ENTITY_PUBLIC_PROJECTION_INPUT_INVALID')
  }

  const totalRecords =
    input.legalEntities.length +
    input.campusBindings.length +
    input.courses.length +
    input.cycles.length +
    input.campuses.length +
    input.courseRuns.length
  const maxRecords = input.maxRecords ?? DEFAULT_MAX_RECORDS
  if (!Number.isInteger(maxRecords) || maxRecords < 1 || totalRecords > maxRecords) {
    throw new Error('MULTI_ENTITY_PUBLIC_PROJECTION_RECORD_LIMIT_EXCEEDED')
  }

  validateRecordShapes(input.legalEntities, ENTITY_KEYS, (record) =>
    ENTITY_STATUSES.has(record.status)
  )
  validateRecordShapes(input.campusBindings, BINDING_KEYS, (record) =>
    BINDING_STATUSES.has(record.status)
  )
  validateRecordShapes(input.courses, COURSE_KEYS, (record) => typeof record.active === 'boolean')
  validateRecordShapes(input.cycles, CYCLE_KEYS, (record) => typeof record.active === 'boolean')
  validateRecordShapes(input.campuses, CAMPUS_KEYS, (record) => typeof record.active === 'boolean')
  validateRecordShapes(
    input.courseRuns,
    RUN_KEYS,
    (record) => RUN_STATUSES.has(record.status) && MODALITIES.has(record.modality)
  )
}

function buildEntityMap(
  input: MultiEntityPublicProjectionInput,
  issues: MultiEntityPublicProjectionIssue[]
): ReadonlyMap<string, PublicProjectionLegalEntity> {
  return buildRecordMap(
    input.legalEntities,
    'legal_entity',
    input.targetTenantId,
    issues,
    (record) => validIdentifier(record.id) && validIdentifier(record.tenantId)
  )
}

function buildCampusBindingMap(
  input: MultiEntityPublicProjectionInput,
  entities: ReadonlyMap<string, PublicProjectionLegalEntity>,
  campuses: ReadonlyMap<string, PublicProjectionCampus>,
  issues: MultiEntityPublicProjectionIssue[]
): ReadonlyMap<string, PublicProjectionCampusBinding[]> {
  const ids = new Set<string>()
  const result = new Map<string, PublicProjectionCampusBinding[]>()
  for (const binding of sortedById(input.campusBindings)) {
    if (
      !validIdentifier(binding.id) ||
      !validIdentifier(binding.tenantId) ||
      !validIdentifier(binding.legalEntityId) ||
      !validIdentifier(binding.campusId)
    ) {
      issues.push(issue('identifier_invalid', 'campus_binding', safeRecordId(binding.id)))
      continue
    }
    if (ids.has(binding.id)) {
      issues.push(issue('duplicate_record_id', 'campus_binding', binding.id))
      continue
    }
    ids.add(binding.id)
    if (binding.tenantId !== input.targetTenantId) {
      issues.push(issue('tenant_mismatch', 'campus_binding', binding.id))
      continue
    }
    if (binding.status !== 'validated') continue
    const entity = entities.get(binding.legalEntityId)
    if (!entity || entity.status !== 'validated') {
      issues.push(
        issue(
          'legal_entity_missing_or_not_validated',
          'campus_binding',
          binding.id,
          binding.legalEntityId
        )
      )
      continue
    }
    if (!campuses.has(binding.campusId)) {
      issues.push(
        issue('campus_missing_or_inactive', 'campus_binding', binding.id, binding.campusId)
      )
      continue
    }
    const existing = result.get(binding.campusId) ?? []
    existing.push(binding)
    result.set(binding.campusId, existing)
  }
  return result
}

function buildCourseMap(
  input: MultiEntityPublicProjectionInput,
  issues: MultiEntityPublicProjectionIssue[]
): ReadonlyMap<string, PublicProjectionCourse> {
  return buildPublicRecordMap(
    input.courses,
    'course',
    input.targetTenantId,
    issues,
    (record) => validSlug(record.slug) && validPublicText(record.title, 500)
  )
}

function buildCycleMap(
  input: MultiEntityPublicProjectionInput,
  issues: MultiEntityPublicProjectionIssue[]
): ReadonlyMap<string, PublicProjectionCycle> {
  return buildPublicRecordMap(
    input.cycles,
    'cycle',
    input.targetTenantId,
    issues,
    (record) => validSlug(record.slug) && validPublicText(record.title, 500)
  )
}

function buildCampusMap(
  input: MultiEntityPublicProjectionInput,
  issues: MultiEntityPublicProjectionIssue[]
): ReadonlyMap<string, PublicProjectionCampus> {
  return buildPublicRecordMap(
    input.campuses,
    'campus',
    input.targetTenantId,
    issues,
    (record) =>
      validSlug(record.slug) &&
      validPublicText(record.name, 200) &&
      (record.city === null || validPublicText(record.city, 100))
  )
}

function buildPublicRecordMap<
  T extends { readonly id: string; readonly tenantId: string; readonly slug: string },
>(
  records: readonly T[],
  recordType: 'course' | 'cycle' | 'campus',
  targetTenantId: string,
  issues: MultiEntityPublicProjectionIssue[],
  validatePublicFields: (record: T) => boolean
): ReadonlyMap<string, T> {
  const result = new Map<string, T>()
  const slugs = new Map<string, string>()
  for (const record of sortedById(records)) {
    if (
      !validIdentifier(record.id) ||
      !validIdentifier(record.tenantId) ||
      !validatePublicFields(record)
    ) {
      issues.push(issue('public_field_invalid', recordType, safeRecordId(record.id)))
      continue
    }
    if (result.has(record.id)) {
      issues.push(issue('duplicate_record_id', recordType, record.id))
      continue
    }
    if (record.tenantId !== targetTenantId) {
      issues.push(issue('tenant_mismatch', recordType, record.id))
      continue
    }
    const existingSlugOwner = slugs.get(record.slug)
    if (existingSlugOwner) {
      issues.push(issue('duplicate_public_slug', recordType, record.id, existingSlugOwner))
      continue
    }
    result.set(record.id, record)
    slugs.set(record.slug, record.id)
  }
  return result
}

function buildRecordMap<T extends { readonly id: string; readonly tenantId: string }>(
  records: readonly T[],
  recordType: MultiEntityPublicProjectionRecordType,
  targetTenantId: string,
  issues: MultiEntityPublicProjectionIssue[],
  validate: (record: T) => boolean
): ReadonlyMap<string, T> {
  const result = new Map<string, T>()
  for (const record of sortedById(records)) {
    if (!validate(record)) {
      issues.push(issue('identifier_invalid', recordType, safeRecordId(record.id)))
      continue
    }
    if (result.has(record.id)) {
      issues.push(issue('duplicate_record_id', recordType, record.id))
      continue
    }
    if (record.tenantId !== targetTenantId) {
      issues.push(issue('tenant_mismatch', recordType, record.id))
      continue
    }
    result.set(record.id, record)
  }
  return result
}

function validRun(run: PublicProjectionCourseRun): boolean {
  return (
    validIdentifier(run.id) &&
    validIdentifier(run.tenantId) &&
    validIdentifier(run.legalEntityId) &&
    (run.courseId === null || validIdentifier(run.courseId)) &&
    (run.cycleId === null || validIdentifier(run.cycleId)) &&
    (run.campusId === null || validIdentifier(run.campusId)) &&
    validPublicPathSegment(run.publicSlug) &&
    (run.startDate === null || validIsoDate(run.startDate))
  )
}

function isPublicRunStatus(
  status: PublicProjectionRunStatus
): status is 'published' | 'enrollment_open' {
  return PUBLIC_RUN_STATUSES.has(status)
}

function validatePlan(plan: MultiEntityPublicProjectionPlan): void {
  const metrics = Object.values(plan.summary)
  const projectedRuns =
    plan.courses.reduce((total, course) => total + course.runs.length, 0) +
    plan.cycles.reduce((total, cycle) => total + cycle.runs.length, 0)
  if (
    plan.mode !== 'unified_public_projection_shadow' ||
    plan.canPublish !== false ||
    plan.canActivate !== false ||
    plan.ready !== (plan.issues.length === 0) ||
    !metrics.every(nonNegativeInteger) ||
    plan.summary.blockedIssues !== plan.issues.length ||
    plan.summary.sharedPublicCourses !== plan.courses.length ||
    plan.summary.sharedPublicCycles !== plan.cycles.length ||
    plan.summary.publicCampuses !== plan.campuses.length ||
    plan.summary.projectedRuns !== projectedRuns ||
    plan.summary.sourceCourses < plan.summary.sharedPublicCourses ||
    plan.summary.sourceCycles < plan.summary.sharedPublicCycles ||
    plan.summary.sourceCampuses < plan.summary.publicCampuses ||
    plan.summary.sourceRuns < plan.summary.projectedRuns + plan.summary.ignoredNonPublicRuns ||
    (plan.ready &&
      plan.summary.sourceRuns !== plan.summary.projectedRuns + plan.summary.ignoredNonPublicRuns) ||
    (!plan.ready && (plan.courses.length > 0 || plan.cycles.length > 0 || plan.campuses.length > 0))
  ) {
    throw new Error('MULTI_ENTITY_PUBLIC_PROJECTION_PLAN_INVALID')
  }
}

function validateRecordShapes<T extends object>(
  records: readonly T[],
  keys: ReadonlySet<string>,
  validate: (record: T) => boolean
): void {
  for (const record of records) {
    if (!record || typeof record !== 'object' || !exactKeys(record, keys) || !validate(record)) {
      throw new Error('MULTI_ENTITY_PUBLIC_PROJECTION_RECORD_INVALID')
    }
  }
}

function sortedById<T extends { readonly id: string }>(records: readonly T[]): T[] {
  return [...records].sort((left, right) => String(left.id).localeCompare(String(right.id)))
}

function comparePublicRuns(
  left: UnifiedPublicRunProjection,
  right: UnifiedPublicRunProjection
): number {
  return (
    (left.startDate ?? '').localeCompare(right.startDate ?? '') ||
    left.slug.localeCompare(right.slug)
  )
}

function compareIssues(
  left: MultiEntityPublicProjectionIssue,
  right: MultiEntityPublicProjectionIssue
): number {
  return (
    left.recordType.localeCompare(right.recordType) ||
    left.recordId.localeCompare(right.recordId) ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}

function issue(
  code: MultiEntityPublicProjectionIssueCode,
  recordType: MultiEntityPublicProjectionRecordType,
  recordId: string,
  relatedId?: string
): MultiEntityPublicProjectionIssue {
  return relatedId === undefined
    ? { code, recordType, recordId }
    : { code, recordType, recordId, relatedId }
}

function exactKeys(value: object, allowed: ReadonlySet<string>, optional?: string): boolean {
  const keys = Object.keys(value)
  return (
    keys.every((key) => allowed.has(key)) &&
    [...allowed].every(
      (key) => key === optional || Object.prototype.hasOwnProperty.call(value, key)
    )
  )
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= 255
}

function safeRecordId(value: unknown): string {
  return validIdentifier(value) ? value : '<invalid>'
}

function validSlug(value: unknown): value is string {
  return typeof value === 'string' && value.length <= 500 && SLUG_PATTERN.test(value)
}

function validPublicPathSegment(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    value.length <= 255 &&
    /^[A-Za-z0-9]+(?:[-_.][A-Za-z0-9]+)*$/.test(value)
  )
}

function validPublicText(value: unknown, maxLength: number): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= maxLength
}

function validIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{3})?Z)?$/.test(value)) {
    return false
  }
  const timestamp = Date.parse(value)
  if (Number.isNaN(timestamp)) return false
  const canonical = new Date(timestamp).toISOString()
  return value.length === 10
    ? canonical.slice(0, 10) === value
    : canonical === value || canonical.replace('.000Z', 'Z') === value
}

function nonNegativeInteger(value: number): boolean {
  return Number.isSafeInteger(value) && value >= 0
}
