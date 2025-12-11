/**
 * Hook: Track FAQ Creator
 *
 * Auto-populates created_by field with current user ID:
 * - On create: Sets created_by = req.user.id
 * - On update: Preserves original created_by (immutable)
 *
 * SECURITY PATTERN (SP-001 Layer 3):
 * - This is the business logic layer of immutability defense
 * - Layer 1: admin.readOnly = true (UX)
 * - Layer 2: access.update = false (Security)
 * - Layer 3: This hook (Business Logic)
 *
 * SECURITY (SP-004): No logging of user email or names
 *
 * @hook beforeChange
 */

import type { FieldHook } from 'payload';

export const trackFAQCreator: FieldHook = async ({ req, operation, value, originalDoc }) => {
  // On create: set created_by to current user
  if (operation === 'create') {
    if (!req.user) {
      // SECURITY (SP-004): No logging of user details
      req.payload.logger.error('[FAQ] Cannot create FAQ without authenticated user', {
        operation: 'create',
        hasUser: false,
      });
      throw new Error('User must be authenticated to create FAQ');
    }

    // SECURITY (SP-004): Log only user ID, not email or name
    req.payload.logger.info('[FAQ] Creator tracked on create', {
      operation: 'create',
      userId: req.user.id,
    });

    return req.user.id;
  }

  // On update: preserve original created_by (immutability)
  if (operation === 'update') {
    if (originalDoc?.created_by) {
      // SECURITY (SP-001 Layer 3): Enforce immutability at business logic level
      // Even if someone bypasses UI and API security, this hook prevents changes

      // SECURITY (SP-004): Log only IDs, not user details
      req.payload.logger.info('[FAQ] Creator preserved on update (immutable)', {
        operation: 'update',
        creatorId: originalDoc.created_by,
        attemptedChange: value !== originalDoc.created_by,
      });

      return originalDoc.created_by;
    }

    // Fallback: if original doc has no creator, set current user
    // This handles edge case of legacy data migration
    if (req.user) {
      req.payload.logger.warn('[FAQ] Missing creator on update, setting current user', {
        operation: 'update',
        userId: req.user.id,
      });

      return req.user.id;
    }
  }

  // Should never reach here, but return value as fallback
  return value;
};
