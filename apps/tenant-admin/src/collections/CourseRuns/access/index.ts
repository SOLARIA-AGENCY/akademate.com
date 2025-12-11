/**
 * CourseRuns Collection - Access Control Functions
 *
 * This module exports all access control functions for the CourseRuns collection.
 *
 * Access Control Model (6-tier RBAC):
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Only published/enrollment_open runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All active runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: All runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: Own runs only ✅ (created_by = user.id)
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: All runs ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: All runs ✅
 * - DELETE: YES ✅
 */

export { canCreateCourseRun } from './canCreateCourseRun';
export { canReadCourseRuns } from './canReadCourseRuns';
export { canUpdateCourseRun } from './canUpdateCourseRun';
export { canDeleteCourseRun } from './canDeleteCourseRun';
