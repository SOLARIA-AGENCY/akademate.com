/**
 * @module @akademate/api/gdpr
 * GDPR Data Export Types
 *
 * Implements Article 15 - Right of Access
 * User can request all personal data in machine-readable format
 */

import { z } from 'zod'

// ============================================================================
// Export Format Types
// ============================================================================

export type ExportFormat = 'json' | 'csv'

export const ExportFormatSchema = z.enum(['json', 'csv']).default('json')

// ============================================================================
// User Profile Data
// ============================================================================

export interface UserProfileExport {
  id: string
  email: string
  name: string
  mfaEnabled: boolean
  createdAt: string
  updatedAt: string
}

// ============================================================================
// Membership Data
// ============================================================================

export interface MembershipExport {
  tenantId: string
  tenantName: string
  roles: string[]
  status: string
  createdAt: string
}

// ============================================================================
// Enrollment Data
// ============================================================================

export interface EnrollmentExport {
  id: string
  courseRunId: string
  courseRunName: string
  status: string
  progress: number
  enrolledAt: string
  startedAt: string | null
  completedAt: string | null
  lastAccessAt: string | null
}

// ============================================================================
// Learning Progress Data
// ============================================================================

export interface LessonProgressExport {
  lessonId: string
  lessonTitle: string
  moduleTitle: string
  isCompleted: boolean
  completedAt: string | null
  timeSpentSeconds: number
}

// ============================================================================
// Submission & Grade Data
// ============================================================================

export interface SubmissionExport {
  id: string
  assignmentId: string
  assignmentTitle: string
  status: string
  attemptNumber: number
  submittedAt: string | null
  grade: {
    score: number
    maxScore: number
    feedback: string | null
    isPass: boolean
    gradedAt: string
  } | null
}

// ============================================================================
// Certificate Data
// ============================================================================

export interface CertificateExport {
  id: string
  courseRunId: string
  courseRunName: string
  verificationHash: string
  issuedAt: string
  expiresAt: string | null
  pdfUrl: string | null
}

// ============================================================================
// Gamification Data
// ============================================================================

export interface BadgeExport {
  badgeName: string
  badgeType: string
  earnedAt: string
  pointsValue: number
}

export interface PointsTransactionExport {
  points: number
  reason: string
  sourceType: string
  createdAt: string
}

export interface StreakExport {
  currentStreak: number
  longestStreak: number
  lastActivityAt: string | null
}

// ============================================================================
// Attendance Data
// ============================================================================

export interface AttendanceExport {
  sessionDate: string
  status: string
  checkInAt: string | null
  checkOutAt: string | null
  courseRunName: string
}

// ============================================================================
// Lead Data (if user was converted from lead)
// ============================================================================

export interface LeadDataExport {
  originalEmail: string
  source: string
  createdAt: string
  convertedAt: string | null
  gdprConsentAt: string | null
  tags: string[]
}

// ============================================================================
// Audit Log (actions by/on user)
// ============================================================================

export interface AuditLogExport {
  action: string
  resource: string
  resourceId: string
  ipAddress: string | null
  createdAt: string
}

// ============================================================================
// Complete User Data Export
// ============================================================================

export interface UserDataExport {
  exportedAt: string
  format: ExportFormat
  userId: string

  // Personal profile
  profile: UserProfileExport

  // Multi-tenant memberships
  memberships: MembershipExport[]

  // Learning data
  enrollments: EnrollmentExport[]
  lessonProgress: LessonProgressExport[]
  submissions: SubmissionExport[]
  certificates: CertificateExport[]

  // Gamification
  badges: BadgeExport[]
  pointsTransactions: PointsTransactionExport[]
  streaks: StreakExport[]

  // Operations
  attendance: AttendanceExport[]

  // Marketing (if applicable)
  leadData: LeadDataExport | null

  // Activity logs
  auditLogs: AuditLogExport[]
}

// ============================================================================
// Request/Response Schemas
// ============================================================================

export const ExportRequestSchema = z.object({
  userId: z.string().uuid().optional(), // Admin can export for other users
  format: ExportFormatSchema,
  includeSections: z.array(z.enum([
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
  ])).optional(), // If not provided, export all
})

export type ExportRequest = z.infer<typeof ExportRequestSchema>

export interface ExportResponse {
  success: boolean
  export: UserDataExport
  downloadUrl?: string // For async large exports
}
