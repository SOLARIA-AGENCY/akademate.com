import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Access control for managing Courses
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 * - Marketing: Can create and edit courses
 *
 * All other roles: Read-only access
 */
export const canManageCourses: Access = ({ req: { user } }) => {
  // Not authenticated
  if (!user) return false;

  // Admin, Gestor, and Marketing can manage courses
  return (
    user.role === ROLES.ADMIN || user.role === ROLES.GESTOR || user.role === ROLES.MARKETING
  );
};
