export type StudentEnrollmentJoinInput = {
  email?: string | null
}

export type EnrollmentJoinRow = {
  email?: string | null
  status?: string | null
  campusName?: string | null
  courseName?: string | null
  cycleName?: string | null
}

export type StudentEnrollmentJoin = {
  sede: string
  curso_actual: string
  ciclo: string
  enrolled_courses: number
  completed_courses: number
}

const EMPTY_JOIN: StudentEnrollmentJoin = {
  sede: 'Sin sede',
  curso_actual: '-',
  ciclo: '-',
  enrolled_courses: 0,
  completed_courses: 0,
}

function normalizeEmail(value: string | null | undefined): string {
  return (value ?? '').trim().toLowerCase()
}

export function joinStudentWithEnrollments(
  student: StudentEnrollmentJoinInput,
  enrollments: EnrollmentJoinRow[],
): StudentEnrollmentJoin {
  const email = normalizeEmail(student.email)
  if (!email) return EMPTY_JOIN

  const matches = enrollments.filter((row) => normalizeEmail(row.email) === email)
  if (matches.length === 0) return EMPTY_JOIN

  const active = matches.find((row) => {
    const status = (row.status ?? '').toLowerCase()
    return status !== 'cancelled' && status !== 'completed'
  }) ?? matches[0]

  return {
    sede: active.campusName?.trim() || 'Sin sede',
    curso_actual: active.courseName?.trim() || '-',
    ciclo: active.cycleName?.trim() || '-',
    enrolled_courses: matches.length,
    completed_courses: matches.filter((row) => (row.status ?? '').toLowerCase() === 'completed').length,
  }
}
