import { minutesBetween, normalizeClock, toDayKey, weekdayFromDayKey } from './time'
import {
  isSessionStatus,
  isPhaseType,
  type AcademicId,
  type AcademicSession,
  type SessionOrigin,
  type SessionStatus,
  type SessionType,
} from './types'

export type PayloadSessionDoc = {
  id?: AcademicId
  tenant?: AcademicId | { id?: AcademicId }
  course_run?: AcademicId | { id?: AcademicId }
  phase?: AcademicId | { id?: AcademicId }
  session_date?: string
  time_start?: string
  time_end?: string
  planned_minutes?: number | null
  actual_start?: string | null
  actual_end?: string | null
  actual_minutes?: number | null
  session_type?: string | null
  venue?: AcademicId | { id?: AcademicId }
  classroom?: AcademicId | { id?: AcademicId }
  instructor?: AcademicId | { id?: AcademicId }
  instructor_ids?: AcademicId[] | null
  status?: string
  origin?: string | null
  recurrence_rule?: AcademicId | { id?: AcademicId }
  notes?: string | null
}

function asId(value: AcademicId | { id?: AcademicId } | null | undefined): AcademicId | null {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && (typeof value.id === 'string' || typeof value.id === 'number')) {
    return value.id
  }
  return null
}

function asIdList(value: unknown): AcademicId[] {
  if (!Array.isArray(value)) return []
  return value
    .map((item) => asId(item as AcademicId | { id?: AcademicId }))
    .filter((id): id is AcademicId => id != null)
}

export function mapPayloadSession(doc: PayloadSessionDoc): AcademicSession | null {
  const date = doc.session_date ? toDayKey(doc.session_date) : null
  const plannedStart = normalizeClock(doc.time_start)
  const plannedEnd = normalizeClock(doc.time_end)
  const courseRunId = asId(doc.course_run)
  if (!date || !plannedStart || !plannedEnd || courseRunId == null) return null

  const instructorIds = asIdList(doc.instructor_ids)
  const primary = asId(doc.instructor)
  if (primary != null && !instructorIds.some((id) => String(id) === String(primary))) {
    instructorIds.unshift(primary)
  }

  const status = isSessionStatus(String(doc.status ?? '')) ? (doc.status as SessionStatus) : 'scheduled'
  const sessionType = isPhaseType(String(doc.session_type ?? '')) ? (doc.session_type as SessionType) : 'THEORY'

  return {
    id: doc.id,
    tenantId: asId(doc.tenant) ?? undefined,
    courseRunId,
    phaseId: asId(doc.phase),
    date,
    plannedStart,
    plannedEnd,
    plannedMinutes: doc.planned_minutes ?? minutesBetween(plannedStart, plannedEnd),
    actualStart: doc.actual_start ?? null,
    actualEnd: doc.actual_end ?? null,
    actualMinutes: doc.actual_minutes ?? null,
    sessionType,
    venueId: asId(doc.venue),
    roomId: asId(doc.classroom),
    instructorIds,
    status,
    origin: (doc.origin as SessionOrigin | undefined) ?? 'manual',
    recurrenceRuleId: asId(doc.recurrence_rule),
    notes: doc.notes ?? null,
  }
}

export function weekdayForSessionDate(date: string): string {
  return weekdayFromDayKey(date) ?? 'monday'
}
