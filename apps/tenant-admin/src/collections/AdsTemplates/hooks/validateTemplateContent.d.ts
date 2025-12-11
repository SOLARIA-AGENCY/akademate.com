import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Template Content (beforeValidate)
 *
 * Purpose:
 * - Validate headline length (max 100 chars)
 * - Validate call_to_action length (max 50 chars)
 * - Ensure content meets advertising platform requirements
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Validation Rules:
 * - headline: Required, max 100 characters
 * - call_to_action: Optional, max 50 characters
 * - body_copy: Required (validated by field config)
 *
 * Error Handling:
 * - Throws validation errors with user-friendly messages
 * - No sensitive data in error messages (SP-004)
 *
 * No PII Logging:
 * - Logs only template.id (non-sensitive)
 * - NEVER logs headline, body_copy, or CTA (confidential marketing copy)
 */
export declare const validateTemplateContent: CollectionBeforeValidateHook;
//# sourceMappingURL=validateTemplateContent.d.ts.map