import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Hook: trackStaffCreator
 *
 * Automatically populates the `created_by` field with the current user ID on create operations.
 * Ensures field immutability by preserving the original value on update operations.
 *
 * Security Pattern (SP-001):
 * - Layer 1 (UX): admin.readOnly = true (UI level)
 * - Layer 2 (Security): access.update = false (API level)
 * - Layer 3 (Business Logic): This hook (enforcement)
 *
 * Use Cases:
 * - Audit trail: Who created this staff member?
 * - Accountability: Track staff additions
 * - Security: Prevent ownership manipulation
 */
export const trackStaffCreator: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  const { user } = req;

  // Only process authenticated requests
  if (!user) {
    return data;
  }

  if (operation === 'create') {
    // On create: Set created_by to current user
    return {
      ...data,
      created_by: user.id,
    };
  }

  if (operation === 'update') {
    // On update: Preserve original created_by value (immutability)
    if (originalDoc?.created_by) {
      return {
        ...data,
        created_by: originalDoc.created_by,
      };
    }
  }

  return data;
};
