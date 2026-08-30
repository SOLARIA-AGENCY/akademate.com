export const PLANNING_MODELS = ['legacy_template', 'session_first'] as const
export type PlanningModel = (typeof PLANNING_MODELS)[number]

export const PHASE_TYPES = [
  'THEORY',
  'PRACTICE',
  'THEORY_PRACTICE',
  'EXTERNAL_PRACTICE',
  'WORKSHOP',
  'OUTDOOR_PRACTICE',
  'ONLINE',
  'OTHER',
] as const
export type PhaseType = (typeof PHASE_TYPES)[number]

export const SESSION_TYPES = PHASE_TYPES
export type SessionType = PhaseType

export const SESSION_STATUSES = [
  'draft',
  'planned',
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'rescheduled',
] as const
export type SessionStatus = (typeof SESSION_STATUSES)[number]

export const SESSION_ORIGINS = ['recurrence', 'exception', 'import', 'manual'] as const
export type SessionOrigin = (typeof SESSION_ORIGINS)[number]

export const CONFIRMATION_STATUSES = ['PENDING_CONFIRMATION', 'UNVERIFIED', 'CONFIRMED'] as const
export type ConfirmationStatus = (typeof CONFIRMATION_STATUSES)[number]

export const VENUE_TYPES = [
  'OWN_CENTER',
  'PARTNER_CENTER',
  'PRACTICE_CENTER',
  'COMPANY',
  'OUTDOOR_AREA',
  'OTHER',
] as const
export type VenueType = (typeof VENUE_TYPES)[number]

export const WEEKDAYS = [
  'sunday',
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
] as const
export type Weekday = (typeof WEEKDAYS)[number]

export const OCCUPYING_SESSION_STATUSES: readonly SessionStatus[] = [
  'planned',
  'scheduled',
  'confirmed',
  'completed',
]

export const CONFLICT_TYPES = [
  'ROOM_CONFLICT',
  'INSTRUCTOR_CONFLICT',
  'VENUE_CONFLICT',
  'CAPACITY_CONFLICT',
  'COURSE_PHASE_CONFLICT',
  'RESOURCE_UNAVAILABLE',
  'PARTNER_CAPACITY_CONFLICT',
  'TRAVEL_BUFFER_WARNING',
  'HOURS_MISMATCH',
  'END_DATE_MISMATCH',
  'INVALID_INTERVAL',
] as const
export type AcademicConflictType = (typeof CONFLICT_TYPES)[number]

export const LEDGER_APPROVAL_STATUSES = ['pending', 'approved', 'rejected'] as const
export type LedgerApprovalStatus = (typeof LEDGER_APPROVAL_STATUSES)[number]

export type AcademicId = string | number

export type AcademicSession = {
  id?: AcademicId
  tenantId?: AcademicId
  courseRunId: AcademicId
  phaseId?: AcademicId | null
  date: string
  plannedStart: string
  plannedEnd: string
  plannedMinutes?: number | null
  actualStart?: string | null
  actualEnd?: string | null
  actualMinutes?: number | null
  sessionType?: SessionType | null
  venueId?: AcademicId | null
  roomId?: AcademicId | null
  instructorIds?: AcademicId[]
  status: SessionStatus
  origin?: SessionOrigin
  recurrenceRuleId?: AcademicId | null
  notes?: string | null
}

export type AcademicPhase = {
  id?: AcademicId
  courseRunId: AcademicId
  name: string
  phaseType: PhaseType
  plannedStart?: string | null
  plannedEnd?: string | null
  venueId?: AcademicId | null
  roomId?: AcademicId | null
  sortOrder?: number
  confirmationStatus?: ConfirmationStatus
}

export type RecurrenceRule = {
  id?: AcademicId
  courseRunId: AcademicId
  phaseId?: AcademicId | null
  weekdays: Weekday[]
  startDate: string
  endDate: string
  startTime: string
  endTime: string
  sessionType?: SessionType
  venueId?: AcademicId | null
  roomId?: AcademicId | null
  instructorIds?: AcademicId[]
  exceptionPolicy?: 'preserve'
}

export type AcademicRoom = {
  id: AcademicId
  campusId?: AcademicId | null
  venueId?: AcademicId | null
  name?: string
  capacity?: number | null
  resourceType?: string | null
  isActive?: boolean
}

export type CourseHoursBudget = {
  theoryHours?: number | null
  practiceHoursInternal?: number | null
  externalPracticeHours?: number | null
  otherHours?: number | null
  plannedHours?: number | null
}

export type CourseHoursSummary = {
  plannedHours: number
  scheduledHours: number
  completedHours: number
  cancelledHours: number
  remainingHours: number
  theoryHours: number
  practiceHours: number
  externalPracticeHours: number
  otherHours: number
  calculatedEndDate: string | null
  endDateWarning: boolean
}

export type AcademicConflict = {
  type: AcademicConflictType
  severity: 'blocker' | 'warning'
  message: string
  sessionId?: AcademicId
  conflictingSessionId?: AcademicId
  courseRunId?: AcademicId
  conflictingCourseRunId?: AcademicId
  resourceId?: AcademicId
  date?: string
  start?: string
  end?: string
}

export function assertNever(value: never, label: string): never {
  throw new Error(`Unhandled ${label}: ${String(value)}`)
}

export function isPhaseType(value: string): value is PhaseType {
  return (PHASE_TYPES as readonly string[]).includes(value)
}

export function isSessionStatus(value: string): value is SessionStatus {
  return (SESSION_STATUSES as readonly string[]).includes(value)
}

export function isWeekday(value: string): value is Weekday {
  return (WEEKDAYS as readonly string[]).includes(value)
}

export function occupiesResource(status: SessionStatus): boolean {
  switch (status) {
    case 'planned':
    case 'scheduled':
    case 'confirmed':
    case 'completed':
      return true
    case 'draft':
    case 'cancelled':
    case 'rescheduled':
      return false
    default:
      return assertNever(status, 'session status')
  }
}

export function occupiesOwnClassroom(session: AcademicSession): boolean {
  if (!occupiesResource(session.status)) return false
  if (session.roomId == null) return false
  switch (session.sessionType ?? 'THEORY') {
    case 'EXTERNAL_PRACTICE':
    case 'OUTDOOR_PRACTICE':
    case 'ONLINE':
      return false
    case 'THEORY':
    case 'PRACTICE':
    case 'THEORY_PRACTICE':
    case 'WORKSHOP':
    case 'OTHER':
      return true
    default:
      return assertNever(session.sessionType as never, 'session type')
  }
}

/** @deprecated Use occupiesOwnClassroom. Kept so CEP ports compile during the rename. */
export const occupiesCepClassroom = occupiesOwnClassroom

export function sameAcademicId(a?: AcademicId | null, b?: AcademicId | null): boolean {
  if (a == null || b == null) return false
  return String(a) === String(b)
}
