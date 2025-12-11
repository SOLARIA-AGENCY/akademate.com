import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Check if user is viewing/editing their own profile or is superadmin/admin
 *
 * SuperAdmin has all admin privileges plus cross-tenant access
 */
export const isSelfOrAdmin: Access = ({ req: { user }, id }) => {
  // SuperAdmin can access all users across all tenants
  if (user?.role === ROLES.SUPERADMIN) return true;

  // Admin can access all users within their tenant
  if (user?.role === ROLES.ADMIN) return true;

  // Users can access their own profile
  return user?.id === id;
};
