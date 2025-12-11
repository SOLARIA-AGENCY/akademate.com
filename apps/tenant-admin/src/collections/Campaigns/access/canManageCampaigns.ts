import { Access } from 'payload';
import { ROLES } from '../../../access/roles';

/**
 * Access control for managing Campaigns
 *
 * Allowed roles:
 * - Admin: Full access
 * - Gestor: Full access
 * - Marketing: Full access (primary role for campaigns)
 *
 * All other roles: Read-only access
 */
export const canManageCampaigns: Access = ({ req: { user } }) => {
  // Not authenticated
  if (!user) return false;

  // Admin, Gestor, and Marketing can manage campaigns
  return (
    user.role === ROLES.ADMIN || user.role === ROLES.GESTOR || user.role === ROLES.MARKETING
  );
};
