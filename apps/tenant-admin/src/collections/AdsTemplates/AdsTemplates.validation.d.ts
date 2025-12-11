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
/**
 * Valid template types
 */
export declare const VALID_TEMPLATE_TYPES: readonly ["email", "social_post", "display_ad", "landing_page", "video_script", "other"];
/**
 * Valid template statuses
 *
 * Workflow: draft → active → archived (terminal)
 */
export declare const VALID_STATUSES: readonly ["draft", "active", "archived"];
/**
 * Valid tone values
 */
export declare const VALID_TONES: readonly ["professional", "casual", "urgent", "friendly", "educational", "promotional"];
/**
 * Valid language codes
 * - es: Spanish
 * - en: English
 * - ca: Catalan
 */
export declare const VALID_LANGUAGES: readonly ["es", "en", "ca"];
/**
 * Template Name Schema
 * - Required
 * - Unique (enforced at collection level)
 * - Min 3 chars, max 100 chars
 * - No special characters except hyphens and underscores
 */
export declare const templateNameSchema: z.ZodString;
/**
 * Headline Schema
 * - Required
 * - Max 100 chars (ad headline length limit)
 */
export declare const headlineSchema: z.ZodString;
/**
 * Call to Action Schema
 * - Optional
 * - Max 50 chars (button text length limit)
 */
export declare const callToActionSchema: z.ZodOptional<z.ZodString>;
/**
 * URL Schema
 * - Must be valid HTTP/HTTPS URL
 * - Used for: cta_url, image URLs, video URLs
 * - Security: Prevents XSS, open redirects, newline injection
 */
export declare const urlSchema: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
/**
 * Tag Schema
 * - Lowercase only
 * - Alphanumeric and hyphens
 * - No spaces or special characters
 */
export declare const tagSchema: z.ZodString;
/**
 * Tags Array Schema
 * - Optional
 * - Max 10 tags per template
 */
export declare const tagsArraySchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Template Type Schema
 */
export declare const templateTypeSchema: z.ZodEnum<["email", "social_post", "display_ad", "landing_page", "video_script", "other"]>;
/**
 * Status Schema
 */
export declare const statusSchema: z.ZodEnum<["draft", "active", "archived"]>;
/**
 * Tone Schema
 */
export declare const toneSchema: z.ZodEnum<["professional", "casual", "urgent", "friendly", "educational", "promotional"]>;
/**
 * Language Schema
 */
export declare const languageSchema: z.ZodEnum<["es", "en", "ca"]>;
/**
 * Validate Template Name
 */
export declare const validateTemplateName: (name: string) => true | string;
/**
 * Validate Headline
 */
export declare const validateHeadline: (headline: string) => true | string;
/**
 * Validate Call to Action
 */
export declare const validateCallToAction: (cta: string | undefined) => true | string;
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
export declare const validateStatusWorkflow: (currentStatus: string, newStatus: string) => true | string;
/**
 * Validate Template Type
 */
export declare const validateTemplateType: (type: string) => true | string;
/**
 * Validate Tone
 */
export declare const validateTone: (tone: string) => true | string;
/**
 * Validate Language
 */
export declare const validateLanguage: (language: string) => true | string;
export type TemplateType = typeof VALID_TEMPLATE_TYPES[number];
export type TemplateStatus = typeof VALID_STATUSES[number];
export type TemplateTone = typeof VALID_TONES[number];
export type TemplateLanguage = typeof VALID_LANGUAGES[number];
//# sourceMappingURL=AdsTemplates.validation.d.ts.map