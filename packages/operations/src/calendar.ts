/**
 * @module @akademate/operations/calendar
 * Calendar and session management service
 */

import {
  SessionType,
  type Session,
  type CalendarEvent,
  type CalendarFilter,
} from './types.js'

// ============================================================================
// Session Validation
// ============================================================================

export interface SessionConflict {
  type: 'instructor' | 'room' | 'student'
  conflictingSessionId: string
  conflictingSessionTitle: string
  message: string
}

/**
 * Check for scheduling conflicts
 */
export function checkSessionConflicts(
  newSession: Session,
  existingSessions: Session[]
): SessionConflict[] {
  const conflicts: SessionConflict[] = []
  const newStart = newSession.startTime.getTime()
  const newEnd = newSession.endTime.getTime()

  for (const existing of existingSessions) {
    if (existing.id === newSession.id) continue // Skip self

    const existingStart = existing.startTime.getTime()
    const existingEnd = existing.endTime.getTime()

    // Check if times overlap
    const overlaps = newStart < existingEnd && newEnd > existingStart

    if (!overlaps) continue

    // Check instructor conflict
    if (newSession.instructorId && existing.instructorId === newSession.instructorId) {
      conflicts.push({
        type: 'instructor',
        conflictingSessionId: existing.id!,
        conflictingSessionTitle: existing.title,
        message: `El instructor ya tiene asignada la sesión "${existing.title}" en este horario`,
      })
    }

    // Check room conflict (only for in-person sessions at same center)
    if (
      !newSession.isOnline &&
      !existing.isOnline &&
      newSession.centerId === existing.centerId &&
      newSession.room &&
      newSession.room === existing.room
    ) {
      conflicts.push({
        type: 'room',
        conflictingSessionId: existing.id!,
        conflictingSessionTitle: existing.title,
        message: `El aula "${newSession.room}" ya está ocupada por "${existing.title}"`,
      })
    }
  }

  return conflicts
}

/**
 * Validate session times
 */
export function validateSessionTimes(session: Session): { valid: boolean; errors: string[] } {
  const errors: string[] = []
  const now = new Date()

  if (session.endTime <= session.startTime) {
    errors.push('La hora de fin debe ser posterior a la hora de inicio')
  }

  const durationMinutes = (session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60)

  if (durationMinutes < 15) {
    errors.push('La sesión debe durar al menos 15 minutos')
  }

  if (durationMinutes > 480) { // 8 hours
    errors.push('La sesión no puede durar más de 8 horas')
  }

  if (session.startTime < now) {
    errors.push('No se pueden crear sesiones en el pasado')
  }

  return { valid: errors.length === 0, errors }
}

// ============================================================================
// Calendar Service
// ============================================================================

export class CalendarService {
  /**
   * Get calendar events for filter criteria
   */
  getEvents(sessions: Session[], filter: CalendarFilter): CalendarEvent[] {
    return sessions
      .filter(session => {
        // Tenant filter
        if (session.tenantId !== filter.tenantId) return false

        // Date range filter
        const sessionStart = session.startTime.getTime()
        const sessionEnd = session.endTime.getTime()
        const filterStart = filter.startDate.getTime()
        const filterEnd = filter.endDate.getTime()

        if (sessionEnd < filterStart || sessionStart > filterEnd) return false

        // Optional filters
        if (filter.courseRunId && session.courseRunId !== filter.courseRunId) return false
        if (filter.instructorId && session.instructorId !== filter.instructorId) return false
        if (filter.centerId && session.centerId !== filter.centerId) return false
        if (filter.types && filter.types.length > 0 && !filter.types.includes(session.type as SessionType)) return false

        return true
      })
      .map(session => this.sessionToEvent(session))
      .sort((a, b) => a.start.getTime() - b.start.getTime())
  }

  /**
   * Convert session to calendar event
   */
  private sessionToEvent(session: Session): CalendarEvent {
    return {
      id: session.id!,
      title: session.title,
      type: session.type as SessionType,
      start: session.startTime,
      end: session.endTime,
      courseRunId: session.courseRunId,
      isOnline: session.isOnline,
      meetingUrl: session.meetingUrl,
      color: this.getSessionColor(session.type as SessionType),
    }
  }

  /**
   * Get color for session type
   */
  private getSessionColor(type: SessionType): string {
    const colors: Record<SessionType, string> = {
      [SessionType.CLASS]: '#3b82f6', // blue
      [SessionType.EXAM]: '#ef4444', // red
      [SessionType.WORKSHOP]: '#10b981', // green
      [SessionType.TUTORING]: '#8b5cf6', // purple
      [SessionType.LAB]: '#f59e0b', // amber
      [SessionType.PRESENTATION]: '#ec4899', // pink
    }
    return colors[type] ?? '#6b7280'
  }

  /**
   * Get sessions for a specific day
   */
  getSessionsForDay(sessions: Session[], date: Date, tenantId: string): Session[] {
    const dayStart = new Date(date)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(date)
    dayEnd.setHours(23, 59, 59, 999)

    return sessions.filter(session => {
      if (session.tenantId !== tenantId) return false
      const sessionStart = session.startTime.getTime()
      return sessionStart >= dayStart.getTime() && sessionStart <= dayEnd.getTime()
    })
  }

  /**
   * Get upcoming sessions for user (as student or instructor)
   */
  getUpcomingSessions(
    sessions: Session[],
    params: {
      tenantId: string
      userId?: string
      instructorId?: string
      limit?: number
    }
  ): Session[] {
    const now = new Date()

    return sessions
      .filter(session => {
        if (session.tenantId !== params.tenantId) return false
        if (session.startTime < now) return false
        if (params.instructorId && session.instructorId !== params.instructorId) return false
        return true
      })
      .sort((a, b) => a.startTime.getTime() - b.startTime.getTime())
      .slice(0, params.limit ?? 10)
  }

  /**
   * Calculate session duration in minutes
   */
  getSessionDuration(session: Session): number {
    return Math.round((session.endTime.getTime() - session.startTime.getTime()) / (1000 * 60))
  }

  /**
   * Check if session is ongoing
   */
  isSessionOngoing(session: Session): boolean {
    const now = new Date()
    return session.startTime <= now && session.endTime > now
  }

  /**
   * Check if session is upcoming (within next X minutes)
   */
  isSessionUpcoming(session: Session, withinMinutes = 30): boolean {
    const now = new Date()
    const threshold = new Date(now.getTime() + withinMinutes * 60 * 1000)
    return session.startTime > now && session.startTime <= threshold
  }
}

// ============================================================================
// Recurrence Helpers
// ============================================================================

export type RecurrenceFrequency = 'daily' | 'weekly' | 'biweekly' | 'monthly'

export interface RecurrencePattern {
  frequency: RecurrenceFrequency
  interval: number // e.g., every 2 weeks
  daysOfWeek?: number[] // 0 = Sunday, 6 = Saturday
  endDate?: Date
  occurrences?: number
}

/**
 * Generate recurring sessions from pattern
 */
export function generateRecurringSessions(
  baseSession: Session,
  pattern: RecurrencePattern
): Session[] {
  const sessions: Session[] = []
  const duration = baseSession.endTime.getTime() - baseSession.startTime.getTime()
  const currentDate = new Date(baseSession.startTime)
  let count = 0
  const maxOccurrences = pattern.occurrences ?? 52 // Default max 1 year of weekly

  while (count < maxOccurrences) {
    if (pattern.endDate && currentDate > pattern.endDate) break

    // Check if this day of week is included
    if (!pattern.daysOfWeek || pattern.daysOfWeek.includes(currentDate.getDay())) {
      const newSession: Session = {
        ...baseSession,
        id: undefined, // New ID will be assigned
        startTime: new Date(currentDate),
        endTime: new Date(currentDate.getTime() + duration),
      }
      sessions.push(newSession)
      count++
    }

    // Advance date based on frequency
    switch (pattern.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + pattern.interval)
        break
      case 'weekly':
        currentDate.setDate(currentDate.getDate() + 7 * pattern.interval)
        break
      case 'biweekly':
        currentDate.setDate(currentDate.getDate() + 14 * pattern.interval)
        break
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + pattern.interval)
        break
    }
  }

  return sessions
}
