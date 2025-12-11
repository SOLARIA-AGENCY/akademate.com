import type { CollectionBeforeValidateHook } from 'payload';
import { extractIPAddress, extractUserAgent } from '../schemas';

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
export const autoPopulateAuditMetadata: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Only populate on creation (updates are blocked anyway)
  if (operation !== 'create') {
    return data;
  }

  const { user, payload } = req;

  try {
    // Auto-populate user_email from user relationship
    if (!data?.user_email && user) {
      data.user_email = user.email;
    }

    // Auto-populate user_role from user relationship
    if (!data?.user_role && user) {
      data.user_role = user.role;
    }

    // Auto-populate ip_address from request headers
    if (!data?.ip_address && req) {
      const ipAddress = extractIPAddress(req);
      if (ipAddress) {
        data.ip_address = ipAddress;
      } else {
        // Fallback to localhost for development (should never happen in production)
        data.ip_address = '127.0.0.1';
        if (payload?.logger) {
          payload.logger.warn('[AuditLog] Could not extract IP address, using localhost fallback');
        }
      }
    }

    // Auto-populate user_agent from request headers
    if (!data?.user_agent && req) {
      const userAgent = extractUserAgent(req);
      if (userAgent) {
        data.user_agent = userAgent;
      }
    }

    // SECURITY: NO logging of PII (SP-004)
    // DO NOT log: user_email, ip_address (both are PII)
    // Only log operation success with non-PII flags
    if (payload?.logger) {
      payload.logger.info('[AuditLog] Metadata auto-populated');
    }
  } catch (error) {
    // Log error without exposing PII
    if (req?.payload?.logger) {
      req.payload.logger.error('[AuditLog] Error auto-populating metadata');
    }
    // Don't throw - allow creation to proceed with partial metadata
    // Validation will catch missing required fields
  }

  return data;
};
