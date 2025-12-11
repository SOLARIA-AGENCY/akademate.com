import type { Access } from 'payload';

/**
 * Access Control: canDeleteStudent
 *
 * Determines who can delete student records (GDPR Right to be Forgotten).
 *
 * BUSINESS RULES:
 * - Public (unauthenticated): NO ❌
 *   Public cannot delete student records.
 *
 * - Lectura: NO ❌
 *   Read-only role cannot delete students.
 *
 * - Asesor: NO ❌
 *   Advisors cannot delete students (data integrity).
 *
 * - Marketing: NO ❌
 *   Marketing cannot delete students (data integrity).
 *
 * - Gestor: YES ✅
 *   Can delete students for GDPR right to be forgotten.
 *   Requires proper authorization and audit logging.
 *
 * - Admin: YES ✅
 *   Full delete access for GDPR compliance and data management.
 *
 * GDPR RIGHT TO BE FORGOTTEN (Article 17):
 * When a student requests deletion under GDPR:
 * 1. Verify identity and request legitimacy
 * 2. Admin or Gestor performs deletion
 * 3. Deletion cascades to:
 *    - Enrollments (ON DELETE CASCADE)
 *    - Any other related records
 * 4. Audit log records the deletion (who, when, why)
 *
 * DATABASE CASCADE BEHAVIOR:
 * From migrations/008_create_students.sql:
 * - enrollments.student_id: ON DELETE CASCADE
 *   When student is deleted, all enrollments are automatically deleted.
 *
 * SECURITY CONSIDERATIONS:
 * - Delete operations are irreversible
 * - Only senior roles (Gestor, Admin) can delete
 * - Deletion should trigger audit log entry
 * - Consider soft delete for some use cases (status='deleted')
 * - Hard delete should only be used for GDPR compliance
 *
 * ALTERNATIVE: SOFT DELETE
 * For non-GDPR deletions, consider setting status='inactive' or 'deleted'
 * instead of hard delete. This preserves audit trail and analytics.
 *
 * @param req - Payload request object containing user information
 * @returns boolean - true if user can delete students, false otherwise
 */
export const canDeleteStudent: Access = ({ req: { user } }) => {
  // No user = public access
  if (!user) {
    return false; // Public cannot delete students
  }

  // Only Gestor and Admin can delete (GDPR right to be forgotten)
  const allowedRoles = ['gestor', 'admin'];

  if (allowedRoles.includes(user.role)) {
    return true; // Authorized to delete students
  }

  // All other roles: denied (including Asesor and Marketing)
  return false;
};
