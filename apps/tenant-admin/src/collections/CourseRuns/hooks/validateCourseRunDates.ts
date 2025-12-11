import type { CollectionBeforeValidateHook } from 'payload';
import { dateValidationSchema, timeValidationSchema } from '../CourseRuns.validation';

/**
 * Hook: validateCourseRunDates
 *
 * Validates date and time logic for course runs:
 *
 * Date Validations:
 * 1. end_date must be after start_date
 * 2. enrollment_deadline must be before start_date (if provided)
 *
 * Time Validations:
 * 3. If schedule_time_start is provided, schedule_time_end is required
 * 4. If schedule_time_end is provided, schedule_time_start is required
 * 5. schedule_time_end must be after schedule_time_start
 *
 * This hook runs in beforeValidate to catch errors early.
 */
export const validateCourseRunDates: CollectionBeforeValidateHook = async ({ data, operation }) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  if (!data) {
    return data;
  }

  try {
    // Validate date logic
    if (data.start_date && data.end_date) {
      const dateResult = dateValidationSchema.safeParse({
        start_date: data.start_date,
        end_date: data.end_date,
        enrollment_deadline: data.enrollment_deadline,
      });

      if (!dateResult.success) {
        const errors = dateResult.error.errors.map((err) => err.message).join(', ');
        throw new Error(`Date validation failed: ${errors}`);
      }
    }

    // Validate time logic
    if (data.schedule_time_start || data.schedule_time_end) {
      const timeResult = timeValidationSchema.safeParse({
        schedule_time_start: data.schedule_time_start,
        schedule_time_end: data.schedule_time_end,
      });

      if (!timeResult.success) {
        const errors = timeResult.error.errors.map((err) => err.message).join(', ');
        throw new Error(`Time validation failed: ${errors}`);
      }
    }
  } catch (error) {
    throw error;
  }

  return data;
};
