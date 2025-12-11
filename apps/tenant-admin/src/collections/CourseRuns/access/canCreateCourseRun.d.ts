import type { Access } from 'payload';
/**
 * Access Control: canCreateCourseRun
 *
 * Role-based create access to course runs:
 *
 * - Public: CANNOT create course runs
 * - Lectura: CANNOT create course runs
 * - Asesor: CANNOT create course runs
 * - Marketing: CAN create course runs ✅
 * - Gestor: CAN create course runs ✅
 * - Admin: CAN create course runs ✅
 *
 * Business Logic:
 * - Marketing users can create course runs for planning purposes
 * - Gestor and Admin have full management capabilities
 * - Lower roles cannot create course runs to maintain data quality
 */
export declare const canCreateCourseRun: Access;
//# sourceMappingURL=canCreateCourseRun.d.ts.map