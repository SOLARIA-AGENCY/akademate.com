import type { CollectionBeforeValidateHook } from 'payload';
import { capacityValidationSchema } from '../CourseRuns.validation';

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
export const validateEnrollmentCapacity: CollectionBeforeValidateHook = async ({
  data,
  operation,
  originalDoc,
}) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  if (!data) {
    return data;
  }

  try {
    // Check if current_enrollments is being manually modified
    if (operation === 'update' && originalDoc) {
      const isEnrollmentChanged =
        data.current_enrollments !== undefined &&
        data.current_enrollments !== originalDoc.current_enrollments;

      if (isEnrollmentChanged) {
        // SECURITY: Prevent manual modification of current_enrollments
        // This field should only be modified by the enrollment system via specific hooks
        throw new Error(
          'current_enrollments can only be modified by the enrollment system. ' +
            'This field is automatically updated when students enroll or withdraw.'
        );
      }
    }

    // Validate capacity logic
    const capacityData = {
      max_students: data.max_students ?? 30,
      min_students: data.min_students ?? 5,
      current_enrollments: data.current_enrollments ?? 0,
    };

    const result = capacityValidationSchema.safeParse(capacityData);

    if (!result.success) {
      const errors = result.error.errors.map((err) => err.message).join(', ');
      throw new Error(`Capacity validation failed: ${errors}`);
    }
  } catch (error) {
    throw error;
  }

  return data;
};
