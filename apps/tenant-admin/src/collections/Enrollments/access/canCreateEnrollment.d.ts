import type { Access } from 'payload';
/**
 * Access Control: canCreateEnrollment
 *
 * Role-based create access to enrollments:
 *
 * - Public: CANNOT create enrollments ❌
 * - Lectura: CANNOT create enrollments ❌
 * - Asesor: CAN create enrollments (manual enrollment) ✅
 * - Marketing: CAN create enrollments (manual enrollment) ✅
 * - Gestor: CAN create enrollments ✅
 * - Admin: CAN create enrollments ✅
 *
 * Business Logic:
 * - Asesor can manually enroll students during consultations
 * - Marketing can create enrollments for campaign conversions
 * - Gestor and Admin have full enrollment management capabilities
 * - Public and Lectura cannot create enrollments to prevent unauthorized access
 */
export declare const canCreateEnrollment: Access;
//# sourceMappingURL=canCreateEnrollment.d.ts.map