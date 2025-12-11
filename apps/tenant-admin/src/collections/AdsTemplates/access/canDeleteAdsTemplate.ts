import type { Access } from 'payload';

/**
 * Access Control: Who can DELETE ad templates
 *
 * Hard delete is restricted to Gestor and Admin only.
 * Marketing users should use soft delete (active=false) instead.
 *
 * Allowed Roles:
 * - Gestor: YES ✅ (can hard delete templates)
 * - Admin: YES ✅ (can hard delete templates)
 *
 * Denied Roles:
 * - Public: NO ❌ (unauthenticated users)
 * - Lectura: NO ❌ (read-only role)
 * - Asesor: NO ❌ (advisors cannot delete)
 * - Marketing: NO ❌ (should use soft delete instead)
 *
 * Security Considerations:
 * - Hard delete is permanent and should be restricted
 * - Marketing users can use active=false for soft delete
 * - Only managers (Gestor) and admins can permanently remove templates
 * - Prevents accidental data loss
 */
export const canDeleteAdsTemplate: Access = ({ req: { user } }) => {
  // No authentication = no access
  if (!user) {
    return false;
  }

  // Only Gestor and Admin can hard delete
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // All other roles (including Marketing): no delete access
  // Marketing should use soft delete (active=false)
  return false;
};
