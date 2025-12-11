import type { FieldHook } from 'payload';

/**
 * Hook: trackStudentCreator
 *
 * Auto-populates and protects the created_by field:
 * - On creation: Sets created_by to current user ID
 * - On update: Prevents modification of created_by (immutable)
 *
 * WHEN: beforeChange (runs after validation, before database write)
 * OPERATION: create and update
 *
 * SECURITY PATTERN (SP-001: Immutable Fields):
 * This field has 3-layer defense:
 * - Layer 1 (UX): admin.readOnly = true (UI protection)
 * - Layer 2 (Security): access.update = false (API protection)
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * WHY IMMUTABLE:
 * - Audit trail integrity: Must know who created each student
 * - Prevents privilege escalation: Users can't change ownership
 * - GDPR compliance: Processing records must be accurate
 * - Data integrity: Creator is set once, never changes
 *
 * SECURITY CONSIDERATIONS:
 * - Automatically set on creation (user can't manipulate)
 * - Immutable after creation (even Admin can't change)
 * - Protects audit trail from tampering
 * - NO logging of PII (SP-004)
 *
 * ERROR HANDLING:
 * - Silently preserves original created_by on update attempts
 * - No error thrown (field-level access control handles rejection)
 * - Logs tampering attempts for security monitoring
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data with created_by set/protected
 */
export const trackStudentCreator: FieldHook = async ({ data, req, operation, originalDoc }) => {
  try {
    // CREATION: Auto-populate created_by
    if (operation === 'create') {
      if (!data.created_by && req?.user?.id) {
        data.created_by = req.user.id;

        // SECURITY: NO logging of user details (could be PII)
        // Only log successful creator tracking
        if (req.payload?.logger) {
          req.payload.logger.info('[Student] Creator tracked', {
            operation,
            userId: req.user.id,
          });
        }
      }
    }

    // UPDATE: Protect created_by from modification (immutability)
    if (operation === 'update') {
      // If created_by is present in update data, it's a tampering attempt
      if (data.created_by && originalDoc?.created_by) {
        // Detect tampering attempt
        if (data.created_by !== originalDoc.created_by) {
          // SECURITY: Log tampering attempt
          if (req?.payload?.logger) {
            req.payload.logger.warn('[Student] Attempted to modify created_by (blocked)', {
              operation,
              userId: req?.user?.id,
              originalCreator: originalDoc.created_by,
              attemptedCreator: data.created_by,
            });
          }
        }

        // Restore original value (immutability enforcement)
        data.created_by = originalDoc.created_by;
      }
    }
  } catch (error) {
    // Log error without exposing PII
    if (req?.payload?.logger) {
      req.payload.logger.error('[Student] Error in creator tracking', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation,
      });
    }

    // For creation, re-throw error (created_by is critical)
    if (operation === 'create') {
      throw new Error('Failed to track student creator');
    }

    // For updates, continue (field-level access control will handle it)
  }

  return data;
};
