import type { PayloadShadowRelationship } from './multi-entity-payload-projection'
import {
  DEFAULT_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT,
  HARD_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT,
  validateMultiEntityTeacherSchedule,
  type MultiEntityScheduleWeekday,
  type MultiEntityTeacherScheduleCourseRun,
  type MultiEntityTeacherScheduleStatus,
  type MultiEntityTeacherScheduleValidation,
} from './multi-entity-teacher-schedule'
import {
  validateMultiEntityTopology,
  type MultiEntityTopology,
  type StaffEntityAssignmentTopologyRecord,
} from './multi-entity-topology'

export interface PayloadTeacherScheduleCourseRunRecord {
  readonly id: unknown
  readonly tenant: PayloadShadowRelationship
  /**
   * Shadow-enriched relationship. It may come from a reviewed resolution plan;
   * this projector never infers it from campus.
   */
  readonly legalEntity?: PayloadShadowRelationship
  readonly campus?: PayloadShadowRelationship
  readonly instructor?: PayloadShadowRelationship
  readonly instructors?: unknown
  readonly start_date?: unknown
  readonly end_date?: unknown
  readonly schedule_days?: unknown
  readonly schedule_time_start?: unknown
  readonly schedule_time_end?: unknown
  readonly planning_status?: unknown
}

export interface PayloadTeacherScheduleSnapshot {
  readonly targetTenantId: string
  readonly topology: MultiEntityTopology
  readonly courseRuns: readonly PayloadTeacherScheduleCourseRunRecord[]
  readonly maxCourseRuns?: number
}

export type PayloadTeacherScheduleProjectionIssueCode =
  | 'invalid_target_tenant'
  | 'record_limit_exceeded'
  | 'topology_invalid'
  | 'invalid_course_run_id'
  | 'duplicate_course_run_id'
  | 'tenant_relationship_invalid'
  | 'record_outside_target_tenant'
  | 'legal_entity_relationship_missing'
  | 'legal_entity_relationship_invalid'
  | 'campus_relationship_invalid'
  | 'instructor_relationship_invalid'
  | 'staff_assignment_missing'
  | 'staff_assignment_ambiguous'
  | 'schedule_shape_invalid'

export interface PayloadTeacherScheduleProjectionIssue {
  readonly code: PayloadTeacherScheduleProjectionIssueCode
  readonly courseRunId?: string
  readonly relatedId?: string
}

export interface PayloadTeacherScheduleProjectionSummary {
  readonly sourceCourseRuns: number
  readonly projectedCourseRuns: number
  readonly blockedCourseRuns: number
  readonly outsideTargetTenant: number
  readonly unresolvedAssignments: number
  readonly courseRunsWithoutTeachers: number
  readonly topologyIssues: number
}

export interface PayloadTeacherScheduleProjection {
  readonly mode: 'shadow_payload_teacher_schedule_projection'
  readonly canWrite: false
  readonly canApply: false
  readonly readyForValidation: boolean
  readonly courseRuns: readonly MultiEntityTeacherScheduleCourseRun[]
  readonly issues: readonly PayloadTeacherScheduleProjectionIssue[]
  readonly summary: PayloadTeacherScheduleProjectionSummary
}

export interface PayloadTeacherScheduleShadowPlan {
  readonly mode: 'shadow_payload_teacher_schedule_plan'
  readonly canWrite: false
  readonly canApply: false
  readonly ready: boolean
  readonly projection: PayloadTeacherScheduleProjection
  readonly validation: MultiEntityTeacherScheduleValidation
}

/**
 * Converts an already-fetched, shadow-enriched Payload snapshot into the pure
 * multi-entity schedule contract. It performs no I/O and never derives legal
 * entity ownership from a campus or from the current user's access.
 */
export function projectPayloadTeacherScheduleSnapshot(
  input: PayloadTeacherScheduleSnapshot
): PayloadTeacherScheduleProjection {
  const sourceCourseRuns = input.courseRuns.length
  if (!validIdentifier(input.targetTenantId)) {
    return emptyProjection(sourceCourseRuns, 'invalid_target_tenant')
  }

  const limit = validLimit(input.maxCourseRuns)
  if (limit === null || sourceCourseRuns > limit) {
    return emptyProjection(sourceCourseRuns, 'record_limit_exceeded')
  }

  const topologyIssues = validateMultiEntityTopology(input.topology)
  if (topologyIssues.length > 0) {
    return emptyProjection(sourceCourseRuns, 'topology_invalid', topologyIssues.length)
  }

  const issues: PayloadTeacherScheduleProjectionIssue[] = []
  const projected: MultiEntityTeacherScheduleCourseRun[] = []
  const duplicateIds = duplicateCourseRunIds(input.courseRuns)
  const assignmentsByScope = groupAssignmentsByScope(input.topology.staffAssignments)
  let outsideTargetTenant = 0
  let unresolvedAssignments = 0

  for (const duplicateId of [...duplicateIds].sort()) {
    issues.push(projectionIssue('duplicate_course_run_id', duplicateId))
  }

  for (const source of input.courseRuns) {
    const id = relationshipId(source.id as PayloadShadowRelationship)
    if (id.kind !== 'valid') {
      issues.push(projectionIssue('invalid_course_run_id'))
      continue
    }
    if (duplicateIds.has(id.id)) continue

    const tenant = relationshipId(source.tenant)
    if (tenant.kind !== 'valid') {
      issues.push(projectionIssue('tenant_relationship_invalid', id.id))
      continue
    }
    if (tenant.id !== input.targetTenantId) {
      issues.push(projectionIssue('record_outside_target_tenant', id.id))
      outsideTargetTenant += 1
      continue
    }

    const legalEntity = relationshipId(source.legalEntity)
    if (legalEntity.kind === 'missing') {
      issues.push(projectionIssue('legal_entity_relationship_missing', id.id))
      continue
    }
    if (legalEntity.kind === 'invalid') {
      issues.push(projectionIssue('legal_entity_relationship_invalid', id.id))
      continue
    }

    const campus = relationshipId(source.campus)
    if (campus.kind === 'invalid') {
      issues.push(projectionIssue('campus_relationship_invalid', id.id))
    }

    const schedule = normalizeSchedule(source)
    if (!schedule) {
      issues.push(projectionIssue('schedule_shape_invalid', id.id))
      continue
    }

    const instructors = collectInstructorIds(source)
    if (instructors.invalid) {
      issues.push(projectionIssue('instructor_relationship_invalid', id.id))
    }

    const staffAssignmentIds: string[] = []
    for (const instructorId of instructors.ids) {
      const resolution = resolveStaffAssignment(
        assignmentsByScope,
        tenant.id,
        legalEntity.id,
        instructorId
      )
      if (resolution.kind === 'missing') {
        issues.push(projectionIssue('staff_assignment_missing', id.id, instructorId))
        unresolvedAssignments += 1
        continue
      }
      if (resolution.kind === 'ambiguous') {
        issues.push(projectionIssue('staff_assignment_ambiguous', id.id, instructorId))
        unresolvedAssignments += 1
        continue
      }
      staffAssignmentIds.push(resolution.assignment.id)
    }

    projected.push({
      id: id.id,
      tenantId: tenant.id,
      legalEntityId: legalEntity.id,
      campusId: campus.kind === 'valid' ? campus.id : null,
      staffAssignmentIds: [...new Set(staffAssignmentIds)].sort(),
      ...schedule,
    })
  }

  projected.sort((left, right) => left.id.localeCompare(right.id))
  issues.sort(compareIssues)
  const blockedCourseRunIds = new Set(
    issues.flatMap((issue) => (issue.courseRunId ? [issue.courseRunId] : []))
  )

  return {
    mode: 'shadow_payload_teacher_schedule_projection',
    canWrite: false,
    canApply: false,
    readyForValidation: issues.length === 0,
    courseRuns: projected,
    issues,
    summary: {
      sourceCourseRuns,
      projectedCourseRuns: projected.length,
      blockedCourseRuns: blockedCourseRunIds.size,
      outsideTargetTenant,
      unresolvedAssignments,
      courseRunsWithoutTeachers: projected.filter(
        (courseRun) => courseRun.staffAssignmentIds.length === 0
      ).length,
      topologyIssues: 0,
    },
  }
}

/**
 * Chains projection and validation while preserving a non-applicable result.
 * Valid records are still checked when other records are blocked, so shadow
 * evidence can expose conflicts without treating a partial snapshot as ready.
 */
export function planPayloadTeacherScheduleShadow(
  input: PayloadTeacherScheduleSnapshot
): PayloadTeacherScheduleShadowPlan {
  const projection = projectPayloadTeacherScheduleSnapshot(input)
  const configuredLimit = validLimit(input.maxCourseRuns)
  const validation = validateMultiEntityTeacherSchedule({
    topology: input.topology,
    courseRuns: projection.courseRuns,
    ...(configuredLimit === null ? {} : { maxCourseRuns: configuredLimit }),
  })

  return {
    mode: 'shadow_payload_teacher_schedule_plan',
    canWrite: false,
    canApply: false,
    ready: projection.readyForValidation && validation.ready,
    projection,
    validation,
  }
}

interface NormalizedSchedule {
  readonly startDate: string
  readonly endDate: string
  readonly scheduleDays: readonly MultiEntityScheduleWeekday[]
  readonly scheduleTimeStart: string
  readonly scheduleTimeEnd: string
  readonly status: MultiEntityTeacherScheduleStatus
}

function normalizeSchedule(
  source: PayloadTeacherScheduleCourseRunRecord
): NormalizedSchedule | null {
  const startDate = normalizePayloadDate(source.start_date)
  const endDate = normalizePayloadDate(source.end_date)
  const scheduleTimeStart = normalizePayloadTime(source.schedule_time_start)
  const scheduleTimeEnd = normalizePayloadTime(source.schedule_time_end)
  if (
    !startDate ||
    !endDate ||
    !scheduleTimeStart ||
    !scheduleTimeEnd ||
    !Array.isArray(source.schedule_days) ||
    !source.schedule_days.every((day) => typeof day === 'string') ||
    typeof source.planning_status !== 'string'
  ) {
    return null
  }

  return {
    startDate,
    endDate,
    scheduleDays: source.schedule_days as MultiEntityScheduleWeekday[],
    scheduleTimeStart,
    scheduleTimeEnd,
    status: source.planning_status as MultiEntityTeacherScheduleStatus,
  }
}

function normalizePayloadDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const midnightUtc = /^(\d{4}-\d{2}-\d{2})T00:00:00(?:\.\d{3})?Z$/.exec(value)
  return midnightUtc?.[1] ?? null
}

function normalizePayloadTime(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const match = /^(\d|[01]\d|2[0-3]):([0-5]\d):([0-5]\d)$/.exec(value)
  if (!match) return null
  return `${match[1]!.padStart(2, '0')}:${match[2]}:${match[3]}`
}

function collectInstructorIds(source: PayloadTeacherScheduleCourseRunRecord): {
  readonly ids: readonly string[]
  readonly invalid: boolean
} {
  const ids = new Set<string>()
  let invalid = false

  if (source.instructor !== null && source.instructor !== undefined) {
    const instructor = relationshipId(source.instructor)
    if (instructor.kind === 'valid') ids.add(instructor.id)
    else invalid = true
  }

  if (source.instructors !== null && source.instructors !== undefined) {
    if (!Array.isArray(source.instructors)) {
      invalid = true
    } else {
      for (const value of source.instructors) {
        const instructor = relationshipId(value as PayloadShadowRelationship)
        if (instructor.kind === 'valid') ids.add(instructor.id)
        else invalid = true
      }
    }
  }

  return { ids: [...ids].sort(), invalid }
}

type AssignmentResolution =
  | { readonly kind: 'missing' }
  | { readonly kind: 'ambiguous' }
  | { readonly kind: 'resolved'; readonly assignment: StaffEntityAssignmentTopologyRecord }

function groupAssignmentsByScope(
  assignments: readonly StaffEntityAssignmentTopologyRecord[]
): ReadonlyMap<string, readonly StaffEntityAssignmentTopologyRecord[]> {
  const result = new Map<string, StaffEntityAssignmentTopologyRecord[]>()
  for (const assignment of assignments) {
    const key = assignmentScopeKey(
      assignment.tenantId,
      assignment.legalEntityId,
      assignment.staffId
    )
    const existing = result.get(key) ?? []
    existing.push(assignment)
    result.set(key, existing)
  }
  return result
}

function resolveStaffAssignment(
  assignmentsByScope: ReadonlyMap<string, readonly StaffEntityAssignmentTopologyRecord[]>,
  tenantId: string,
  legalEntityId: string,
  staffId: string
): AssignmentResolution {
  const matches = assignmentsByScope.get(assignmentScopeKey(tenantId, legalEntityId, staffId)) ?? []
  const active = matches.filter((assignment) => assignment.status !== 'suspended')
  if (active.length === 1) return { kind: 'resolved', assignment: active[0]! }
  if (active.length > 1) return { kind: 'ambiguous' }
  if (matches.length === 1) return { kind: 'resolved', assignment: matches[0]! }
  return matches.length === 0 ? { kind: 'missing' } : { kind: 'ambiguous' }
}

function assignmentScopeKey(tenantId: string, legalEntityId: string, staffId: string): string {
  return `${tenantId}\u0000${legalEntityId}\u0000${staffId}`
}

function validLimit(value: number | undefined): number | null {
  const limit = value ?? DEFAULT_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT
  return Number.isSafeInteger(limit) &&
    limit >= 1 &&
    limit <= HARD_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT
    ? limit
    : null
}

function duplicateCourseRunIds(
  records: readonly PayloadTeacherScheduleCourseRunRecord[]
): ReadonlySet<string> {
  const counts = new Map<string, number>()
  for (const record of records) {
    const id = relationshipId(record.id as PayloadShadowRelationship)
    if (id.kind !== 'valid') continue
    counts.set(id.id, (counts.get(id.id) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id))
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

function validIdentifier(value: string): boolean {
  return value.length > 0 && value.length <= 255 && value.trim() === value
}

function emptyProjection(
  sourceCourseRuns: number,
  code: 'invalid_target_tenant' | 'record_limit_exceeded' | 'topology_invalid',
  topologyIssues = 0
): PayloadTeacherScheduleProjection {
  return {
    mode: 'shadow_payload_teacher_schedule_projection',
    canWrite: false,
    canApply: false,
    readyForValidation: false,
    courseRuns: [],
    issues: [{ code }],
    summary: {
      sourceCourseRuns,
      projectedCourseRuns: 0,
      blockedCourseRuns: 0,
      outsideTargetTenant: 0,
      unresolvedAssignments: 0,
      courseRunsWithoutTeachers: 0,
      topologyIssues,
    },
  }
}

function projectionIssue(
  code: PayloadTeacherScheduleProjectionIssueCode,
  courseRunId?: string,
  relatedId?: string
): PayloadTeacherScheduleProjectionIssue {
  return {
    code,
    ...(courseRunId === undefined ? {} : { courseRunId }),
    ...(relatedId === undefined ? {} : { relatedId }),
  }
}

function compareIssues(
  left: PayloadTeacherScheduleProjectionIssue,
  right: PayloadTeacherScheduleProjectionIssue
): number {
  return (
    (left.courseRunId ?? '').localeCompare(right.courseRunId ?? '') ||
    left.code.localeCompare(right.code) ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}
