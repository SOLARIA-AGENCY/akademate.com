import type { Access } from 'payload';

/**
 * Access Control: Update Media
 *
 * Who can update media metadata (alt text, caption, folder):
 * - Public: NO (unauthenticated users cannot modify)
 * - Lectura: NO (read-only role)
 * - Asesor: NO (can only upload, not modify)
 * - Marketing: YES, but ONLY own files (created_by = user.id)
 * - Gestor: YES (all files)
 * - Admin: YES (all files)
 *
 * Ownership-Based Permissions (Marketing):
 * - Marketing users can only update media they uploaded
 * - created_by field determines ownership
 * - Prevents unauthorized modification of other users' assets
 *
 * Security:
 * - Requires authentication
 * - Ownership verification prevents privilege escalation
 */
export const canUpdateMedia: Access = ({ req: { user } }) => {
  // No authentication = no update
  if (!user) {
    return false;
  }

  // Admin and Gestor can update all media files
  if (['admin', 'gestor'].includes(user.role)) {
    return true;
  }

  // Marketing can ONLY update own files (ownership-based)
  if (user.role === 'marketing') {
    return {
      created_by: {
        equals: user.id,
      },
    };
  }

  // Lectura, Asesor, others: NO
  return false;
};
