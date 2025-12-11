import type { Access } from 'payload';

/**
 * Access Control: canDeleteEnrollment
 *
 * Role-based delete access to enrollments:
 *
 * - Public: CANNOT delete enrollments ❌
 * - Lectura: CANNOT delete enrollments ❌
 * - Asesor: CANNOT delete enrollments ❌
 * - Marketing: CANNOT delete enrollments ❌
 * - Gestor: CAN delete enrollments (with restrictions) ✅
 * - Admin: CAN delete enrollments (unrestricted) ✅
 *
 * Business Logic:
 * - Only Gestor and Admin can delete enrollments
 * - Deletion should be rare - prefer cancellation for audit trail
 * - Recommended: Use status 'cancelled' instead of deleting
 * - Hard delete only for data correction or compliance (GDPR)
 *
 * Security Considerations:
 * - Deleting enrollments affects course_run capacity counts
 * - afterChange hook will decrement current_enrollments
 * - Cascade delete relationships must be respected
 * - Consider soft delete (status='cancelled') for better audit trail
 */
export const canDeleteEnrollment: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Only Admin and Gestor can delete enrollments
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // All other roles cannot delete
  return false;
};
