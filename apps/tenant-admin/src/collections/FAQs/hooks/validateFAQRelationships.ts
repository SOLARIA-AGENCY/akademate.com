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

/**
 * Payload Logger interface for typed logging calls
 */
interface PayloadLogger {
  info: (message: string, meta?: Record<string, unknown>) => void;
  warn: (message: string, meta?: Record<string, unknown>) => void;
  error: (message: string, meta?: Record<string, unknown>) => void;
}

/**
 * Related course reference - can be ID string or populated object
 */
interface RelatedCourseRef {
  id: string | number;
}

/**
 * FAQ data interface for validation hook
 */
interface FAQData {
  related_course?: string | RelatedCourseRef | null;
  [key: string]: unknown;
}

export const validateFAQRelationships: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  const logger = req?.payload?.logger as PayloadLogger | undefined;
  const faqData = data as FAQData | undefined;
  try {
    // Validate related_course if provided
    if (faqData?.related_course) {
      const courseId =
        typeof faqData.related_course === 'string'
          ? faqData.related_course
          : faqData.related_course.id;

      if (courseId) {
        // Check if course exists
        const course = await req.payload.findByID({
          collection: 'courses',
          id: courseId,
          depth: 0,
        });

        if (!course) {
          // SECURITY (SP-004): No logging of course ID
          logger?.error('[FAQ] Invalid related course', {
            operation,
            hasCourseId: !!courseId,
          });

          throw new Error(`Related course does not exist`);
        }

        // SECURITY (SP-004): Log validation success without IDs
        logger?.info('[FAQ] Related course validated', {
          operation,
          hasCourse: true,
        });
      }
    }

    // SECURITY (SP-004): Log validation completion without data
    logger?.info('[FAQ] Relationships validated', {
      operation,
      hasRelatedCourse: !!faqData?.related_course,
    });

    return data;
  } catch (error: unknown) {
    // SECURITY (SP-004): Log error without exposing data
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    logger?.error('[FAQ] Relationship validation failed', {
      operation,
      hasError: true,
      errorMessage,
    });

    throw error;
  }
};
