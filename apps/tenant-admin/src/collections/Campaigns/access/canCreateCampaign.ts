import type { Access } from 'payload';

/**
 * Access Control: Who can CREATE campaigns
 *
 * Campaigns are created by Marketing team members, Gestors, and Admins.
 * Campaigns are business intelligence data used for tracking ROI.
 *
 * Allowed Roles:
 * - Marketing: YES ✅ (primary users - create marketing campaigns)
 * - Gestor: YES ✅ (supervisors - create campaigns for teams)
 * - Admin: YES ✅ (system admins - full access)
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users cannot create campaigns)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors view campaign results but don't create campaigns)
 */
export const canCreateCampaign: Access = ({ req: { user } }) => {
  // No authentication = no access
  if (!user) {
    return false;
  }

  // Marketing, Gestor, Admin can create campaigns
  const allowedRoles = ['marketing', 'gestor', 'admin'];

  return allowedRoles.includes(user.role);
};
