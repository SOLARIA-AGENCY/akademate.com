import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: validateEnrollmentCapacity
 *
 * Validates course run capacity and automatically sets status to 'waitlisted'
 * if the course is full.
 *
 * Business Logic:
 * - Check if current_enrollments < max_students
 * - If full: Set enrollment status to 'waitlisted'
 * - If space available: Allow requested status (usually 'pending')
 *
 * Runs: beforeValidate (after relationship validation)
 *
 * Note: This hook only sets the initial status. The updateCourseRunEnrollmentCount
 * hook (afterChange) actually increments the counter when status becomes 'confirmed'.
 */
export declare const validateEnrollmentCapacity: CollectionBeforeValidateHook;
//# sourceMappingURL=validateEnrollmentCapacity.d.ts.map