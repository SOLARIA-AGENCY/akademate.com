/**
 * @module @akademate/api/gdpr/export
 * GDPR Data Export Service
 *
 * Implements Article 15 - Right of Access
 * Collects all personal data for a user across all tables
 */

import type {
  UserDataExport,
  UserProfileExport,
  MembershipExport,
  EnrollmentExport,
  LessonProgressExport,
  SubmissionExport,
  CertificateExport,
  BadgeExport,
  PointsTransactionExport,
  StreakExport,
  AttendanceExport,
  LeadDataExport,
  AuditLogExport,
  ExportFormat,
} from './types'

// ============================================================================
// Export Service Interface
// ============================================================================

export interface GdprExportDependencies {
  // Database query functions - injected for testability
  findUserById: (userId: string) => Promise<UserProfileExport | null>
  findMembershipsByUserId: (userId: string) => Promise<MembershipExport[]>
  findEnrollmentsByUserId: (userId: string, tenantId?: string) => Promise<EnrollmentExport[]>
  findLessonProgressByUserId: (userId: string, tenantId?: string) => Promise<LessonProgressExport[]>
  findSubmissionsByUserId: (userId: string, tenantId?: string) => Promise<SubmissionExport[]>
  findCertificatesByUserId: (userId: string, tenantId?: string) => Promise<CertificateExport[]>
  findBadgesByUserId: (userId: string, tenantId?: string) => Promise<BadgeExport[]>
  findPointsTransactionsByUserId: (userId: string, tenantId?: string) => Promise<PointsTransactionExport[]>
  findStreaksByUserId: (userId: string, tenantId?: string) => Promise<StreakExport[]>
  findAttendanceByUserId: (userId: string, tenantId?: string) => Promise<AttendanceExport[]>
  findLeadDataByUserId: (userId: string, tenantId?: string) => Promise<LeadDataExport | null>
  findAuditLogsByUserId: (userId: string, tenantId?: string) => Promise<AuditLogExport[]>
}

export type ExportSection = keyof Omit<UserDataExport, 'exportedAt' | 'format' | 'userId'>

const ALL_SECTIONS: ExportSection[] = [
  'profile',
  'memberships',
  'enrollments',
  'lessonProgress',
  'submissions',
  'certificates',
  'badges',
  'pointsTransactions',
  'streaks',
  'attendance',
  'leadData',
  'auditLogs',
]

// ============================================================================
// Export Service
// ============================================================================

export class GdprExportService {
  constructor(private deps: GdprExportDependencies) {}

  /**
   * Export all personal data for a user
   *
   * @param userId - User ID to export data for
   * @param format - Export format (json or csv)
   * @param tenantId - Optional tenant filter (for scoped exports)
   * @param sections - Optional sections to include (defaults to all)
   */
  async exportUserData(
    userId: string,
    format: ExportFormat = 'json',
    tenantId?: string,
    sections?: ExportSection[]
  ): Promise<UserDataExport> {
    const includeSections = new Set(sections || ALL_SECTIONS)

    // Start with required profile
    const profile = await this.deps.findUserById(userId)
    if (!profile) {
      throw new Error(`User not found: ${userId}`)
    }

    // Build export object based on requested sections
    const exportData: UserDataExport = {
      exportedAt: new Date().toISOString(),
      format,
      userId,
      profile,
      memberships: [],
      enrollments: [],
      lessonProgress: [],
      submissions: [],
      certificates: [],
      badges: [],
      pointsTransactions: [],
      streaks: [],
      attendance: [],
      leadData: null,
      auditLogs: [],
    }

    // Parallel fetch for performance
    const fetchTasks: Promise<void>[] = []

    if (includeSections.has('memberships')) {
      fetchTasks.push(
        this.deps.findMembershipsByUserId(userId).then((data) => {
          exportData.memberships = data
        })
      )
    }

    if (includeSections.has('enrollments')) {
      fetchTasks.push(
        this.deps.findEnrollmentsByUserId(userId, tenantId).then((data) => {
          exportData.enrollments = data
        })
      )
    }

    if (includeSections.has('lessonProgress')) {
      fetchTasks.push(
        this.deps.findLessonProgressByUserId(userId, tenantId).then((data) => {
          exportData.lessonProgress = data
        })
      )
    }

    if (includeSections.has('submissions')) {
      fetchTasks.push(
        this.deps.findSubmissionsByUserId(userId, tenantId).then((data) => {
          exportData.submissions = data
        })
      )
    }

    if (includeSections.has('certificates')) {
      fetchTasks.push(
        this.deps.findCertificatesByUserId(userId, tenantId).then((data) => {
          exportData.certificates = data
        })
      )
    }

    if (includeSections.has('badges')) {
      fetchTasks.push(
        this.deps.findBadgesByUserId(userId, tenantId).then((data) => {
          exportData.badges = data
        })
      )
    }

    if (includeSections.has('pointsTransactions')) {
      fetchTasks.push(
        this.deps.findPointsTransactionsByUserId(userId, tenantId).then((data) => {
          exportData.pointsTransactions = data
        })
      )
    }

    if (includeSections.has('streaks')) {
      fetchTasks.push(
        this.deps.findStreaksByUserId(userId, tenantId).then((data) => {
          exportData.streaks = data
        })
      )
    }

    if (includeSections.has('attendance')) {
      fetchTasks.push(
        this.deps.findAttendanceByUserId(userId, tenantId).then((data) => {
          exportData.attendance = data
        })
      )
    }

    if (includeSections.has('leadData')) {
      fetchTasks.push(
        this.deps.findLeadDataByUserId(userId, tenantId).then((data) => {
          exportData.leadData = data
        })
      )
    }

    if (includeSections.has('auditLogs')) {
      fetchTasks.push(
        this.deps.findAuditLogsByUserId(userId, tenantId).then((data) => {
          exportData.auditLogs = data
        })
      )
    }

    await Promise.all(fetchTasks)

    return exportData
  }

  /**
   * Convert export data to CSV format
   * Returns a zip-like structure with multiple CSVs
   */
  toCSV(exportData: UserDataExport): Record<string, string> {
    const csvFiles: Record<string, string> = {}

    // Profile CSV
    csvFiles['profile.csv'] = this.objectToCSV([exportData.profile])

    // Memberships CSV
    if (exportData.memberships.length > 0) {
      csvFiles['memberships.csv'] = this.objectToCSV(exportData.memberships)
    }

    // Enrollments CSV
    if (exportData.enrollments.length > 0) {
      csvFiles['enrollments.csv'] = this.objectToCSV(exportData.enrollments)
    }

    // Lesson Progress CSV
    if (exportData.lessonProgress.length > 0) {
      csvFiles['lesson_progress.csv'] = this.objectToCSV(exportData.lessonProgress)
    }

    // Submissions CSV
    if (exportData.submissions.length > 0) {
      csvFiles['submissions.csv'] = this.objectToCSV(
        exportData.submissions.map((s) => ({
          ...s,
          grade_score: s.grade?.score ?? null,
          grade_maxScore: s.grade?.maxScore ?? null,
          grade_feedback: s.grade?.feedback ?? null,
          grade_isPass: s.grade?.isPass ?? null,
          grade_gradedAt: s.grade?.gradedAt ?? null,
        }))
      )
    }

    // Certificates CSV
    if (exportData.certificates.length > 0) {
      csvFiles['certificates.csv'] = this.objectToCSV(exportData.certificates)
    }

    // Badges CSV
    if (exportData.badges.length > 0) {
      csvFiles['badges.csv'] = this.objectToCSV(exportData.badges)
    }

    // Points Transactions CSV
    if (exportData.pointsTransactions.length > 0) {
      csvFiles['points_transactions.csv'] = this.objectToCSV(exportData.pointsTransactions)
    }

    // Streaks CSV
    if (exportData.streaks.length > 0) {
      csvFiles['streaks.csv'] = this.objectToCSV(exportData.streaks)
    }

    // Attendance CSV
    if (exportData.attendance.length > 0) {
      csvFiles['attendance.csv'] = this.objectToCSV(exportData.attendance)
    }

    // Lead Data CSV
    if (exportData.leadData) {
      csvFiles['lead_data.csv'] = this.objectToCSV([exportData.leadData])
    }

    // Audit Logs CSV
    if (exportData.auditLogs.length > 0) {
      csvFiles['audit_logs.csv'] = this.objectToCSV(exportData.auditLogs)
    }

    return csvFiles
  }

  /**
   * Convert array of objects to CSV string
   */
  private objectToCSV<T extends object>(data: T[]): string {
    if (data.length === 0) return ''

    const firstRow = data[0] as object
    const headers = Object.keys(firstRow)
    const rows = data.map((row) =>
      headers.map((header) => {
        const value = (row as Record<string, unknown>)[header]
        if (value === null || value === undefined) return ''
        if (typeof value === 'string') {
          // Escape quotes and wrap in quotes if contains comma or newline
          const escaped = value.replace(/"/g, '""')
          return /[,\n"]/.test(value) ? `"${escaped}"` : escaped
        }
        if (Array.isArray(value)) return `"${JSON.stringify(value)}"`
        if (typeof value === 'object') return `"${JSON.stringify(value)}"`
        return String(value)
      }).join(',')
    )

    return [headers.join(','), ...rows].join('\n')
  }
}

// ============================================================================
// Factory Function
// ============================================================================

export function createGdprExportService(deps: GdprExportDependencies): GdprExportService {
  return new GdprExportService(deps)
}
