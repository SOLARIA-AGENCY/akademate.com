import type { Access } from 'payload';
/**
 * Access Control: canReadCourseRuns
 *
 * Role-based read access to course runs:
 *
 * - Public: Can ONLY read published/enrollment_open runs
 * - Lectura: Can read ALL active runs (not draft or cancelled)
 * - Asesor: Can read ALL runs
 * - Marketing: Can read ALL runs
 * - Gestor: Can read ALL runs
 * - Admin: Can read ALL runs
 *
 * Public Access Logic:
 * - Only show runs that are publicly visible (published, enrollment_open)
 * - Hide draft, cancelled, and completed runs from public
 *
 * Authenticated Access Logic:
 * - Lectura: Can see active runs (helps with inquiries)
 * - Asesor: Can see all runs (needs context for student advising)
 * - Marketing/Gestor/Admin: Full read access
 */
export declare const canReadCourseRuns: Access;
//# sourceMappingURL=canReadCourseRuns.d.ts.map