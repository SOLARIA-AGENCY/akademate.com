import type { FieldHook } from 'payload';

/**
 * Hook: Set Archived Timestamp (beforeChange)
 *
 * Purpose:
 * - Auto-set 'archived_at' timestamp when status changes to 'archived'
 * - Enforce immutability: archived_at cannot be changed once set
 * - Track when content was archived (terminal state)
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Logic:
 * - Set archived_at ONLY when status changes to 'archived'
 * - Once set, archived_at is IMMUTABLE (never changes)
 * - Archived is a TERMINAL state (cannot transition from archived)
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
 * @returns Archived timestamp or original value
 */
export const setArchivedTimestamp: FieldHook = ({ data, req, operation, originalDoc, value }) => {
  const currentStatus = data?.status;
  const previousStatus = originalDoc?.status;

  // If archived_at is already set, preserve it (immutability)
  if (originalDoc?.archived_at) {
    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Archived timestamp preserved (immutable)', {
      operation,
      postId: originalDoc.id,
    });

    return originalDoc.archived_at;
  }

  // If status is changing to 'archived', set timestamp
  if (currentStatus === 'archived' && previousStatus !== 'archived') {
    const timestamp = new Date().toISOString();

    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Archived timestamp set', {
      operation,
      status: currentStatus,
    });

    return timestamp;
  }

  // If status is 'archived' on create, set timestamp
  if (operation === 'create' && currentStatus === 'archived') {
    const timestamp = new Date().toISOString();

    // SECURITY (SP-004): No logging of sensitive data
    req.payload.logger.info('[BlogPost] Archived timestamp set on create', {
      operation,
      status: currentStatus,
    });

    return timestamp;
  }

  // Otherwise, return existing value or undefined
  return value;
};
