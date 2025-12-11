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
export declare const trackEnrollmentCreator: CollectionBeforeChangeHook;
//# sourceMappingURL=trackEnrollmentCreator.d.ts.map