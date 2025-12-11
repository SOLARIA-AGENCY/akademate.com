import { z } from 'zod';

/**
 * Students Collection - Validation Schemas
 *
 * This file contains Zod schemas for validating student data with GDPR compliance
 * and Spanish-specific validation (DNI, phone format).
 *
 * Key validations:
 * - Spanish phone format: +34 XXX XXX XXX
 * - Email RFC 5322 compliance
 * - Spanish DNI format: 8 digits + checksum letter
 * - GDPR consent MUST be true (not just truthy)
 * - Privacy policy acceptance MUST be true
 * - Age validation: Student must be >= 16 years old
 * - Status, gender enums
 * - Field length constraints
 */

// ============================================================================
// PHONE VALIDATION - Spanish Format
// ============================================================================

/**
 * Spanish phone format: +34 XXX XXX XXX
 * Examples:
 * - +34 612 345 678 ✅ (mobile)
 * - +34 912 345 678 ✅ (landline Madrid)
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
// DNI VALIDATION - Spanish ID Document
// ============================================================================

/**
 * Spanish DNI format: 8 digits + 1 letter (checksum)
 * The letter is calculated from the number using modulo 23
 *
 * Examples:
 * - 12345678Z ✅ (valid checksum)
 * - 12345678X ❌ (invalid checksum)
 * - 1234567Z ❌ (only 7 digits)
 */
export const dniRegex = /^\d{8}[A-Z]$/;

/**
 * DNI checksum letters table (position = number % 23)
 */
const DNI_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE';

/**
 * Validate Spanish DNI checksum
 *
 * @param dni - DNI string (8 digits + 1 letter)
 * @returns true if checksum is valid
 *
 * Algorithm:
 * 1. Extract number (first 8 digits)
 * 2. Calculate: number % 23
 * 3. Look up letter at that position in DNI_LETTERS
 * 4. Compare with provided letter
 */
export const validateDNIChecksum = (dni: string): boolean => {
  if (!dniRegex.test(dni)) {
    return false;
  }

  const number = parseInt(dni.slice(0, 8), 10);
  const letter = dni.charAt(8);
  const expectedLetter = DNI_LETTERS[number % 23];

  return letter === expectedLetter;
};

/**
 * Zod schema for DNI validation with checksum
 */
export const dniSchema = z
  .string()
  .regex(dniRegex, 'DNI must be 8 digits followed by a letter')
  .refine(validateDNIChecksum, {
    message: 'DNI checksum letter is invalid',
  });

// ============================================================================
// EMAIL VALIDATION - RFC 5322
// ============================================================================

/**
 * Email validation using Zod's built-in email validator (RFC 5322)
 */
export const emailSchema = z
  .string()
  .email('Invalid email format')
  .max(255, 'Email must be 255 characters or less');

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
// DATE OF BIRTH VALIDATION
// ============================================================================

/**
 * Validate date of birth:
 * - Must be in the past
 * - Student must be at least 16 years old
 */
export const dateOfBirthSchema = z
  .string()
  .date('Invalid date format')
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      return date < today;
    },
    {
      message: 'Date of birth must be in the past',
    }
  )
  .refine(
    (dateStr) => {
      const date = new Date(dateStr);
      const today = new Date();
      const age = today.getFullYear() - date.getFullYear();
      const monthDiff = today.getMonth() - date.getMonth();
      const dayDiff = today.getDate() - date.getDate();

      // Adjust age if birthday hasn't occurred this year yet
      if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
        return age - 1 >= 16;
      }

      return age >= 16;
    },
    {
      message: 'Student must be at least 16 years old',
    }
  );

// ============================================================================
// ENUM VALIDATIONS
// ============================================================================

/**
 * Student status enum
 */
export const VALID_STUDENT_STATUSES = ['active', 'inactive', 'suspended', 'graduated'] as const;

export const statusSchema = z.enum(VALID_STUDENT_STATUSES, {
  errorMap: () => ({ message: 'Invalid status value' }),
});

/**
 * Gender enum
 */
export const VALID_GENDERS = ['male', 'female', 'non-binary', 'prefer-not-to-say'] as const;

export const genderSchema = z.enum(VALID_GENDERS, {
  errorMap: () => ({ message: 'Invalid gender value' }),
});

/**
 * Emergency contact relationship enum
 */
export const VALID_RELATIONSHIPS = [
  'parent',
  'father',
  'mother',
  'guardian',
  'spouse',
  'partner',
  'sibling',
  'friend',
  'other',
] as const;

export const relationshipSchema = z.enum(VALID_RELATIONSHIPS, {
  errorMap: () => ({ message: 'Invalid relationship value' }),
});

// ============================================================================
// UUID VALIDATION (for relationships)
// ============================================================================

export const uuidSchema = z.string().uuid('Invalid UUID format');

// ============================================================================
// MAIN STUDENT SCHEMA
// ============================================================================

/**
 * Complete Student validation schema
 *
 * Required fields:
 * - first_name, last_name, email, phone (PII)
 * - gdpr_consent = true (MANDATORY)
 * - privacy_policy_accepted = true (MANDATORY)
 *
 * Optional fields:
 * - dni (unique if provided)
 * - address, city, postal_code, country
 * - date_of_birth (must be >= 16 years old)
 * - gender
 * - emergency_contact_* (name, phone, relationship)
 * - marketing_consent (OPTIONAL, defaults to false)
 * - status, notes
 */
export const StudentSchema = z.object({
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
  // OPTIONAL PERSONAL INFORMATION
  // ============================================================================

  dni: dniSchema.optional(),

  address: z.string().max(500, 'Address must be 500 characters or less').optional(),

  city: z.string().max(100, 'City must be 100 characters or less').optional(),

  postal_code: z.string().max(10, 'Postal code must be 10 characters or less').optional(),

  country: z.string().max(100, 'Country must be 100 characters or less').optional(),

  date_of_birth: dateOfBirthSchema.optional(),

  gender: genderSchema.optional(),

  // ============================================================================
  // EMERGENCY CONTACT (OPTIONAL)
  // ============================================================================

  emergency_contact_name: z
    .string()
    .max(200, 'Emergency contact name must be 200 characters or less')
    .optional(),

  emergency_contact_phone: phoneSchema.optional(),

  emergency_contact_relationship: relationshipSchema.optional(),

  // ============================================================================
  // STATUS AND NOTES
  // ============================================================================

  status: statusSchema.optional().default('active'),

  notes: z.string().optional(),

  // ============================================================================
  // CONSENT METADATA (optional, auto-captured)
  // ============================================================================

  consent_timestamp: z.string().datetime().optional(),

  consent_ip_address: z.string().ip().optional(),

  // ============================================================================
  // AUDIT TRAIL
  // ============================================================================

  created_by: uuidSchema.optional(),
});

/**
 * Type inference from schema
 */
export type StudentInput = z.infer<typeof StudentSchema>;

/**
 * Validation helper function
 *
 * @param data - Raw data to validate
 * @returns Validated student data
 * @throws ZodError if validation fails
 */
export const validateStudentData = (data: unknown): StudentInput => {
  return StudentSchema.parse(data);
};

/**
 * Safe validation helper (returns result object)
 *
 * @param data - Raw data to validate
 * @returns { success: boolean, data?: StudentInput, error?: ZodError }
 */
export const safeValidateStudentData = (data: unknown) => {
  return StudentSchema.safeParse(data);
};

/**
 * Partial schema for updates (all fields optional except immutable ones)
 */
export const StudentUpdateSchema = StudentSchema.partial().extend({
  // Ensure certain fields cannot be updated (immutable)
  gdpr_consent: z.literal(true).optional(),
  privacy_policy_accepted: z.literal(true).optional(),
  consent_timestamp: z.never().optional(), // Cannot be in update payload
  consent_ip_address: z.never().optional(), // Cannot be in update payload
  created_by: z.never().optional(), // Cannot be in update payload
});

export type StudentUpdateInput = z.infer<typeof StudentUpdateSchema>;

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

/**
 * Validate email uniqueness (must be checked against database)
 * This is handled by Payload's unique constraint
 */
export const checkEmailUniqueness = async (
  email: string,
  payload: any,
  excludeId?: string
): Promise<boolean> => {
  const existing = await payload.find({
    collection: 'students',
    where: {
      email: { equals: email },
    },
    limit: 1,
  });

  // If excluding an ID (update operation), check if found record is not the same
  if (existing.docs.length > 0 && existing.docs[0].id !== excludeId) {
    return false; // Email already exists
  }

  return true; // Email is unique
};

/**
 * Validate DNI uniqueness (must be checked against database)
 * This is handled by Payload's unique constraint
 */
export const checkDNIUniqueness = async (
  dni: string,
  payload: any,
  excludeId?: string
): Promise<boolean> => {
  const existing = await payload.find({
    collection: 'students',
    where: {
      dni: { equals: dni },
    },
    limit: 1,
  });

  if (existing.docs.length > 0 && existing.docs[0].id !== excludeId) {
    return false; // DNI already exists
  }

  return true; // DNI is unique
};
