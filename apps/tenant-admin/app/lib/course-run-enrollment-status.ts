export const COURSE_RUN_ENROLLMENT_STATUSES = [
  'open',
  'closed',
  'scheduled',
  'always_open',
] as const

export type CourseRunEnrollmentStatus = (typeof COURSE_RUN_ENROLLMENT_STATUSES)[number]

export type CourseRunEnrollmentStatusInfo = {
  key: CourseRunEnrollmentStatus
  label: string
  publicLabel: string
  description: string
  ctaLabel: string
  mobileCtaLabel: string
  allowsEnrollment: boolean
}

export const COURSE_RUN_ENROLLMENT_STATUS_INFO: Record<CourseRunEnrollmentStatus, CourseRunEnrollmentStatusInfo> = {
  open: {
    key: 'open',
    label: 'Matrícula abierta',
    publicLabel: 'Matrícula abierta',
    description: 'Se admiten nuevas matrículas en esta convocatoria.',
    ctaLabel: 'Reservar plaza',
    mobileCtaLabel: 'Reserva tu plaza',
    allowsEnrollment: true,
  },
  closed: {
    key: 'closed',
    label: 'Matrícula cerrada',
    publicLabel: 'Matrícula cerrada',
    description: 'La convocatoria sigue visible, pero no admite nuevas matrículas.',
    ctaLabel: 'Solicitar próxima convocatoria',
    mobileCtaLabel: 'Solicitar aviso',
    allowsEnrollment: false,
  },
  scheduled: {
    key: 'scheduled',
    label: 'Apertura programada',
    publicLabel: 'Matrícula abre próximamente',
    description: 'La matrícula todavía no está abierta.',
    ctaLabel: 'Solicitar aviso',
    mobileCtaLabel: 'Avisarme',
    allowsEnrollment: false,
  },
  always_open: {
    key: 'always_open',
    label: 'Matrícula permanente',
    publicLabel: 'Matrícula abierta permanente',
    description: 'Convocatoria con matrícula flexible o permanente.',
    ctaLabel: 'Solicitar información',
    mobileCtaLabel: 'Solicitar información',
    allowsEnrollment: true,
  },
}

export function resolveCourseRunEnrollmentStatus(courseRun: any): CourseRunEnrollmentStatus {
  const explicit = String(courseRun?.enrollment_status ?? '').trim().toLowerCase()
  if ((COURSE_RUN_ENROLLMENT_STATUSES as readonly string[]).includes(explicit)) {
    return explicit as CourseRunEnrollmentStatus
  }

  const operationalStatus = String(courseRun?.status ?? '').trim().toLowerCase()
  if (['cancelled', 'completed', 'enrollment_closed'].includes(operationalStatus)) return 'closed'
  if (['published', 'enrollment_open', 'in_progress'].includes(operationalStatus)) return 'open'
  if (!operationalStatus) return 'open'
  return 'closed'
}

export function getCourseRunEnrollmentStatusInfo(courseRun: any): CourseRunEnrollmentStatusInfo {
  return COURSE_RUN_ENROLLMENT_STATUS_INFO[resolveCourseRunEnrollmentStatus(courseRun)]
}
