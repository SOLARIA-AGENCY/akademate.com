import { assertValidMultiEntityTopology, type MultiEntityTopology } from './multi-entity-topology'

export const DEFAULT_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT = 10_000
export const HARD_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT = 100_000

export type MultiEntityScheduleWeekday =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type MultiEntityTeacherScheduleStatus =
  | 'draft'
  | 'pending_validation'
  | 'validated'
  | 'published'
  | 'cancelled'
  | 'completed'

export interface MultiEntityTeacherScheduleCourseRun {
  readonly id: string
  readonly tenantId: string
  readonly legalEntityId: string
  readonly campusId?: string | null
  readonly staffAssignmentIds: readonly string[]
  readonly startDate: string
  readonly endDate: string
  readonly scheduleDays: readonly MultiEntityScheduleWeekday[]
  readonly scheduleTimeStart: string
  readonly scheduleTimeEnd: string
  readonly status: MultiEntityTeacherScheduleStatus
}

export interface MultiEntityTeacherScheduleInput {
  readonly topology: MultiEntityTopology
  readonly courseRuns: readonly MultiEntityTeacherScheduleCourseRun[]
  readonly maxCourseRuns?: number
}

export type MultiEntityTeacherScheduleIssueCode =
  | 'duplicate_course_run_id'
  | 'invalid_identifier'
  | 'invalid_course_run_scope'
  | 'invalid_course_run_status'
  | 'staff_assignment_missing'
  | 'staff_assignment_suspended'
  | 'staff_assignment_scope_mismatch'
  | 'staff_assignment_campus_mismatch'
  | 'invalid_date_range'
  | 'invalid_schedule_days'
  | 'invalid_schedule_time'
  | 'teacher_schedule_overlap'

export interface MultiEntityTeacherScheduleIssue {
  readonly code: MultiEntityTeacherScheduleIssueCode
  readonly courseRunId: string
  readonly relatedId?: string
  readonly relatedCourseRunId?: string
}

export interface MultiEntityTeacherScheduleSummary {
  readonly courseRuns: number
  readonly activeCourseRuns: number
  readonly conflictEligibleCourseRuns: number
  readonly teacherBookings: number
  readonly blockedCourseRuns: number
  readonly conflicts: number
}

export interface MultiEntityTeacherScheduleValidation {
  readonly mode: 'shadow_teacher_schedule_validation'
  readonly canWrite: false
  readonly canApply: false
  readonly ready: boolean
  readonly summary: MultiEntityTeacherScheduleSummary
  readonly issues: readonly MultiEntityTeacherScheduleIssue[]
}

export class MultiEntityTeacherScheduleError extends Error {
  readonly code = 'MULTI_ENTITY_TEACHER_SCHEDULE_INVALID'

  constructor(readonly issues: readonly MultiEntityTeacherScheduleIssue[]) {
    super(`Multi-entity teacher schedule contains ${issues.length} integrity issue(s).`)
    this.name = 'MultiEntityTeacherScheduleError'
  }
}

export class MultiEntityTeacherScheduleInputError extends Error {
  constructor(
    readonly code:
      | 'MULTI_ENTITY_TEACHER_SCHEDULE_INVALID_LIMIT'
      | 'MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT_EXCEEDED',
    message: string
  ) {
    super(message)
    this.name = 'MultiEntityTeacherScheduleInputError'
  }
}

interface ParsedCourseRun {
  readonly id: string
  readonly tenantId: string
  readonly startDay: number
  readonly endDay: number
  readonly weekdays: ReadonlySet<MultiEntityScheduleWeekday>
  readonly startSecond: number
  readonly endSecond: number
  readonly teacherIds: ReadonlySet<string>
}

const WEEKDAYS: readonly MultiEntityScheduleWeekday[] = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
]
const WEEKDAY_SET = new Set(WEEKDAYS)
const ACTIVE_STATUSES = new Set<MultiEntityTeacherScheduleStatus>([
  'draft',
  'pending_validation',
  'validated',
  'published',
])
const ALL_STATUSES = new Set<MultiEntityTeacherScheduleStatus>([
  ...ACTIVE_STATUSES,
  'cancelled',
  'completed',
])
const IDENTIFIER_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,254}$/
const DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/
const TIME_PATTERN = /^(?:[01]\d|2[0-3]):[0-5]\d:[0-5]\d$/
const MILLISECONDS_PER_DAY = 86_400_000

/**
 * Builds a deterministic, read-only validation report for teacher schedules.
 *
 * A conflict is resolved through the master teacher (`staffId`) behind each
 * entity-local assignment. No Payload hook, database write, user, role,
 * membership or authorization decision is read or changed here.
 */
export function validateMultiEntityTeacherSchedule(
  input: MultiEntityTeacherScheduleInput
): MultiEntityTeacherScheduleValidation {
  const limit = resolveLimit(input.maxCourseRuns)
  if (input.courseRuns.length > limit) {
    throw new MultiEntityTeacherScheduleInputError(
      'MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT_EXCEEDED',
      `Course run count ${input.courseRuns.length} exceeds the configured limit ${limit}.`
    )
  }

  const issues: MultiEntityTeacherScheduleIssue[] = []
  const entityById = firstRecordMap(input.topology.legalEntities)
  const campusById = firstRecordMap(input.topology.campuses)
  const assignmentById = firstRecordMap(input.topology.staffAssignments)
  const activeCampusBindings = new Set(
    input.topology.campusBindings
      .filter((binding) => binding.status !== 'inactive')
      .map(
        (binding) => `${binding.tenantId}\u0000${binding.legalEntityId}\u0000${binding.campusId}`
      )
  )
  const duplicateIds = duplicateValidIds(input.courseRuns)
  const seenCourseRunIds = new Set<string>()
  const parsedCourseRuns: ParsedCourseRun[] = []
  let activeCourseRuns = 0
  let teacherBookings = 0

  for (const [index, courseRun] of input.courseRuns.entries()) {
    const courseRunId = validIdentifier(courseRun.id) ? courseRun.id : `index:${index}`
    let scheduleIsValid = true

    if (!validIdentifier(courseRun.id)) {
      issues.push(scheduleIssue('invalid_identifier', courseRunId))
      scheduleIsValid = false
    } else if (seenCourseRunIds.has(courseRun.id)) {
      issues.push(scheduleIssue('duplicate_course_run_id', courseRunId))
    } else {
      seenCourseRunIds.add(courseRun.id)
    }

    if (duplicateIds.has(courseRun.id)) scheduleIsValid = false

    if (!ALL_STATUSES.has(courseRun.status)) {
      issues.push(scheduleIssue('invalid_course_run_status', courseRunId))
      scheduleIsValid = false
    }
    const isActive = ACTIVE_STATUSES.has(courseRun.status)
    if (isActive) activeCourseRuns += 1

    if (!validCourseRunScope(courseRun, entityById, campusById, activeCampusBindings)) {
      issues.push(scheduleIssue('invalid_course_run_scope', courseRunId))
      scheduleIsValid = false
    }

    const startDay = parseIsoDate(courseRun.startDate)
    const endDay = parseIsoDate(courseRun.endDate)
    if (startDay === null || endDay === null || endDay <= startDay) {
      issues.push(scheduleIssue('invalid_date_range', courseRunId))
      scheduleIsValid = false
    }

    const weekdays = parseWeekdays(courseRun.scheduleDays)
    if (weekdays === null) {
      issues.push(scheduleIssue('invalid_schedule_days', courseRunId))
      scheduleIsValid = false
    }

    const startSecond = parseTime(courseRun.scheduleTimeStart)
    const endSecond = parseTime(courseRun.scheduleTimeEnd)
    if (startSecond === null || endSecond === null || endSecond <= startSecond) {
      issues.push(scheduleIssue('invalid_schedule_time', courseRunId))
      scheduleIsValid = false
    }

    const teacherIds = new Set<string>()
    for (const assignmentId of new Set(courseRun.staffAssignmentIds)) {
      if (!validIdentifier(assignmentId)) {
        issues.push(scheduleIssue('invalid_identifier', courseRunId, assignmentId))
        continue
      }
      const assignment = assignmentById.get(assignmentId)
      if (!assignment) {
        issues.push(scheduleIssue('staff_assignment_missing', courseRunId, assignmentId))
        continue
      }
      if (assignment.status === 'suspended') {
        issues.push(scheduleIssue('staff_assignment_suspended', courseRunId, assignment.id))
        continue
      }
      if (
        assignment.tenantId !== courseRun.tenantId ||
        assignment.legalEntityId !== courseRun.legalEntityId
      ) {
        issues.push(scheduleIssue('staff_assignment_scope_mismatch', courseRunId, assignment.id))
        continue
      }
      if (
        courseRun.campusId &&
        assignment.campusIds.length > 0 &&
        !assignment.campusIds.includes(courseRun.campusId)
      ) {
        issues.push(scheduleIssue('staff_assignment_campus_mismatch', courseRunId, assignment.id))
        continue
      }
      if (!validIdentifier(assignment.staffId)) {
        issues.push(scheduleIssue('invalid_identifier', courseRunId, assignment.id))
        continue
      }
      teacherIds.add(assignment.staffId)
    }

    if (
      isActive &&
      scheduleIsValid &&
      startDay !== null &&
      endDay !== null &&
      weekdays !== null &&
      startSecond !== null &&
      endSecond !== null &&
      teacherIds.size > 0
    ) {
      parsedCourseRuns.push({
        id: courseRun.id,
        tenantId: courseRun.tenantId,
        startDay,
        endDay,
        weekdays,
        startSecond,
        endSecond,
        teacherIds,
      })
      teacherBookings += teacherIds.size
    }
  }

  parsedCourseRuns.sort((left, right) => left.id.localeCompare(right.id))

  for (let leftIndex = 0; leftIndex < parsedCourseRuns.length; leftIndex += 1) {
    const left = parsedCourseRuns[leftIndex]!
    for (let rightIndex = leftIndex + 1; rightIndex < parsedCourseRuns.length; rightIndex += 1) {
      const right = parsedCourseRuns[rightIndex]!
      if (left.tenantId !== right.tenantId) continue
      if (!setsIntersect(left.teacherIds, right.teacherIds)) continue
      if (!timesOverlap(left, right)) continue
      if (!hasSharedWeekdayOccurrence(left, right)) continue

      issues.push(scheduleIssue('teacher_schedule_overlap', left.id, undefined, right.id))
    }
  }

  issues.sort(compareIssues)
  const blockedCourseRunIds = new Set<string>()
  for (const issue of issues) {
    blockedCourseRunIds.add(issue.courseRunId)
    if (issue.relatedCourseRunId) blockedCourseRunIds.add(issue.relatedCourseRunId)
  }
  const conflicts = issues.filter((issue) => issue.code === 'teacher_schedule_overlap').length

  return {
    mode: 'shadow_teacher_schedule_validation',
    canWrite: false,
    canApply: false,
    ready: issues.length === 0,
    summary: {
      courseRuns: input.courseRuns.length,
      activeCourseRuns,
      conflictEligibleCourseRuns: parsedCourseRuns.length,
      teacherBookings,
      blockedCourseRuns: blockedCourseRunIds.size,
      conflicts,
    },
    issues,
  }
}

export function assertValidMultiEntityTeacherSchedule(
  input: MultiEntityTeacherScheduleInput
): void {
  assertValidMultiEntityTopology(input.topology)
  const result = validateMultiEntityTeacherSchedule(input)
  if (!result.ready) throw new MultiEntityTeacherScheduleError(result.issues)
}

function validCourseRunScope(
  courseRun: MultiEntityTeacherScheduleCourseRun,
  entityById: ReadonlyMap<string, MultiEntityTopology['legalEntities'][number]>,
  campusById: ReadonlyMap<string, MultiEntityTopology['campuses'][number]>,
  activeCampusBindings: ReadonlySet<string>
): boolean {
  if (
    !validIdentifier(courseRun.tenantId) ||
    !validIdentifier(courseRun.legalEntityId) ||
    (courseRun.campusId != null && !validIdentifier(courseRun.campusId))
  ) {
    return false
  }
  const entity = entityById.get(courseRun.legalEntityId)
  if (!entity || entity.tenantId !== courseRun.tenantId || entity.status === 'inactive') {
    return false
  }
  if (!courseRun.campusId) return true
  const campus = campusById.get(courseRun.campusId)
  if (!campus || campus.tenantId !== courseRun.tenantId) return false
  return activeCampusBindings.has(
    `${courseRun.tenantId}\u0000${courseRun.legalEntityId}\u0000${courseRun.campusId}`
  )
}

function resolveLimit(maxCourseRuns: number | undefined): number {
  const limit = maxCourseRuns ?? DEFAULT_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT
  if (
    !Number.isSafeInteger(limit) ||
    limit < 1 ||
    limit > HARD_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT
  ) {
    throw new MultiEntityTeacherScheduleInputError(
      'MULTI_ENTITY_TEACHER_SCHEDULE_INVALID_LIMIT',
      `maxCourseRuns must be an integer between 1 and ${HARD_MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT}.`
    )
  }
  return limit
}

function duplicateValidIds(
  courseRuns: readonly MultiEntityTeacherScheduleCourseRun[]
): ReadonlySet<string> {
  const counts = new Map<string, number>()
  for (const courseRun of courseRuns) {
    if (!validIdentifier(courseRun.id)) continue
    counts.set(courseRun.id, (counts.get(courseRun.id) ?? 0) + 1)
  }
  return new Set([...counts].filter(([, count]) => count > 1).map(([id]) => id))
}

function firstRecordMap<T extends { readonly id: string }>(records: readonly T[]): Map<string, T> {
  const result = new Map<string, T>()
  for (const record of records) {
    if (!result.has(record.id)) result.set(record.id, record)
  }
  return result
}

function validIdentifier(value: unknown): value is string {
  return typeof value === 'string' && IDENTIFIER_PATTERN.test(value)
}

function parseIsoDate(value: string): number | null {
  const match = DATE_PATTERN.exec(value)
  if (!match) return null
  const year = Number(match[1])
  const month = Number(match[2])
  const day = Number(match[3])
  const timestamp = Date.UTC(year, month - 1, day)
  const parsed = new Date(timestamp)
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    return null
  }
  return timestamp / MILLISECONDS_PER_DAY
}

function parseWeekdays(
  values: readonly MultiEntityScheduleWeekday[]
): ReadonlySet<MultiEntityScheduleWeekday> | null {
  if (!Array.isArray(values) || values.length === 0) return null
  const result = new Set<MultiEntityScheduleWeekday>()
  for (const value of values) {
    if (!WEEKDAY_SET.has(value) || result.has(value)) return null
    result.add(value)
  }
  return result
}

function parseTime(value: string): number | null {
  if (!TIME_PATTERN.test(value)) return null
  const [hour, minute, second] = value.split(':').map(Number)
  return hour! * 3_600 + minute! * 60 + second!
}

function setsIntersect<T>(left: ReadonlySet<T>, right: ReadonlySet<T>): boolean {
  for (const value of left) {
    if (right.has(value)) return true
  }
  return false
}

function timesOverlap(left: ParsedCourseRun, right: ParsedCourseRun): boolean {
  return left.startSecond < right.endSecond && right.startSecond < left.endSecond
}

function hasSharedWeekdayOccurrence(left: ParsedCourseRun, right: ParsedCourseRun): boolean {
  const firstDay = Math.max(left.startDay, right.startDay)
  const lastDay = Math.min(left.endDay, right.endDay)
  if (firstDay > lastDay) return false

  const sharedWeekdays = new Set(
    [...left.weekdays].filter((weekday) => right.weekdays.has(weekday))
  )
  if (sharedWeekdays.size === 0) return false

  for (let day = firstDay; day <= Math.min(lastDay, firstDay + 6); day += 1) {
    const weekday = WEEKDAYS[new Date(day * MILLISECONDS_PER_DAY).getUTCDay()]!
    if (sharedWeekdays.has(weekday)) return true
  }
  return false
}

function scheduleIssue(
  code: MultiEntityTeacherScheduleIssueCode,
  courseRunId: string,
  relatedId?: string,
  relatedCourseRunId?: string
): MultiEntityTeacherScheduleIssue {
  return {
    code,
    courseRunId,
    ...(relatedId === undefined ? {} : { relatedId }),
    ...(relatedCourseRunId === undefined ? {} : { relatedCourseRunId }),
  }
}

function compareIssues(
  left: MultiEntityTeacherScheduleIssue,
  right: MultiEntityTeacherScheduleIssue
): number {
  return (
    left.courseRunId.localeCompare(right.courseRunId) ||
    left.code.localeCompare(right.code) ||
    (left.relatedCourseRunId ?? '').localeCompare(right.relatedCourseRunId ?? '') ||
    (left.relatedId ?? '').localeCompare(right.relatedId ?? '')
  )
}
