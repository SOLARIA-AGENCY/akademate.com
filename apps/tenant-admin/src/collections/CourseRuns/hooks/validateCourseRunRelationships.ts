import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Hook: validateCourseRunRelationships
 *
 * Validates that all relationship IDs (course, campus) exist.
 *
 * This hook ensures referential integrity before saving to the database.
 * While Payload CMS handles basic relationship validation, this hook provides:
 * - Better error messages
 * - Explicit validation for required relationships
 * - Graceful handling of optional relationships
 *
 * Relationships validated:
 * - course_id → courses table (REQUIRED)
 * - campus_id → campuses table (OPTIONAL)
 */
export const validateCourseRunRelationships: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  if (!data) {
    return data;
  }

  try {
    // Validate course relationship (REQUIRED)
    if (data.course) {
      try {
        await req.payload.findByID({
          collection: 'courses',
          id: typeof data.course === 'object' ? data.course.id : data.course,
        });
      } catch (error) {
        // SECURITY: Don't include user input in error messages (defense in depth)
        throw new Error('The specified course does not exist or is not accessible');
      }
    }

    // Validate campus relationship (OPTIONAL)
    if (data.campus) {
      try {
        await req.payload.findByID({
          collection: 'campuses',
          id: typeof data.campus === 'object' ? data.campus.id : data.campus,
        });
      } catch (error) {
        // SECURITY: Don't include user input in error messages (defense in depth)
        throw new Error('The specified campus does not exist or is not accessible');
      }
    }
  } catch (error) {
    throw error;
  }

  return data;
};
