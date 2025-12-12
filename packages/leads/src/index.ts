/**
 * @module @akademate/leads
 * Lead Management and Pre-Enrollment Domain Module
 *
 * Provides domain logic for:
 * - Lead capture with GDPR compliance
 * - Lead scoring and qualification
 * - Lead-to-enrollment conversion workflow
 * - Status transitions and activity tracking
 */

// Types and schemas
export {
  LeadStatus,
  LeadSource,
  ConsentType,
  ActivityType,
  LeadCaptureSchema,
  LeadSchema,
  LeadStatusTransitionSchema,
  GdprConsentSchema,
  type Lead,
  type LeadCapture,
  type LeadStatusTransition,
  type GdprConsent,
  type ScoringRule,
  type ScoringCondition,
  type LeadScoreResult,
  type ConversionRequest,
  type ConversionResult,
  type LeadActivity,
} from './types.js'

// Scoring
export {
  LeadScoringService,
  DEFAULT_SCORING_RULES,
  quickScore,
  isQualified,
} from './scoring.js'

// Conversion
export {
  LeadConversionService,
  isValidStatusTransition,
  getNextStatuses,
  checkEligibility,
  DEFAULT_ELIGIBILITY_CHECKS,
  type ConversionServiceConfig,
  type EligibilityCheck,
} from './conversion.js'
