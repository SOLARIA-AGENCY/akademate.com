import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Access control for managing Leads
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 * - Asesor: Can view and add notes to leads, but not delete
 *
 * Marketing and Lectura: No direct access to leads (GDPR)
 */
export const canManageLeads: Access = ({ req: { user } }) => {
  // Not authenticated
  if (!user) return false;

  // Admin, Gestor, and Asesor can access leads
  return user.role === ROLES.ADMIN || user.role === ROLES.GESTOR || user.role === ROLES.ASESOR;
};

/**
 * Access control for deleting Leads
 *
 * Only Admin and Gestor can delete leads (GDPR compliance)
 */
export const canDeleteLeads: Access = ({ req: { user } }) => {
  // Not authenticated
  if (!user) return false;

  // Only Admin and Gestor can delete
  return user.role === ROLES.ADMIN || user.role === ROLES.GESTOR;
};
