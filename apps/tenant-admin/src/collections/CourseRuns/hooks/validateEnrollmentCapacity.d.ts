import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: validateEnrollmentCapacity
 *
 * Validates enrollment capacity logic:
 *
 * Validations:
 * 1. max_students must be greater than min_students
 * 2. min_students must be greater than 0
 * 3. current_enrollments must be >= 0
 * 4. current_enrollments must be <= max_students
 * 5. current_enrollments can ONLY be modified by enrollment system (not manually)
 *
 * Security Implementation (SP-001: Immutable Fields with Defense in Depth):
 * - current_enrollments is protected from manual modification
 * - Only the enrollment system (via specific hooks/workers) can update this field
 * - This prevents data corruption and ensures accurate enrollment tracking
 *
 * Why protect current_enrollments?
 * - Maintains data integrity for enrollment tracking
 * - Prevents manual errors that could cause overbooking
 * - Ensures accurate capacity management
 * - Supports business logic for enrollment workflows
 */
export declare const validateEnrollmentCapacity: CollectionBeforeValidateHook;
//# sourceMappingURL=validateEnrollmentCapacity.d.ts.map