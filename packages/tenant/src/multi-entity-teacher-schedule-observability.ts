import type {
  PayloadTeacherScheduleProjectionIssueCode,
  PayloadTeacherScheduleShadowPlan,
} from './multi-entity-teacher-schedule-projection'
import type { MultiEntityTeacherScheduleIssueCode } from './multi-entity-teacher-schedule'

export interface RedactedTeacherScheduleProjectionMetrics {
  readonly sourceCourseRuns: number
  readonly projectedCourseRuns: number
  readonly blockedCourseRuns: number
  readonly outsideTargetTenant: number
  readonly unresolvedAssignments: number
  readonly courseRunsWithoutTeachers: number
  readonly topologyIssues: number
  readonly issues: number
}

export interface RedactedTeacherScheduleValidationMetrics {
  readonly activeCourseRuns: number
  readonly conflictEligibleCourseRuns: number
  readonly teacherBookings: number
  readonly blockedCourseRuns: number
  readonly conflicts: number
  readonly issues: number
}

export interface RedactedTeacherScheduleObservation {
  readonly mode: 'shadow_teacher_schedule_observation'
  readonly verdict: 'ready' | 'blocked'
  readonly projection: RedactedTeacherScheduleProjectionMetrics
  readonly validation: RedactedTeacherScheduleValidationMetrics
  readonly projectionIssueCounts: Readonly<
    Partial<Record<PayloadTeacherScheduleProjectionIssueCode, number>>
  >
  readonly validationIssueCounts: Readonly<
    Partial<Record<MultiEntityTeacherScheduleIssueCode, number>>
  >
}

/**
 * Converts an internal schedule plan into allow-listed aggregate telemetry.
 * Tenant, entity, campus, teacher, assignment and course-run identifiers are
 * deliberately omitted.
 */
export function createRedactedTeacherScheduleObservation(
  plan: PayloadTeacherScheduleShadowPlan
): RedactedTeacherScheduleObservation {
  const projectionIssueCounts = countCodes(
    plan.projection.issues.map((issue) => issue.code)
  ) as Partial<Record<PayloadTeacherScheduleProjectionIssueCode, number>>
  const validationIssueCounts = countCodes(
    plan.validation.issues.map((issue) => issue.code)
  ) as Partial<Record<MultiEntityTeacherScheduleIssueCode, number>>

  return Object.freeze({
    mode: 'shadow_teacher_schedule_observation',
    verdict: plan.ready ? 'ready' : 'blocked',
    projection: Object.freeze({
      sourceCourseRuns: plan.projection.summary.sourceCourseRuns,
      projectedCourseRuns: plan.projection.summary.projectedCourseRuns,
      blockedCourseRuns: plan.projection.summary.blockedCourseRuns,
      outsideTargetTenant: plan.projection.summary.outsideTargetTenant,
      unresolvedAssignments: plan.projection.summary.unresolvedAssignments,
      courseRunsWithoutTeachers: plan.projection.summary.courseRunsWithoutTeachers,
      topologyIssues: plan.projection.summary.topologyIssues,
      issues: plan.projection.issues.length,
    }),
    validation: Object.freeze({
      activeCourseRuns: plan.validation.summary.activeCourseRuns,
      conflictEligibleCourseRuns: plan.validation.summary.conflictEligibleCourseRuns,
      teacherBookings: plan.validation.summary.teacherBookings,
      blockedCourseRuns: plan.validation.summary.blockedCourseRuns,
      conflicts: plan.validation.summary.conflicts,
      issues: plan.validation.issues.length,
    }),
    projectionIssueCounts: Object.freeze(projectionIssueCounts),
    validationIssueCounts: Object.freeze(validationIssueCounts),
  })
}

function countCodes(codes: readonly string[]): Readonly<Record<string, number>> {
  const counts = new Map<string, number>()
  for (const code of codes) counts.set(code, (counts.get(code) ?? 0) + 1)
  return Object.fromEntries([...counts].sort(([left], [right]) => left.localeCompare(right)))
}
