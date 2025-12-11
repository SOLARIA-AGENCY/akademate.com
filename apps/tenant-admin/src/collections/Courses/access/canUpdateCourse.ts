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
export const canUpdateCourse: Access = ({ req: { user } }) => {
  // Unauthenticated users cannot update courses
  if (!user) {
    return false;
  }

  // Admin and Gestor can update any course
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can only update courses they created
  if (user.role === 'marketing') {
    return {
      created_by: { equals: user.id },
    };
  }

  // All other roles (asesor, lectura) cannot update courses
  return false;
};
