/**
 * @module @akademate/api/gdpr
 * GDPR Compliance Module
 *
 * Implements GDPR Articles:
 * - Article 15: Right of Access (data export)
 * - Article 17: Right to Erasure (future: anonymization)
 * - Article 7: Consent Withdrawal (future)
 */

// Types
export type {
  ExportFormat,
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
  UserDataExport,
  ExportRequest,
  ExportResponse,
} from './types'

// Schemas
export { ExportFormatSchema, ExportRequestSchema } from './types'

// Service
export {
  GdprExportService,
  createGdprExportService,
  type GdprExportDependencies,
  type ExportSection,
} from './export'
