import type { FieldHook } from 'payload';

/**
 * Hook: Track Template Creator (beforeChange)
 *
 * Purpose:
 * - Auto-populate created_by field with current user ID on create
 * - Enforce immutability: created_by cannot be changed after creation
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
 * No PII Logging:
 * - Logs only template.id and user.id (non-sensitive)
 * - NEVER logs template content or URLs (confidential marketing assets)
 */
export const trackTemplateCreator: FieldHook = ({ req, operation, value, originalDoc }) => {
  // Only apply on CREATE operation
  if (operation === 'create') {
    // Auto-populate created_by with current user
    if (!req.user) {
      throw new Error('Authentication required to create templates');
    }
    return req.user.id;
  }

  // On UPDATE: preserve original created_by (immutability enforcement)
  if (operation === 'update') {
    // SECURITY FIX: Always preserve original, NEVER accept user input
    if (!originalDoc?.created_by) {
      // This should never happen in normal operation
      // If it does, it indicates data corruption - reject the update
      throw new Error(
        'Cannot update template: created_by field is missing or corrupted. Contact system administrator.'
      );
    }
    // Always return original value, ignore any user-supplied changes
    return originalDoc.created_by;
  }

  // SECURITY FIX: Explicitly handle unexpected operations instead of fallback
  throw new Error(`Unsupported operation: ${operation}`);
};
