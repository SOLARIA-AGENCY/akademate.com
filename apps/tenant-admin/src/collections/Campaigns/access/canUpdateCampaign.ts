import type { Access } from 'payload';

/**
 * Access Control: Who can UPDATE campaigns
 *
 * Ownership-based permissions: Marketing users can only update their own campaigns.
 * Gestors and Admins can update any campaign.
 *
 * Allowed Roles:
 * - Marketing: YES (own campaigns only) ✅
 *   Returns query constraint: { created_by: { equals: user.id } }
 *
 * - Gestor: YES (all campaigns) ✅
 * - Admin: YES (all campaigns) ✅
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors view campaigns but don't modify them)
 *
 * Security Considerations:
 * - Marketing role: Ownership enforced via created_by relationship
 * - Prevents privilege escalation (Marketing cannot edit others' campaigns)
 * - Immutable fields (created_by, system metrics) protected at field level
 * - Status workflow validation in hooks
 */
export const canUpdateCampaign: Access = ({ req: { user } }) => {
  // No authentication = no access
  if (!user) {
    return false;
  }

  // Admin and Gestor: unrestricted access
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing: ownership-based access (only own campaigns)
  if (user.role === 'marketing') {
    return {
      created_by: {
        equals: user.id,
      },
    };
  }

  // All other roles: no update access
  return false;
};
