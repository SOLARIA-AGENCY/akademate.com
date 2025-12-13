/**
 * @module @akademate/operations/__tests__/calendar
 * Tests for calendar and session management
 */

import { describe, it, expect } from 'vitest'
import {
  CalendarService,
  checkSessionConflicts,
  validateSessionTimes,
  generateRecurringSessions,
  SessionType,
  type Session,
} from '../src/index.js'

describe('Calendar Service', () => {
  const validTenantId = '123e4567-e89b-12d3-a456-426614174000'
  const validCourseRunId = '123e4567-e89b-12d3-a456-426614174001'
  const validInstructorId = '123e4567-e89b-12d3-a456-426614174002'
  const validCenterId = '123e4567-e89b-12d3-a456-426614174003'

  const createSession = (overrides: Partial<Session> = {}): Session => ({
    id: crypto.randomUUID(),
    tenantId: validTenantId,
    courseRunId: validCourseRunId,
    title: 'Test Session',
    type: SessionType.CLASS,
    startTime: new Date('2025-02-01T09:00:00'),
    endTime: new Date('2025-02-01T11:00:00'),
    isOnline: false,
    materials: [],
    metadata: {},
    ...overrides,
  })

  // ============================================================================
  // Session Validation Tests
  // ============================================================================

  describe('validateSessionTimes', () => {
    it('should pass for valid session times', () => {
      const session = createSession({
        startTime: new Date(Date.now() + 86400000), // Tomorrow
        endTime: new Date(Date.now() + 86400000 + 7200000), // Tomorrow + 2h
      })

      const result = validateSessionTimes(session)

      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should fail if end time before start time', () => {
      const session = createSession({
        startTime: new Date('2025-02-01T11:00:00'),
        endTime: new Date('2025-02-01T09:00:00'),
      })

      const result = validateSessionTimes(session)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('posterior'))).toBe(true)
    })

    it('should fail if duration less than 15 minutes', () => {
      const session = createSession({
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 600000), // +10 minutes
      })

      const result = validateSessionTimes(session)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('15 minutos'))).toBe(true)
    })

    it('should fail if duration more than 8 hours', () => {
      const session = createSession({
        startTime: new Date(Date.now() + 86400000),
        endTime: new Date(Date.now() + 86400000 + 36000000), // +10 hours
      })

      const result = validateSessionTimes(session)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('8 horas'))).toBe(true)
    })

    it('should fail if session in the past', () => {
      const session = createSession({
        startTime: new Date('2020-01-01T09:00:00'),
        endTime: new Date('2020-01-01T11:00:00'),
      })

      const result = validateSessionTimes(session)

      expect(result.valid).toBe(false)
      expect(result.errors.some(e => e.includes('pasado'))).toBe(true)
    })
  })

  // ============================================================================
  // Conflict Detection Tests
  // ============================================================================

  describe('checkSessionConflicts', () => {
    it('should detect instructor conflict', () => {
      const existingSession = createSession({
        id: '1',
        instructorId: validInstructorId,
        startTime: new Date('2025-02-01T09:00:00'),
        endTime: new Date('2025-02-01T11:00:00'),
      })

      const newSession = createSession({
        id: '2',
        instructorId: validInstructorId,
        startTime: new Date('2025-02-01T10:00:00'), // Overlaps
        endTime: new Date('2025-02-01T12:00:00'),
      })

      const conflicts = checkSessionConflicts(newSession, [existingSession])

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('instructor')
    })

    it('should detect room conflict', () => {
      const existingSession = createSession({
        id: '1',
        centerId: validCenterId,
        room: 'A101',
        isOnline: false,
        startTime: new Date('2025-02-01T09:00:00'),
        endTime: new Date('2025-02-01T11:00:00'),
      })

      const newSession = createSession({
        id: '2',
        centerId: validCenterId,
        room: 'A101',
        isOnline: false,
        startTime: new Date('2025-02-01T10:00:00'),
        endTime: new Date('2025-02-01T12:00:00'),
      })

      const conflicts = checkSessionConflicts(newSession, [existingSession])

      expect(conflicts).toHaveLength(1)
      expect(conflicts[0].type).toBe('room')
    })

    it('should not detect conflict for non-overlapping times', () => {
      const existingSession = createSession({
        id: '1',
        instructorId: validInstructorId,
        startTime: new Date('2025-02-01T09:00:00'),
        endTime: new Date('2025-02-01T11:00:00'),
      })

      const newSession = createSession({
        id: '2',
        instructorId: validInstructorId,
        startTime: new Date('2025-02-01T14:00:00'), // After
        endTime: new Date('2025-02-01T16:00:00'),
      })

      const conflicts = checkSessionConflicts(newSession, [existingSession])

      expect(conflicts).toHaveLength(0)
    })

    it('should not detect room conflict for online sessions', () => {
      const existingSession = createSession({
        id: '1',
        centerId: validCenterId,
        room: 'A101',
        isOnline: true, // Online
        startTime: new Date('2025-02-01T09:00:00'),
        endTime: new Date('2025-02-01T11:00:00'),
      })

      const newSession = createSession({
        id: '2',
        centerId: validCenterId,
        room: 'A101',
        isOnline: true, // Online
        startTime: new Date('2025-02-01T10:00:00'),
        endTime: new Date('2025-02-01T12:00:00'),
      })

      const conflicts = checkSessionConflicts(newSession, [existingSession])

      // No room conflict for online sessions
      expect(conflicts.filter(c => c.type === 'room')).toHaveLength(0)
    })

    it('should skip self when checking conflicts', () => {
      const session = createSession({
        id: '1',
        instructorId: validInstructorId,
      })

      const conflicts = checkSessionConflicts(session, [session])

      expect(conflicts).toHaveLength(0)
    })
  })

  // ============================================================================
  // Calendar Service Tests
  // ============================================================================

  describe('CalendarService', () => {
    const service = new CalendarService()

    describe('getEvents', () => {
      it('should filter events by tenant and date range', () => {
        const sessions = [
          createSession({
            id: '1',
            startTime: new Date('2025-02-01T09:00:00'),
            endTime: new Date('2025-02-01T11:00:00'),
          }),
          createSession({
            id: '2',
            startTime: new Date('2025-02-15T09:00:00'),
            endTime: new Date('2025-02-15T11:00:00'),
          }),
          createSession({
            id: '3',
            tenantId: 'other-tenant',
            startTime: new Date('2025-02-01T09:00:00'),
            endTime: new Date('2025-02-01T11:00:00'),
          }),
        ]

        const events = service.getEvents(sessions, {
          tenantId: validTenantId,
          startDate: new Date('2025-02-01'),
          endDate: new Date('2025-02-10'),
        })

        expect(events).toHaveLength(1)
        expect(events[0].id).toBe('1')
      })

      it('should filter by course run', () => {
        const sessions = [
          createSession({ id: '1', courseRunId: 'course-1' }),
          createSession({ id: '2', courseRunId: 'course-2' }),
        ]

        const events = service.getEvents(sessions, {
          tenantId: validTenantId,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          courseRunId: 'course-1',
        })

        expect(events).toHaveLength(1)
        expect(events[0].id).toBe('1')
      })

      it('should filter by session type', () => {
        const sessions = [
          createSession({ id: '1', type: SessionType.CLASS }),
          createSession({ id: '2', type: SessionType.EXAM }),
          createSession({ id: '3', type: SessionType.WORKSHOP }),
        ]

        const events = service.getEvents(sessions, {
          tenantId: validTenantId,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
          types: [SessionType.EXAM, SessionType.WORKSHOP],
        })

        expect(events).toHaveLength(2)
      })

      it('should sort events by start time', () => {
        const sessions = [
          createSession({
            id: '1',
            startTime: new Date('2025-02-03T09:00:00'),
            endTime: new Date('2025-02-03T11:00:00'),
          }),
          createSession({
            id: '2',
            startTime: new Date('2025-02-01T09:00:00'),
            endTime: new Date('2025-02-01T11:00:00'),
          }),
          createSession({
            id: '3',
            startTime: new Date('2025-02-02T09:00:00'),
            endTime: new Date('2025-02-02T11:00:00'),
          }),
        ]

        const events = service.getEvents(sessions, {
          tenantId: validTenantId,
          startDate: new Date('2025-01-01'),
          endDate: new Date('2025-12-31'),
        })

        expect(events.map(e => e.id)).toEqual(['2', '3', '1'])
      })
    })

    describe('getSessionsForDay', () => {
      it('should return sessions for specific day', () => {
        const sessions = [
          createSession({
            id: '1',
            startTime: new Date('2025-02-01T09:00:00'),
            endTime: new Date('2025-02-01T11:00:00'),
          }),
          createSession({
            id: '2',
            startTime: new Date('2025-02-01T14:00:00'),
            endTime: new Date('2025-02-01T16:00:00'),
          }),
          createSession({
            id: '3',
            startTime: new Date('2025-02-02T09:00:00'),
            endTime: new Date('2025-02-02T11:00:00'),
          }),
        ]

        const daySessions = service.getSessionsForDay(sessions, new Date('2025-02-01'), validTenantId)

        expect(daySessions).toHaveLength(2)
      })
    })

    describe('session status helpers', () => {
      it('should detect ongoing session', () => {
        const now = new Date()
        const session = createSession({
          startTime: new Date(now.getTime() - 3600000), // 1 hour ago
          endTime: new Date(now.getTime() + 3600000), // 1 hour from now
        })

        expect(service.isSessionOngoing(session)).toBe(true)
      })

      it('should detect upcoming session', () => {
        const now = new Date()
        const session = createSession({
          startTime: new Date(now.getTime() + 900000), // 15 minutes from now
          endTime: new Date(now.getTime() + 8100000),
        })

        expect(service.isSessionUpcoming(session, 30)).toBe(true)
      })

      it('should calculate session duration', () => {
        const session = createSession({
          startTime: new Date('2025-02-01T09:00:00'),
          endTime: new Date('2025-02-01T11:30:00'),
        })

        expect(service.getSessionDuration(session)).toBe(150) // 2.5 hours
      })
    })
  })

  // ============================================================================
  // Recurring Sessions Tests
  // ============================================================================

  describe('generateRecurringSessions', () => {
    it('should generate weekly recurring sessions', () => {
      const baseSession = createSession({
        startTime: new Date('2025-02-03T09:00:00'), // Monday
        endTime: new Date('2025-02-03T11:00:00'),
      })

      const sessions = generateRecurringSessions(baseSession, {
        frequency: 'weekly',
        interval: 1,
        occurrences: 4,
      })

      expect(sessions).toHaveLength(4)
      expect(sessions[1].startTime.getTime() - sessions[0].startTime.getTime()).toBe(7 * 24 * 60 * 60 * 1000)
    })

    it('should generate biweekly recurring sessions', () => {
      const baseSession = createSession({
        startTime: new Date('2025-02-03T09:00:00'),
        endTime: new Date('2025-02-03T11:00:00'),
      })

      const sessions = generateRecurringSessions(baseSession, {
        frequency: 'biweekly',
        interval: 1,
        occurrences: 3,
      })

      expect(sessions).toHaveLength(3)
      expect(sessions[1].startTime.getTime() - sessions[0].startTime.getTime()).toBe(14 * 24 * 60 * 60 * 1000)
    })

    it('should respect end date', () => {
      const baseSession = createSession({
        startTime: new Date('2025-02-03T09:00:00'),
        endTime: new Date('2025-02-03T11:00:00'),
      })

      const sessions = generateRecurringSessions(baseSession, {
        frequency: 'weekly',
        interval: 1,
        endDate: new Date('2025-02-20'),
        occurrences: 100, // High limit
      })

      // Should stop at end date
      expect(sessions.length).toBeLessThan(5)
      expect(sessions.every(s => s.startTime <= new Date('2025-02-20'))).toBe(true)
    })

    it('should preserve session duration', () => {
      const baseSession = createSession({
        startTime: new Date('2025-02-03T09:00:00'),
        endTime: new Date('2025-02-03T12:30:00'), // 3.5 hours
      })

      const sessions = generateRecurringSessions(baseSession, {
        frequency: 'weekly',
        interval: 1,
        occurrences: 2,
      })

      const duration = sessions[1].endTime.getTime() - sessions[1].startTime.getTime()
      expect(duration).toBe(3.5 * 60 * 60 * 1000)
    })
  })
})
