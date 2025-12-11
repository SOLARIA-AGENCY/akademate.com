import type { FieldHook } from 'payload';
/**
 * Hook: Track Blog Post Author (beforeChange)
 *
 * Purpose:
 * - Auto-populate 'author' field with current user ID on create
 * - Enforce immutability: author cannot be changed after creation
 * - Prevent privilege escalation attacks
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Security Considerations:
 * - Layer 1 (UX): admin.readOnly = true (prevents UI edits)
 * - Layer 2 (Security): access.update = false (blocks API updates)
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id and user.id (non-sensitive)
 * - NEVER logs user.email, post.title, or post.content
 *
 * @param args - Field hook arguments
 * @returns User ID for author field
 */
export declare const trackBlogPostAuthor: FieldHook;
//# sourceMappingURL=trackBlogPostAuthor.d.ts.map