import type { Access } from 'payload';

/**
 * Access Control: Can Edit Staff
 *
 * CEP operational requirement: every authenticated dashboard user can create
 * and update professor/staff records, including users with lectura role.
 */
export const canEditStaff: Access = ({ req: { user } }) => {
  return Boolean(user);
};

/**
 * Access Control: Can Manage Staff
 *
 * Destructive staff operations stay restricted to Gestor and Admin roles.
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
