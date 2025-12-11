import type { Access } from 'payload';

/**
 * Access Control: canReadAuditLogs
 *
 * Determines who can read audit log records.
 *
 * BUSINESS RULES:
 * - Public (unauthenticated): NO ❌
 *   Audit logs contain sensitive PII and system activity data.
 *
 * - Lectura: NO ❌
 *   Read-only role has no audit trail access (privacy protection).
 *
 * - Asesor: LIMITED ✅
 *   Can only read their own actions (user_id = current user).
 *   Cannot see actions by other users.
 *
 * - Marketing: LIMITED ✅
 *   Can only read their own actions (user_id = current user).
 *   Useful for reviewing their own campaign/lead activities.
 *
 * - Gestor: FULL ✅
 *   Can read ALL audit logs (audit capability).
 *   Needed for compliance reviews and investigations.
 *
 * - Admin: FULL ✅
 *   Can read ALL audit logs (system administration).
 *   Full audit trail access for security investigations.
 *
 * SECURITY CONSIDERATIONS (GDPR Article 30):
 * - Audit logs contain PII (IP addresses, user emails)
 * - Access must be restricted to authorized personnel only
 * - Lower privilege roles (Asesor, Marketing) can only see own actions
 * - Principle of Least Privilege applied
 *
 * @param req - Payload request object containing user information
 * @returns boolean | Where - true if user can read all logs, false if denied,
 *                             or Where clause to filter accessible logs
 */
export const canReadAuditLogs: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public NEVER has access to audit logs
  }

  // Lectura: NO ACCESS (privacy protection)
  if (user.role === 'lectura') {
    return false;
  }

  // Admin and Gestor: FULL ACCESS (audit capability)
  if (['admin', 'gestor'].includes(user.role)) {
    return true; // Can read all audit logs
  }

  // Asesor and Marketing: LIMITED ACCESS (own actions only)
  if (['asesor', 'marketing'].includes(user.role)) {
    return {
      user_id: { equals: user.id }, // Query constraint: only own logs
    };
  }

  // Unknown roles: denied
  return false;
};
