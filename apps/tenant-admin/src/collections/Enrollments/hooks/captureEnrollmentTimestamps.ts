import type { CollectionBeforeChangeHook } from 'payload';
import type { EnrollmentStatus } from '../Enrollments.validation';

/**
 * Enrollment document interface for hook typing
 */
interface EnrollmentDocument {
  id: string | number;
  status?: EnrollmentStatus;
  enrolled_at?: string;
  confirmed_at?: string;
  completed_at?: string;
  cancelled_at?: string;
}

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
export const captureEnrollmentTimestamps: CollectionBeforeChangeHook = ({
  data,
  req: _req,
  operation,
  originalDoc,
}) => {
  const original = originalDoc as EnrollmentDocument | undefined;
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
  if (operation === 'update' && original) {
    // Protect enrolled_at (immutable)
    if (data.enrolled_at && data.enrolled_at !== original.enrolled_at) {
      data.enrolled_at = original.enrolled_at;
    }

    // Capture confirmed_at when status changes to 'confirmed'
    if (data.status === 'confirmed' && original.status !== 'confirmed' && !original.confirmed_at) {
      data.confirmed_at = now;
    } else if (original.confirmed_at) {
      // Protect confirmed_at once set (immutable)
      data.confirmed_at = original.confirmed_at;
    }

    // Capture completed_at when status changes to 'completed'
    if (data.status === 'completed' && original.status !== 'completed' && !original.completed_at) {
      data.completed_at = now;
    } else if (original.completed_at) {
      // Protect completed_at once set (immutable)
      data.completed_at = original.completed_at;
    }

    // Capture cancelled_at when status changes to 'cancelled' or 'withdrawn'
    if (
      (data.status === 'cancelled' || data.status === 'withdrawn') &&
      original.status !== 'cancelled' &&
      original.status !== 'withdrawn' &&
      !original.cancelled_at
    ) {
      data.cancelled_at = now;
    } else if (original.cancelled_at) {
      // Protect cancelled_at once set (immutable)
      data.cancelled_at = original.cancelled_at;
    }

    // Prevent status downgrade from 'completed'
    if (original.status === 'completed' && data.status !== 'completed') {
      throw new Error('Cannot change status from completed to another status');
    }
  }

  return data;
};
