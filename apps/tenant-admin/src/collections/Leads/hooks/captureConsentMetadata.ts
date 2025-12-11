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
export const captureConsentMetadata: FieldHook = async ({ data, req, operation }) => {
  // Only on creation
  if (operation !== 'create') {
    return data;
  }

  // Only if GDPR consent is given
  if (data?.gdpr_consent !== true) {
    return data;
  }

  try {
    // Capture consent timestamp (ISO 8601 format)
    data.consent_timestamp = new Date().toISOString();

    // Capture IP address from request
    // Priority: X-Forwarded-For > X-Real-IP > req.ip
    const forwardedFor = req.headers?.['x-forwarded-for'];
    const realIp = req.headers?.['x-real-ip'];
    const requestIp = req.ip;

    let ipAddress: string | undefined;

    if (forwardedFor) {
      // X-Forwarded-For can contain multiple IPs, take the first one
      ipAddress = Array.isArray(forwardedFor) ? forwardedFor[0] : forwardedFor.split(',')[0].trim();
    } else if (realIp) {
      ipAddress = Array.isArray(realIp) ? realIp[0] : realIp;
    } else if (requestIp) {
      ipAddress = requestIp;
    }

    if (ipAddress) {
      data.consent_ip_address = ipAddress;
    }

    // Log consent capture for audit trail (NO PII per GDPR)
    console.log('[GDPR Audit] Consent metadata captured', {
      hasTimestamp: !!data.consent_timestamp,
      hasIpAddress: !!data.consent_ip_address,
      gdprConsent: data.gdpr_consent,
      privacyPolicyAccepted: data.privacy_policy_accepted,
      // SECURITY: Do NOT log email or IP address (PII)
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error('[GDPR Audit] Failed to capture consent metadata:', error);
  }

  return data;
};
