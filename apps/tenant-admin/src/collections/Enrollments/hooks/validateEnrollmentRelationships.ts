import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Hook: validateEnrollmentRelationships
 *
 * Validates that all required relationships exist and are valid before enrollment.
 *
 * Validations:
 * 1. Student exists in database
 * 2. CourseRun exists in database
 * 3. CourseRun status is 'enrollment_open' (accepting enrollments)
 *
 * Throws validation error if any check fails.
 *
 * Runs: beforeValidate (earliest possible point to check relationships)
 *
 * Security Considerations:
 * - NO PII in logs (use IDs only, never student names/emails)
 * - Prevents orphaned enrollments
 * - Enforces business rules before database write
 */
export const validateEnrollmentRelationships: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (!data) {
    return data;
  }

  // Only validate on create (relationships shouldn't change after creation)
  if (operation !== 'create') {
    return data;
  }

  const { payload } = req;

  // Validate student exists
  if (data.student) {
    try {
      // NOTE: Using 'leads' collection as students for now
      // In production, this should be a dedicated 'students' collection
      await payload.findByID({
        collection: 'leads',
        id: data.student,
      });
    } catch (error) {
      throw new Error(`Invalid student ID: ${data.student}. Student does not exist.`);
    }
  }

  // Validate course_run exists and is accepting enrollments
  if (data.course_run) {
    try {
      const courseRun = await payload.findByID({
        collection: 'course-runs',
        id: data.course_run,
      });

      // Check if course run is accepting enrollments
      if (courseRun.status !== 'enrollment_open') {
        throw new Error(
          `Course run ${data.course_run} is not accepting enrollments. Current status: ${courseRun.status}`
        );
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('not accepting enrollments')) {
        // Re-throw business logic errors
        throw error;
      }
      // Course run doesn't exist
      throw new Error(`Invalid course_run ID: ${data.course_run}. Course run does not exist.`);
    }
  }

  return data;
};
