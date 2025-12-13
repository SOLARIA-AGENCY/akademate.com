/**
 * @module @akademate/api/gdpr
 * GDPR Compliance Module
 *
 * Implements GDPR Articles:
 * - Article 15: Right of Access (data export)
 * - Article 17: Right to Erasure (anonymization)
 * - Article 7: Consent Withdrawal (future)
 */

// ============================================================================
// Article 15 - Right of Access (Export)
// ============================================================================

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

export { ExportFormatSchema, ExportRequestSchema } from './types'

export {
  GdprExportService,
  createGdprExportService,
  type GdprExportDependencies,
  type ExportSection,
} from './export'

// ============================================================================
// Article 17 - Right to Erasure (Anonymization)
// ============================================================================

export type {
  AnonymizationResult,
  AnonymizationDependencies,
  AnonymizeRequest,
} from './anonymize'

export {
  GdprAnonymizationService,
  createGdprAnonymizationService,
  AnonymizeRequestSchema,
} from './anonymize'

// ============================================================================
// Article 7 - Consent Management
// ============================================================================

export type {
  ConsentType,
  ConsentRecord,
  ConsentHistoryEntry,
  UserConsents,
  ConsentDependencies,
  UpdateConsentsRequest,
  WithdrawConsentRequest,
  ConsentAuditRequest,
} from './consent'

export {
  ConsentTypeSchema,
  GdprConsentService,
  createGdprConsentService,
  UpdateConsentsRequestSchema,
  WithdrawConsentRequestSchema,
  ConsentAuditRequestSchema,
} from './consent'

// ============================================================================
// Article 5(1)(e) - Data Retention (Storage Limitation)
// ============================================================================

export type {
  DataCategory,
  RetentionPolicy,
  RetentionJobResult,
  RetentionCandidate,
  RetentionDependencies,
  UpdateRetentionPolicyRequest,
  ExecuteRetentionRequest,
} from './retention'

export {
  DataCategorySchema,
  DEFAULT_RETENTION_POLICIES,
  GdprRetentionService,
  createGdprRetentionService,
  UpdateRetentionPolicySchema,
  ExecuteRetentionSchema,
} from './retention'
