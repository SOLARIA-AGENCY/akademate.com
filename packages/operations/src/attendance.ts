/**
 * @module @akademate/operations/attendance
 * Attendance tracking service
 */

import {
  AttendanceStatus,
  type Attendance,
  type AttendanceSummary,
  type SessionAttendanceSummary,
} from './types.js'

// ============================================================================
// Attendance Service
// ============================================================================

export interface AttendanceServiceConfig {
  lateThresholdMinutes?: number // Minutes after session start to mark as late
  minAttendanceRate?: number // Minimum attendance rate for course completion (0-100)
  onAttendanceMarked?: (attendance: Attendance) => Promise<void>
}

export class AttendanceService {
  private config: AttendanceServiceConfig

  constructor(config: AttendanceServiceConfig = {}) {
    this.config = {
      lateThresholdMinutes: 15,
      minAttendanceRate: 75,
      ...config,
    }
  }

  /**
   * Mark attendance for a student
   */
  markAttendance(params: {
    sessionId: string
    enrollmentId: string
    userId: string
    tenantId: string
    status: AttendanceStatus
    markedBy: string
    notes?: string
    excuseReason?: string
    excuseDocumentUrl?: string
  }): Attendance {
    const now = new Date()

    const attendance: Attendance = {
      id: crypto.randomUUID(),
      tenantId: params.tenantId,
      sessionId: params.sessionId,
      enrollmentId: params.enrollmentId,
      userId: params.userId,
      status: params.status,
      checkInTime: params.status === AttendanceStatus.PRESENT || params.status === AttendanceStatus.LATE
        ? now
        : undefined,
      markedBy: params.markedBy,
      notes: params.notes,
      excuseReason: params.excuseReason,
      excuseDocumentUrl: params.excuseDocumentUrl,
      metadata: {},
    }

    return attendance
  }

  /**
   * Batch mark attendance for multiple students
   */
  batchMarkAttendance(params: {
    sessionId: string
    tenantId: string
    markedBy: string
    attendances: {
      enrollmentId: string
      userId: string
      status: AttendanceStatus
      notes?: string
    }[]
  }): Attendance[] {
    return params.attendances.map(a => this.markAttendance({
      sessionId: params.sessionId,
      tenantId: params.tenantId,
      markedBy: params.markedBy,
      enrollmentId: a.enrollmentId,
      userId: a.userId,
      status: a.status,
      notes: a.notes,
    }))
  }

  /**
   * Auto-determine attendance status based on check-in time
   */
  determineStatus(checkInTime: Date, sessionStartTime: Date): AttendanceStatus {
    const diffMinutes = (checkInTime.getTime() - sessionStartTime.getTime()) / (1000 * 60)

    if (diffMinutes < 0) {
      // Checked in before session started
      return AttendanceStatus.PRESENT
    } else if (diffMinutes <= (this.config.lateThresholdMinutes ?? 15)) {
      return AttendanceStatus.PRESENT
    } else {
      return AttendanceStatus.LATE
    }
  }

  /**
   * Calculate attendance summary for an enrollment
   */
  getEnrollmentSummary(attendances: Attendance[]): AttendanceSummary {
    if (attendances.length === 0) {
      return {
        enrollmentId: '',
        userId: '',
        totalSessions: 0,
        attended: 0,
        absent: 0,
        late: 0,
        excused: 0,
        attendanceRate: 0,
      }
    }

    const enrollmentId = attendances[0].enrollmentId
    const userId = attendances[0].userId

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      pending: 0,
    }

    for (const a of attendances) {
      counts[a.status]++
    }

    const totalCountable = counts.present + counts.absent + counts.late + counts.excused
    const attended = counts.present + counts.late
    const attendanceRate = totalCountable > 0 ? (attended / totalCountable) * 100 : 0

    // Find last attendance
    const sortedAttendances = [...attendances]
      .filter(a => a.checkInTime)
      .sort((a, b) => (b.checkInTime?.getTime() ?? 0) - (a.checkInTime?.getTime() ?? 0))

    return {
      enrollmentId,
      userId,
      totalSessions: attendances.length,
      attended,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
      lastAttendance: sortedAttendances[0]?.checkInTime,
    }
  }

  /**
   * Calculate attendance summary for a session
   */
  getSessionSummary(attendances: Attendance[], sessionId: string, sessionTitle: string): SessionAttendanceSummary {
    const sessionAttendances = attendances.filter(a => a.sessionId === sessionId)

    const counts = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      pending: 0,
    }

    for (const a of sessionAttendances) {
      counts[a.status]++
    }

    const total = sessionAttendances.length
    const attended = counts.present + counts.late
    const attendanceRate = total > 0 ? (attended / total) * 100 : 0

    return {
      sessionId,
      sessionTitle,
      totalEnrolled: total,
      present: counts.present,
      absent: counts.absent,
      late: counts.late,
      excused: counts.excused,
      pending: counts.pending,
      attendanceRate: Math.round(attendanceRate * 10) / 10,
    }
  }

  /**
   * Check if enrollment meets minimum attendance requirement
   */
  meetsAttendanceRequirement(attendances: Attendance[]): { meets: boolean; rate: number; required: number } {
    const summary = this.getEnrollmentSummary(attendances)
    const required = this.config.minAttendanceRate ?? 75

    return {
      meets: summary.attendanceRate >= required,
      rate: summary.attendanceRate,
      required,
    }
  }

  /**
   * Get students with low attendance (below threshold)
   */
  getLowAttendanceStudents(
    allAttendances: Attendance[],
    threshold?: number
  ): AttendanceSummary[] {
    const effectiveThreshold = threshold ?? (this.config.minAttendanceRate ?? 75)

    // Group by enrollmentId
    const byEnrollment = new Map<string, Attendance[]>()
    for (const a of allAttendances) {
      const existing = byEnrollment.get(a.enrollmentId) ?? []
      existing.push(a)
      byEnrollment.set(a.enrollmentId, existing)
    }

    // Calculate summaries and filter
    const lowAttendance: AttendanceSummary[] = []
    for (const [, attendances] of byEnrollment) {
      const summary = this.getEnrollmentSummary(attendances)
      if (summary.attendanceRate < effectiveThreshold && summary.totalSessions >= 3) {
        lowAttendance.push(summary)
      }
    }

    return lowAttendance.sort((a, b) => a.attendanceRate - b.attendanceRate)
  }

  /**
   * Generate attendance report for date range
   */
  generateReport(params: {
    attendances: Attendance[]
    startDate: Date
    endDate: Date
  }): {
    period: { start: Date; end: Date }
    totalSessions: number
    averageAttendanceRate: number
    statusBreakdown: Record<AttendanceStatus, number>
    lowAttendanceCount: number
  } {
    const { attendances, startDate, endDate } = params

    // Get unique sessions
    const sessionIds = new Set(attendances.map(a => a.sessionId))

    const statusBreakdown: Record<AttendanceStatus, number> = {
      [AttendanceStatus.PRESENT]: 0,
      [AttendanceStatus.ABSENT]: 0,
      [AttendanceStatus.LATE]: 0,
      [AttendanceStatus.EXCUSED]: 0,
      [AttendanceStatus.PENDING]: 0,
    }

    for (const a of attendances) {
      statusBreakdown[a.status as AttendanceStatus]++
    }

    const total = attendances.length
    const attended = statusBreakdown[AttendanceStatus.PRESENT] + statusBreakdown[AttendanceStatus.LATE]
    const averageAttendanceRate = total > 0 ? Math.round((attended / total) * 1000) / 10 : 0

    const lowAttendanceStudents = this.getLowAttendanceStudents(attendances)

    return {
      period: { start: startDate, end: endDate },
      totalSessions: sessionIds.size,
      averageAttendanceRate,
      statusBreakdown,
      lowAttendanceCount: lowAttendanceStudents.length,
    }
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Check if attendance can be modified
 */
export function canModifyAttendance(
  attendance: Attendance,
  sessionEndTime: Date,
  modificationWindowHours = 48
): boolean {
  const now = new Date()
  const windowEnd = new Date(sessionEndTime.getTime() + modificationWindowHours * 60 * 60 * 1000)
  return now <= windowEnd
}

/**
 * Calculate duration attended in minutes
 */
export function calculateDuration(attendance: Attendance, sessionEndTime: Date): number {
  if (!attendance.checkInTime) return 0

  const checkOut = attendance.checkOutTime ?? sessionEndTime
  return Math.round((checkOut.getTime() - attendance.checkInTime.getTime()) / (1000 * 60))
}
