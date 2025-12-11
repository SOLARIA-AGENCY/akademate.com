/**
 * AdsTemplates Collection - Validation Rules & Business Logic
 *
 * This file contains all validation schemas and business rules for ad templates.
 * Uses Zod for robust type-safe validation.
 *
 * Validation Categories:
 * 1. Template identification (name, type, status)
 * 2. Content validation (headline, body, CTA)
 * 3. Asset URL validation (images, videos)
 * 4. Tag validation (format, count)
 * 5. Status workflow (terminal states)
 *
 * Security Considerations:
 * - No sensitive data in error messages
 * - URL validation prevents XSS
 * - Tag format prevents injection
 */

import { z } from 'zod';

// ============================================================================
// VALID ENUM VALUES
// ============================================================================

/**
 * Valid template types
 */
export const VALID_TEMPLATE_TYPES = [
  'email',
  'social_post',
  'display_ad',
  'landing_page',
  'video_script',
  'other',
] as const;

/**
 * Valid template statuses
 *
 * Workflow: draft → active → archived (terminal)
 */
export const VALID_STATUSES = [
  'draft',
  'active',
  'archived',
] as const;

/**
 * Valid tone values
 */
export const VALID_TONES = [
  'professional',
  'casual',
  'urgent',
  'friendly',
  'educational',
  'promotional',
] as const;

/**
 * Valid language codes
 * - es: Spanish
 * - en: English
 * - ca: Catalan
 */
export const VALID_LANGUAGES = [
  'es',
  'en',
  'ca',
] as const;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Template Name Schema
 * - Required
 * - Unique (enforced at collection level)
 * - Min 3 chars, max 100 chars
 * - No special characters except hyphens and underscores
 */
export const templateNameSchema = z
  .string()
  .min(3, 'Template name must be at least 3 characters')
  .max(100, 'Template name must be 100 characters or less')
  .regex(
    /^[a-zA-Z0-9\s\-_]+$/,
    'Template name can only contain letters, numbers, spaces, hyphens, and underscores'
  );

/**
 * Headline Schema
 * - Required
 * - Max 100 chars (ad headline length limit)
 */
export const headlineSchema = z
  .string()
  .min(1, 'Headline is required')
  .max(100, 'Headline must be 100 characters or less');

/**
 * Call to Action Schema
 * - Optional
 * - Max 50 chars (button text length limit)
 */
export const callToActionSchema = z
  .string()
  .max(50, 'Call to action must be 50 characters or less')
  .optional();

/**
 * URL Schema
 * - Must be valid HTTP/HTTPS URL
 * - Used for: cta_url, image URLs, video URLs
 * - Security: Prevents XSS, open redirects, newline injection
 */
export const urlSchema = z
  .string()
  .url('Must be a valid URL (http:// or https://)')
  .regex(
    /^https?:\/\/[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(\.[a-zA-Z0-9]([a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*(\:[0-9]{1,5})?(\/[^\s]*)?$/,
    'URL contains invalid characters or format'
  )
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // SECURITY: Block triple slashes (malformed URLs)
        if (url.includes('///')) return false;
        // SECURITY: Block newlines and control characters (XSS prevention)
        if (/[\r\n\t\x00-\x1F]/.test(url)) return false;
        // SECURITY: Block @ in hostname (open redirect prevention)
        if (parsed.hostname.includes('@')) return false;
        return true;
      } catch {
        return false;
      }
    },
    'Potentially malicious URL detected'
  )
  .optional();

/**
 * Tag Schema
 * - Lowercase only
 * - Alphanumeric and hyphens
 * - No spaces or special characters
 */
export const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(50, 'Tag must be 50 characters or less')
  .regex(
    /^[a-z0-9\-]+$/,
    'Tags must be lowercase, alphanumeric, and may contain hyphens only'
  );

/**
 * Tags Array Schema
 * - Optional
 * - Max 10 tags per template
 */
export const tagsArraySchema = z
  .array(tagSchema)
  .max(10, 'Maximum 10 tags per template')
  .optional();

/**
 * Template Type Schema
 */
export const templateTypeSchema = z.enum(VALID_TEMPLATE_TYPES, {
  errorMap: () => ({
    message: `Template type must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`,
  }),
});

/**
 * Status Schema
 */
export const statusSchema = z.enum(VALID_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
  }),
});

/**
 * Tone Schema
 */
export const toneSchema = z.enum(VALID_TONES, {
  errorMap: () => ({
    message: `Tone must be one of: ${VALID_TONES.join(', ')}`,
  }),
});

/**
 * Language Schema
 */
export const languageSchema = z.enum(VALID_LANGUAGES, {
  errorMap: () => ({
    message: `Language must be one of: ${VALID_LANGUAGES.join(', ')}`,
  }),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate Template Name
 */
export const validateTemplateName = (name: string): true | string => {
  const result = templateNameSchema.safeParse(name);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Headline
 */
export const validateHeadline = (headline: string): true | string => {
  const result = headlineSchema.safeParse(headline);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Call to Action
 */
export const validateCallToAction = (cta: string | undefined): true | string => {
  if (!cta) return true; // Optional field

  const result = callToActionSchema.safeParse(cta);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate URL
 */
export const validateURL = (url: string | undefined, fieldName: string = 'URL'): true | string => {
  if (!url) return true; // Optional field

  const result = urlSchema.safeParse(url);
  if (!result.success) {
    return `${fieldName} ${result.error.errors[0].message.toLowerCase()}`;
  }
  return true;
};

/**
 * Validate Tag Format
 */
export const validateTag = (tag: string): true | string => {
  const result = tagSchema.safeParse(tag);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Tags Array
 */
export const validateTags = (tags: string[] | undefined): true | string => {
  if (!tags || tags.length === 0) return true; // Optional field

  const result = tagsArraySchema.safeParse(tags);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  // Validate each individual tag
  for (const tag of tags) {
    const tagResult = validateTag(tag);
    if (tagResult !== true) {
      return tagResult;
    }
  }

  return true;
};

/**
 * Validate Status Workflow
 *
 * Business Rules:
 * - draft can transition to active or archived
 * - active can transition to archived
 * - archived is TERMINAL (cannot transition to any other status)
 *
 * @param currentStatus - Current status
 * @param newStatus - Requested new status
 * @returns true if transition is valid, error message otherwise
 */
export const validateStatusWorkflow = (
  currentStatus: string,
  newStatus: string
): true | string => {
  // Allow if status is not changing
  if (currentStatus === newStatus) {
    return true;
  }

  // CRITICAL: archived is a terminal state
  if (currentStatus === 'archived') {
    return 'Cannot change status from archived. Archived is a terminal status.';
  }

  // All other transitions are allowed
  // draft → active ✅
  // draft → archived ✅
  // active → archived ✅
  // active → draft ✅ (allow reverting to draft)

  return true;
};

/**
 * Validate Template Type
 */
export const validateTemplateType = (type: string): true | string => {
  const result = templateTypeSchema.safeParse(type);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Tone
 */
export const validateTone = (tone: string): true | string => {
  const result = toneSchema.safeParse(tone);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Language
 */
export const validateLanguage = (language: string): true | string => {
  const result = languageSchema.safeParse(language);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type TemplateType = typeof VALID_TEMPLATE_TYPES[number];
export type TemplateStatus = typeof VALID_STATUSES[number];
export type TemplateTone = typeof VALID_TONES[number];
export type TemplateLanguage = typeof VALID_LANGUAGES[number];
