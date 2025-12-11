/**
 * Enrollments Collection - Access Control Functions
 *
 * This module exports all access control functions for the Enrollments collection.
 *
 * Access Control Model (6-tier RBAC):
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: NO ❌
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All enrollments (view only) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: YES (manual enrollment) ✅
 * - READ: All enrollments ✅
 * - UPDATE: Status changes, notes ✅
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES (manual enrollment) ✅
 * - READ: All enrollments ✅
 * - UPDATE: Limited (notes only) ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All enrollments ✅
 * - UPDATE: All fields except financial ✅
 * - DELETE: YES (with restrictions) ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All enrollments ✅
 * - UPDATE: All fields ✅
 * - DELETE: YES (unrestricted) ✅
 *
 * Security Notes:
 * - Enrollments contain student PII - public access denied
 * - Field-level access control provides additional granularity
 * - Financial data protected with field-level restrictions
 * - Immutable fields enforced via field-level access.update = false
 */

export { canCreateEnrollment } from './canCreateEnrollment';
export { canReadEnrollments } from './canReadEnrollments';
export { canUpdateEnrollment } from './canUpdateEnrollment';
export { canDeleteEnrollment } from './canDeleteEnrollment';
