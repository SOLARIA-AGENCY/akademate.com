import type { Access } from 'payload';

/**
 * Access Control: canCreateAuditLog
 *
 * Determines who can create audit log entries.
 *
 * BUSINESS RULE: System-only creation
 * - Audit logs should ONLY be created by system hooks, not manually via UI/API
 * - This prevents log tampering and ensures audit trail integrity
 * - For manual testing, Admin can create logs (development only)
 *
 * PRODUCTION BEHAVIOR:
 * - Only system processes can create audit logs
 * - Manual creation via admin UI is BLOCKED for all roles
 * - Logs are created automatically via afterChange hooks on other collections
 *
 * DEVELOPMENT/TESTING:
 * - Admin role can manually create logs for testing purposes
 * - This should be disabled in production via environment variable
 *
 * SECURITY CONSIDERATIONS (SP-001: Immutable Audit Trail):
 * - Preventing manual creation ensures audit trail authenticity
 * - All logs must be system-generated to prevent fraud
 * - GDPR Article 30 requires provable audit trail integrity
 *
 * @param req - Payload request object containing user information
 * @returns boolean - true if user can create audit logs, false otherwise
 */
export const canCreateAuditLog: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public can NEVER create audit logs
  }

  // DEVELOPMENT MODE: Allow Admin to create logs for testing
  // In production, this should be disabled via environment variable
  if (process.env.NODE_ENV === 'development' && user.role === 'admin') {
    return true;
  }

  // PRODUCTION MODE: Only system can create logs (no manual creation)
  // System creation happens via hooks, which bypass access control
  // So this function effectively blocks all manual creation attempts
  return false;
};
