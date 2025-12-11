import type { Access } from 'payload';

/**
 * Access Control: canReadEnrollments
 *
 * Role-based read access to enrollments:
 *
 * - Public: CANNOT read enrollments (privacy protection) ❌
 * - Lectura: CAN read all enrollments (view only) ✅
 * - Asesor: CAN read all enrollments ✅
 * - Marketing: CAN read all enrollments ✅
 * - Gestor: CAN read all enrollments ✅
 * - Admin: CAN read all enrollments ✅
 *
 * Business Logic:
 * - All authenticated users can view enrollments (except public)
 * - No row-level filtering needed - all authenticated users see all enrollments
 * - Enrollment data contains student PII, so public access is denied
 *
 * Security Considerations:
 * - Enrollments contain sensitive student information
 * - Public access denied to protect student privacy
 * - Even Lectura role gets read access for reporting purposes
 */
export const canReadEnrollments: Access = ({ req: { user } }) => {
  // Public cannot read enrollments (privacy protection)
  if (!user) {
    return false;
  }

  // All authenticated users can read enrollments
  // This includes: admin, gestor, marketing, asesor, lectura
  return true;
};
