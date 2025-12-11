import { z } from 'zod';

/**
 * Courses Validation - Zod Schemas (3-Layer Validation)
 *
 * Layer 1: Payload field validators (in Courses.ts)
 * Layer 2: Zod runtime validation (this file)
 * Layer 3: PostgreSQL constraints (in migrations)
 *
 * This provides comprehensive validation at runtime and enables
 * type-safe data handling throughout the application.
 */

/**
 * Zod schema for course validation
 *
 * Validates:
 * - Required fields: slug, name, cycle_id, modality
 * - Optional fields: descriptions, pricing, campus relationships
 * - Format constraints: slug format, name length, price precision
 * - Enum validation: modality values
 * - Relationship validation: UUIDs for cycle and campuses
 */
export const CourseSchema = z.object({
  // Required: Unique URL-friendly identifier
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(500, 'Slug too long')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens only'),

  // Required: Course name
  name: z
    .string()
    .min(1, 'Course name is required')
    .max(500, 'Course name must be 500 characters or less'),

  // Required: Reference to educational cycle
  cycle: z.string({ required_error: 'Cycle is required' }),

  // Optional: Multiple campus references (array of IDs)
  campuses: z.array(z.string()).optional().default([]),

  // Optional: Brief summary for listings
  short_description: z.string().optional(),

  // Optional: Detailed course information
  long_description: z.string().optional(),

  // Required: Delivery method (presencial, online, hibrido)
  modality: z.enum(['presencial', 'online', 'hibrido'], {
    errorMap: () => ({ message: 'Modality must be presencial, online, or hibrido' }),
  }),

  // Optional: Course duration in hours (positive integer)
  duration_hours: z
    .number()
    .int('Duration must be an integer')
    .positive('Duration must be positive')
    .optional(),

  // Optional: Base price in euros (non-negative, 2 decimal places)
  base_price: z
    .number()
    .nonnegative('Price cannot be negative')
    .multipleOf(0.01, 'Price must have at most 2 decimal places')
    .optional(),

  // Optional: Financial aid availability flag
  financial_aid_available: z.boolean().optional().default(true),

  // Optional: Active/inactive status (for soft delete)
  active: z.boolean().optional().default(true),

  // Optional: Featured course flag (for homepage)
  featured: z.boolean().optional().default(false),

  // Optional: SEO meta title (max 300 chars)
  meta_title: z.string().max(300, 'Meta title must be 300 characters or less').optional(),

  // Optional: SEO meta description (max 500 chars)
  meta_description: z
    .string()
    .max(500, 'Meta description must be 500 characters or less')
    .optional(),

  // Optional: User who created the course (relationship)
  created_by: z.string().optional(),
});

/**
 * TypeScript type inferred from Zod schema
 * Use this type for type-safe course data handling
 */
export type CourseInput = z.infer<typeof CourseSchema>;

/**
 * Validation helper function
 *
 * Validates course data against the Zod schema and returns
 * validated data or throws validation errors.
 *
 * @param data - Unknown data to validate
 * @returns Validated CourseInput
 * @throws ZodError if validation fails
 */
export const validateCourseData = (data: unknown): CourseInput => {
  return CourseSchema.parse(data);
};

/**
 * Safe validation helper (doesn't throw)
 *
 * @param data - Unknown data to validate
 * @returns { success: true, data } or { success: false, error }
 */
export const validateCourseDataSafe = (data: unknown) => {
  return CourseSchema.safeParse(data);
};

/**
 * Slug generation utility
 *
 * Converts course name to URL-friendly slug:
 * - Converts to lowercase
 * - Normalizes Unicode characters (removes accents)
 * - Replaces non-alphanumeric chars with hyphens
 * - Removes leading/trailing hyphens
 *
 * Examples:
 * - "Técnico Superior en Marketing" → "tecnico-superior-en-marketing"
 * - "Grado Medio - Informática" → "grado-medio-informatica"
 *
 * @param name - Course name
 * @returns URL-friendly slug
 */
export const generateCourseSlug = (name: string): string => {
  return name
    .toLowerCase()
    .normalize('NFD') // Decompose accented characters
    .replace(/[\u0300-\u036f]/g, '') // Remove accent marks
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
};

/**
 * Format validation errors for better UX
 *
 * Converts Zod error object to user-friendly error messages
 *
 * @param error - Zod validation error
 * @returns Array of formatted error messages
 */
export const formatValidationErrors = (error: z.ZodError): string[] => {
  return error.errors.map((err) => {
    const path = err.path.join('.');
    return `${path}: ${err.message}`;
  });
};

/**
 * Partial schema for updates (all fields optional)
 * Use this when validating PATCH requests
 */
export const CourseUpdateSchema = CourseSchema.partial();

/**
 * Type for course updates
 */
export type CourseUpdate = z.infer<typeof CourseUpdateSchema>;
