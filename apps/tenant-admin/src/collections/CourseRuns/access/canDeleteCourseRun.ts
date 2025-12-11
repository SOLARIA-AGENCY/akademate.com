import type { Access } from 'payload';

/**
 * Access Control: canDeleteCourseRun
 *
 * Role-based delete access to course runs:
 *
 * - Public: CANNOT delete course runs
 * - Lectura: CANNOT delete course runs
 * - Asesor: CANNOT delete course runs
 * - Marketing: CANNOT delete course runs
 * - Gestor: CAN delete course runs ✅
 * - Admin: CAN delete course runs ✅
 *
 * Business Logic:
 * - Only Gestor and Admin can delete course runs
 * - Marketing users cannot delete to prevent accidental data loss
 * - Deletion should be reserved for corrections and administrative cleanup
 *
 * Data Integrity:
 * - Deleting a course run with enrollments should be prevented (future enhancement)
 * - Consider soft delete for runs with historical enrollments
 * - Audit log should record all deletions
 */
export const canDeleteCourseRun: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Only Admin and Gestor can delete course runs
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // All other roles cannot delete
  return false;
};
