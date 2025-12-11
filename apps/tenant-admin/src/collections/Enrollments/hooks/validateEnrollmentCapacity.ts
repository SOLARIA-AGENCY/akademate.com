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
export const validateEnrollmentCapacity: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  if (!data) {
    return data;
  }

  // Only check capacity on create
  if (operation !== 'create') {
    return data;
  }

  const { payload } = req;

  // Check course run capacity
  if (data.course_run) {
    try {
      const courseRun = await payload.findByID({
        collection: 'course-runs',
        id: data.course_run,
      });

      // Check if course run is full
      const currentEnrollments = courseRun.current_enrollments || 0;
      const maxStudents = courseRun.max_students;

      if (currentEnrollments >= maxStudents) {
        // Course is full - set status to waitlisted
        data.status = 'waitlisted';
      }
      // If not full, keep the requested status (usually 'pending')
    } catch (error) {
      // Course run doesn't exist - will be caught by validateEnrollmentRelationships
      // Don't throw here to avoid duplicate errors
    }
  }

  return data;
};
