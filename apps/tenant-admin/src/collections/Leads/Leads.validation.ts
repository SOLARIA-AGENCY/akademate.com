import { z } from 'zod';

/**
 * Leads Collection - Validation Schemas
 *
 * This file contains Zod schemas for validating lead data with GDPR compliance.
 *
 * Key validations:
 * - Spanish phone format: +34 XXX XXX XXX
 * - Email RFC 5322 compliance
 * - GDPR consent MUST be true (not just truthy)
 * - Privacy policy acceptance MUST be true
 * - Status, priority, and contact method enums
 * - Lead score range: 0-100
 * - Field length constraints
 */

// ============================================================================
// PHONE VALIDATION - Spanish Format
// ============================================================================

/**
 * Spanish phone format: +34 XXX XXX XXX
 * Examples:
 * - +34 612 345 678 ✅
 * - +34 623 456 789 ✅
 * - 612345678 ❌ (missing +34)
 * - +1 555 123 4567 ❌ (wrong country code)
 */
export const spanishPhoneRegex = /^\+34\s\d{3}\s\d{3}\s\d{3}$/;

export const phoneSchema = z.string().regex(
  spanishPhoneRegex,
  'Phone must be in Spanish format: +34 XXX XXX XXX'
);

/**
 * Format Spanish phone number from various input formats
 *
 * @param phone - Input phone number
 * @returns Formatted phone in +34 XXX XXX XXX format
 *
 * Examples:
 * - formatSpanishPhone('612345678') → '+34 612 345 678'
 * - formatSpanishPhone('34612345678') → '+34 612 345 678'
 * - formatSpanishPhone('+34612345678') → '+34 612 345 678'
 */
export const formatSpanishPhone = (phone: string): string => {
  // Remove all non-digits
  const digits = phone.replace(/\D/g, '');

  // Handle different input formats
  if (digits.startsWith('34') && digits.length === 11) {
    // 34XXXXXXXXX → +34 XXX XXX XXX
    return `+34 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8, 11)}`;
  } else if (digits.length === 9) {
    // XXXXXXXXX → +34 XXX XXX XXX
    return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 9)}`;
  }

  return phone; // Return as-is if format is unknown
};

// ============================================================================
// EMAIL VALIDATION - RFC 5322
// ============================================================================

/**
 * Email validation using Zod's built-in email validator (RFC 5322)
 */
export const emailSchema = z.string().email('Invalid email format').max(255, 'Email must be 255 characters or less');

// ============================================================================
// GDPR CONSENT VALIDATION (CRITICAL)
// ============================================================================

/**
 * GDPR consent MUST be explicitly true (not just truthy)
 * This enforces the database CHECK constraint at the application level
 */
export const gdprConsentSchema = z.literal(true, {
  errorMap: () => ({ message: 'GDPR consent is required to submit this form' }),
});

/**
 * Privacy policy acceptance MUST be explicitly true
 * This enforces the database CHECK constraint at the application level
 */
export const privacyPolicySchema = z.literal(true, {
  errorMap: () => ({ message: 'You must accept the privacy policy to submit this form' }),
});

/**
 * Marketing consent is OPTIONAL (can be true or false)
 */
export const marketingConsentSchema = z.boolean().optional().default(false);

// ============================================================================
// ENUM VALIDATIONS
// ============================================================================

/**
 * Lead status enum
 */
export const statusSchema = z.enum(['new', 'contacted', 'qualified', 'converted', 'rejected', 'spam'], {
  errorMap: () => ({ message: 'Invalid status value' }),
});

/**
 * Priority enum
 */
export const prioritySchema = z.enum(['low', 'medium', 'high', 'urgent'], {
  errorMap: () => ({ message: 'Invalid priority value' }),
});

/**
 * Preferred contact method enum
 */
export const contactMethodSchema = z.enum(['email', 'phone', 'whatsapp'], {
  errorMap: () => ({ message: 'Invalid contact method' }),
});

/**
 * Preferred contact time enum
 */
export const contactTimeSchema = z.enum(['morning', 'afternoon', 'evening', 'anytime'], {
  errorMap: () => ({ message: 'Invalid contact time' }),
});

/**
 * Lead score validation: 0-100
 */
export const leadScoreSchema = z
  .number()
  .int('Lead score must be an integer')
  .min(0, 'Lead score must be at least 0')
  .max(100, 'Lead score must be at most 100');

// ============================================================================
// UUID VALIDATION (for relationships)
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

// ============================================================================
// MAIN LEAD SCHEMA
// ============================================================================

/**
 * Complete Lead validation schema
 *
 * Required fields:
 * - first_name, last_name, email, phone (PII)
 * - gdpr_consent = true (MANDATORY)
 * - privacy_policy_accepted = true (MANDATORY)
 *
 * Optional fields:
 * - course, campus, campaign (relationships)
 * - message, notes (text fields)
 * - preferred_contact_method, preferred_contact_time
 * - marketing_consent (OPTIONAL, defaults to false)
 * - status, priority, assigned_to
 * - utm_* (tracking parameters)
 * - lead_score
 */
export const LeadSchema = z.object({
  // ============================================================================
  // REQUIRED FIELDS (PII)
  // ============================================================================

  first_name: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be 100 characters or less')
    .trim(),

  last_name: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be 100 characters or less')
    .trim(),

  email: emailSchema,

  phone: phoneSchema,

  // ============================================================================
  // GDPR COMPLIANCE (MANDATORY)
  // ============================================================================

  gdpr_consent: gdprConsentSchema,

  privacy_policy_accepted: privacyPolicySchema,

  marketing_consent: marketingConsentSchema,

  // ============================================================================
  // RELATIONSHIPS (optional)
  // ============================================================================

  course: uuidSchema.optional(),

  campus: uuidSchema.optional(),

  campaign: uuidSchema.optional(),

  assigned_to: uuidSchema.optional(),

  // ============================================================================
  // ADDITIONAL INFORMATION (optional)
  // ============================================================================

  message: z.string().max(5000, 'Message must be 5000 characters or less').optional(),

  notes: z.string().optional(),

  preferred_contact_method: contactMethodSchema.optional(),

  preferred_contact_time: contactTimeSchema.optional(),

  // ============================================================================
  // LEAD MANAGEMENT (optional)
  // ============================================================================

  status: statusSchema.optional().default('new'),

  priority: prioritySchema.optional().default('medium'),

  lead_score: leadScoreSchema.optional().default(0),

  // ============================================================================
  // UTM TRACKING (optional)
  // ============================================================================

  utm_source: z.string().max(255, 'UTM source must be 255 characters or less').optional(),

  utm_medium: z.string().max(255, 'UTM medium must be 255 characters or less').optional(),

  utm_campaign: z.string().max(255, 'UTM campaign must be 255 characters or less').optional(),

  utm_term: z.string().max(255, 'UTM term must be 255 characters or less').optional(),

  utm_content: z.string().max(255, 'UTM content must be 255 characters or less').optional(),

  // ============================================================================
  // EXTERNAL SERVICE IDs (optional, auto-populated)
  // ============================================================================

  mailchimp_subscriber_id: z.string().max(255).optional(),

  whatsapp_contact_id: z.string().max(255).optional(),

  // ============================================================================
  // CONSENT METADATA (optional, auto-captured)
  // ============================================================================

  consent_timestamp: z.string().datetime().optional(),

  consent_ip_address: z.string().ip().optional(),

  // ============================================================================
  // TIMESTAMPS (optional, auto-managed)
  // ============================================================================

  last_contacted_at: z.string().datetime().optional(),

  converted_at: z.string().datetime().optional(),
});

/**
 * Type inference from schema
 */
export type LeadInput = z.infer<typeof LeadSchema>;

/**
 * Validation helper function
 *
 * @param data - Raw data to validate
 * @returns Validated lead data
 * @throws ZodError if validation fails
 */
export const validateLeadData = (data: unknown): LeadInput => {
  return LeadSchema.parse(data);
};

/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: LeadInput, error?: ZodError }
 */
export const safeValidateLeadData = (data: unknown) => {
  return LeadSchema.safeParse(data);
};

/**
 * Partial schema for updates (all fields optional except IDs)
 */
export const LeadUpdateSchema = LeadSchema.partial().extend({
  // Ensure certain fields cannot be updated
  gdpr_consent: z.literal(true).optional(),
  privacy_policy_accepted: z.literal(true).optional(),
});

export type LeadUpdateInput = z.infer<typeof LeadUpdateSchema>;

/**
 * Format validation errors for API responses
 *
 * @param error - Zod error object
 * @returns Formatted error array for Payload CMS
 */
export const formatValidationErrors = (error: z.ZodError) => {
  return error.errors.map((err) => ({
    message: err.message,
    field: err.path.join('.'),
  }));
};
