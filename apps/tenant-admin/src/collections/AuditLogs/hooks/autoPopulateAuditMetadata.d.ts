import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: autoPopulateAuditMetadata
 *
 * Auto-populates audit log metadata during creation:
 * - user_email: Extract from user relationship
 * - user_role: Extract from user relationship
 * - ip_address: Extract from request headers
 * - user_agent: Extract from request headers
 *
 * WHEN: beforeValidate (runs before Payload's validation)
 * OPERATION: create only (not on updates, since updates are blocked)
 *
 * GDPR COMPLIANCE (Article 30):
 * - Organizations must maintain records of processing activities
 * - Must record who, what, when, where for all data operations
 * - Audit metadata is immutable (no updates allowed)
 *
 * SECURITY CONSIDERATIONS (SP-002: GDPR Critical Fields):
 * - ip_address is PII and immutable after creation
 * - user_email is snapshot (in case user is deleted later)
 * - user_role is snapshot (in case role changes later)
 * - All fields protected by access.update = false
 *
 * PII PROTECTION (SP-004):
 * - NO logging of user email or IP address
 * - Only log non-PII: user_id, hasEmail, hasIPAddress (booleans)
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data with audit metadata
 */
export declare const autoPopulateAuditMetadata: CollectionBeforeValidateHook;
//# sourceMappingURL=autoPopulateAuditMetadata.d.ts.map