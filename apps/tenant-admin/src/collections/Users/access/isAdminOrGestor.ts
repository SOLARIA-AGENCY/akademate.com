import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Check if user is superadmin, admin, or gestor
 *
 * SuperAdmin has all privileges plus cross-tenant access
 */
export const isAdminOrGestor: Access = ({ req: { user } }) => {
  return user?.role === ROLES.SUPERADMIN || user?.role === ROLES.ADMIN || user?.role === ROLES.GESTOR;
};
