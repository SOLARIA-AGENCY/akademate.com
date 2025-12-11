/**
 * Hook: Set Archived Timestamp
 *
 * Auto-sets archived_at timestamp when status changes to 'archived':
 * - On first archive: Sets archived_at = current timestamp
 * - On subsequent updates: Preserves original archived_at (immutable)
 * - Archived is a terminal status (cannot change from archived)
 *
 * SECURITY PATTERN (SP-001 Layer 3):
 * - This is the business logic layer of immutability defense
 * - Layer 1: admin.readOnly = true (UX)
 * - Layer 2: access.update = false (Security)
 * - Layer 3: This hook (Business Logic)
 *
 * SECURITY (SP-004): No logging of FAQ content or timestamps
 *
 * @hook beforeChange
 */

import type { FieldHook } from 'payload';

export const setArchivedTimestamp: FieldHook = async ({
  req,
  operation,
  data,
  originalDoc,
}) => {
  // If archived_at already exists, preserve it (immutable)
  if (originalDoc?.archived_at) {
    // SECURITY (SP-001 Layer 3): Enforce immutability at business logic level
    req.payload.logger.info('[FAQ] Archived timestamp preserved (immutable)', {
      operation,
      hasOriginalTimestamp: true,
    });

    return originalDoc.archived_at;
  }

  // If status is being set to 'archived' for the first time, set archived_at
  if (data?.status === 'archived') {
    const now = new Date().toISOString();

    // SECURITY (SP-004): Log action but not timestamp value
    req.payload.logger.info('[FAQ] Archived timestamp set', {
      operation,
      status: 'archived',
      timestampSet: true,
    });

    return now;
  }

  // Otherwise, return undefined (not yet archived)
  return undefined;
};
