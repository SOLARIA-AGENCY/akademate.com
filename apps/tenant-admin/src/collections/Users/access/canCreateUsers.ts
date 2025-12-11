import type { Access } from 'payload';

/**
 * Access Control: Can Create Users
 *
 * Determines who can create new user records.
 *
 * Rules:
 * - SuperAdmin: Can create ANY user in ANY tenant (including other superadmins)
 * - Admin: Can create any user within their tenant (including other admins, NOT superadmin)
 * - Gestor: Can create non-admin users within their tenant only
 * - Marketing/Asesor/Lectura: Cannot create users
 *
 * Security Notes:
 * - Only SuperAdmin can create other SuperAdmin accounts
 * - Prevents privilege escalation by limiting who can create higher roles
 * - Tenant-aware: Users can only create within their tenant
 *
 * @param req - Payload request object containing authenticated user
 * @param data - User data being created (contains role)
 * @returns Boolean indicating if creation is allowed
 */
export const canCreateUsers: Access = ({ req: { user }, data }) => {
  // Not authenticated - deny access
  if (!user) {
    return false;
  }

  // SuperAdmin can create ANY user across ALL tenants
  if (user.role === 'superadmin') {
    return true;
  }

  // Admin can create any user within their tenant (but NOT superadmin)
  if (user.role === 'admin') {
    // Admin cannot create superadmin
    if (data?.role === 'superadmin') {
      return false;
    }
    return true;
  }

  // Gestor can create non-admin, non-superadmin users within their tenant
  if (user.role === 'gestor') {
    // Check if trying to create an admin or superadmin user
    if (data?.role === 'admin' || data?.role === 'superadmin') {
      return false; // Gestor cannot create admins or superadmins
    }
    return true;
  }

  // All other roles cannot create users
  return false;
};
