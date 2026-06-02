import { describe, expect, it, vi } from 'vitest'
import {
  dateRangesOverlap,
  daysOverlap,
  evaluateInstructorAreaQualification,
  evaluateCourseRunAvailability,
  normalizeTime,
  relationId,
  relationIds,
  sameId,
  timeRangesOverlap,
  toSeconds,
  validatePublicationReadiness,
  type CourseRunPlanningDoc,
} from '../course-run-planning'

function payloadWithRuns(runs: CourseRunPlanningDoc[]) {
  return {
    find: vi.fn(async ({ collection }: { collection: string }) => {
      if (collection === 'course-runs') return { docs: runs }
      return { docs: [] }
    }),
  }
}

const readyPresentialRun: CourseRunPlanningDoc = {
  id: 10,
  tenant: 1,
  codigo: 'SC-2026-010',
  course: 187,
  campus: { id: 1, name: 'Sede Santa Cruz' },
  classroom: { id: 5, name: 'Aula 2' },
  start_date: '2026-09-01T00:00:00.000Z',
  end_date: '2026-12-20T00:00:00.000Z',
  schedule_days: ['monday', 'wednesday'],
  schedule_time_start: '10:00:00',
  schedule_time_end: '13:00:00',
  enrollment_status: 'open',
  status: 'draft',
  max_students: 18,
}

describe('course-run planning helpers', () => {
  it('normalizes relation values consistently', () => {
    expect(relationId(7)).toBe(7)
    expect(relationId('7')).toBe('7')
    expect(relationId({ id: 7, name: 'Aula 2' })).toBe(7)
    expect(relationId({ name: 'Sin id' })).toBeNull()
    expect(sameId({ id: 7 }, '7')).toBe(true)
    expect(relationIds([{ id: 7 }, '8', null, undefined])).toEqual([7, '8'])
  })

  it('normalizes and compares time ranges', () => {
    expect(normalizeTime('09:30')).toBe('09:30:00')
    expect(normalizeTime('09:30:15')).toBe('09:30:15')
    expect(normalizeTime('9:30')).toBeUndefined()
    expect(toSeconds('01:02:03')).toBe(3723)
    expect(timeRangesOverlap('10:00:00', '12:00:00', '11:59:00', '14:00:00')).toBe(true)
    expect(timeRangesOverlap('10:00:00', '12:00:00', '12:00:00', '14:00:00')).toBe(false)
  })

  it('compares date and weekday ranges', () => {
    expect(dateRangesOverlap('2026-09-01', '2026-09-30', '2026-09-30', '2026-10-10')).toBe(true)
    expect(dateRangesOverlap('2026-09-01', '2026-09-29', '2026-09-30', '2026-10-10')).toBe(false)
    expect(daysOverlap(['monday', 'wednesday'], ['friday', 'wednesday'])).toBe(true)
    expect(daysOverlap(['monday'], ['friday'])).toBe(false)
  })

  it('evaluates instructor area qualification when structured areas are present', () => {
    expect(evaluateInstructorAreaQualification({ full_name: 'Docente', qualified_areas: [3, { id: 4 }] }, 4)).toEqual(expect.objectContaining({
      ok: true,
      qualifiedAreaIds: [3, 4],
    }))

    expect(evaluateInstructorAreaQualification({ full_name: 'Docente', qualified_areas: [3] }, 4)).toEqual(expect.objectContaining({
      ok: false,
      reason: 'area_mismatch',
      requiredAreaId: 4,
    }))

    expect(evaluateInstructorAreaQualification({ full_name: 'Docente', qualified_areas: [] }, 4)).toEqual(expect.objectContaining({
      ok: true,
      reason: 'no_qualified_areas',
    }))
  })
})

describe('validatePublicationReadiness', () => {
  it('accepts a complete presential convocatoria', () => {
    expect(validatePublicationReadiness(readyPresentialRun)).toEqual([])
  })

  it('requires sede, aula and schedule for presential convocatorias', () => {
    expect(validatePublicationReadiness({
      ...readyPresentialRun,
      campus: null,
      classroom: null,
      schedule_days: [],
      schedule_time_start: null,
      schedule_time_end: null,
    })).toEqual(expect.arrayContaining([
      'La convocatoria presencial necesita sede.',
      'La convocatoria presencial necesita aula.',
      'La convocatoria necesita días de clase.',
      'La convocatoria necesita horario de inicio y fin.',
    ]))
  })

  it('does not require physical classroom data for online convocatorias', () => {
    expect(validatePublicationReadiness({
      ...readyPresentialRun,
      training_type: 'online',
      campus: null,
      classroom: null,
      schedule_days: [],
      schedule_time_start: null,
      schedule_time_end: null,
    })).toEqual([])
  })

  it('requires business-critical public fields', () => {
    expect(validatePublicationReadiness({
      id: 11,
      tenant: 1,
      status: 'draft',
    })).toEqual(expect.arrayContaining([
      'La convocatoria necesita un código público.',
      'La convocatoria necesita un curso o ciclo asociado.',
      'La convocatoria necesita fecha de inicio.',
      'La convocatoria necesita fecha de fin.',
      'La convocatoria necesita plazas configuradas.',
      'La convocatoria necesita estado de matrícula.',
    ]))
  })
})

describe('evaluateCourseRunAvailability', () => {
  it('returns no blockers when required planning range is incomplete', async () => {
    const payload = payloadWithRuns([])
    const availability = await evaluateCourseRunAvailability(payload, {
      ...readyPresentialRun,
      start_date: undefined,
    }, 1)

    expect(availability).toEqual({ blockers: [], warnings: [] })
    expect(payload.find).not.toHaveBeenCalled()
  })

  it('blocks classroom overlap in the same tenant, date, day and time range', async () => {
    const payload = payloadWithRuns([{
      id: 20,
      codigo: 'SC-2026-020',
      classroom: 5,
      start_date: '2026-09-15T00:00:00.000Z',
      end_date: '2026-10-15T00:00:00.000Z',
      schedule_days: ['wednesday'],
      schedule_time_start: '12:00:00',
      schedule_time_end: '14:00:00',
      status: 'published',
    }])

    const availability = await evaluateCourseRunAvailability(payload, readyPresentialRun, 1)

    expect(availability.blockers).toEqual([
      expect.objectContaining({
        type: 'classroom_overlap',
        severity: 'blocker',
        conflictingRunId: 20,
        conflictingRunCode: 'SC-2026-020',
      }),
    ])
    expect(payload.find).toHaveBeenCalledWith(expect.objectContaining({
      collection: 'course-runs',
      where: expect.objectContaining({
        and: expect.arrayContaining([
          { tenant: { equals: 1 } },
          { id: { not_equals: 10 } },
          { status: { not_in: ['cancelled', 'completed'] } },
        ]),
      }),
    }))
  })

  it('blocks instructor overlap across primary and secondary instructors', async () => {
    const payload = payloadWithRuns([{
      id: 21,
      codigo: 'N-2026-021',
      classroom: 99,
      instructor: { id: 44, full_name: 'Docente Activo' },
      start_date: '2026-09-01T00:00:00.000Z',
      end_date: '2026-11-01T00:00:00.000Z',
      schedule_days: ['monday'],
      schedule_time_start: '09:00:00',
      schedule_time_end: '11:00:00',
      status: 'published',
    }])

    const availability = await evaluateCourseRunAvailability(payload, {
      ...readyPresentialRun,
      instructor: null,
      instructors: ['44'],
    }, 1)

    expect(availability.blockers).toEqual([
      expect.objectContaining({
        type: 'instructor_overlap',
        severity: 'blocker',
        conflictingRunId: 21,
      }),
    ])
  })

  it('ignores conflicts outside overlapping dates, days or times', async () => {
    const payload = payloadWithRuns([
      { ...readyPresentialRun, id: 30, classroom: 5, start_date: '2027-01-01', end_date: '2027-02-01' },
      { ...readyPresentialRun, id: 31, classroom: 5, schedule_days: ['friday'] },
      { ...readyPresentialRun, id: 32, classroom: 5, schedule_time_start: '13:00:00', schedule_time_end: '15:00:00' },
    ])

    const availability = await evaluateCourseRunAvailability(payload, readyPresentialRun, 1)

    expect(availability).toEqual({ blockers: [], warnings: [] })
  })
})
