import type { Access } from 'payload';

/**
 * Access Control: canDeleteAuditLog
 *
 * Determines who can delete audit log entries.
 *
 * BUSINESS RULES:
 * - Public: NO ❌
 * - Lectura: NO ❌
 * - Asesor: NO ❌
 * - Marketing: NO ❌
 * - Gestor: NO ❌
 * - Admin: YES ✅ (ONLY for GDPR right to erasure compliance)
 *
 * GDPR RIGHT TO ERASURE (Article 17):
 * When a data subject exercises their right to be forgotten, Admin must be able to:
 * 1. Delete the subject's personal data from all collections
 * 2. Delete audit logs containing the subject's PII (IP addresses, emails)
 * 3. Maintain audit log of the erasure operation itself (meta-auditing)
 *
 * RETENTION POLICY (Spain - 7 years):
 * - Audit logs must be retained for 7 years (legal requirement)
 * - After 7 years, Admin can delete old logs
 * - Automated cleanup jobs should handle this (future enhancement)
 *
 * SECURITY CONSIDERATIONS:
 * - Deletion should be rare and carefully controlled
 * - Each deletion should create a new audit log entry (meta-auditing)
 * - Only Admin role has this capability (highest trust level)
 * - Bulk deletion should require additional confirmation (UI pattern)
 *
 * WHEN TO DELETE:
 * 1. GDPR right to erasure request (user deletion)
 * 2. Retention period expired (7+ years old)
 * 3. Test data cleanup (development only)
 * 4. Legal order requiring data destruction
 *
 * @param req - Payload request object containing user information
 * @returns boolean - true only for Admin role
 */
export const canDeleteAuditLog: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public can NEVER delete audit logs
  }

  // Only Admin can delete audit logs (GDPR compliance)
  if (user.role === 'admin') {
    return true;
  }

  // All other roles: denied (including Gestor)
  // Gestor can manage most content, but NOT audit logs
  return false;
};
