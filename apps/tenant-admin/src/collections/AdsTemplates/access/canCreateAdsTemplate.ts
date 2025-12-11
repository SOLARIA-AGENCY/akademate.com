import type { Access } from 'payload';

/**
 * Access Control: Who can CREATE ad templates
 *
 * Allowed Roles:
 * - Marketing: YES ✅ (primary users who create templates)
 * - Gestor: YES ✅ (can create templates)
 * - Admin: YES ✅ (full access)
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users - marketing assets are confidential)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors view templates but don't create them)
 *
 * Security Considerations:
 * - Marketing templates are confidential business assets
 * - Only authenticated marketing staff can create
 * - Public cannot access to protect marketing strategies
 */
export const canCreateAdsTemplate: Access = ({ req: { user } }) => {
  // No authentication = no access
  if (!user) {
    return false;
  }

  // Marketing, Gestor, and Admin: can create templates
  if (['admin', 'gestor', 'marketing'].includes(user.role)) {
    return true;
  }

  // All other roles: no create access
  return false;
};
