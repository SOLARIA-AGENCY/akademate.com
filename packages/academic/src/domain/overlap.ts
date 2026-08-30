import {
  occupiesCepClassroom,
  occupiesResource,
  sameAcademicId,
  type AcademicId,
  type AcademicSession,
} from './types'
import { intervalsOverlap, toDayKey } from './time'

export function sessionIntervalValid(session: Pick<AcademicSession, 'plannedStart' | 'plannedEnd'>): boolean {
  return Boolean(session.plannedStart && session.plannedEnd && session.plannedStart < session.plannedEnd)
}

export function sessionsShareDay(a: AcademicSession, b: AcademicSession): boolean {
  const left = toDayKey(a.date)
  const right = toDayKey(b.date)
  return Boolean(left && right && left === right)
}

export function sessionsTimeOverlap(a: AcademicSession, b: AcademicSession): boolean {
  if (!sessionsShareDay(a, b)) return false
  return intervalsOverlap(a.plannedStart, a.plannedEnd, b.plannedStart, b.plannedEnd)
}

export function sessionsOverlapOnResource(
  a: AcademicSession,
  b: AcademicSession,
  resource: 'room' | 'instructor' | 'venue',
): boolean {
  if (a === b) return false
  if (sameAcademicId(a.id, b.id)) return false
  if (!occupiesResource(a.status) || !occupiesResource(b.status)) return false
  if (!sessionsTimeOverlap(a, b)) return false

  if (resource === 'room') {
    return occupiesCepClassroom(a) && occupiesCepClassroom(b) && sameAcademicId(a.roomId, b.roomId)
  }
  if (resource === 'venue') {
    return a.venueId != null && sameAcademicId(a.venueId, b.venueId)
  }

  const left = a.instructorIds ?? []
  const right = b.instructorIds ?? []
  return left.some((id) => right.some((other) => sameAcademicId(id, other)))
}

export function findOverlappingSessions(
  candidate: AcademicSession,
  existing: AcademicSession[],
  resource: 'room' | 'instructor' | 'venue',
): AcademicSession[] {
  return existing.filter((session) => sessionsOverlapOnResource(candidate, session, resource))
}

export function roomOccupiedOnInterval(
  sessions: AcademicSession[],
  roomId: AcademicId,
  date: string,
  start: string,
  end: string,
  ignoreSessionId?: AcademicId | null,
): boolean {
  const probe: AcademicSession = {
    id: ignoreSessionId ?? 'probe',
    courseRunId: 'probe',
    date,
    plannedStart: start,
    plannedEnd: end,
    roomId,
    sessionType: 'THEORY',
    status: 'planned',
    instructorIds: [],
  }
  return findOverlappingSessions(probe, sessions, 'room').length > 0
}
