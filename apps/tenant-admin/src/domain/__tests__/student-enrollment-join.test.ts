import { describe, expect, it } from 'vitest'
import { joinStudentWithEnrollments } from '../student-enrollment-join'

describe('joinStudentWithEnrollments', () => {
  it('fills sede, course and cycle from matching email', () => {
    const joined = joinStudentWithEnrollments(
      { email: 'ana@example.test' },
      [
        {
          email: 'ANA@example.test',
          status: 'confirmed',
          campusName: 'Sede Norte',
          courseName: 'Auxiliar de enfermería',
          cycleName: 'Sanidad',
        },
      ],
    )
    expect(joined.sede).toBe('Sede Norte')
    expect(joined.curso_actual).toBe('Auxiliar de enfermería')
    expect(joined.ciclo).toBe('Sanidad')
    expect(joined.enrolled_courses).toBe(1)
  })

  it('returns empty labels when there is no email match', () => {
    const joined = joinStudentWithEnrollments({ email: 'nadie@example.test' }, [
      { email: 'otra@example.test', campusName: 'Sede Sur' },
    ])
    expect(joined.sede).toBe('Sin sede')
    expect(joined.curso_actual).toBe('-')
  })
})
