import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Check if user is admin or superadmin
 *
 * SuperAdmin has all admin privileges plus cross-tenant access
 */
export const isAdmin: Access = ({ req: { user } }) => {
  return user?.role === ROLES.SUPERADMIN || user?.role === ROLES.ADMIN;
};
