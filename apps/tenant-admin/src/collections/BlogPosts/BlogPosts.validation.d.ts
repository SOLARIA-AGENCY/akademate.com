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
/**
 * Valid post statuses
 *
 * Workflow: draft → published → archived (terminal)
 */
export declare const VALID_STATUSES: readonly ["draft", "published", "archived"];
/**
 * Valid language codes
 * - es: Spanish (default)
 * - en: English
 * - ca: Catalan
 */
export declare const VALID_LANGUAGES: readonly ["es", "en", "ca"];
/**
 * Title Schema
 * - Required
 * - Min 10 chars, max 120 chars
 * - No special validation (allows all characters for blog titles)
 */
export declare const titleSchema: z.ZodString;
/**
 * Slug Schema
 * - Lowercase only
 * - Alphanumeric and hyphens
 * - No special characters, spaces, or underscores
 * - Auto-generated from title (with Spanish normalization)
 */
export declare const slugSchema: z.ZodString;
/**
 * Excerpt Schema
 * - Required
 * - Min 50 chars (meaningful preview)
 * - Max 300 chars (keep concise)
 */
export declare const excerptSchema: z.ZodString;
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
export declare const urlSchema: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
/**
 * Tag Schema
 * - Lowercase only
 * - Alphanumeric and hyphens
 * - No spaces or special characters
 * - Max 30 chars per tag
 */
export declare const tagSchema: z.ZodString;
/**
 * Tags Array Schema
 * - Optional
 * - Max 10 tags per post
 */
export declare const tagsArraySchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Meta Title Schema (SEO)
 * - Optional
 * - Min 50 chars, max 70 chars (SEO best practice)
 */
export declare const metaTitleSchema: z.ZodOptional<z.ZodString>;
/**
 * Meta Description Schema (SEO)
 * - Optional
 * - Min 120 chars, max 160 chars (SEO best practice)
 */
export declare const metaDescriptionSchema: z.ZodOptional<z.ZodString>;
/**
 * Status Schema
 */
export declare const statusSchema: z.ZodEnum<["draft", "published", "archived"]>;
/**
 * Language Schema
 */
export declare const languageSchema: z.ZodEnum<["es", "en", "ca"]>;
/**
 * Validate Title
 */
export declare const validateTitle: (title: string) => true | string;
/**
 * Validate Slug
 */
export declare const validateSlug: (slug: string) => true | string;
/**
 * Validate Excerpt
 */
export declare const validateExcerpt: (excerpt: string) => true | string;
/**
 * Validate URL
 */
export declare const validateURL: (url: string | undefined, fieldName?: string) => true | string;
/**
 * Validate Tag Format
 */
export declare const validateTag: (tag: string) => true | string;
/**
 * Validate Tags Array
 */
export declare const validateTags: (tags: string[] | undefined) => true | string;
/**
 * Validate Meta Title
 */
export declare const validateMetaTitle: (metaTitle: string | undefined) => true | string;
/**
 * Validate Meta Description
 */
export declare const validateMetaDescription: (metaDescription: string | undefined) => true | string;
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
export declare const validateStatusWorkflow: (currentStatus: string, newStatus: string) => true | string;
/**
 * Validate Status
 */
export declare const validateStatus: (status: string) => true | string;
/**
 * Validate Language
 */
export declare const validateLanguage: (language: string) => true | string;
/**
 * Validate Related Courses Array
 * - Optional
 * - Max 5 courses per post
 */
export declare const validateRelatedCourses: (courses: string[] | undefined) => true | string;
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
export declare const normalizeSpanishCharacters: (text: string) => string;
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
export declare const generateSlugFromTitle: (title: string) => string;
/**
 * Extract plain text from Payload richText content
 *
 * Recursively extracts text from richText nodes
 *
 * @param content - Payload richText content
 * @returns Plain text string
 */
export declare const extractTextFromRichText: (content: any[]) => string;
/**
 * Calculate estimated read time
 *
 * Calculation: word count / 200 words per minute (average reading speed)
 * Rounds up to nearest minute (minimum 1 minute)
 *
 * @param content - Payload richText content
 * @returns Estimated read time in minutes
 */
export declare const calculateEstimatedReadTime: (content: any[]) => number;
export type PostStatus = (typeof VALID_STATUSES)[number];
export type PostLanguage = (typeof VALID_LANGUAGES)[number];
//# sourceMappingURL=BlogPosts.validation.d.ts.map