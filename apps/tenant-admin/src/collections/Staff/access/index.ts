import type { Access } from 'payload';

/**
 * Access Control: Can Manage Staff
 *
 * Only Gestor and Admin roles can create, update, or delete staff members.
 * Other roles have read-only access.
 */
export const canManageStaff: Access = ({ req: { user } }) => {
  // Require authentication
  if (!user) {
    return false;
  }

  // Allow Gestor and Admin roles
  if (user.role === 'admin' || user.role === 'gestor') {
    return true;
  }

  return false;
};
