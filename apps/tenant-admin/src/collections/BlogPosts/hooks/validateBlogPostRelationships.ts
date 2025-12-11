import type { CollectionBeforeValidateHook } from 'payload';
import { validateRelatedCourses } from '../BlogPosts.validation';

/**
 * Hook: Validate Blog Post Relationships (beforeValidate)
 *
 * Purpose:
 * - Validate related_courses array
 * - Enforce max 5 courses limit
 * - Verify courses exist in database
 *
 * Execution:
 * - Runs BEFORE validation
 * - Can throw errors to prevent creation/update
 *
 * Validation Rules:
 * - Max 5 related courses
 * - All course IDs must exist in courses collection
 * - Course IDs must be valid format
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id and course count (non-sensitive)
 * - NEVER logs course names or post content
 *
 * @param args - Collection hook arguments
 * @returns Validated data
 */
export const validateBlogPostRelationships: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  const relatedCourses = data?.related_courses;

  // Skip if no related courses
  if (!relatedCourses || !Array.isArray(relatedCourses) || relatedCourses.length === 0) {
    return data;
  }

  // Validate max 5 courses
  const validationResult = validateRelatedCourses(relatedCourses);
  if (validationResult !== true) {
    throw new Error(validationResult);
  }

  // Verify all courses exist in database
  const { payload } = req;

  for (const courseId of relatedCourses) {
    if (typeof courseId !== 'string') {
      throw new Error('Invalid course ID format');
    }

    try {
      const course = await payload.findByID({
        collection: 'courses',
        id: courseId,
      });

      if (!course) {
        throw new Error(`Course with ID ${courseId} does not exist`);
      }
    } catch (error) {
      throw new Error(`Invalid related course: ${courseId}`);
    }
  }

  // SECURITY (SP-004): No logging of course names or post data
  req.payload.logger.info('[BlogPost] Related courses validated', {
    operation,
    courseCount: relatedCourses.length,
  });

  return data;
};
