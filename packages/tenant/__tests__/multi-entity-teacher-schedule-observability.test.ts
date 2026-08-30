import { describe, expect, it } from 'vitest'
import { createRedactedTeacherScheduleObservation } from '../src/multi-entity-teacher-schedule-observability'
import { planPayloadTeacherScheduleShadow } from '../src/multi-entity-teacher-schedule-projection'
import type { PayloadTeacherScheduleSnapshot } from '../src/multi-entity-teacher-schedule-projection'

const input: PayloadTeacherScheduleSnapshot = {
  targetTenantId: 'tenant-secret',
  topology: {
    legalEntities: [
      { id: 'entity-norte-secret', tenantId: 'tenant-secret', status: 'validated' },
      { id: 'entity-sur-secret', tenantId: 'tenant-secret', status: 'proposed' },
    ],
    campuses: [
      { id: 'campus-norte-secret', tenantId: 'tenant-secret' },
      { id: 'campus-sur-secret', tenantId: 'tenant-secret' },
    ],
    campusBindings: [
      {
        id: 'binding-norte-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-norte-secret',
        campusId: 'campus-norte-secret',
        status: 'validated',
      },
      {
        id: 'binding-sur-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-sur-secret',
        campusId: 'campus-sur-secret',
        status: 'proposed',
      },
    ],
    staffAssignments: [
      {
        id: 'assignment-norte-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-norte-secret',
        staffId: 'teacher-secret',
        campusIds: ['campus-norte-secret'],
        status: 'validated',
      },
      {
        id: 'assignment-sur-secret',
        tenantId: 'tenant-secret',
        legalEntityId: 'entity-sur-secret',
        staffId: 'teacher-secret',
        campusIds: ['campus-sur-secret'],
        status: 'proposed',
      },
    ],
    accountingConnections: [],
  },
  courseRuns: [
    {
      id: 'run-norte-secret',
      tenant: 'tenant-secret',
      legalEntity: 'entity-norte-secret',
      campus: 'campus-norte-secret',
      instructor: 'teacher-secret',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      schedule_days: ['monday'],
      schedule_time_start: '09:00:00',
      schedule_time_end: '11:00:00',
      planning_status: 'published',
    },
    {
      id: 'run-sur-secret',
      tenant: 'tenant-secret',
      legalEntity: 'entity-sur-secret',
      campus: 'campus-sur-secret',
      instructor: 'teacher-secret',
      start_date: '2026-09-01',
      end_date: '2026-09-30',
      schedule_days: ['monday'],
      schedule_time_start: '10:00:00',
      schedule_time_end: '12:00:00',
      planning_status: 'published',
    },
  ],
}

describe('teacher schedule redacted observability', () => {
  it('emits only aggregate metrics and safe issue codes', () => {
    const plan = planPayloadTeacherScheduleShadow(input)
    const before = JSON.stringify(plan)
    const observation = createRedactedTeacherScheduleObservation(plan)

    expect(observation).toEqual({
      mode: 'shadow_teacher_schedule_observation',
      verdict: 'blocked',
      projection: {
        sourceCourseRuns: 2,
        projectedCourseRuns: 2,
        blockedCourseRuns: 0,
        outsideTargetTenant: 0,
        unresolvedAssignments: 0,
        courseRunsWithoutTeachers: 0,
        topologyIssues: 0,
        issues: 0,
      },
      validation: {
        activeCourseRuns: 2,
        conflictEligibleCourseRuns: 2,
        teacherBookings: 2,
        blockedCourseRuns: 2,
        conflicts: 1,
        issues: 1,
      },
      projectionIssueCounts: {},
      validationIssueCounts: { teacher_schedule_overlap: 1 },
    })
    expect(JSON.stringify(plan)).toBe(before)

    const serialized = JSON.stringify(observation)
    for (const secret of [
      'tenant-secret',
      'entity-norte-secret',
      'entity-sur-secret',
      'campus-norte-secret',
      'campus-sur-secret',
      'teacher-secret',
      'assignment-norte-secret',
      'assignment-sur-secret',
      'run-norte-secret',
      'run-sur-secret',
    ]) {
      expect(serialized).not.toContain(secret)
    }
  })

  it('aggregates projection blockers without copying their related identifiers', () => {
    const observation = createRedactedTeacherScheduleObservation(
      planPayloadTeacherScheduleShadow({
        ...input,
        courseRuns: [{ ...input.courseRuns[0]!, legalEntity: undefined }],
      })
    )

    expect(observation).toMatchObject({
      verdict: 'blocked',
      projection: { sourceCourseRuns: 1, projectedCourseRuns: 0, blockedCourseRuns: 1 },
      projectionIssueCounts: { legal_entity_relationship_missing: 1 },
      validation: { conflicts: 0 },
    })
    expect(JSON.stringify(observation)).not.toContain('run-norte-secret')
  })
})
