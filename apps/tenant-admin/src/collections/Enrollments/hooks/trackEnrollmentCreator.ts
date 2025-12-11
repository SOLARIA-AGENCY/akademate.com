import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Hook: trackEnrollmentCreator
 *
 * Auto-populates and protects the created_by field.
 *
 * Behavior:
 * - On CREATE: Sets created_by to the current user's ID
 * - On UPDATE: Prevents modification of created_by (immutability)
 *
 * Security Implementation (SP-001: Immutable Fields with Defense in Depth):
 * - Layer 1 (UX): admin.readOnly = true in field config
 * - Layer 2 (Security): access.update = false in field config
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * Why track creator?
 * - Provides audit trail for who created each enrollment
 * - Supports accountability in enrollment management
 * - Enables future features like "enrollments I created"
 */
export const trackEnrollmentCreator: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) {
    return data;
  }

  // On CREATE: Auto-populate created_by with current user
  if (operation === 'create') {
    if (req.user) {
      data.created_by = req.user.id;
    }
  }

  // On UPDATE: Prevent modification of created_by (restore original value)
  if (operation === 'update' && originalDoc) {
    if (data.created_by && data.created_by !== originalDoc.created_by) {
      // Attempting to change created_by - restore original value
      data.created_by = originalDoc.created_by;
    }
  }

  return data;
};
