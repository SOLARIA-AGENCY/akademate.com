import type { FieldHook } from 'payload';

/**
 * Hook: Track Media Creator (beforeChange)
 *
 * Purpose:
 * - Auto-populate created_by field with uploader's user ID
 * - Enforce immutability: created_by cannot be modified after upload
 * - Track ownership for access control
 *
 * Security Pattern: SP-001 (Immutable Fields - Layer 3: Business Logic)
 *
 * Execution:
 * - Runs AFTER validation
 * - Runs BEFORE database write
 *
 * Business Rules:
 * - created_by is set ONLY on upload (operation = 'create')
 * - Once set, created_by cannot be changed (even by Admin)
 * - Prevents ownership hijacking attacks
 *
 * No PII Logging (SP-004):
 * - Logs only user.id and operation (non-sensitive)
 * - NEVER logs filename or file content
 */
export const trackMediaCreator: FieldHook = ({ req, operation, originalDoc }) => {
  // CREATE: Auto-populate created_by with authenticated user
  if (operation === 'create') {
    if (!req.user) {
      throw new Error('Authentication required to upload media files');
    }

    console.log('[Media Creator] Tracking uploader', {
      userId: req.user.id,
      operation: 'create',
    });

    return req.user.id;
  }

  // UPDATE: Preserve original created_by (immutability)
  if (operation === 'update') {
    if (!originalDoc?.created_by) {
      throw new Error('Cannot update media: created_by field is missing from original document');
    }

    console.log('[Media Creator] Preserving original uploader', {
      userId: originalDoc.created_by,
      operation: 'update',
    });

    // SECURITY: Always return original created_by
    // Prevents ownership hijacking via API manipulation
    return originalDoc.created_by;
  }

  // Unsupported operation
  throw new Error(`Unsupported operation for trackMediaCreator hook: ${operation}`);
};
