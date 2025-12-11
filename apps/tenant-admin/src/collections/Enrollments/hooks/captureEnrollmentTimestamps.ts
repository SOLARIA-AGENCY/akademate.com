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
export const captureEnrollmentTimestamps: CollectionBeforeChangeHook = async ({
  data,
  req,
  operation,
  originalDoc,
}) => {
  if (!data) {
    return data;
  }

  const now = new Date().toISOString();

  // On CREATE: Auto-populate enrolled_at
  if (operation === 'create') {
    data.enrolled_at = now;

    // If status is already 'confirmed', set confirmed_at
    if (data.status === 'confirmed') {
      data.confirmed_at = now;
    }

    // If status is already 'completed', set completed_at
    if (data.status === 'completed') {
      data.completed_at = now;
    }

    // If status is 'cancelled' or 'withdrawn', set cancelled_at
    if (data.status === 'cancelled' || data.status === 'withdrawn') {
      data.cancelled_at = now;
    }
  }

  // On UPDATE: Capture status change timestamps
  if (operation === 'update' && originalDoc) {
    // Protect enrolled_at (immutable)
    if (data.enrolled_at && data.enrolled_at !== originalDoc.enrolled_at) {
      data.enrolled_at = originalDoc.enrolled_at;
    }

    // Capture confirmed_at when status changes to 'confirmed'
    if (data.status === 'confirmed' && originalDoc.status !== 'confirmed' && !originalDoc.confirmed_at) {
      data.confirmed_at = now;
    } else if (originalDoc.confirmed_at) {
      // Protect confirmed_at once set (immutable)
      data.confirmed_at = originalDoc.confirmed_at;
    }

    // Capture completed_at when status changes to 'completed'
    if (data.status === 'completed' && originalDoc.status !== 'completed' && !originalDoc.completed_at) {
      data.completed_at = now;
    } else if (originalDoc.completed_at) {
      // Protect completed_at once set (immutable)
      data.completed_at = originalDoc.completed_at;
    }

    // Capture cancelled_at when status changes to 'cancelled' or 'withdrawn'
    if (
      (data.status === 'cancelled' || data.status === 'withdrawn') &&
      originalDoc.status !== 'cancelled' &&
      originalDoc.status !== 'withdrawn' &&
      !originalDoc.cancelled_at
    ) {
      data.cancelled_at = now;
    } else if (originalDoc.cancelled_at) {
      // Protect cancelled_at once set (immutable)
      data.cancelled_at = originalDoc.cancelled_at;
    }

    // Prevent status downgrade from 'completed'
    if (originalDoc.status === 'completed' && data.status !== 'completed') {
      throw new Error('Cannot change status from completed to another status');
    }
  }

  return data;
};
