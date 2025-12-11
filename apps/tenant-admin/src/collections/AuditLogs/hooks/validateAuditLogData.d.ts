import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: validateAuditLogData
 *
 * Validates audit log data before Payload's built-in validation.
 *
 * WHEN: beforeValidate (runs before Payload's validation)
 * OPERATION: create only (updates are blocked)
 *
 * VALIDATIONS:
 * 1. collection_name must match existing Payload collections
 * 2. user_id must reference an existing user (checked via relationship)
 * 3. changes object must be sanitized (remove sensitive fields)
 * 4. Required fields must be present
 *
 * SECURITY CONSIDERATIONS (SP-004: No PII in Logs):
 * - Sanitize changes object to remove passwords, tokens, secrets
 * - Do NOT log the actual data being validated (contains PII)
 * - Only log validation success/failure with non-PII context
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data after validation
 * @throws Error if validation fails
 */
export declare const validateAuditLogData: CollectionBeforeValidateHook;
//# sourceMappingURL=validateAuditLogData.d.ts.map