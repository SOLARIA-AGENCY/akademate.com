import type { FieldHook } from 'payload';
/**
 * Hook: Generate Slug (beforeValidate)
 *
 * Purpose:
 * - Auto-generate URL-safe slug from blog post title
 * - Normalize Spanish characters (á→a, ñ→n, ü→u, etc.)
 * - Convert to lowercase with hyphens
 * - Handle duplicate slugs with numeric suffix
 *
 * Execution:
 * - Runs BEFORE validation
 * - Applied to 'slug' field
 *
 * Process:
 * 1. Generate slug from title
 * 2. Check for duplicates in database
 * 3. If duplicate exists, append numeric suffix (-1, -2, etc.)
 * 4. Return unique slug
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id (non-sensitive)
 * - NEVER logs post.title, post.content, or user data
 *
 * @param args - Field hook arguments
 * @returns Generated unique slug
 */
export declare const generateSlug: FieldHook;
//# sourceMappingURL=generateSlug.d.ts.map