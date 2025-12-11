import type { Access } from 'payload';

/**
 * Access Control: Who can READ ad templates
 *
 * Allowed Roles:
 * - Lectura: YES ✅ (can view templates for reference)
 * - Asesor: YES ✅ (can view templates for client interactions)
 * - Marketing: YES ✅ (read all templates)
 * - Gestor: YES ✅ (read all templates)
 * - Admin: YES ✅ (read all templates)
 *
 * Denied Roles:
 * - Public: NO ❌ (marketing assets are confidential)
 *
 * Security Considerations:
 * - Marketing templates contain confidential copy and creative strategies
 * - Public access denied to protect business intelligence
 * - All authenticated users can view (but only some can edit)
 */
export const canReadAdsTemplates: Access = ({ req: { user } }) => {
  // No authentication = no access (confidential marketing assets)
  if (!user) {
    return false;
  }

  // All authenticated users can read templates
  // Lectura, Asesor, Marketing, Gestor, Admin
  return true;
};
