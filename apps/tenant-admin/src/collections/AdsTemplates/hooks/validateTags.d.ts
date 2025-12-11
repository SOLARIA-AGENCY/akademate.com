import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Tags (beforeValidate)
 *
 * Purpose:
 * - Validate tag format (lowercase, alphanumeric, hyphens)
 * - Enforce max 10 tags per template
 * - Prevent injection attacks via malformed tags
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Validation Rules:
 * - Tags must be lowercase
 * - Tags can only contain alphanumeric characters and hyphens
 * - No spaces or special characters
 * - Maximum 10 tags per template
 *
 * Security Considerations:
 * - Tag format validation prevents injection attacks
 * - Lowercase-only prevents case-sensitivity issues
 * - Max 10 tags prevents abuse
 *
 * No PII Logging:
 * - Logs only template.id and tag count (non-sensitive)
 * - NEVER logs tag values (may contain marketing strategy info)
 */
export declare const validateTagsHook: CollectionBeforeValidateHook;
//# sourceMappingURL=validateTags.d.ts.map