/**
 * FAQs Collection - Validation Schemas
 *
 * Comprehensive validation using Zod schemas for:
 * - question (10-200 chars, required)
 * - slug (lowercase, hyphens only, unique)
 * - answer (richText, required)
 * - category (enum: courses, enrollment, payments, technical, general)
 * - language (enum: es, en, ca)
 * - status (enum: draft, published, archived)
 * - keywords (max 10, each max 50 chars)
 * - order (integer >= 0)
 * - status workflow (validates state transitions)
 *
 * All validation functions return:
 * - `true` if valid
 * - Error message string if invalid
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

export const VALID_CATEGORIES = ['courses', 'enrollment', 'payments', 'technical', 'general'] as const;
export const VALID_LANGUAGES = ['es', 'en', 'ca'] as const;
export const VALID_STATUSES = ['draft', 'published', 'archived'] as const;

export const MAX_KEYWORDS = 10;
export const MAX_KEYWORD_LENGTH = 50;
export const MIN_QUESTION_LENGTH = 10;
export const MAX_QUESTION_LENGTH = 200;
export const MAX_SLUG_LENGTH = 100;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Question Schema
 * - Required
 * - 10-200 characters
 * - Trimmed
 */
export const questionSchema = z
  .string()
  .min(MIN_QUESTION_LENGTH, `Question must be at least ${MIN_QUESTION_LENGTH} characters long`)
  .max(MAX_QUESTION_LENGTH, `Question must be at most ${MAX_QUESTION_LENGTH} characters long`)
  .trim();

/**
 * Slug Schema
 * - Lowercase letters, numbers, hyphens only
 * - No special characters
 * - Max 100 chars
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(MAX_SLUG_LENGTH, `Slug must be at most ${MAX_SLUG_LENGTH} characters long`)
  .regex(/^[a-z0-9-]+$/, 'Slug must contain only lowercase letters, numbers, and hyphens')
  .trim();

/**
 * Category Schema
 * - Enum validation
 */
export const categorySchema = z.enum(VALID_CATEGORIES, {
  errorMap: () => ({
    message: `Category must be one of: ${VALID_CATEGORIES.join(', ')}`,
  }),
});

/**
 * Language Schema
 * - Enum validation
 */
export const languageSchema = z.enum(VALID_LANGUAGES, {
  errorMap: () => ({
    message: `Language must be one of: ${VALID_LANGUAGES.join(', ')}`,
  }),
});

/**
 * Status Schema
 * - Enum validation
 */
export const statusSchema = z.enum(VALID_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
  }),
});

/**
 * Keywords Schema
 * - Array of strings
 * - Max 10 keywords
 * - Each keyword max 50 chars
 */
export const keywordsSchema = z
  .array(
    z
      .string()
      .max(MAX_KEYWORD_LENGTH, `Each keyword must be at most ${MAX_KEYWORD_LENGTH} characters long`)
      .trim()
  )
  .max(MAX_KEYWORDS, `Maximum ${MAX_KEYWORDS} keywords allowed`)
  .optional();

/**
 * Order Schema
 * - Integer >= 0
 */
export const orderSchema = z
  .number()
  .int('Order must be an integer')
  .min(0, 'Order must be greater than or equal to 0');

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate question field
 */
export function validateQuestion(value: string | undefined): string | true {
  if (!value) {
    return 'Question is required';
  }

  const result = questionSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate slug field
 */
export function validateSlug(value: string | undefined): string | true {
  if (!value) {
    return 'Slug is required';
  }

  const result = slugSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate answer field (richText)
 */
export function validateAnswer(value: any): string | true {
  if (!value || !Array.isArray(value) || value.length === 0) {
    return 'Answer is required and must contain content';
  }

  // Check that at least one block has content
  const hasContent = value.some((block: any) => {
    if (block.children && Array.isArray(block.children)) {
      return block.children.some((child: any) => {
        return child.text && child.text.trim().length > 0;
      });
    }
    return false;
  });

  if (!hasContent) {
    return 'Answer must contain at least 20 characters of content';
  }

  return true;
}

/**
 * Validate category field
 */
export function validateCategory(value: string | undefined): string | true {
  if (!value) {
    return 'Category is required';
  }

  const result = categorySchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate language field
 */
export function validateLanguage(value: string | undefined): string | true {
  if (!value) {
    return 'Language is required';
  }

  const result = languageSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate status field
 */
export function validateStatus(value: string | undefined): string | true {
  if (!value) {
    return 'Status is required';
  }

  const result = statusSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate keywords array
 */
export function validateKeywords(value: string[] | undefined): string | true {
  if (!value) {
    return true; // Keywords are optional
  }

  const result = keywordsSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate order field
 */
export function validateOrder(value: number | undefined): string | true {
  if (value === undefined || value === null) {
    return true; // Order has default value
  }

  const result = orderSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate status workflow transitions
 *
 * Valid transitions:
 * - draft → published
 * - draft → archived
 * - published → archived
 * - archived → NONE (terminal state)
 *
 * @param currentStatus - Current status
 * @param newStatus - New status
 * @returns true if valid transition, error message if invalid
 */
export function validateStatusWorkflow(
  currentStatus: string,
  newStatus: string
): string | true {
  // Same status is always allowed
  if (currentStatus === newStatus) {
    return true;
  }

  // Archived is a terminal state - no transitions allowed
  if (currentStatus === 'archived') {
    return 'Cannot change status from archived (terminal state). Once archived, an FAQ cannot be republished or edited.';
  }

  // All other transitions are valid
  // draft → published ✓
  // draft → archived ✓
  // published → draft ✓ (allow unpublishing)
  // published → archived ✓

  return true;
}
