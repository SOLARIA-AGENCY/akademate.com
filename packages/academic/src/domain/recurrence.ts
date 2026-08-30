import { minutesBetween, toDayKey, weekdayFromDayKey } from './time'
import {
  isWeekday,
  type AcademicSession,
  type RecurrenceRule,
  type SessionOrigin,
  type Weekday,
} from './types'

const WEEKDAY_INDEX: Record<Weekday, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
}

export function sessionSlotKey(session: Pick<AcademicSession, 'date' | 'plannedStart' | 'plannedEnd'>): string {
  return `${toDayKey(session.date) ?? ''}|${session.plannedStart}|${session.plannedEnd}`
}

export function eachDayInclusive(startDate: string, endDate: string): string[] {
  const start = toDayKey(startDate)
  const end = toDayKey(endDate)
  if (!start || !end || end < start) return []

  const days: string[] = []
  const cursor = new Date(`${start}T12:00:00.000Z`)
  const last = new Date(`${end}T12:00:00.000Z`)
  while (cursor.getTime() <= last.getTime()) {
    days.push(cursor.toISOString().slice(0, 10))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return days
}

export function generateSessionsFromRule(
  rule: RecurrenceRule,
  existing: AcademicSession[] = [],
): AcademicSession[] {
  const weekdays = new Set(rule.weekdays.filter(isWeekday))
  if (weekdays.size === 0) return []

  const existingKeys = new Set(existing.map(sessionSlotKey))
  const existingStarts = new Set(
    existing.map((session) => `${toDayKey(session.date) ?? ''}|${session.plannedStart}`),
  )
  const generated: AcademicSession[] = []

  for (const date of eachDayInclusive(rule.startDate, rule.endDate)) {
    const weekday = weekdayFromDayKey(date)
    if (!weekday || !weekdays.has(weekday as Weekday)) continue
    const startKey = `${date}|${rule.startTime}`
    if (existingStarts.has(startKey)) continue
    const candidate: AcademicSession = {
      courseRunId: rule.courseRunId,
      phaseId: rule.phaseId ?? null,
      date,
      plannedStart: rule.startTime,
      plannedEnd: rule.endTime,
      plannedMinutes: minutesBetween(rule.startTime, rule.endTime),
      sessionType: rule.sessionType ?? 'THEORY',
      venueId: rule.venueId ?? null,
      roomId: rule.roomId ?? null,
      instructorIds: rule.instructorIds ?? [],
      status: 'planned',
      origin: 'recurrence',
      recurrenceRuleId: rule.id ?? null,
    }
    if (existingKeys.has(sessionSlotKey(candidate)) || existingStarts.has(startKey)) continue
    generated.push(candidate)
  }

  return generated
}

export function regenerateSessionsPreservingExceptions(
  rule: RecurrenceRule,
  existing: AcademicSession[],
): { keep: AcademicSession[]; create: AcademicSession[]; drop: AcademicSession[] } {
  const preservedOrigins: SessionOrigin[] = ['exception', 'import', 'manual']
  const keep = existing.filter((session) => {
    if (session.recurrenceRuleId != null && String(session.recurrenceRuleId) !== String(rule.id ?? '')) {
      return true
    }
    return preservedOrigins.includes(session.origin ?? 'recurrence') || session.status === 'cancelled'
  })

  const create = generateSessionsFromRule(rule, keep)
  const generatedKeys = new Set(
    generateSessionsFromRule(rule, []).map(sessionSlotKey),
  )
  const drop = existing.filter((session) => {
    if (keep.includes(session)) return false
    if ((session.origin ?? 'recurrence') !== 'recurrence') return false
    return !generatedKeys.has(sessionSlotKey(session))
  })

  return { keep, create, drop }
}

export function weekdayMatches(date: string, weekday: Weekday): boolean {
  return weekdayFromDayKey(date) === weekday
}

export function weekdayIndex(weekday: Weekday): number {
  return WEEKDAY_INDEX[weekday]
}
