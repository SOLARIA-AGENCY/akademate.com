import type { Access } from 'payload';
import { hasMinimumRole } from '../../../access/roles';

/**
 * Access control for managing Cycles
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 *
 * All other roles: Read-only access
 *
 * Uses role hierarchy for clean permission checks.
 */
export const canManageCycles: Access = ({ req: { user } }) => {
  // Not authenticated
  if (!user) return false;

  // Admin and Gestor can manage cycles (using role hierarchy)
  return hasMinimumRole(user.role, 'gestor');
};
