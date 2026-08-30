import { describe, expect, it } from 'vitest'
import {
  MultiEntityTeacherScheduleError,
  MultiEntityTeacherScheduleInputError,
  assertValidMultiEntityTeacherSchedule,
  validateMultiEntityTeacherSchedule,
  type MultiEntityTeacherScheduleCourseRun,
  type MultiEntityTeacherScheduleInput,
} from '../src/multi-entity-teacher-schedule'
import { MultiEntityTopologyError, type MultiEntityTopology } from '../src/multi-entity-topology'

const topology: MultiEntityTopology = {
  legalEntities: [
    { id: 'entity-norte', tenantId: 'cep', status: 'validated' },
    { id: 'entity-santa-cruz', tenantId: 'cep', status: 'validated' },
    { id: 'entity-sur', tenantId: 'cep', status: 'proposed' },
  ],
  campuses: [
    { id: 'campus-norte', tenantId: 'cep' },
    { id: 'campus-santa-cruz', tenantId: 'cep' },
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
      id: 'binding-santa-cruz',
      tenantId: 'cep',
      legalEntityId: 'entity-santa-cruz',
      campusId: 'campus-santa-cruz',
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
      id: 'assignment-norte-shared',
      tenantId: 'cep',
      legalEntityId: 'entity-norte',
      staffId: 'teacher-shared',
      campusIds: ['campus-norte'],
      status: 'validated',
    },
    {
      id: 'assignment-santa-cruz-shared',
      tenantId: 'cep',
      legalEntityId: 'entity-santa-cruz',
      staffId: 'teacher-shared',
      campusIds: ['campus-santa-cruz'],
      status: 'validated',
    },
    {
      id: 'assignment-sur-shared',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-shared',
      campusIds: ['campus-sur'],
      status: 'proposed',
    },
    {
      id: 'assignment-sur-other',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-other',
      campusIds: ['campus-sur'],
      status: 'validated',
    },
    {
      id: 'assignment-sur-suspended',
      tenantId: 'cep',
      legalEntityId: 'entity-sur',
      staffId: 'teacher-suspended',
      campusIds: ['campus-sur'],
      status: 'suspended',
    },
  ],
  accountingConnections: [],
}

const norteRun: MultiEntityTeacherScheduleCourseRun = {
  id: 'run-norte',
  tenantId: 'cep',
  legalEntityId: 'entity-norte',
  campusId: 'campus-norte',
  staffAssignmentIds: ['assignment-norte-shared'],
  startDate: '2026-09-01',
  endDate: '2026-09-30',
  scheduleDays: ['monday', 'wednesday'],
  scheduleTimeStart: '09:00:00',
  scheduleTimeEnd: '11:00:00',
  status: 'published',
}

function inputWith(
  courseRuns: readonly MultiEntityTeacherScheduleCourseRun[],
  overrides: Partial<MultiEntityTeacherScheduleInput> = {}
): MultiEntityTeacherScheduleInput {
  return { topology, courseRuns, ...overrides }
}

describe('CEP multi-entity teacher schedule shadow validation', () => {
  it('allows the shared master teacher in independent non-overlapping entity slots', () => {
    const result = validateMultiEntityTeacherSchedule(
      inputWith([
        norteRun,
        {
          ...norteRun,
          id: 'run-sur',
          legalEntityId: 'entity-sur',
          campusId: 'campus-sur',
          staffAssignmentIds: ['assignment-sur-shared'],
          scheduleTimeStart: '11:00:00',
          scheduleTimeEnd: '13:00:00',
        },
      ])
    )

    expect(result).toEqual({
      mode: 'shadow_teacher_schedule_validation',
      canWrite: false,
      canApply: false,
      ready: true,
      summary: {
        courseRuns: 2,
        activeCourseRuns: 2,
        conflictEligibleCourseRuns: 2,
        teacherBookings: 2,
        blockedCourseRuns: 0,
        conflicts: 0,
      },
      issues: [],
    })
  })

  it('detects the same master teacher across different entity assignment IDs', () => {
    const result = validateMultiEntityTeacherSchedule(
      inputWith([
        norteRun,
        {
          ...norteRun,
          id: 'run-sur',
          legalEntityId: 'entity-sur',
          campusId: 'campus-sur',
          staffAssignmentIds: ['assignment-sur-shared'],
          scheduleTimeStart: '10:30:00',
          scheduleTimeEnd: '12:00:00',
        },
      ])
    )

    expect(result.ready).toBe(false)
    expect(result.summary).toMatchObject({ blockedCourseRuns: 2, conflicts: 1 })
    expect(result.issues).toEqual([
      {
        code: 'teacher_schedule_overlap',
        courseRunId: 'run-norte',
        relatedCourseRunId: 'run-sur',
      },
    ])
    expect(() =>
      assertValidMultiEntityTeacherSchedule(
        inputWith([
          norteRun,
          {
            ...norteRun,
            id: 'run-sur',
            legalEntityId: 'entity-sur',
            campusId: 'campus-sur',
            staffAssignmentIds: ['assignment-sur-shared'],
          },
        ])
      )
    ).toThrow(MultiEntityTeacherScheduleError)
  })

  it('allows adjacent slots and schedules without a real shared weekday occurrence', () => {
    const adjacent = {
      ...norteRun,
      id: 'run-sur-adjacent',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      staffAssignmentIds: ['assignment-sur-shared'],
      scheduleTimeStart: '11:00:00',
      scheduleTimeEnd: '12:00:00',
    } as const
    const dateEdge = {
      ...norteRun,
      id: 'run-sur-date-edge',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      staffAssignmentIds: ['assignment-sur-shared'],
      startDate: '2026-09-05',
      endDate: '2026-09-06',
      scheduleDays: ['monday'] as const,
    }

    expect(validateMultiEntityTeacherSchedule(inputWith([norteRun, adjacent])).ready).toBe(true)
    expect(validateMultiEntityTeacherSchedule(inputWith([norteRun, dateEdge])).ready).toBe(true)
  })

  it('ignores cancelled and completed runs for conflict detection', () => {
    for (const status of ['cancelled', 'completed'] as const) {
      const result = validateMultiEntityTeacherSchedule(
        inputWith([
          norteRun,
          {
            ...norteRun,
            id: `run-sur-${status}`,
            legalEntityId: 'entity-sur',
            campusId: 'campus-sur',
            staffAssignmentIds: ['assignment-sur-shared'],
            status,
          },
        ])
      )
      expect(result.ready).toBe(true)
      expect(result.summary.activeCourseRuns).toBe(1)
    }
  })

  it('fails closed on missing, suspended, cross-entity and cross-campus assignments', () => {
    const result = validateMultiEntityTeacherSchedule(
      inputWith([
        {
          ...norteRun,
          staffAssignmentIds: [
            'missing-assignment',
            'assignment-sur-suspended',
            'assignment-sur-shared',
          ],
        },
        {
          ...norteRun,
          id: 'run-sur-wrong-campus',
          legalEntityId: 'entity-sur',
          campusId: 'campus-santa-cruz',
          staffAssignmentIds: ['assignment-sur-other'],
        },
      ])
    )

    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'staff_assignment_missing',
        'staff_assignment_suspended',
        'staff_assignment_scope_mismatch',
        'invalid_course_run_scope',
        'staff_assignment_campus_mismatch',
      ])
    )
  })

  it('rejects malformed dates, weekdays, times, statuses and duplicate IDs', () => {
    const malformed = {
      ...norteRun,
      startDate: '2026-02-30',
      endDate: '2026-02-01',
      scheduleDays: ['monday', 'monday'],
      scheduleTimeStart: '9:00:00',
      scheduleTimeEnd: '09:00:00',
      status: 'unknown',
    } as unknown as MultiEntityTeacherScheduleCourseRun
    const result = validateMultiEntityTeacherSchedule(inputWith([malformed, malformed]))

    expect(result.ready).toBe(false)
    expect(result.summary.conflictEligibleCourseRuns).toBe(0)
    expect(result.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        'duplicate_course_run_id',
        'invalid_course_run_status',
        'invalid_date_range',
        'invalid_schedule_days',
        'invalid_schedule_time',
      ])
    )
  })

  it('enforces bounded input and rejects invalid limits', () => {
    expect(() =>
      validateMultiEntityTeacherSchedule(inputWith([norteRun], { maxCourseRuns: 0 }))
    ).toThrowError(
      expect.objectContaining<Partial<MultiEntityTeacherScheduleInputError>>({
        code: 'MULTI_ENTITY_TEACHER_SCHEDULE_INVALID_LIMIT',
      })
    )
    expect(() =>
      validateMultiEntityTeacherSchedule(
        inputWith([norteRun, { ...norteRun, id: 'run-2' }], {
          maxCourseRuns: 1,
        })
      )
    ).toThrowError(
      expect.objectContaining<Partial<MultiEntityTeacherScheduleInputError>>({
        code: 'MULTI_ENTITY_TEACHER_SCHEDULE_LIMIT_EXCEEDED',
      })
    )
  })

  it('is deterministic, does not mutate input and does not expose teacher identifiers', () => {
    const surRun: MultiEntityTeacherScheduleCourseRun = {
      ...norteRun,
      id: 'run-sur',
      legalEntityId: 'entity-sur',
      campusId: 'campus-sur',
      staffAssignmentIds: ['assignment-sur-shared', 'assignment-sur-shared'],
    }
    const courseRuns = [surRun, norteRun]
    const before = JSON.stringify(courseRuns)
    const forward = validateMultiEntityTeacherSchedule(inputWith(courseRuns))
    const reverse = validateMultiEntityTeacherSchedule(inputWith([...courseRuns].reverse()))

    expect(forward).toEqual(reverse)
    expect(JSON.stringify(courseRuns)).toBe(before)
    expect(JSON.stringify(forward)).not.toContain('teacher-shared')
    expect(forward.summary.teacherBookings).toBe(2)
  })

  it('fails closed on invalid topology before schedule assertion', () => {
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

    expect(() =>
      assertValidMultiEntityTeacherSchedule({ topology: invalidTopology, courseRuns: [norteRun] })
    ).toThrow(MultiEntityTopologyError)
  })
})
