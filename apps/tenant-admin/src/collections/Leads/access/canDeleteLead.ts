import type { Access } from 'payload';

/**
 * Access Control: canDeleteLead
 *
 * CRITICAL: Lead deletion is restricted due to GDPR compliance.
 * Deleting a lead permanently removes personal data (Right to be Forgotten).
 *
 * Only Admin can delete leads:
 * - This ensures proper oversight of data deletion
 * - Deletion should be logged in audit trail
 * - Deletion should cascade to related records (if any)
 *
 * Role access:
 * - Public: CANNOT delete
 * - Lectura: CANNOT delete
 * - Asesor: CANNOT delete
 * - Marketing: CANNOT delete
 * - Gestor: CANNOT delete (use case: prevent accidental deletions)
 * - Admin: CAN delete (GDPR right to be forgotten)
 *
 * Best practices:
 * - Consider soft delete (status = 'deleted') for most cases
 * - Hard delete only when legally required (GDPR request)
 * - Always create audit log entry before deletion
 */
export const canDeleteLead: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Only Admin can delete leads (GDPR compliance requirement)
  return user.role === 'admin';
};
