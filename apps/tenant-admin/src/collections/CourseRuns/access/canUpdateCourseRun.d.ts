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
export declare const canUpdateCourseRun: Access;
//# sourceMappingURL=canUpdateCourseRun.d.ts.map