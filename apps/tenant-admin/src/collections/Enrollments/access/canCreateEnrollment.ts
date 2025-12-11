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
export const canCreateEnrollment: Access = ({ req: { user } }) => {
  // Must be authenticated
  if (!user) {
    return false;
  }

  // Admin, Gestor, Marketing, and Asesor can create enrollments
  if (['admin', 'gestor', 'marketing', 'asesor'].includes(user.role)) {
    return true;
  }

  // All other roles (including Lectura) cannot create
  return false;
};
