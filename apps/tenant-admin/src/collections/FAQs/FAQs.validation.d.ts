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
export declare const VALID_CATEGORIES: readonly ["courses", "enrollment", "payments", "technical", "general"];
export declare const VALID_LANGUAGES: readonly ["es", "en", "ca"];
export declare const VALID_STATUSES: readonly ["draft", "published", "archived"];
export declare const MAX_KEYWORDS = 10;
export declare const MAX_KEYWORD_LENGTH = 50;
export declare const MIN_QUESTION_LENGTH = 10;
export declare const MAX_QUESTION_LENGTH = 200;
export declare const MAX_SLUG_LENGTH = 100;
/**
 * Question Schema
 * - Required
 * - 10-200 characters
 * - Trimmed
 */
export declare const questionSchema: z.ZodString;
/**
 * Slug Schema
 * - Lowercase letters, numbers, hyphens only
 * - No special characters
 * - Max 100 chars
 */
export declare const slugSchema: z.ZodString;
/**
 * Category Schema
 * - Enum validation
 */
export declare const categorySchema: z.ZodEnum<["courses", "enrollment", "payments", "technical", "general"]>;
/**
 * Language Schema
 * - Enum validation
 */
export declare const languageSchema: z.ZodEnum<["es", "en", "ca"]>;
/**
 * Status Schema
 * - Enum validation
 */
export declare const statusSchema: z.ZodEnum<["draft", "published", "archived"]>;
/**
 * Keywords Schema
 * - Array of strings
 * - Max 10 keywords
 * - Each keyword max 50 chars
 */
export declare const keywordsSchema: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
/**
 * Order Schema
 * - Integer >= 0
 */
export declare const orderSchema: z.ZodNumber;
/**
 * Validate question field
 */
export declare function validateQuestion(value: string | undefined): string | true;
/**
 * Validate slug field
 */
export declare function validateSlug(value: string | undefined): string | true;
/**
 * Validate answer field (richText)
 */
export declare function validateAnswer(value: any): string | true;
/**
 * Validate category field
 */
export declare function validateCategory(value: string | undefined): string | true;
/**
 * Validate language field
 */
export declare function validateLanguage(value: string | undefined): string | true;
/**
 * Validate status field
 */
export declare function validateStatus(value: string | undefined): string | true;
/**
 * Validate keywords array
 */
export declare function validateKeywords(value: string[] | undefined): string | true;
/**
 * Validate order field
 */
export declare function validateOrder(value: number | undefined): string | true;
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
export declare function validateStatusWorkflow(currentStatus: string, newStatus: string): string | true;
//# sourceMappingURL=FAQs.validation.d.ts.map