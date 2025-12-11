import type { Access } from 'payload';

/**
 * Access Control: canUpdateCourseRun
 *
 * Role-based update access to course runs:
 *
 * - Public: CANNOT update course runs
 * - Lectura: CANNOT update course runs
 * - Asesor: CANNOT update course runs
 * - Marketing: Can update ONLY their own runs (created_by = user.id) ✅
 * - Gestor: Can update ALL runs ✅
 * - Admin: Can update ALL runs ✅
 *
 * Ownership Logic (Marketing):
 * - Marketing users can only update course runs they created
 * - This prevents accidental or unauthorized modifications
 * - Enforced via created_by field match
 *
 * Security Considerations:
 * - Immutable fields (created_by, current_enrollments) are protected via field-level access
 * - Status transitions should be validated (future enhancement)
 * - Updates are logged for audit trail
 */
export const canUpdateCourseRun: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Admin and Gestor can update all course runs
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can update only their own course runs
  if (user.role === 'marketing') {
    return {
      created_by: {
        equals: user.id,
      },
    };
  }

  // Asesor and Lectura cannot update course runs
  return false;
};
