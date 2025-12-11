/**
 * Hook: Set Publication Timestamp
 *
 * Auto-sets published_at timestamp when status changes to 'published':
 * - On first publication: Sets published_at = current timestamp
 * - On subsequent updates: Preserves original published_at (immutable)
 * - If status changes from published: Keeps published_at (history)
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

export const setPublicationTimestamp: FieldHook = async ({
  req,
  operation,
  data,
  originalDoc,
}) => {
  // If published_at already exists, preserve it (immutable)
  if (originalDoc?.published_at) {
    // SECURITY (SP-001 Layer 3): Enforce immutability at business logic level
    req.payload.logger.info('[FAQ] Publication timestamp preserved (immutable)', {
      operation,
      hasOriginalTimestamp: true,
    });

    return originalDoc.published_at;
  }

  // If status is being set to 'published' for the first time, set published_at
  if (data?.status === 'published') {
    const now = new Date().toISOString();

    // SECURITY (SP-004): Log action but not timestamp value
    req.payload.logger.info('[FAQ] Publication timestamp set', {
      operation,
      status: 'published',
      timestampSet: true,
    });

    return now;
  }

  // Otherwise, return undefined (not yet published)
  return undefined;
};
