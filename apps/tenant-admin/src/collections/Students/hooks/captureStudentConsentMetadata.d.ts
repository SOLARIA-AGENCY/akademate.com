import type { FieldHook } from 'payload';
/**
 * Hook: captureStudentConsentMetadata
 *
 * Auto-captures GDPR consent metadata during student creation:
 * - consent_timestamp: ISO 8601 timestamp when consent was given
 * - consent_ip_address: IP address of the request (for audit trail)
 *
 * WHEN: beforeValidate (runs before Payload's validation)
 * OPERATION: create only (not on updates)
 *
 * GDPR COMPLIANCE (Article 7):
 * - Organizations must be able to prove consent was given
 * - Must record when and how consent was obtained
 * - Consent metadata is immutable (audit trail)
 *
 * SECURITY CONSIDERATIONS (SP-002: GDPR Critical Fields):
 * - These fields are immutable after creation
 * - Protected by field-level access control: access.update = false
 * - Only auto-populated, never manually set
 * - Timestamp is in ISO 8601 format for consistency
 * - IP address captured from req.ip or X-Forwarded-For header
 *
 * PII PROTECTION (SP-004):
 * - NO logging of student email, name, or other PII
 * - Only log student ID (non-PII)
 * - IP address is PII, do not log it
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data with consent metadata
 */
export declare const captureStudentConsentMetadata: FieldHook;
//# sourceMappingURL=captureStudentConsentMetadata.d.ts.map