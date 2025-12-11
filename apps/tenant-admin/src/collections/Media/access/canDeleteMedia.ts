import type { Access } from 'payload';

/**
 * Access Control: Delete Media
 *
 * Who can delete media files:
 * - Public: NO
 * - Lectura: NO
 * - Asesor: NO
 * - Marketing: NO (prevents accidental deletion of shared assets)
 * - Gestor: NO (prevents accidental deletion)
 * - Admin: YES (only role with delete permission)
 *
 * Business Logic:
 * - Media files may be referenced by multiple entities (courses, blog posts, ads)
 * - Deleting a file could break links across the website
 * - Only Admin can delete to prevent accidental data loss
 * - Gestor intentionally excluded to prevent mistakes
 *
 * Alternative Approaches:
 * - Consider "soft delete" with active/inactive status
 * - Consider "orphaned media" cleanup job
 * - Consider reference counting before deletion
 */
export const canDeleteMedia: Access = ({ req: { user } }) => {
  // Only Admin can delete media files
  return user?.role === 'admin';
};
