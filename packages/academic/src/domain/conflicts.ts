import { hoursMismatchWarning, sessionPlannedMinutes, summarizeCourseHours } from './hours'
import { findOverlappingSessions, sessionIntervalValid } from './overlap'
import { clockToMinutes, toDayKey } from './time'
import {
  occupiesCepClassroom,
  occupiesResource,
  sameAcademicId,
  type AcademicConflict,
  type AcademicId,
  type AcademicSession,
  type CourseHoursBudget,
} from './types'

export type TravelContext = {
  instructorId: AcademicId
  campusId?: AcademicId | null
  bufferMinutes?: number | null
}

function sessionCampus(session: AcademicSession, campusByRoom: Map<string, AcademicId | null | undefined>): AcademicId | null {
  if (session.venueId != null) return session.venueId
  if (session.roomId == null) return null
  return campusByRoom.get(String(session.roomId)) ?? null
}

export function detectSessionConflicts(input: {
  candidate: AcademicSession
  existing: AcademicSession[]
  campusByRoom?: Map<string, AcademicId | null | undefined>
  travelBuffers?: TravelContext[]
  expectedStudents?: number | null
  roomCapacity?: number | null
}): AcademicConflict[] {
  const { candidate, existing } = input
  const conflicts: AcademicConflict[] = []

  if (!sessionIntervalValid(candidate)) {
    conflicts.push({
      type: 'INVALID_INTERVAL',
      severity: 'blocker',
      message: 'La sesión debe terminar después de empezar.',
      sessionId: candidate.id,
      courseRunId: candidate.courseRunId,
      date: candidate.date,
      start: candidate.plannedStart,
      end: candidate.plannedEnd,
    })
    return conflicts
  }

  if (occupiesCepClassroom(candidate)) {
    for (const other of findOverlappingSessions(candidate, existing, 'room')) {
      conflicts.push({
        type: 'ROOM_CONFLICT',
        severity: 'blocker',
        message: `El aula ${String(candidate.roomId)} ya está ocupada el ${toDayKey(candidate.date)} de ${candidate.plannedStart} a ${candidate.plannedEnd}.`,
        sessionId: candidate.id,
        conflictingSessionId: other.id,
        courseRunId: candidate.courseRunId,
        conflictingCourseRunId: other.courseRunId,
        resourceId: candidate.roomId ?? undefined,
        date: candidate.date,
        start: candidate.plannedStart,
        end: candidate.plannedEnd,
      })
    }
  }

  for (const other of findOverlappingSessions(candidate, existing, 'instructor')) {
    conflicts.push({
      type: 'INSTRUCTOR_CONFLICT',
      severity: 'blocker',
      message: `Un docente ya imparte otra sesión el ${toDayKey(candidate.date)} de ${candidate.plannedStart} a ${candidate.plannedEnd}.`,
      sessionId: candidate.id,
      conflictingSessionId: other.id,
      courseRunId: candidate.courseRunId,
      conflictingCourseRunId: other.courseRunId,
      date: candidate.date,
      start: candidate.plannedStart,
      end: candidate.plannedEnd,
    })
  }

  if (candidate.venueId != null) {
    for (const other of findOverlappingSessions(candidate, existing, 'venue')) {
      conflicts.push({
        type: 'VENUE_CONFLICT',
        severity: 'warning',
        message: `La ubicación ${String(candidate.venueId)} ya tiene una sesión solapada.`,
        sessionId: candidate.id,
        conflictingSessionId: other.id,
        courseRunId: candidate.courseRunId,
        conflictingCourseRunId: other.courseRunId,
        resourceId: candidate.venueId,
        date: candidate.date,
      })
    }
  }

  if (
    occupiesCepClassroom(candidate) &&
    typeof input.expectedStudents === 'number' &&
    typeof input.roomCapacity === 'number' &&
    input.expectedStudents > input.roomCapacity
  ) {
    conflicts.push({
      type: 'CAPACITY_CONFLICT',
      severity: 'warning',
      message: `El aforo del aula (${input.roomCapacity}) es inferior al alumnado previsto (${input.expectedStudents}).`,
      sessionId: candidate.id,
      courseRunId: candidate.courseRunId,
      resourceId: candidate.roomId ?? undefined,
    })
  }

  conflicts.push(...detectTravelWarnings(candidate, existing, input.campusByRoom, input.travelBuffers))
  return conflicts
}

export function detectTravelWarnings(
  candidate: AcademicSession,
  existing: AcademicSession[],
  campusByRoom?: Map<string, AcademicId | null | undefined>,
  travelBuffers?: TravelContext[],
): AcademicConflict[] {
  if (!occupiesResource(candidate.status)) return []
  const warnings: AcademicConflict[] = []
  const day = toDayKey(candidate.date)
  if (!day) return warnings

  for (const instructorId of candidate.instructorIds ?? []) {
    const buffer = travelBuffers?.find((item) => sameAcademicId(item.instructorId, instructorId))
    const minutes = buffer?.bufferMinutes
    if (!minutes || minutes <= 0) continue

    const candidateCampus = sessionCampus(candidate, campusByRoom ?? new Map())
    const candidateStart = clockToMinutes(candidate.plannedStart)
    const candidateEnd = clockToMinutes(candidate.plannedEnd)
    if (candidateStart == null || candidateEnd == null) continue

    for (const other of existing) {
      if (!occupiesResource(other.status)) continue
      if (!other.instructorIds?.some((id) => sameAcademicId(id, instructorId))) continue
      if (toDayKey(other.date) !== day) continue
      const otherCampus = sessionCampus(other, campusByRoom ?? new Map())
      if (candidateCampus == null || otherCampus == null || sameAcademicId(candidateCampus, otherCampus)) continue

      const otherStart = clockToMinutes(other.plannedStart)
      const otherEnd = clockToMinutes(other.plannedEnd)
      if (otherStart == null || otherEnd == null) continue

      const gapAfterOther = candidateStart - otherEnd
      const gapAfterCandidate = otherStart - candidateEnd
      const gap = Math.max(gapAfterOther, gapAfterCandidate)
      if (gap >= 0 && gap < minutes) {
        warnings.push({
          type: 'TRAVEL_BUFFER_WARNING',
          severity: 'warning',
          message: `El docente no tiene ${minutes} minutos de margen para trasladarse entre sedes.`,
          sessionId: candidate.id,
          conflictingSessionId: other.id,
          courseRunId: candidate.courseRunId,
          conflictingCourseRunId: other.courseRunId,
          date: candidate.date,
        })
      }
    }
  }

  return warnings
}

export function detectCourseWarnings(input: {
  sessions: AcademicSession[]
  budget?: CourseHoursBudget
  plannedEndDate?: string | null
}): AcademicConflict[] {
  const summary = summarizeCourseHours(input.sessions, input.budget ?? {}, input.plannedEndDate)
  const warnings: AcademicConflict[] = []
  if (hoursMismatchWarning(summary)) {
    warnings.push({
      type: 'HOURS_MISMATCH',
      severity: 'warning',
      message: `Hay ${summary.remainingHours} h pendientes de programar (${summary.scheduledHours}/${summary.plannedHours}).`,
    })
  }
  if (summary.endDateWarning) {
    warnings.push({
      type: 'END_DATE_MISMATCH',
      severity: 'warning',
      message: `La última sesión cae en ${summary.calculatedEndDate}, distinto del fin previsto ${input.plannedEndDate}.`,
    })
  }
  return warnings
}

export function collectAllConflicts(sessions: AcademicSession[]): AcademicConflict[] {
  const conflicts: AcademicConflict[] = []
  sessions.forEach((candidate, index) => {
    conflicts.push(
      ...detectSessionConflicts({
        candidate,
        existing: sessions.filter((_, otherIndex) => otherIndex !== index),
      }),
    )
  })
  return dedupeConflicts(conflicts)
}

export function dedupeConflicts(conflicts: AcademicConflict[]): AcademicConflict[] {
  const seen = new Set<string>()
  return conflicts.filter((conflict) => {
    const key = [
      conflict.type,
      conflict.sessionId,
      conflict.conflictingSessionId,
      conflict.date,
      conflict.start,
      conflict.end,
    ].join('|')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export function sessionDurationMinutes(session: AcademicSession): number {
  return sessionPlannedMinutes(session)
}
