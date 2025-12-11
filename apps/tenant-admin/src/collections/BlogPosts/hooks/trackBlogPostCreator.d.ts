import type { FieldHook } from 'payload';
/**
 * Hook: Track Blog Post Creator (beforeChange)
 *
 * Purpose:
 * - Auto-populate 'created_by' field with current user ID on create
 * - Enforce immutability: created_by cannot be changed after creation
 * - Audit trail for compliance and security
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
 * @returns User ID for created_by field
 */
export declare const trackBlogPostCreator: FieldHook;
//# sourceMappingURL=trackBlogPostCreator.d.ts.map