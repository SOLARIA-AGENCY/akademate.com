import type { Access } from 'payload';

/**
 * Access Control: Can Read Users
 *
 * Determines who can read user records.
 *
 * Rules:
 * - SuperAdmin: Can read ALL users across ALL tenants
 * - Admin: Can read all users within their tenant
 * - Gestor: Can read all users within their tenant
 * - Marketing/Asesor/Lectura: Can only read themselves
 *
 * Implementation:
 * - Returns `true` for superadmin (global access)
 * - Returns tenant filter for admin/gestor
 * - Returns query constraint for others (filter to self only)
 *
 * @param req - Payload request object containing authenticated user
 * @returns Boolean true for full access, or query constraint object
 */
export const canReadUsers: Access = ({ req: { user } }) => {
  // Not authenticated - deny access
  if (!user) {
    return false;
  }

  // SuperAdmin can read ALL users across ALL tenants
  if (user.role === 'superadmin') {
    return true;
  }

  // Admin and Gestor can read all users within their tenant
  if (user.role === 'admin' || user.role === 'gestor') {
    // If user has a tenant, filter by tenant
    if (user.tenant) {
      return {
        or: [
          { tenant: { equals: typeof user.tenant === 'object' ? user.tenant.id : user.tenant } },
          { id: { equals: user.id } }, // Can always see themselves
        ],
      };
    }
    return true; // Fallback for users without tenant (shouldn't happen)
  }

  // Other roles can only read themselves
  return {
    id: {
      equals: user.id,
    },
  };
};
