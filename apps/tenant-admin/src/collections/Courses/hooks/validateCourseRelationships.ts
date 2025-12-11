import type { FieldHook } from 'payload';

/**
 * Validate Course Relationships Hook
 *
 * Validates that referenced entities (cycle, campuses) exist in the database
 * before creating or updating a course.
 *
 * This hook runs in the beforeValidate phase to ensure data integrity
 * at the application level before database constraints are checked.
 *
 * Validations:
 * 1. Cycle ID exists in cycles collection
 * 2. All Campus IDs exist in campuses collection (if provided)
 *
 * @throws Error if cycle or any campus does not exist
 */
export const validateCourseRelationships: FieldHook = async ({ data, req }) => {
  if (!data) return data;

  try {
    // Validate cycle exists
    if (data.cycle) {
      try {
        await req.payload.findByID({
          collection: 'cycles',
          id: data.cycle,
        });
      } catch (error) {
        throw new Error(`Cycle with ID ${data.cycle} does not exist`);
      }
    }

    // Validate campuses exist (if provided)
    if (data.campuses && Array.isArray(data.campuses) && data.campuses.length > 0) {
      for (const campusId of data.campuses) {
        try {
          await req.payload.findByID({
            collection: 'campuses',
            id: campusId,
          });
        } catch (error) {
          throw new Error(`Campus with ID ${campusId} does not exist`);
        }
      }
    }
  } catch (error) {
    // Re-throw the error to fail the operation
    throw error;
  }

  return data;
};
