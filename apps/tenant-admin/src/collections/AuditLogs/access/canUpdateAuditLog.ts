import type { Access } from 'payload';

/**
 * Access Control: canUpdateAuditLog
 *
 * Determines who can update audit log entries.
 *
 * BUSINESS RULE: NEVER ALLOW UPDATES
 * - Audit logs are IMMUTABLE by design (GDPR Article 30 requirement)
 * - Once created, an audit log entry can NEVER be modified
 * - This ensures audit trail integrity and legal compliance
 * - No exceptions - not even Admin can update audit logs
 *
 * RATIONALE:
 * - GDPR Article 30: Records of processing activities must be reliable
 * - Legal requirement: Audit trails must be tamper-proof
 * - Security: Prevents covering up of malicious activity
 * - Compliance: Required for SOC2, ISO 27001, HIPAA, etc.
 *
 * SECURITY PATTERN (SP-001: Immutable Audit Trail):
 * - Collection-level: access.update = () => false
 * - Field-level: All fields have access.update = false
 * - Hook-level: beforeChange hook throws error on update attempts
 * - Database-level: Triggers prevent updates (future enhancement)
 *
 * If a log entry needs correction:
 * - DO NOT update the incorrect entry
 * - CREATE a new corrective entry with metadata explaining the correction
 * - Reference the original entry ID in the new entry's metadata
 *
 * @param req - Payload request object containing user information
 * @returns boolean - ALWAYS false (no one can update audit logs)
 */
export const canUpdateAuditLog: Access = () => {
  // CRITICAL SECURITY: Audit logs are IMMUTABLE
  // No user, no role, no permission level can update audit logs
  // This is a fundamental GDPR compliance requirement
  return false;
};
