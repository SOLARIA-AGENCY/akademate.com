import { ROLES } from '../../../access/roles';
/**
 * Check if user is admin or superadmin
 *
 * SuperAdmin has all admin privileges plus cross-tenant access
 */
export const isAdmin = ({ req: { user } }) => {
    return user?.role === ROLES.SUPERADMIN || user?.role === ROLES.ADMIN;
};
//# sourceMappingURL=isAdmin.js.map