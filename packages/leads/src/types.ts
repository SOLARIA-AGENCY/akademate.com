/**
 * @module @akademate/leads/types
 * Domain types for lead management and pre-enrollment
 */

import { z } from 'zod'

// ============================================================================
// Lead Status
// ============================================================================

export const LeadStatus = {
  NEW: 'new',
  CONTACTED: 'contacted',
  QUALIFIED: 'qualified',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const

export type LeadStatus = (typeof LeadStatus)[keyof typeof LeadStatus]

// ============================================================================
// Lead Source
// ============================================================================

export const LeadSource = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL: 'social',
  ADS: 'ads',
  EVENT: 'event',
  OTHER: 'other',
} as const

export type LeadSource = (typeof LeadSource)[keyof typeof LeadSource]

// ============================================================================
// GDPR Consent Types
// ============================================================================

export const ConsentType = {
  MARKETING: 'marketing',
  DATA_PROCESSING: 'data_processing',
  THIRD_PARTY: 'third_party',
  PROFILING: 'profiling',
} as const

export type ConsentType = (typeof ConsentType)[keyof typeof ConsentType]

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

/**
 * Spanish phone validation (mobile and landline)
 * Mobile: 6XX XXX XXX or 7XX XXX XXX
 * Landline: 9XX XXX XXX
 */
const spanishPhoneRegex = /^(\+34)?[679]\d{8}$/

/**
 * Lead capture form schema with GDPR compliance
 */
export const LeadCaptureSchema = z.object({
  // Contact information
  email: z.string().email('Email inválido'),
  name: z.string().min(2, 'Nombre demasiado corto').max(100),
  phone: z.string()
    .regex(spanishPhoneRegex, 'Teléfono español inválido')
    .optional(),

  // Interest
  courseRunId: z.string().uuid().optional(),
  message: z.string().max(2000).optional(),

  // Source tracking
  source: z.enum(['website', 'referral', 'social', 'ads', 'event', 'other']).default('website'),
  campaignId: z.string().uuid().optional(),
  utmSource: z.string().max(100).optional(),
  utmMedium: z.string().max(100).optional(),
  utmCampaign: z.string().max(100).optional(),
  utmContent: z.string().max(100).optional(),
  utmTerm: z.string().max(100).optional(),
  referrerUrl: z.string().url().optional(),
  landingPage: z.string().url().optional(),

  // GDPR consents (required)
  gdprConsent: z.boolean().refine(val => val === true, {
    message: 'Debe aceptar la política de privacidad',
  }),
  marketingConsent: z.boolean().default(false),

  // Metadata (set by server)
  ipAddress: z.union([z.ipv4(), z.ipv6()]).optional(),
  userAgent: z.string().max(500).optional(),
})

/**
 * Full lead schema for database operations
 */
export const LeadSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),

  // Contact
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  phone: z.string().max(20).optional(),

  // Status
  source: z.enum(['website', 'referral', 'social', 'ads', 'event', 'other']).default('website'),
  status: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']).default('new'),

  // Interest
  courseRunId: z.string().uuid().optional(),
  campaignId: z.string().uuid().optional(),

  // Notes and tags
  notes: z.string().max(5000).optional(),
  tags: z.array(z.string()).default([]),

  // Scoring
  score: z.number().int().min(0).max(100).default(0),

  // Conversion
  convertedAt: z.date().optional(),
  convertedUserId: z.string().uuid().optional(),

  // GDPR
  gdprConsent: z.boolean().default(false),
  gdprConsentAt: z.date().optional(),
  marketingConsent: z.boolean().default(false),
  marketingConsentAt: z.date().optional(),

  // Tracking metadata
  metadata: z.record(z.string(), z.unknown()).default({}),
})

/**
 * Lead status transition schema
 */
export const LeadStatusTransitionSchema = z.object({
  leadId: z.string().uuid(),
  fromStatus: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  toStatus: z.enum(['new', 'contacted', 'qualified', 'converted', 'lost']),
  userId: z.string().uuid(),
  reason: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
})

/**
 * GDPR consent record schema
 */
export const GdprConsentSchema = z.object({
  leadId: z.string().uuid(),
  consentType: z.enum(['marketing', 'data_processing', 'third_party', 'profiling']),
  granted: z.boolean(),
  ipAddress: z.union([z.ipv4(), z.ipv6()]),
  userAgent: z.string().max(500),
  timestamp: z.date(),
  version: z.string().max(50), // Privacy policy version
})

// ============================================================================
// Type Inferences
// ============================================================================

export type LeadCapture = z.infer<typeof LeadCaptureSchema>
export type Lead = z.infer<typeof LeadSchema>
export type LeadStatusTransition = z.infer<typeof LeadStatusTransitionSchema>
export type GdprConsent = z.infer<typeof GdprConsentSchema>

// ============================================================================
// Lead Scoring Types
// ============================================================================

export interface ScoringRule {
  id: string
  name: string
  description: string
  condition: ScoringCondition
  points: number
  category: 'demographic' | 'behavioral' | 'engagement' | 'fit'
}

export interface ScoringCondition {
  field: string
  operator: 'equals' | 'contains' | 'gt' | 'lt' | 'exists' | 'matches'
  value: unknown
}

export interface LeadScoreResult {
  totalScore: number
  breakdown: {
    ruleId: string
    ruleName: string
    points: number
    matched: boolean
  }[]
  grade: 'A' | 'B' | 'C' | 'D' | 'F'
  recommendation: string
}

// ============================================================================
// Conversion Types
// ============================================================================

export interface ConversionRequest {
  leadId: string
  tenantId: string
  courseRunId: string
  userId: string
  enrollmentData?: {
    paymentMethod?: string
    scholarshipCode?: string
    notes?: string
  }
}

export interface ConversionResult {
  success: boolean
  enrollmentId?: string
  userId?: string
  errors?: string[]
}

// ============================================================================
// Lead Activity Types
// ============================================================================

export const ActivityType = {
  CREATED: 'created',
  STATUS_CHANGED: 'status_changed',
  NOTE_ADDED: 'note_added',
  EMAIL_SENT: 'email_sent',
  CALL_MADE: 'call_made',
  MEETING_SCHEDULED: 'meeting_scheduled',
  DOCUMENT_SENT: 'document_sent',
  CONVERTED: 'converted',
  LOST: 'lost',
} as const

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType]

export interface LeadActivity {
  id: string
  leadId: string
  tenantId: string
  type: ActivityType
  userId: string
  description: string
  metadata?: Record<string, unknown>
  createdAt: Date
}
