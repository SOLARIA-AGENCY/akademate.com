import type { CollectionBeforeChangeHook } from 'payload';

/**
 * Hook: preventAuditLogUpdates
 *
 * Enforces immutability of audit logs by blocking ALL update operations.
 *
 * WHEN: beforeChange (runs after validation, before database write)
 * OPERATION: update only (throws error to prevent updates)
 *
 * SECURITY PATTERN (SP-001: Immutable Audit Trail):
 * This is the THIRD layer of defense preventing audit log updates:
 * - Layer 1 (UX): admin.readOnly = true on all fields
 * - Layer 2 (API Security): access.update = () => false (collection + field level)
 * - Layer 3 (Business Logic): THIS HOOK - throws error if update attempted
 *
 * GDPR COMPLIANCE (Article 30):
 * - Records of processing activities must be reliable and tamper-proof
 * - Audit logs are legal evidence and must maintain integrity
 * - No one, not even Admin, can modify audit logs after creation
 *
 * RATIONALE:
 * - Access control can be bypassed by admin operations
 * - Hooks provide additional enforcement layer
 * - Throwing error ensures update never reaches database
 * - Clear error message explains why update is blocked
 *
 * IF CORRECTION IS NEEDED:
 * - Do NOT update the incorrect entry
 * - CREATE a new corrective entry
 * - Reference original entry ID in metadata
 * - Explain correction in error_message field
 *
 * @param args - Hook arguments from Payload
 * @throws Error if operation is 'update'
 */
export const preventAuditLogUpdates: CollectionBeforeChangeHook = async ({
  operation,
  req,
}) => {
  // If operation is 'update', block it
  if (operation === 'update') {
    // Log the blocked attempt (security monitoring)
    if (req?.payload?.logger) {
      req.payload.logger.warn('[AuditLog] BLOCKED: Attempt to update audit log');
    }

    // Throw error to prevent update
    throw new Error(
      'Audit logs are immutable and cannot be updated. This is a GDPR Article 30 compliance requirement. ' +
        'If you need to correct an entry, create a new audit log entry with the correction and reference ' +
        'the original entry ID in the metadata field.'
    );
  }

  // Allow 'create' operations to proceed
  // 'delete' operations are handled by access control (Admin only)
  return;
};
