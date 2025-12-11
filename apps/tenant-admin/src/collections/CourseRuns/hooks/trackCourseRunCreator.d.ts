import type { CollectionBeforeChangeHook } from 'payload';
/**
 * Hook: trackCourseRunCreator
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
 * - Enables ownership-based access control (Marketing can only update own runs)
 * - Provides audit trail for who created each course run
 * - Supports accountability in multi-user environments
 */
export declare const trackCourseRunCreator: CollectionBeforeChangeHook;
//# sourceMappingURL=trackCourseRunCreator.d.ts.map