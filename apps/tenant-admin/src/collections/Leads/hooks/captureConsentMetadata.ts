import type { FieldHook } from 'payload';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

/**
 * Plain object headers (Node.js HTTP style)
 */
interface PlainHeaders {
  'x-forwarded-for'?: string | string[];
  'x-real-ip'?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * Web API Headers interface (with get method)
 */
interface WebAPIHeaders {
  get(name: string): string | null;
}

/**
 * Union type for headers that can be either plain object or Web API Headers
 */
type RequestHeaders = PlainHeaders | WebAPIHeaders;

/**
 * Type guard to check if headers is a Web API Headers object
 */
function isWebAPIHeaders(headers: RequestHeaders): headers is WebAPIHeaders {
  return typeof (headers as WebAPIHeaders).get === 'function';
}

/**
 * Payload request interface with header access
 */
interface PayloadRequestWithHeaders {
  headers?: RequestHeaders;
  ip?: string;
}

/**
 * Lead consent data fields (GDPR compliance)
 */
interface LeadConsentData {
  gdpr_consent?: boolean;
  privacy_policy_accepted?: boolean;
  consent_timestamp?: string;
  consent_ip_address?: string;
  [key: string]: unknown;
}

/**
 * Helper function to get header value from either plain object or Web API Headers
 */
function getHeaderValue(
  headers: RequestHeaders | undefined,
  headerName: string
): string | string[] | null {
  if (!headers) return null;

  if (isWebAPIHeaders(headers)) {
    return headers.get(headerName);
  }

  return headers[headerName] ?? null;
}

/**
 * Extract IP address from request headers
 */
function extractIPFromRequest(req: PayloadRequestWithHeaders): string | undefined {
  const headers = req.headers;

  // Try X-Forwarded-For header first (if behind proxy/load balancer)
  const forwardedFor = getHeaderValue(headers, 'x-forwarded-for');
  if (forwardedFor) {
    // X-Forwarded-For can contain multiple IPs, take the first one
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0]?.trim();
    }
    return forwardedFor.split(',')[0]?.trim();
  }

  // Try X-Real-IP header
  const realIp = getHeaderValue(headers, 'x-real-ip');
  if (realIp) {
    if (Array.isArray(realIp)) {
      return realIp[0];
    }
    return realIp;
  }

  // Fallback to req.ip
  if (req.ip) {
    return req.ip;
  }

  return undefined;
}

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
export const captureConsentMetadata: FieldHook = ({ data, req, operation }) => {
  const typedData = data as LeadConsentData | undefined;

  // Only on creation
  if (operation !== 'create') {
    return typedData;
  }

  // Only if GDPR consent is given
  if (typedData?.gdpr_consent !== true) {
    return typedData;
  }

  try {
    // Capture consent timestamp (ISO 8601 format)
    typedData.consent_timestamp = new Date().toISOString();

    // Capture IP address from request using typed helper function
    const typedReq = req as unknown as PayloadRequestWithHeaders;
    const ipAddress = extractIPFromRequest(typedReq);

    if (ipAddress) {
      typedData.consent_ip_address = ipAddress;
    }

    // Log consent capture for audit trail (NO PII per GDPR)
    console.log('[GDPR Audit] Consent metadata captured', {
      hasTimestamp: !!typedData.consent_timestamp,
      hasIpAddress: !!typedData.consent_ip_address,
      gdprConsent: Boolean(typedData.gdpr_consent),
      privacyPolicyAccepted: Boolean(typedData.privacy_policy_accepted),
      // SECURITY: Do NOT log email or IP address (PII)
    });
  } catch (error) {
    // Log error but don't fail the operation
    console.error('[GDPR Audit] Failed to capture consent metadata:', error);
  }

  return typedData;
};
