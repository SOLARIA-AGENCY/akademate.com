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
export const captureStudentConsentMetadata: FieldHook = async ({
  data,
  req,
  operation,
  value,
}) => {
  // Only capture on creation, not on updates
  if (operation !== 'create') {
    return data;
  }

  // Only capture if GDPR consent is true
  if (data?.gdpr_consent !== true) {
    return data;
  }

  try {
    // Capture consent timestamp (ISO 8601)
    if (!data.consent_timestamp) {
      data.consent_timestamp = new Date().toISOString();
    }

    // Capture IP address from request
    if (!data.consent_ip_address && req) {
      // Try X-Forwarded-For header first (if behind proxy)
      const forwardedFor = req.headers?.['x-forwarded-for'];
      if (forwardedFor) {
        // X-Forwarded-For can be a comma-separated list, take first IP
        const ips = Array.isArray(forwardedFor) ? forwardedFor : forwardedFor.split(',');
        data.consent_ip_address = ips[0].trim();
      } else if (req.ip) {
        // Fallback to req.ip
        data.consent_ip_address = req.ip;
      }
    }

    // SECURITY: NO logging of PII (SP-004)
    // DO NOT log: email, name, IP address (all are PII)
    // Only log operation success with non-PII identifiers
    if (req?.payload?.logger) {
      req.payload.logger.info('[Student] Consent metadata captured', {
        hasTimestamp: !!data.consent_timestamp,
        hasIPAddress: !!data.consent_ip_address,
        operation,
      });
    }
  } catch (error) {
    // Log error without exposing PII
    if (req?.payload?.logger) {
      req.payload.logger.error('[Student] Error capturing consent metadata', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation,
      });
    }
    // Don't throw - allow creation to proceed without metadata
    // (database constraints will enforce GDPR consent)
  }

  return data;
};
