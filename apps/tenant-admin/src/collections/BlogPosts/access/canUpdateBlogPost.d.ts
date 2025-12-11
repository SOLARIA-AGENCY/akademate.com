import type { Access } from 'payload';
/**
 * Access Control: Can Update Blog Post
 *
 * Determines who can update blog posts (ownership-based for Marketing).
 *
 * Rules:
 * - Public: NO ❌
 * - Lectura: NO ❌
 * - Asesor: NO ❌
 * - Marketing: Own posts only (author = user.id) ✅
 * - Gestor: All posts ✅
 * - Admin: All posts ✅
 *
 * Reasoning:
 * - Marketing can only edit their own posts (ownership-based)
 * - Gestor and Admin have full edit permissions
 * - Read-only roles cannot update
 *
 * Security:
 * - Prevents privilege escalation
 * - Enforces ownership boundaries
 * - Uses query constraint for Marketing role
 *
 * @param args - Payload access control arguments
 * @returns Query constraint or boolean
 */
export declare const canUpdateBlogPost: Access;
//# sourceMappingURL=canUpdateBlogPost.d.ts.map