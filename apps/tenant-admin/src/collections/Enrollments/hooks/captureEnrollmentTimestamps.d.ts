import type { CollectionBeforeChangeHook } from 'payload';
/**
 * Hook: captureEnrollmentTimestamps
 *
 * Auto-populates and protects enrollment lifecycle timestamps.
 *
 * Timestamps managed:
 * - enrolled_at: When enrollment was created (immutable)
 * - confirmed_at: When status changed to 'confirmed' (immutable once set)
 * - completed_at: When status changed to 'completed' (immutable once set)
 * - cancelled_at: When status changed to 'cancelled' or 'withdrawn' (immutable once set)
 *
 * Security Implementation (SP-001: Immutable Fields with Defense in Depth):
 * - Layer 1 (UX): admin.readOnly = true in field config
 * - Layer 2 (Security): access.update = false in field config
 * - Layer 3 (Business Logic): This hook enforces immutability
 *
 * Why immutable timestamps?
 * - Provides accurate audit trail of enrollment lifecycle
 * - Prevents tampering with historical records
 * - Supports compliance and reporting requirements
 */
export declare const captureEnrollmentTimestamps: CollectionBeforeChangeHook;
//# sourceMappingURL=captureEnrollmentTimestamps.d.ts.map