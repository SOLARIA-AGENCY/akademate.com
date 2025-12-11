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
export declare const trackStudentCreator: FieldHook;
//# sourceMappingURL=trackStudentCreator.d.ts.map