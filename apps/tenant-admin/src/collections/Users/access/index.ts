/**
 * Users Collection Access Control
 *
 * Exports all access control functions for the Users collection.
 *
 * Access Control Hierarchy:
 * - isAdmin: Admin-only access
 * - isAdminOrGestor: Admin or Gestor access
 * - isSelfOrAdmin: User can access own data or admin can access all
 * - canReadUsers: Read access control (admin/gestor all, others self)
 * - canCreateUsers: Create access control (admin all, gestor non-admins)
 * - canUpdateUsers: Update access control (admin/gestor all, others self)
 * - canDeleteUsers: Delete access control (admin only, not self)
 */

export { isAdmin } from './isAdmin';
export { isAdminOrGestor } from './isAdminOrGestor';
export { isSelfOrAdmin } from './isSelfOrAdmin';
export { canReadUsers } from './canReadUsers';
export { canCreateUsers } from './canCreateUsers';
export { canUpdateUsers } from './canUpdateUsers';
export { canDeleteUsers } from './canDeleteUsers';
