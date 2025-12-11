import type { Access } from 'payload';

/**
 * Access Control: Can Read Courses
 *
 * Determines who can read courses and which courses they can see.
 *
 * Access Rules:
 * - Authenticated users (admin, gestor, marketing, asesor): See all courses
 * - Public/unauthenticated users: See only active courses (active=true)
 *
 * This implements a two-tier read access system:
 * 1. Authenticated staff can see draft/inactive courses for management
 * 2. Public users only see published/active courses
 *
 * @param req - Payload request object with user context
 * @returns Boolean or query constraint object
 */
export const canReadCourses: Access = ({ req: { user } }) => {
  // Authenticated users with appropriate roles can read all courses
  if (user && ['admin', 'gestor', 'marketing', 'asesor'].includes(user.role)) {
    return true; // Full read access to all courses
  }

  // Public users (unauthenticated or lectura role) can only read active courses
  return {
    active: { equals: true },
  };
};
