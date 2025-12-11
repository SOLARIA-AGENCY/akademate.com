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
export const trackBlogPostAuthor: FieldHook = ({ req, operation, value, originalDoc }) => {
  // Only apply on CREATE operation
  if (operation === 'create') {
    // Auto-populate author with current user
    if (!req.user) {
      throw new Error('Authentication required to create blog posts');
    }

    // SECURITY (SP-004): No logging of user email or post data
    req.payload.logger.info('[BlogPost] Author auto-populated', {
      userId: req.user.id,
      operation,
    });

    return req.user.id;
  }

  // On UPDATE: preserve original author (immutability enforcement)
  if (operation === 'update') {
    // SECURITY FIX: Always preserve original, NEVER accept user input
    if (!originalDoc?.author) {
      // This should never happen in normal operation
      // If it does, it indicates data corruption - reject the update
      throw new Error(
        'Cannot update blog post: author field is missing or corrupted. Contact system administrator.'
      );
    }

    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Author preserved (immutable)', {
      operation,
      authorId: originalDoc.author,
    });

    // Always return original value, ignore any user-supplied changes
    return originalDoc.author;
  }

  // SECURITY FIX: Explicitly handle unexpected operations instead of fallback
  throw new Error(`Unsupported operation: ${operation}`);
};
