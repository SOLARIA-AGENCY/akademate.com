import type { FieldHook } from 'payload';
/**
 * Hook: captureConsentMetadata
 *
 * GDPR Compliance: Automatically capture consent metadata when a lead is created.
 *
 * This hook captures:
 * 1. consent_timestamp: ISO 8601 timestamp when consent was given
 * 2. consent_ip_address: IP address of the user who gave consent
 *
 * IMPORTANT:
 * - Only runs on CREATE operations
 * - Only captures if gdpr_consent is true
 * - Metadata is immutable after creation (for audit purposes)
 *
 * Legal requirements:
 * - GDPR Article 7: Controller must be able to demonstrate that consent was given
 * - Must record when and how consent was obtained
 * - Must be able to prove consent in case of audit
 */
export declare const captureConsentMetadata: FieldHook;
//# sourceMappingURL=captureConsentMetadata.d.ts.map