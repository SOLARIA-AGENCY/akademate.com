import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Hook: validateCourseRunRelationships
 *
 * Validates that all relationship IDs (course, campus, classroom, staff) exist.
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
 * - classroom_id → classrooms table (OPTIONAL)
 * - instructor/administrative_owner → staff table (OPTIONAL)
 */
export const validateCourseRunRelationships: CollectionBeforeValidateHook = async ({ data, req, operation }) => {
  // Only validate on create and update operations
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  if (!data) {
    return data;
  }

  // Validate course relationship (REQUIRED)
  if (data.course) {
    try {
      await req.payload.findByID({
        collection: 'courses',
        id: typeof data.course === 'object' ? data.course.id : data.course,
      });
    } catch {
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
    } catch {
      // SECURITY: Don't include user input in error messages (defense in depth)
      throw new Error('The specified campus does not exist or is not accessible');
    }
  }

  if (data.classroom) {
    try {
      await req.payload.findByID({
        collection: 'classrooms',
        id: typeof data.classroom === 'object' ? data.classroom.id : data.classroom,
      });
    } catch {
      throw new Error('The specified classroom does not exist or is not accessible');
    }
  }

  if (data.instructor) {
    try {
      await req.payload.findByID({
        collection: 'staff',
        id: typeof data.instructor === 'object' ? data.instructor.id : data.instructor,
      });
    } catch {
      throw new Error('The specified instructor does not exist or is not accessible');
    }
  }

  if (Array.isArray(data.instructors)) {
    for (const instructor of data.instructors) {
      try {
        await req.payload.findByID({
          collection: 'staff',
          id: typeof instructor === 'object' ? instructor.id : instructor,
        });
      } catch {
        throw new Error('One of the specified instructors does not exist or is not accessible');
      }
    }
  }

  if (data.administrative_owner) {
    try {
      await req.payload.findByID({
        collection: 'staff',
        id: typeof data.administrative_owner === 'object' ? data.administrative_owner.id : data.administrative_owner,
      });
    } catch {
      throw new Error('The specified administrative owner does not exist or is not accessible');
    }
  }

  return data;
};
