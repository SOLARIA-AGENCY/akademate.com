import type { Access } from 'payload';

/**
 * Access Control: Can Update Users
 *
 * Determines who can update user records.
 *
 * Rules:
 * - SuperAdmin: Can update ANY user across ALL tenants
 * - Admin: Can update any user within their tenant
 * - Gestor: Can update any user within their tenant (but role changes restricted via field-level access)
 * - Marketing/Asesor/Lectura: Can only update themselves
 *
 * Additional Restrictions (enforced via field-level access or hooks):
 * - Users cannot change their own role (except superadmin/admin)
 * - Users cannot change their own is_active status (except superadmin/admin)
 * - Users cannot change their email address
 * - Only SuperAdmin can change tenant assignment
 *
 * Implementation:
 * - Returns `true` for superadmin (global access)
 * - Returns tenant filter for admin/gestor
 * - Returns query constraint for others (filter to self only)
 *
 * @param req - Payload request object containing authenticated user
 * @param id - ID of user being updated
 * @returns Boolean true for full access, or query constraint object
 */
export const canUpdateUsers: Access = ({ req: { user } }) => {
  // Not authenticated - deny access
  if (!user) {
    return false;
  }

  // SuperAdmin can update ANY user across ALL tenants
  if (user.role === 'superadmin') {
    return true;
  }

  // Admin can update any user within their tenant
  if (user.role === 'admin') {
    if (user.tenant) {
      return {
        or: [
          { tenant: { equals: typeof user.tenant === 'object' ? user.tenant.id : user.tenant } },
          { id: { equals: user.id } }, // Can always update themselves
        ],
      };
    }
    return true;
  }

  // Gestor can update any user within their tenant (but some fields are restricted via field-level access)
  if (user.role === 'gestor') {
    if (user.tenant) {
      return {
        or: [
          { tenant: { equals: typeof user.tenant === 'object' ? user.tenant.id : user.tenant } },
          { id: { equals: user.id } }, // Can always update themselves
        ],
      };
    }
    return true;
  }

  // Other roles can only update themselves
  return {
    id: {
      equals: user.id,
    },
  };
};
