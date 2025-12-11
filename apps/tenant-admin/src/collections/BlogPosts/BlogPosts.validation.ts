/**
 * BlogPosts Collection - Validation Rules & Business Logic
 *
 * This file contains all validation schemas and business rules for blog posts.
 * Uses Zod for robust type-safe validation.
 *
 * Validation Categories:
 * 1. Post identification (title, slug, excerpt)
 * 2. Content validation (richText content)
 * 3. SEO fields (meta_title, meta_description, og_image)
 * 4. Asset URL validation (featured_image, og_image)
 * 5. Tag validation (format, count)
 * 6. Status workflow (terminal states)
 * 7. Related courses validation
 *
 * Security Considerations:
 * - No sensitive data in error messages
 * - URL validation prevents XSS, open redirects, newline injection
 * - Tag format prevents injection attacks
 * - Terminal state enforcement prevents data corruption
 */

import { z } from 'zod';

// ============================================================================
// VALID ENUM VALUES
// ============================================================================

/**
 * Valid post statuses
 *
 * Workflow: draft → published → archived (terminal)
 */
export const VALID_STATUSES = ['draft', 'published', 'archived'] as const;

/**
 * Valid language codes
 * - es: Spanish (default)
 * - en: English
 * - ca: Catalan
 */
export const VALID_LANGUAGES = ['es', 'en', 'ca'] as const;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * Title Schema
 * - Required
 * - Min 10 chars, max 120 chars
 * - No special validation (allows all characters for blog titles)
 */
export const titleSchema = z
  .string()
  .min(10, 'Title must be at least 10 characters')
  .max(120, 'Title must be 120 characters or less');

/**
 * Slug Schema
 * - Lowercase only
 * - Alphanumeric and hyphens
 * - No special characters, spaces, or underscores
 * - Auto-generated from title (with Spanish normalization)
 */
export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .max(150, 'Slug must be 150 characters or less')
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    'Slug must be lowercase, alphanumeric, and may contain hyphens only (no consecutive hyphens)'
  );

/**
 * Excerpt Schema
 * - Required
 * - Min 50 chars (meaningful preview)
 * - Max 300 chars (keep concise)
 */
export const excerptSchema = z
  .string()
  .min(50, 'Excerpt must be at least 50 characters')
  .max(300, 'Excerpt must be 300 characters or less');

/**
 * URL Schema
 * - Must be valid HTTP/HTTPS URL
 * - Used for: featured_image, og_image
 * - Security: Prevents XSS, open redirects, newline injection
 *
 * Security Checks:
 * 1. RFC-compliant URL format
 * 2. Block triple slashes (malformed URLs)
 * 3. Block newlines and control characters (XSS prevention)
 * 4. Block @ in hostname (open redirect prevention)
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
 * - Max 30 chars per tag
 */
export const tagSchema = z
  .string()
  .min(1, 'Tag cannot be empty')
  .max(30, 'Tag must be 30 characters or less')
  .regex(/^[a-z0-9\-]+$/, 'Tags must be lowercase, alphanumeric, and may contain hyphens only');

/**
 * Tags Array Schema
 * - Optional
 * - Max 10 tags per post
 */
export const tagsArraySchema = z.array(tagSchema).max(10, 'Maximum 10 tags per post').optional();

/**
 * Meta Title Schema (SEO)
 * - Optional
 * - Min 50 chars, max 70 chars (SEO best practice)
 */
export const metaTitleSchema = z
  .string()
  .min(50, 'Meta title should be between 50-70 characters for optimal SEO')
  .max(70, 'Meta title should be between 50-70 characters for optimal SEO')
  .optional();

/**
 * Meta Description Schema (SEO)
 * - Optional
 * - Min 120 chars, max 160 chars (SEO best practice)
 */
export const metaDescriptionSchema = z
  .string()
  .min(120, 'Meta description should be between 120-160 characters for optimal SEO')
  .max(160, 'Meta description should be between 120-160 characters for optimal SEO')
  .optional();

/**
 * Status Schema
 */
export const statusSchema = z.enum(VALID_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${VALID_STATUSES.join(', ')}`,
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
 * Validate Title
 */
export const validateTitle = (title: string): true | string => {
  const result = titleSchema.safeParse(title);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Slug
 */
export const validateSlug = (slug: string): true | string => {
  const result = slugSchema.safeParse(slug);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Excerpt
 */
export const validateExcerpt = (excerpt: string): true | string => {
  const result = excerptSchema.safeParse(excerpt);
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
 * Validate Meta Title
 */
export const validateMetaTitle = (metaTitle: string | undefined): true | string => {
  if (!metaTitle) return true; // Optional field

  const result = metaTitleSchema.safeParse(metaTitle);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Meta Description
 */
export const validateMetaDescription = (metaDescription: string | undefined): true | string => {
  if (!metaDescription) return true; // Optional field

  const result = metaDescriptionSchema.safeParse(metaDescription);
  if (!result.success) {
    return result.error.errors[0].message;
  }
  return true;
};

/**
 * Validate Status Workflow
 *
 * Business Rules:
 * - draft can transition to published or archived
 * - published can transition to archived
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
  // draft → published ✅
  // draft → archived ✅
  // published → archived ✅
  // published → draft ✅ (allow reverting to draft)

  return true;
};

/**
 * Validate Status
 */
export const validateStatus = (status: string): true | string => {
  const result = statusSchema.safeParse(status);
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

/**
 * Validate Related Courses Array
 * - Optional
 * - Max 5 courses per post
 */
export const validateRelatedCourses = (
  courses: string[] | undefined
): true | string => {
  if (!courses || courses.length === 0) return true; // Optional field

  if (courses.length > 5) {
    return 'Maximum 5 related courses allowed per blog post';
  }

  return true;
};

// ============================================================================
// SPANISH CHARACTER NORMALIZATION
// ============================================================================

/**
 * Normalize Spanish characters for slug generation
 *
 * Conversions:
 * - á, à, ä → a
 * - é, è, ë → e
 * - í, ì, ï → i
 * - ó, ò, ö → o
 * - ú, ù, ü → u
 * - ñ → n
 * - ç → c
 *
 * @param text - Text with Spanish characters
 * @returns Normalized text for slug
 */
export const normalizeSpanishCharacters = (text: string): string => {
  const replacements: Record<string, string> = {
    á: 'a',
    à: 'a',
    ä: 'a',
    é: 'e',
    è: 'e',
    ë: 'e',
    í: 'i',
    ì: 'i',
    ï: 'i',
    ó: 'o',
    ò: 'o',
    ö: 'o',
    ú: 'u',
    ù: 'u',
    ü: 'u',
    ñ: 'n',
    ç: 'c',
    Á: 'a',
    À: 'a',
    Ä: 'a',
    É: 'e',
    È: 'e',
    Ë: 'e',
    Í: 'i',
    Ì: 'i',
    Ï: 'i',
    Ó: 'o',
    Ò: 'o',
    Ö: 'o',
    Ú: 'u',
    Ù: 'u',
    Ü: 'u',
    Ñ: 'n',
    Ç: 'c',
  };

  return text
    .split('')
    .map((char) => replacements[char] || char)
    .join('');
};

/**
 * Generate slug from title
 *
 * Process:
 * 1. Normalize Spanish characters (á→a, ñ→n, etc.)
 * 2. Convert to lowercase
 * 3. Replace spaces and special characters with hyphens
 * 4. Remove consecutive hyphens
 * 5. Trim hyphens from start/end
 *
 * @param title - Blog post title
 * @returns URL-safe slug
 */
export const generateSlugFromTitle = (title: string): string => {
  // 1. Normalize Spanish characters
  let slug = normalizeSpanishCharacters(title);

  // 2. Convert to lowercase
  slug = slug.toLowerCase();

  // 3. Replace spaces and special characters with hyphens
  slug = slug.replace(/[^a-z0-9]+/g, '-');

  // 4. Remove consecutive hyphens
  slug = slug.replace(/-+/g, '-');

  // 5. Trim hyphens from start/end
  slug = slug.replace(/^-+|-+$/g, '');

  return slug;
};

// ============================================================================
// READ TIME CALCULATION
// ============================================================================

/**
 * Extract plain text from Payload richText content
 *
 * Recursively extracts text from richText nodes
 *
 * @param content - Payload richText content
 * @returns Plain text string
 */
export const extractTextFromRichText = (content: any[]): string => {
  if (!Array.isArray(content)) return '';

  let text = '';

  for (const node of content) {
    if (node.text) {
      text += node.text + ' ';
    }
    if (node.children && Array.isArray(node.children)) {
      text += extractTextFromRichText(node.children);
    }
  }

  return text;
};

/**
 * Calculate estimated read time
 *
 * Calculation: word count / 200 words per minute (average reading speed)
 * Rounds up to nearest minute (minimum 1 minute)
 *
 * @param content - Payload richText content
 * @returns Estimated read time in minutes
 */
export const calculateEstimatedReadTime = (content: any[]): number => {
  // Extract plain text
  const text = extractTextFromRichText(content);

  // Count words (split by whitespace and filter empty strings)
  const words = text.split(/\s+/).filter((word) => word.length > 0);
  const wordCount = words.length;

  // Calculate read time (200 words per minute)
  const minutes = wordCount / 200;

  // Round up, minimum 1 minute
  return Math.max(1, Math.ceil(minutes));
};

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type PostStatus = (typeof VALID_STATUSES)[number];
export type PostLanguage = (typeof VALID_LANGUAGES)[number];
