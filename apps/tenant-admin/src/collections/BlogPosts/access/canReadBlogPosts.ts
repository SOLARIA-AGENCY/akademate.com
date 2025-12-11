import type { Access } from 'payload';

/**
 * Access Control: Can Read Blog Posts
 *
 * Determines who can read blog posts and what they can see.
 *
 * Rules:
 * - Public: Published posts only ✅
 * - Lectura: All posts ✅
 * - Asesor: All posts ✅
 * - Marketing: All posts ✅
 * - Gestor: All posts ✅
 * - Admin: All posts ✅
 *
 * Reasoning:
 * - Public should only see published content (status = published)
 * - All authenticated users can see all posts (for internal review/reference)
 *
 * @param args - Payload access control arguments
 * @returns Query constraint or boolean
 */
export const canReadBlogPosts: Access = ({ req: { user } }) => {
  // Public (unauthenticated) can only read published posts
  if (!user) {
    return {
      status: { equals: 'published' },
    };
  }

  // All authenticated users can read all posts
  return true;
};
