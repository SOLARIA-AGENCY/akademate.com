import { describe, expect, it } from 'vitest'
import { getInstructorAvailability } from '../instructor-availability'

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
})
