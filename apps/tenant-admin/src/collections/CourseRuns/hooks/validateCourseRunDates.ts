import type { CollectionBeforeValidateHook } from 'payload'
import { dateValidationSchema, timeValidationSchema } from '../CourseRuns.validation'

/**
 * Hook: validateCourseRunDates
 *
 * Validates date and time logic for course runs:
 *
 * Date Validations:
 * 1. end_date must be after start_date
 * 2. enrollment_deadline must be before start_date for non-cycle training
 * 3. cycles may use the later annual deadline issued by the education authority
 *
 * Time Validations:
 * 3. If schedule_time_start is provided, schedule_time_end is required
 * 4. If schedule_time_end is provided, schedule_time_start is required
 * 5. schedule_time_end must be after schedule_time_start
 *
 * This hook runs in beforeValidate to catch errors early.
 */
export const validateCourseRunDates: CollectionBeforeValidateHook = ({
  data,
  operation,
  originalDoc,
}) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data
  }

  if (!data) {
    return data
  }

  // Validate date logic
  const startDate = data.start_date ?? originalDoc?.start_date
  const endDate = data.end_date ?? originalDoc?.end_date
  const enrollmentDeadline =
    data.enrollment_deadline === undefined
      ? originalDoc?.enrollment_deadline
      : data.enrollment_deadline
  const trainingType = data.training_type ?? originalDoc?.training_type

  if (startDate && endDate) {
    const dateResult = dateValidationSchema.safeParse({
      start_date: startDate,
      end_date: endDate,
      enrollment_deadline: enrollmentDeadline || undefined,
      training_type: trainingType,
    })

    if (!dateResult.success) {
      const errors = dateResult.error.issues.map((err) => err.message).join(', ')
      throw new Error(`Date validation failed: ${errors}`)
    }
  }

  // Validate time logic
  if (data.schedule_time_start || data.schedule_time_end) {
    const timeResult = timeValidationSchema.safeParse({
      schedule_time_start: data.schedule_time_start,
      schedule_time_end: data.schedule_time_end,
    })

    if (!timeResult.success) {
      const errors = timeResult.error.issues.map((err) => err.message).join(', ')
      throw new Error(`Time validation failed: ${errors}`)
    }
  }

  return data
}
