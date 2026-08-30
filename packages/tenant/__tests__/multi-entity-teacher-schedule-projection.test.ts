import { describe, expect, it } from 'vitest'
import {
  planPayloadTeacherScheduleShadow,
  projectPayloadTeacherScheduleSnapshot,
  type PayloadTeacherScheduleCourseRunRecord,
  type PayloadTeacherScheduleSnapshot,
} from '../src/multi-entity-teacher-schedule-projection'
import type { MultiEntityTopology } from '../src/multi-entity-topology'

const topology: MultiEntityTopology = {
  legalEntities: [
    { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
    { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
  ],
  campuses: [
    { id: 'campus-norte', tenantId: 'cep' },
    { id: 'campus-sur', tenantId: 'cep' },
  ],
  campusBindings: [
    {
      id: 'binding-norte',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      campusId: 'campus-norte',
      status: 'validated',
    },
    {
      id: 'binding-sur',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      status: 'proposed',
    },
  ],
  staffAssignments: [
    {
      id: 'assignment-norte-current',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      staffId: 'teacher-shared',
      campusIds: ['campus-norte'],
      status: 'validated',
    },
    {
      id: 'assignment-norte-history',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      staffId: 'teacher-shared',
      campusIds: ['campus-norte'],
      status: 'suspended',
    },
    {
      id: 'assignment-sur-current',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-shared',
      campusIds: ['campus-sur'],
      status: 'proposed',
    },
    {
      id: 'assignment-ambiguous-1',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-ambiguous',
      campusIds: ['campus-sur'],
      status: 'suspended',
    },
    {
      id: 'assignment-ambiguous-2',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-ambiguous',
      campusIds: ['campus-sur'],
      status: 'suspended',
    },
  ],
  accountingConnections: [],
}

const nortePayloadRun: PayloadTeacherScheduleCourseRunRecord = {
  id: 101,
  tenant: { id: 'cep' },
  legalEntity: { id: 'entity-norte' },
  campus: { id: 'campus-norte' },
  instructor: { id: 'teacher-shared' },
  instructors: ['teacher-shared'],
  start_date: '2026-09-01T00:00:00.000Z',
  end_date: '2026-09-30T00:00:00.000Z',
  schedule_days: ['monday', 'wednesday'],
  schedule_time_start: '9:00:00',
  schedule_time_end: '11:00:00',
  planning_status: 'published',
}

function snapshotWith(
  courseRuns: readonly PayloadTeacherScheduleCourseRunRecord[],
  overrides: Partial<PayloadTeacherScheduleSnapshot> = {}
): PayloadTeacherScheduleSnapshot {
  return { targetTenantId: 'cep', topology, courseRuns, ...overrides }
}

describe('Payload teacher schedule shadow projection', () => {
  it('normalizes Payload relationships, dates and times without mutating the snapshot', () => {
    const courseRuns = [nortePayloadRun]
    const before = JSON.stringify(courseRuns)
    const result = projectPayloadTeacherScheduleSnapshot(snapshotWith(courseRuns))

    expect(JSON.stringify(courseRuns)).toBe(before)
    expect(result).toEqual({
      mode: 'shadow_payload_teacher_schedule_projection',
      canWrite: false,
      canApply: false,
      readyForValidation: true,
      courseRuns: [
        {
          id: '101',
          tenantId: 'cep',
          legalEntityId: 'entity-norte',
          campusId: 'campus-norte',
          staffAssignmentIds: ['assignment-norte-current'],
          startDate: '2026-09-01',
          endDate: '2026-09-30',
          scheduleDays: ['monday', 'wednesday'],
          scheduleTimeStart: '09:00:00',
          scheduleTimeEnd: '11:00:00',
          status: 'published',
        },
      ],
      issues: [],
      summary: {
        sourceCourseRuns: 1,
        projectedCourseRuns: 1,
        blockedCourseRuns: 0,
        outsideTargetTenant: 0,
        unresolvedAssignments: 0,
        courseRunsWithoutTeachers: 0,
        topologyIssues: 0,
      },
    })
  })

  it('detects a cross-entity overlap after resolving local assignments', () => {
    const result = planPayloadTeacherScheduleShadow(
      snapshotWith([
        nortePayloadRun,
        {
          ...nortePayloadRun,
          id: 202,
          legalEntity: 'entity-sur',
          campus: 'campus-sur',
          instructor: 'teacher-shared',
          instructors: [],
          schedule_time_start: '10:30:00',
          schedule_time_end: '12:00:00',
        },
      ])
    )

    expect(result).toMatchObject({
      mode: 'shadow_payload_teacher_schedule_plan',
      canWrite: false,
      canApply: false,
      ready: false,
      projection: { readyForValidation: true },
      validation: {
        ready: false,
        summary: { conflicts: 1, blockedCourseRuns: 2 },
        issues: [
          {
            code: 'teacher_schedule_overlap',
            courseRunId: '101',
            relatedCourseRunId: '202',
          },
        ],
      },
    })
    expect(result.projection.courseRuns.map((run) => run.staffAssignmentIds)).toEqual([
      ['assignment-norte-current'],
      ['assignment-sur-current'],
    ])
  })

  it('never infers a missing legal entity from campus', () => {
    const result = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([{ ...nortePayloadRun, legalEntity: undefined }])
    )

    expect(result.readyForValidation).toBe(false)
    expect(result.courseRuns).toEqual([])
    expect(result.issues).toEqual([
      { code: 'legal_entity_relationship_missing', courseRunId: '101' },
    ])
  })

  it('excludes records outside the target tenant', () => {
    const result = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([{ ...nortePayloadRun, tenant: 'another-tenant' }])
    )

    expect(result.courseRuns).toEqual([])
    expect(result.summary.outsideTargetTenant).toBe(1)
    expect(result.issues).toEqual([{ code: 'record_outside_target_tenant', courseRunId: '101' }])
  })

  it('reports malformed instructor relations and unresolved assignments without guessing', () => {
    const result = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([
        {
          ...nortePayloadRun,
          id: 'run-sur',
          legalEntity: 'entity-sur',
          campus: 'campus-sur',
          instructor: 'teacher-missing',
          instructors: [{ nope: 'teacher' }, 'teacher-ambiguous'],
        },
      ])
    )

    expect(result.readyForValidation).toBe(false)
    expect(result.courseRuns[0]?.staffAssignmentIds).toEqual([])
    expect(result.summary.unresolvedAssignments).toBe(2)
    expect(result.issues.map((issue) => issue.code)).toEqual([
      'instructor_relationship_invalid',
      'staff_assignment_ambiguous',
      'staff_assignment_missing',
    ])
  })

  it('rejects structurally incomplete scheduling fields', () => {
    const result = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([{ ...nortePayloadRun, schedule_days: 'monday' }])
    )

    expect(result.courseRuns).toEqual([])
    expect(result.issues).toEqual([{ code: 'schedule_shape_invalid', courseRunId: '101' }])
  })

  it('excludes every duplicate ID deterministically', () => {
    const duplicate = { ...nortePayloadRun, id: 'duplicate' }
    const forward = projectPayloadTeacherScheduleSnapshot(snapshotWith([duplicate, duplicate]))
    const reverse = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([...([duplicate, duplicate] as const)].reverse())
    )

    expect(forward).toEqual(reverse)
    expect(forward.courseRuns).toEqual([])
    expect(forward.issues).toEqual([{ code: 'duplicate_course_run_id', courseRunId: 'duplicate' }])
  })

  it('fails closed before projection when topology is invalid', () => {
    const invalidTopology: MultiEntityTopology = {
      ...topology,
      campusBindings: [
        ...topology.campusBindings,
        {
          id: 'binding-crossed',
          tenantId: 'cep',
          legalEntityId: 'entity-sur',
          campusId: 'campus-norte',
          status: 'proposed',
        },
      ],
    }
    const result = projectPayloadTeacherScheduleSnapshot(
      snapshotWith([nortePayloadRun], { topology: invalidTopology })
    )

    expect(result.readyForValidation).toBe(false)
    expect(result.courseRuns).toEqual([])
    expect(result.issues).toEqual([{ code: 'topology_invalid' }])
    expect(result.summary.topologyIssues).toBeGreaterThan(0)
  })

  it('enforces bounded snapshots and invalid limit values', () => {
    expect(
      projectPayloadTeacherScheduleSnapshot(snapshotWith([nortePayloadRun], { maxCourseRuns: 0 }))
    ).toMatchObject({ readyForValidation: false, issues: [{ code: 'record_limit_exceeded' }] })
    expect(
      projectPayloadTeacherScheduleSnapshot(
        snapshotWith([nortePayloadRun, { ...nortePayloadRun, id: 202 }], {
          maxCourseRuns: 1,
        })
      )
    ).toMatchObject({ readyForValidation: false, issues: [{ code: 'record_limit_exceeded' }] })
  })
})
