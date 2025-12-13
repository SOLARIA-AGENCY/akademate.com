/**
 * @module @akademate/operations/__tests__/attendance
 * Tests for attendance tracking service
 */

import { describe, it, expect } from 'vitest'
import {
  AttendanceService,
  canModifyAttendance,
  calculateDuration,
  AttendanceStatus,
  type Attendance,
} from '../src/index.js'

describe('Attendance Service', () => {
  const validTenantId = '123e4567-e89b-12d3-a456-426614174000'
  const validSessionId = '123e4567-e89b-12d3-a456-426614174001'
  const validEnrollmentId = '123e4567-e89b-12d3-a456-426614174002'
  const validUserId = '123e4567-e89b-12d3-a456-426614174003'
  const validMarkerId = '123e4567-e89b-12d3-a456-426614174004'

  const createAttendance = (overrides: Partial<Attendance> = {}): Attendance => ({
    id: crypto.randomUUID(),
    tenantId: validTenantId,
    sessionId: validSessionId,
    enrollmentId: validEnrollmentId,
    userId: validUserId,
    status: AttendanceStatus.PRESENT,
    metadata: {},
    ...overrides,
  })

  // ============================================================================
  // Attendance Service Tests
  // ============================================================================

  describe('AttendanceService', () => {
    const service = new AttendanceService({
      lateThresholdMinutes: 15,
      minAttendanceRate: 75,
    })

    describe('markAttendance', () => {
      it('should create attendance record', () => {
        const attendance = service.markAttendance({
          sessionId: validSessionId,
          enrollmentId: validEnrollmentId,
          userId: validUserId,
          tenantId: validTenantId,
          status: AttendanceStatus.PRESENT,
          markedBy: validMarkerId,
        })

        expect(attendance.sessionId).toBe(validSessionId)
        expect(attendance.status).toBe(AttendanceStatus.PRESENT)
        expect(attendance.checkInTime).toBeInstanceOf(Date)
        expect(attendance.markedBy).toBe(validMarkerId)
      })

      it('should not set checkInTime for absent', () => {
        const attendance = service.markAttendance({
          sessionId: validSessionId,
          enrollmentId: validEnrollmentId,
          userId: validUserId,
          tenantId: validTenantId,
          status: AttendanceStatus.ABSENT,
          markedBy: validMarkerId,
        })

        expect(attendance.checkInTime).toBeUndefined()
      })

      it('should include excuse information', () => {
        const attendance = service.markAttendance({
          sessionId: validSessionId,
          enrollmentId: validEnrollmentId,
          userId: validUserId,
          tenantId: validTenantId,
          status: AttendanceStatus.EXCUSED,
          markedBy: validMarkerId,
          excuseReason: 'Medical appointment',
          excuseDocumentUrl: 'https://example.com/doc.pdf',
        })

        expect(attendance.excuseReason).toBe('Medical appointment')
        expect(attendance.excuseDocumentUrl).toBe('https://example.com/doc.pdf')
      })
    })

    describe('batchMarkAttendance', () => {
      it('should mark attendance for multiple students', () => {
        const attendances = service.batchMarkAttendance({
          sessionId: validSessionId,
          tenantId: validTenantId,
          markedBy: validMarkerId,
          attendances: [
            { enrollmentId: '1', userId: 'u1', status: AttendanceStatus.PRESENT },
            { enrollmentId: '2', userId: 'u2', status: AttendanceStatus.LATE },
            { enrollmentId: '3', userId: 'u3', status: AttendanceStatus.ABSENT },
          ],
        })

        expect(attendances).toHaveLength(3)
        expect(attendances[0].status).toBe(AttendanceStatus.PRESENT)
        expect(attendances[1].status).toBe(AttendanceStatus.LATE)
        expect(attendances[2].status).toBe(AttendanceStatus.ABSENT)
      })
    })

    describe('determineStatus', () => {
      it('should mark as present if on time', () => {
        const sessionStart = new Date('2025-02-01T09:00:00')
        const checkIn = new Date('2025-02-01T09:05:00') // 5 min late

        const status = service.determineStatus(checkIn, sessionStart)

        expect(status).toBe(AttendanceStatus.PRESENT)
      })

      it('should mark as present if early', () => {
        const sessionStart = new Date('2025-02-01T09:00:00')
        const checkIn = new Date('2025-02-01T08:55:00') // 5 min early

        const status = service.determineStatus(checkIn, sessionStart)

        expect(status).toBe(AttendanceStatus.PRESENT)
      })

      it('should mark as late if beyond threshold', () => {
        const sessionStart = new Date('2025-02-01T09:00:00')
        const checkIn = new Date('2025-02-01T09:20:00') // 20 min late

        const status = service.determineStatus(checkIn, sessionStart)

        expect(status).toBe(AttendanceStatus.LATE)
      })

      it('should mark as present at exact threshold', () => {
        const sessionStart = new Date('2025-02-01T09:00:00')
        const checkIn = new Date('2025-02-01T09:15:00') // Exactly 15 min

        const status = service.determineStatus(checkIn, sessionStart)

        expect(status).toBe(AttendanceStatus.PRESENT)
      })
    })
  })

  // ============================================================================
  // Enrollment Summary Tests
  // ============================================================================

  describe('getEnrollmentSummary', () => {
    const service = new AttendanceService()

    it('should calculate correct summary', () => {
      const attendances: Attendance[] = [
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.LATE }),
        createAttendance({ status: AttendanceStatus.ABSENT }),
        createAttendance({ status: AttendanceStatus.EXCUSED }),
      ]

      const summary = service.getEnrollmentSummary(attendances)

      expect(summary.totalSessions).toBe(5)
      expect(summary.attended).toBe(3) // 2 present + 1 late
      expect(summary.absent).toBe(1)
      expect(summary.late).toBe(1)
      expect(summary.excused).toBe(1)
      expect(summary.attendanceRate).toBe(60) // 3/5 = 60%
    })

    it('should handle empty attendance list', () => {
      const summary = service.getEnrollmentSummary([])

      expect(summary.totalSessions).toBe(0)
      expect(summary.attendanceRate).toBe(0)
    })

    it('should find last attendance', () => {
      const attendances: Attendance[] = [
        createAttendance({
          status: AttendanceStatus.PRESENT,
          checkInTime: new Date('2025-02-01T09:00:00'),
        }),
        createAttendance({
          status: AttendanceStatus.PRESENT,
          checkInTime: new Date('2025-02-08T09:00:00'), // Most recent
        }),
        createAttendance({
          status: AttendanceStatus.PRESENT,
          checkInTime: new Date('2025-02-03T09:00:00'),
        }),
      ]

      const summary = service.getEnrollmentSummary(attendances)

      expect(summary.lastAttendance).toEqual(new Date('2025-02-08T09:00:00'))
    })
  })

  // ============================================================================
  // Session Summary Tests
  // ============================================================================

  describe('getSessionSummary', () => {
    const service = new AttendanceService()

    it('should calculate session attendance summary', () => {
      const attendances: Attendance[] = [
        createAttendance({ sessionId: 's1', status: AttendanceStatus.PRESENT }),
        createAttendance({ sessionId: 's1', status: AttendanceStatus.PRESENT }),
        createAttendance({ sessionId: 's1', status: AttendanceStatus.LATE }),
        createAttendance({ sessionId: 's1', status: AttendanceStatus.ABSENT }),
        createAttendance({ sessionId: 's1', status: AttendanceStatus.PENDING }),
        createAttendance({ sessionId: 's2', status: AttendanceStatus.PRESENT }), // Different session
      ]

      const summary = service.getSessionSummary(attendances, 's1', 'Session 1')

      expect(summary.sessionId).toBe('s1')
      expect(summary.totalEnrolled).toBe(5)
      expect(summary.present).toBe(2)
      expect(summary.late).toBe(1)
      expect(summary.absent).toBe(1)
      expect(summary.pending).toBe(1)
      expect(summary.attendanceRate).toBe(60) // 3/5
    })
  })

  // ============================================================================
  // Attendance Requirements Tests
  // ============================================================================

  describe('meetsAttendanceRequirement', () => {
    const service = new AttendanceService({ minAttendanceRate: 75 })

    it('should return true when meeting requirement', () => {
      const attendances: Attendance[] = [
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.ABSENT }),
      ]

      const result = service.meetsAttendanceRequirement(attendances)

      expect(result.meets).toBe(true)
      expect(result.rate).toBe(75)
      expect(result.required).toBe(75)
    })

    it('should return false when not meeting requirement', () => {
      const attendances: Attendance[] = [
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.PRESENT }),
        createAttendance({ status: AttendanceStatus.ABSENT }),
        createAttendance({ status: AttendanceStatus.ABSENT }),
      ]

      const result = service.meetsAttendanceRequirement(attendances)

      expect(result.meets).toBe(false)
      expect(result.rate).toBe(50)
    })
  })

  // ============================================================================
  // Low Attendance Detection Tests
  // ============================================================================

  describe('getLowAttendanceStudents', () => {
    const service = new AttendanceService({ minAttendanceRate: 75 })

    it('should find students with low attendance', () => {
      const attendances: Attendance[] = [
        // Student 1: 100% attendance
        createAttendance({ enrollmentId: 'e1', userId: 'u1', status: AttendanceStatus.PRESENT }),
        createAttendance({ enrollmentId: 'e1', userId: 'u1', status: AttendanceStatus.PRESENT }),
        createAttendance({ enrollmentId: 'e1', userId: 'u1', status: AttendanceStatus.PRESENT }),
        // Student 2: 33% attendance (low)
        createAttendance({ enrollmentId: 'e2', userId: 'u2', status: AttendanceStatus.PRESENT }),
        createAttendance({ enrollmentId: 'e2', userId: 'u2', status: AttendanceStatus.ABSENT }),
        createAttendance({ enrollmentId: 'e2', userId: 'u2', status: AttendanceStatus.ABSENT }),
        // Student 3: 66% attendance (low)
        createAttendance({ enrollmentId: 'e3', userId: 'u3', status: AttendanceStatus.PRESENT }),
        createAttendance({ enrollmentId: 'e3', userId: 'u3', status: AttendanceStatus.PRESENT }),
        createAttendance({ enrollmentId: 'e3', userId: 'u3', status: AttendanceStatus.ABSENT }),
      ]

      const lowAttendance = service.getLowAttendanceStudents(attendances)

      expect(lowAttendance).toHaveLength(2) // e2 and e3
      expect(lowAttendance[0].enrollmentId).toBe('e2') // Sorted by rate
    })

    it('should respect minimum sessions threshold', () => {
      const attendances: Attendance[] = [
        // Student with low attendance but only 2 sessions (below threshold)
        createAttendance({ enrollmentId: 'e1', userId: 'u1', status: AttendanceStatus.ABSENT }),
        createAttendance({ enrollmentId: 'e1', userId: 'u1', status: AttendanceStatus.ABSENT }),
      ]

      const lowAttendance = service.getLowAttendanceStudents(attendances)

      expect(lowAttendance).toHaveLength(0) // Needs at least 3 sessions
    })
  })

  // ============================================================================
  // Report Generation Tests
  // ============================================================================

  describe('generateReport', () => {
    const service = new AttendanceService()

    it('should generate attendance report', () => {
      const attendances: Attendance[] = [
        createAttendance({ sessionId: 's1', status: AttendanceStatus.PRESENT }),
        createAttendance({ sessionId: 's1', status: AttendanceStatus.LATE }),
        createAttendance({ sessionId: 's2', status: AttendanceStatus.PRESENT }),
        createAttendance({ sessionId: 's2', status: AttendanceStatus.ABSENT }),
      ]

      const report = service.generateReport({
        attendances,
        startDate: new Date('2025-02-01'),
        endDate: new Date('2025-02-28'),
      })

      expect(report.totalSessions).toBe(2)
      expect(report.averageAttendanceRate).toBe(75) // 3/4
      expect(report.statusBreakdown.present).toBe(2)
      expect(report.statusBreakdown.late).toBe(1)
      expect(report.statusBreakdown.absent).toBe(1)
    })
  })

  // ============================================================================
  // Utility Function Tests
  // ============================================================================

  describe('utility functions', () => {
    describe('canModifyAttendance', () => {
      it('should allow modification within window', () => {
        const attendance = createAttendance()
        const sessionEnd = new Date(Date.now() - 3600000) // 1 hour ago

        const canModify = canModifyAttendance(attendance, sessionEnd, 48)

        expect(canModify).toBe(true)
      })

      it('should not allow modification after window', () => {
        const attendance = createAttendance()
        const sessionEnd = new Date(Date.now() - 72 * 3600000) // 72 hours ago

        const canModify = canModifyAttendance(attendance, sessionEnd, 48)

        expect(canModify).toBe(false)
      })
    })

    describe('calculateDuration', () => {
      it('should calculate duration from check in/out', () => {
        const attendance = createAttendance({
          checkInTime: new Date('2025-02-01T09:00:00'),
          checkOutTime: new Date('2025-02-01T10:30:00'),
        })

        const duration = calculateDuration(attendance, new Date('2025-02-01T11:00:00'))

        expect(duration).toBe(90) // 1.5 hours
      })

      it('should use session end time if no check out', () => {
        const attendance = createAttendance({
          checkInTime: new Date('2025-02-01T09:00:00'),
        })

        const duration = calculateDuration(attendance, new Date('2025-02-01T11:00:00'))

        expect(duration).toBe(120) // 2 hours
      })

      it('should return 0 if no check in', () => {
        const attendance = createAttendance({
          checkInTime: undefined,
        })

        const duration = calculateDuration(attendance, new Date('2025-02-01T11:00:00'))

        expect(duration).toBe(0)
      })
    })
  })
})
