import type { Access } from 'payload';
/**
 * Access Control: canUpdateEnrollment
 *
 * Role-based update access to enrollments:
 *
 * - Public: CANNOT update enrollments ❌
 * - Lectura: CANNOT update enrollments ❌
 * - Asesor: CAN update enrollments (status changes, notes) ✅
 * - Marketing: CAN update enrollments (limited to notes) ✅
 * - Gestor: CAN update enrollments (all fields except financial) ✅
 * - Admin: CAN update enrollments (all fields) ✅
 *
 * Business Logic:
 * - Asesor can update enrollment status and add notes during student interactions
 * - Marketing can only update notes for campaign tracking
 * - Gestor can update most fields but financial data requires Admin
 * - Admin has unrestricted update access
 * - Field-level access control provides additional granularity
 *
 * Note: Field-level access control in collection config provides
 * finer-grained permissions (e.g., Marketing can only update notes)
 */
export declare const canUpdateEnrollment: Access;
//# sourceMappingURL=canUpdateEnrollment.d.ts.map