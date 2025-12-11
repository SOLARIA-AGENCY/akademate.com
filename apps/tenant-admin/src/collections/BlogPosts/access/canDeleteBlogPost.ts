import type { Access } from 'payload';

/**
 * Access Control: Can Delete Blog Post
 *
 * Determines who can delete blog posts (hard delete).
 *
 * Rules:
 * - Public: NO ❌
 * - Lectura: NO ❌
 * - Asesor: NO ❌
 * - Marketing: NO ❌ (use status=archived for soft delete)
 * - Gestor: YES ✅
 * - Admin: YES ✅
 *
 * Reasoning:
 * - Only Gestor and Admin should permanently delete content
 * - Marketing should use status=archived instead (soft delete)
 * - Prevents accidental data loss
 *
 * @param args - Payload access control arguments
 * @returns true if user can delete, false otherwise
 */
export const canDeleteBlogPost: Access = ({ req: { user } }) => {
  // No user = public access = denied
  if (!user) {
    return false;
  }

  // Only Gestor and Admin can delete blog posts
  if (['gestor', 'admin'].includes(user.role)) {
    return true;
  }

  // All other roles denied (including Marketing)
  return false;
};
