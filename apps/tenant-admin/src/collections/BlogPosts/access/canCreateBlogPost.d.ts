import type { Access } from 'payload';
/**
 * Access Control: Can Create Blog Post
 *
 * Determines who can create new blog posts.
 *
 * Rules:
 * - Public: NO ❌
 * - Lectura: NO ❌
 * - Asesor: NO ❌
 * - Marketing: YES ✅
 * - Gestor: YES ✅
 * - Admin: YES ✅
 *
 * Reasoning:
 * - Marketing role is the primary content creator
 * - Gestor and Admin have full permissions
 * - Read-only roles cannot create content
 *
 * @param args - Payload access control arguments
 * @returns true if user can create, false otherwise
 */
export declare const canCreateBlogPost: Access;
//# sourceMappingURL=canCreateBlogPost.d.ts.map