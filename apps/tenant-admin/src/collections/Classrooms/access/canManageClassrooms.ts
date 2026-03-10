import type { Access } from 'payload';
import { hasMinimumRole } from '../../../access/roles';

/**
 * Access control for managing Classrooms
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 *
 * All other roles: Read-only access
 */
export const canManageClassrooms: Access = ({ req: { user } }) => {
  if (!user) return false;
  return hasMinimumRole(user.role, 'gestor');
};
