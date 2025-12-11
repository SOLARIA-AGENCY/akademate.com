import type { CollectionBeforeValidateHook } from 'payload';
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
export declare const validateCourseRunDates: CollectionBeforeValidateHook;
//# sourceMappingURL=validateCourseRunDates.d.ts.map