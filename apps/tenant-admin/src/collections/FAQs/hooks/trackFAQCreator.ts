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

/**
 * Payload Logger interface for typed logging calls
 */
interface PayloadLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Authenticated user interface with ID
 */
interface AuthenticatedUser {
  id: string | number;
}

/**
 * Original FAQ document interface for update operations
 */
interface OriginalFAQDoc {
  created_by?: string | number;
}

export const trackFAQCreator: FieldHook = ({ req, operation, value, originalDoc }) => {
  const logger = req.payload.logger as PayloadLogger;
  const user = req.user as AuthenticatedUser | undefined;
  const original = originalDoc as OriginalFAQDoc | undefined;
  const currentValue = value as string | number | undefined;
  // On create: set created_by to current user
  if (operation === 'create') {
    if (!user) {
      // SECURITY (SP-004): No logging of user details
      logger.error('[FAQ] Cannot create FAQ without authenticated user', {
        operation: 'create',
        hasUser: false,
      });
      throw new Error('User must be authenticated to create FAQ');
    }

    // SECURITY (SP-004): Log only user ID, not email or name
    logger.info('[FAQ] Creator tracked on create', {
      operation: 'create',
      userId: user.id,
    });

    return user.id;
  }

  // On update: preserve original created_by (immutability)
  if (operation === 'update') {
    if (original?.created_by) {
      // SECURITY (SP-001 Layer 3): Enforce immutability at business logic level
      // Even if someone bypasses UI and API security, this hook prevents changes

      // SECURITY (SP-004): Log only IDs, not user details
      logger.info('[FAQ] Creator preserved on update (immutable)', {
        operation: 'update',
        creatorId: original.created_by,
        attemptedChange: currentValue !== original.created_by,
      });

      return original.created_by;
    }

    // Fallback: if original doc has no creator, set current user
    // This handles edge case of legacy data migration
    if (user) {
      logger.warn('[FAQ] Missing creator on update, setting current user', {
        operation: 'update',
        userId: user.id,
      });

      return user.id;
    }
  }

  // Should never reach here, but return value as fallback
  return currentValue;
};
