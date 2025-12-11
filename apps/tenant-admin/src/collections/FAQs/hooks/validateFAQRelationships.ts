/**
 * Hook: Validate FAQ Relationships
 *
 * Validates that related course exists (if provided):
 * - Checks that related_course ID references a valid course
 * - Optional relationship (null/undefined is allowed)
 *
 * SECURITY (SP-004): No logging of course names or IDs
 *
 * @hook beforeValidate
 */

import type { CollectionBeforeValidateHook } from 'payload';

export const validateFAQRelationships: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  try {
    // Validate related_course if provided
    if (data?.related_course) {
      const courseId =
        typeof data.related_course === 'string' ? data.related_course : data.related_course.id;

      if (courseId) {
        // Check if course exists
        const course = await req.payload.findByID({
          collection: 'courses',
          id: courseId,
          depth: 0,
        });

        if (!course) {
          // SECURITY (SP-004): No logging of course ID
          req.payload.logger.error('[FAQ] Invalid related course', {
            operation,
            hasCourseId: !!courseId,
          });

          throw new Error(`Related course does not exist`);
        }

        // SECURITY (SP-004): Log validation success without IDs
        req.payload.logger.info('[FAQ] Related course validated', {
          operation,
          hasCourse: true,
        });
      }
    }

    // SECURITY (SP-004): Log validation completion without data
    req.payload.logger.info('[FAQ] Relationships validated', {
      operation,
      hasRelatedCourse: !!data?.related_course,
    });

    return data;
  } catch (error: any) {
    // SECURITY (SP-004): Log error without exposing data
    req.payload.logger.error('[FAQ] Relationship validation failed', {
      operation,
      hasError: true,
      errorMessage: error.message,
    });

    throw error;
  }
};
