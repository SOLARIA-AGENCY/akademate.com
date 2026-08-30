/**
 * @module @akademate/operations
 * Academic Operations Domain Module
 *
 * Provides domain logic for:
 * - Enrollment management and status transitions
 * - Calendar and session scheduling
 * - Attendance tracking and reporting
 * - Payment tracking (basic)
 */

// Types and schemas
export {
  EnrollmentStatus,
  SessionType,
  AttendanceStatus,
  PaymentStatus,
  EnrollmentSchema,
  EnrollmentRequestSchema,
  SessionSchema,
  AttendanceSchema,
  PaymentSchema,
  type Enrollment,
  type EnrollmentRequest,
  type Session,
  type Attendance,
  type Payment,
  type CalendarEvent,
  type CalendarFilter,
  type AttendanceSummary,
  type SessionAttendanceSummary,
  type EnrollmentTransition,
  type GraduationCheck,
} from './types.js'

// Enrollment service
export {
  EnrollmentService,
  EnrollmentError,
  isValidEnrollmentTransition,
  getNextEnrollmentStatuses,
  type EnrollmentServiceConfig,
} from './enrollment.js'

// Calendar service
export {
  CalendarService,
  checkSessionConflicts,
  validateSessionTimes,
  generateRecurringSessions,
  type SessionConflict,
  type RecurrencePattern,
  type RecurrenceFrequency,
} from './calendar.js'

// Attendance service
export {
  AttendanceService,
  canModifyAttendance,
  calculateDuration,
  type AttendanceServiceConfig,
} from './attendance.js'

// Staff-only region-pack roster. Sibling of LMS AttendanceService; do not reuse LMS codes.
export {
  COMPLIANCE_CONTRACT_VERSION,
  EMPTY_REGION_PACK,
  ES_CANARIAS_SCE_PACK,
  REGION_PACK_CATALOG,
  findRegionPack,
  mergePolicy,
  resolvePolicy,
  assertKnownCode,
  attendedHours,
  canApplyDropout,
  consecutiveUnjustifiedAbsences,
  crossedMilestones,
  dedupeEvents,
  evaluateAttendance,
  hourProgressPercent,
  staffCanSeeRoster,
  learnerCanSeeRoster,
  normalizeSelectionStage,
} from './compliance-ops.js'
export { OFFICIAL_PROFESSIONAL_FAMILIES, officialFamilyByCode } from './official-families.js'
export { SYNTHETIC_PLACEMENT_AGENCIES, findSyntheticAgency, isPublicPlacementEmail } from './placement-agency.js'
