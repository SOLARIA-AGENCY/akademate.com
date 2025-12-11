import { z } from 'zod';

/**
 * Zod Validation Schema for Campuses Collection
 *
 * Provides runtime type validation and TypeScript type inference
 * for the Campuses collection data.
 *
 * Usage:
 * - Type inference: `type CampusData = z.infer<typeof campusSchema>`
 * - Validation: `campusSchema.parse(data)` or `campusSchema.safeParse(data)`
 *
 * Validation Rules:
 * - Postal Code: Spanish format (exactly 5 digits)
 * - Phone: Spanish format (+34 XXX XXX XXX)
 * - Email: Standard email validation
 * - Maps URL: Valid URL format
 */

/**
 * Spanish postal code regex
 * Format: 5 digits (e.g., "28001", "08001", "41001")
 */
const SPANISH_POSTAL_CODE_REGEX = /^\d{5}$/;

/**
 * Spanish phone number regex
 * Format: +34 XXX XXX XXX (e.g., "+34 912 345 678")
 */
const SPANISH_PHONE_REGEX = /^\+34\s\d{3}\s\d{3}\s\d{3}$/;

/**
 * Complete campus validation schema
 */
export const campusSchema = z.object({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .describe('URL-friendly identifier'),

  name: z
    .string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must be less than 100 characters')
    .transform((val) => val.trim())
    .describe('Display name of the campus'),

  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(50, 'City must be less than 50 characters')
    .transform((val) => val.trim())
    .describe('City where the campus is located'),

  address: z
    .string()
    .max(200, 'Address must be less than 200 characters')
    .optional()
    .nullable()
    .describe('Full street address of the campus'),

  postal_code: z
    .string()
    .regex(SPANISH_POSTAL_CODE_REGEX, 'Postal code must be exactly 5 digits (e.g., "28001")')
    .optional()
    .nullable()
    .describe('Spanish postal code (5 digits)'),

  phone: z
    .string()
    .regex(
      SPANISH_PHONE_REGEX,
      'Phone must be in format: +34 XXX XXX XXX (e.g., "+34 912 345 678")'
    )
    .optional()
    .nullable()
    .describe('Spanish phone number'),

  email: z
    .string()
    .email('Email must be a valid email address')
    .max(100, 'Email must be less than 100 characters')
    .optional()
    .nullable()
    .describe('Contact email for the campus'),

  maps_url: z
    .string()
    .url('Maps URL must be a valid URL')
    .optional()
    .nullable()
    .describe('Google Maps URL for the campus location'),
});

/**
 * Schema for creating a new campus (slug is optional, will be auto-generated)
 */
export const campusCreateSchema = campusSchema.extend({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .optional()
    .describe('URL-friendly identifier (auto-generated from name if not provided)'),
});

/**
 * Schema for updating an existing campus (all fields optional)
 */
export const campusUpdateSchema = campusSchema.partial();

/**
 * Type inference from schemas
 */
export type CampusData = z.infer<typeof campusSchema>;
export type CampusCreateData = z.infer<typeof campusCreateSchema>;
export type CampusUpdateData = z.infer<typeof campusUpdateSchema>;

/**
 * Validation helper functions
 */

/**
 * Validates campus data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCampus(data: unknown) {
  return campusSchema.safeParse(data);
}

/**
 * Validates campus creation data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCampusCreate(data: unknown) {
  return campusCreateSchema.safeParse(data);
}

/**
 * Validates campus update data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCampusUpdate(data: unknown) {
  return campusUpdateSchema.safeParse(data);
}

/**
 * Format Zod validation errors for Payload
 * @param errors - Zod validation errors
 * @returns Formatted error messages
 */
export function formatValidationErrors(errors: z.ZodError) {
  return errors.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
}

/**
 * Spanish phone number formatter
 * Formats a phone number to the Spanish format: +34 XXX XXX XXX
 *
 * @param phone - Raw phone number
 * @returns Formatted phone number or null if invalid
 *
 * @example
 * formatSpanishPhone('34912345678') // '+34 912 345 678'
 * formatSpanishPhone('+34912345678') // '+34 912 345 678'
 * formatSpanishPhone('912345678') // '+34 912 345 678'
 */
export function formatSpanishPhone(phone: string): string | null {
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');

  // Check if it's a valid Spanish phone number (9 digits, or 11 with country code 34)
  if (digits.length === 9) {
    return `+34 ${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  } else if (digits.length === 11 && digits.startsWith('34')) {
    const nationalNumber = digits.slice(2);
    return `+34 ${nationalNumber.slice(0, 3)} ${nationalNumber.slice(3, 6)} ${nationalNumber.slice(6)}`;
  }

  return null;
}

/**
 * Validates Spanish postal code
 *
 * @param postalCode - Postal code to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSpanishPostalCode('28001') // true
 * isValidSpanishPostalCode('123') // false
 */
export function isValidSpanishPostalCode(postalCode: string): boolean {
  return SPANISH_POSTAL_CODE_REGEX.test(postalCode);
}

/**
 * Validates Spanish phone number
 *
 * @param phone - Phone number to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidSpanishPhone('+34 912 345 678') // true
 * isValidSpanishPhone('912345678') // false
 */
export function isValidSpanishPhone(phone: string): boolean {
  return SPANISH_PHONE_REGEX.test(phone);
}
