import { describe, expect, it } from 'vitest'
import {
  filterInstructorOptions,
  getInstructorAvailability,
  prepareInstructorOptions,
} from '../instructor-availability'

describe('getInstructorAvailability', () => {
  it('explains that a teacher without qualified areas cannot be assigned to an area-bound course', () => {
    expect(getInstructorAvailability({
      instructor: { id: 1, qualifiedAreas: [] },
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [],
    })).toEqual({
      disabled: true,
      reasons: ['Sin áreas habilitadas en su ficha docente.'],
    })
  })

  it('explains the required area when the teacher is not qualified for it', () => {
    expect(getInstructorAvailability({
      instructor: { id: 2, qualifiedAreas: [{ id: 4, name: 'Administración' }] },
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [],
    })).toEqual({
      disabled: true,
      reasons: ['No habilitado para el área Área Sanitaria y Clínica.'],
    })
  })

  it('identifies the convocatoria and timetable that occupy an otherwise eligible teacher', () => {
    expect(getInstructorAvailability({
      instructor: { id: 3, qualifiedAreas: [{ id: 7 }] },
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [{
        instructorId: 3,
        conflictingRunCode: 'SC-2026-010',
        scheduleDays: ['wednesday'],
        scheduleTimeStart: '16:30:00',
        scheduleTimeEnd: '19:30:00',
      }],
    })).toEqual({
      disabled: true,
      reasons: ['Ocupado por SC-2026-010: miércoles, 16:30-19:30.'],
    })
  })

  it('keeps all applicable reasons instead of hiding an area problem behind a generic unavailable label', () => {
    expect(getInstructorAvailability({
      instructor: { id: 4, qualifiedAreas: [] },
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [{
        instructorId: 4,
        conflictingRunCode: 'SC-2026-011',
        scheduleDays: ['wednesday'],
        scheduleTimeStart: '16:00:00',
        scheduleTimeEnd: '19:00:00',
      }],
    })).toEqual({
      disabled: true,
      reasons: [
        'Sin áreas habilitadas en su ficha docente.',
        'Ocupado por SC-2026-011: miércoles, 16:00-19:00.',
      ],
    })
  })

  it('keeps a teacher selectable when the course has no required area and there is no time conflict', () => {
    expect(getInstructorAvailability({
      instructor: { id: 5, qualifiedAreas: [] },
      requiredAreaId: null,
      requiredAreaName: null,
      timeConflicts: [],
    })).toEqual({ disabled: false, reasons: [] })
  })

  it('matches numeric instructor ids against string conflict ids and handles a missing time range', () => {
    expect(getInstructorAvailability({
      instructor: { id: 6, qualifiedAreas: [7] },
      requiredAreaId: '7',
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [{
        instructorId: '6',
        conflictingRunCode: 'SC-2026-012',
        scheduleDays: ['monday'],
      }],
    })).toEqual({
      disabled: true,
      reasons: ['Ocupado por SC-2026-012: lunes.'],
    })
  })

  it('does not repeat the same reason when a provider returns a duplicate conflict', () => {
    const conflict = {
      instructorId: 7,
      conflictingRunId: 12,
      conflictingRunCode: 'SC-2026-013',
      scheduleDays: ['tuesday'],
      scheduleTimeStart: '10:00:00',
      scheduleTimeEnd: '12:00:00',
    }
    expect(getInstructorAvailability({
      instructor: { id: 7, qualifiedAreas: [7] },
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [conflict, conflict],
    })).toEqual({
      disabled: true,
      reasons: ['Ocupado por SC-2026-013: martes, 10:00-12:00.'],
    })
  })

  it('orders eligible teachers before unavailable teachers without hiding either group', () => {
    const options = prepareInstructorOptions({
      instructors: [
        { id: 1, name: 'Zoe', qualifiedAreas: [] },
        { id: 2, name: 'Ana', qualifiedAreas: [7] },
        { id: 3, name: 'Berta', qualifiedAreas: [7] },
      ],
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [{
        instructorId: 3,
        conflictingRunCode: 'SC-2026-014',
        scheduleDays: ['monday'],
      }],
      getName: (instructor) => instructor.name,
    })

    expect(options.map((option) => [option.instructor.id, option.disabled])).toEqual([
      [2, false],
      [3, true],
      [1, true],
    ])
  })

  it('searches names accent-insensitively and can find an unavailable reason', () => {
    const options = prepareInstructorOptions({
      instructors: [
        { id: 1, name: 'Ángel Cruz', qualifiedAreas: [7] },
        { id: 2, name: 'Beatriz Pérez', qualifiedAreas: [] },
      ],
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [],
      getName: (instructor) => instructor.name,
    })

    expect(filterInstructorOptions({
      options,
      query: 'angel',
      getName: (instructor) => instructor.name,
    }).map((option) => option.instructor.id)).toEqual([1])

    expect(filterInstructorOptions({
      options,
      query: 'sin areas',
      getName: (instructor) => instructor.name,
    }).map((option) => option.instructor.id)).toEqual([2])
  })

  it('preserves the currently selected teacher while filtering so an existing assignment is never lost', () => {
    const options = prepareInstructorOptions({
      instructors: [
        { id: 1, name: 'Ana', qualifiedAreas: [7] },
        { id: 2, name: 'Carlos', qualifiedAreas: [] },
      ],
      requiredAreaId: 7,
      requiredAreaName: 'Área Sanitaria y Clínica',
      timeConflicts: [],
      getName: (instructor) => instructor.name,
    })

    expect(filterInstructorOptions({
      options,
      query: 'ana',
      getName: (instructor) => instructor.name,
      preserveInstructorIds: [2],
    }).map((option) => option.instructor.id)).toEqual([1, 2])
  })
})
