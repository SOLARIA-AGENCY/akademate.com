import type { FieldHook } from 'payload';

/**
 * Hook: Set Publication Timestamp (beforeChange)
 *
 * Purpose:
 * - Auto-set 'published_at' timestamp when status changes to 'published'
 * - Enforce immutability: published_at cannot be changed once set
 * - Track first publication time (not subsequent updates)
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Logic:
 * - Set published_at ONLY when status changes to 'published' for the first time
 * - Once set, published_at is IMMUTABLE (never changes)
 * - If post is unpublished and re-published, keep original timestamp
 *
 * Security Considerations:
 * - Layer 1 (UX): admin.readOnly = true (prevents UI edits)
 * - Layer 2 (Security): access.update = false (blocks API updates)
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id and timestamps (non-sensitive)
 * - NEVER logs post.title, post.content, or user data
 *
 * @param args - Field hook arguments
 * @returns Publication timestamp or original value
 */
export const setPublicationTimestamp: FieldHook = ({ data, req, operation, originalDoc, value }) => {
  const currentStatus = data?.status;
  const previousStatus = originalDoc?.status;

  // If published_at is already set, preserve it (immutability)
  if (originalDoc?.published_at) {
    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Publication timestamp preserved (immutable)', {
      operation,
      postId: originalDoc.id,
    });

    return originalDoc.published_at;
  }

  // If status is changing to 'published', set timestamp
  if (currentStatus === 'published' && previousStatus !== 'published') {
    const timestamp = new Date().toISOString();

    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Publication timestamp set', {
      operation,
      status: currentStatus,
    });

    return timestamp;
  }

  // If status is 'published' on create, set timestamp
  if (operation === 'create' && currentStatus === 'published') {
    const timestamp = new Date().toISOString();

    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Publication timestamp set on create', {
      operation,
      status: currentStatus,
    });

    return timestamp;
  }

  // Otherwise, return existing value or undefined
  return value;
};
