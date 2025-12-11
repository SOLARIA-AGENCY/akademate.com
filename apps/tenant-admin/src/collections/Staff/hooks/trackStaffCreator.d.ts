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
export declare const trackStaffCreator: CollectionBeforeChangeHook;
//# sourceMappingURL=trackStaffCreator.d.ts.map