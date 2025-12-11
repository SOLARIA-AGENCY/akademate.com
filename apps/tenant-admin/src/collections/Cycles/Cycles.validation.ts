import { z } from 'zod';

/**
 * Zod Validation Schema for Cycles Collection
 *
 * Provides runtime type validation and TypeScript type inference
 * for the Cycles collection data.
 *
 * Usage:
 * - Type inference: `type CycleData = z.infer<typeof cycleSchema>`
 * - Validation: `cycleSchema.parse(data)` or `cycleSchema.safeParse(data)`
 */

/**
 * Level enum values matching PostgreSQL CHECK constraint
 */
export const cycleLevel = z.enum([
  'fp_basica',
  'grado_medio',
  'grado_superior',
  'certificado_profesionalidad',
]);

export type CycleLevel = z.infer<typeof cycleLevel>;

/**
 * Complete cycle validation schema
 */
export const cycleSchema = z.object({
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
    .describe('Display name of the cycle'),

  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional()
    .nullable()
    .describe('Detailed description of the cycle'),

  level: cycleLevel.describe('Educational level of the cycle'),

  order_display: z
    .number()
    .int('Order display must be an integer')
    .min(0, 'Order display must be at least 0')
    .max(100, 'Order display must be at most 100')
    .optional()
    .nullable()
    .default(0)
    .describe('Display order (lower numbers appear first)'),
});

/**
 * Schema for creating a new cycle (slug is optional, will be auto-generated)
 */
export const cycleCreateSchema = cycleSchema.extend({
  slug: z
    .string()
    .min(1, 'Slug is required')
    .max(100, 'Slug must be less than 100 characters')
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens only')
    .optional()
    .describe('URL-friendly identifier (auto-generated from name if not provided)'),
});

/**
 * Schema for updating an existing cycle (all fields optional)
 */
export const cycleUpdateSchema = cycleSchema.partial();

/**
 * Type inference from schemas
 */
export type CycleData = z.infer<typeof cycleSchema>;
export type CycleCreateData = z.infer<typeof cycleCreateSchema>;
export type CycleUpdateData = z.infer<typeof cycleUpdateSchema>;

/**
 * Validation helper functions
 */

/**
 * Validates cycle data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCycle(data: unknown) {
  return cycleSchema.safeParse(data);
}

/**
 * Validates cycle creation data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCycleCreate(data: unknown) {
  return cycleCreateSchema.safeParse(data);
}

/**
 * Validates cycle update data against the schema
 * @param data - The data to validate
 * @returns Validation result with parsed data or errors
 */
export function validateCycleUpdate(data: unknown) {
  return cycleUpdateSchema.safeParse(data);
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
