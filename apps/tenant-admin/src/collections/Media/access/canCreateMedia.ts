import type { Access } from 'payload';

/**
 * Access Control: Create Media
 *
 * Who can upload media files:
 * - Public: NO (unauthenticated users cannot upload)
 * - Lectura: NO (read-only role)
 * - Asesor: YES (can upload for lead follow-up)
 * - Marketing: YES (can upload for campaigns/ads)
 * - Gestor: YES (full content management)
 * - Admin: YES (full system access)
 *
 * Security:
 * - Requires authentication
 * - No public uploads (prevents spam/abuse)
 */
export const canCreateMedia: Access = ({ req: { user } }) => {
  // No authentication = no upload
  if (!user) {
    return false;
  }

  // Asesor, Marketing, Gestor, Admin can upload
  if (['asesor', 'marketing', 'gestor', 'admin'].includes(user.role)) {
    return true;
  }

  // Lectura and others: NO
  return false;
};
