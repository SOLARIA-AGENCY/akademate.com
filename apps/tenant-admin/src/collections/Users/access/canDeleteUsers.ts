import type { Access } from 'payload';

/**
 * Access Control: Can Delete Users
 *
 * Determines who can delete user records.
 *
 * Rules:
 * - SuperAdmin: Can delete ANY user EXCEPT themselves (across ALL tenants)
 * - Admin: Can delete any user within their tenant EXCEPT themselves and superadmins
 * - All other roles: Cannot delete any users
 *
 * Security Notes:
 * - Prevents users from deleting themselves (could lock themselves out)
 * - Prevents accidental deletion of the last admin (enforced in beforeDelete hook)
 * - Admin cannot delete SuperAdmin users
 * - Only SuperAdmin has cross-tenant delete privileges
 *
 * Implementation:
 * - Checks if user is superadmin or admin
 * - Checks if trying to delete self (denied)
 * - Returns tenant filter for admin
 * - Additional check in beforeDelete hook prevents deleting last admin
 *
 * @param req - Payload request object containing authenticated user
 * @param id - ID of user being deleted
 * @returns Boolean indicating if deletion is allowed, or query constraint
 */
export const canDeleteUsers: Access = ({ req: { user }, id }) => {
  // Not authenticated - deny access
  if (!user) {
    return false;
  }

  // SuperAdmin can delete ANY user across ALL tenants (except themselves)
  if (user.role === 'superadmin') {
    // SuperAdmin cannot delete themselves
    if (user.id === id) {
      return false;
    }
    return true;
  }

  // Admin can delete users within their tenant (except themselves and superadmins)
  if (user.role === 'admin') {
    // Admin cannot delete themselves
    if (user.id === id) {
      return false;
    }

    // Filter to only users in the same tenant (excluding superadmins via hook)
    if (user.tenant) {
      return {
        and: [
          { tenant: { equals: typeof user.tenant === 'object' ? user.tenant.id : user.tenant } },
          { role: { not_equals: 'superadmin' } }, // Admin cannot delete superadmins
        ],
      };
    }
    return { role: { not_equals: 'superadmin' } };
  }

  // All other roles cannot delete users
  return false;
};
