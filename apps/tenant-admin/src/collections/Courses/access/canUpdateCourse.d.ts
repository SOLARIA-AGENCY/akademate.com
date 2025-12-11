import type { Access } from 'payload';
/**
 * Access Control: Can Update Course
 *
 * Determines who can update existing courses.
 *
 * Update Rules:
 * - admin: Can update any course
 * - gestor: Can update any course
 * - marketing: Can only update courses they created (created_by = user.id)
 * - asesor: Cannot update courses
 * - lectura: Cannot update courses
 * - unauthenticated: Cannot update courses
 *
 * This implements a tiered update permission system:
 * - Tier 1 (Full): Admin, Gestor - unrestricted updates
 * - Tier 2 (Own): Marketing - can only update their own courses
 * - Tier 3 (None): Asesor, Lectura - no update privileges
 *
 * @param req - Payload request object with user context
 * @returns Boolean or query constraint object
 */
export declare const canUpdateCourse: Access;
//# sourceMappingURL=canUpdateCourse.d.ts.map