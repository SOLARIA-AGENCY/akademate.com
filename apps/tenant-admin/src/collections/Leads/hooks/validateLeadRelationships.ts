import type { FieldHook } from 'payload';

/**
 * Hook: validateLeadRelationships
 *
 * Validates that all relationship IDs (course, campus, campaign, assigned_to) exist.
 *
 * This hook ensures referential integrity before saving to the database.
 * While Payload CMS handles basic relationship validation, this hook provides:
 * - Better error messages
 * - Graceful handling of non-existent campaigns (optional collection)
 * - Audit logging for invalid relationships
 *
 * Relationships validated:
 * - course_id → courses table
 * - campus_id → campuses table
 * - campaign_id → campaigns table (optional, might not be implemented yet)
 * - assigned_to → users table
 */
export const validateLeadRelationships: FieldHook = async ({ data, req }) => {
  if (!data) {
    return data;
  }

  try {
    // Validate course relationship
    if (data.course) {
      try {
        await req.payload.findByID({
          collection: 'courses',
          id: data.course,
        });
      } catch (error) {
        throw new Error(`Course with ID ${data.course} does not exist`);
      }
    }

    // Validate campus relationship
    if (data.campus) {
      try {
        await req.payload.findByID({
          collection: 'campuses',
          id: data.campus,
        });
      } catch (error) {
        throw new Error(`Campus with ID ${data.campus} does not exist`);
      }
    }

    // Validate campaign relationship (graceful failure if collection doesn't exist)
    if (data.campaign) {
      try {
        await req.payload.findByID({
          collection: 'campaigns',
          id: data.campaign,
        });
      } catch (error) {
        // Campaigns collection might not be implemented yet
        console.warn(`[Lead Validation] Campaign validation skipped: ${(error as Error).message}`);
        // Don't throw error, just warn
      }
    }

    // Validate assigned_to relationship
    if (data.assigned_to) {
      try {
        await req.payload.findByID({
          collection: 'users',
          id: data.assigned_to,
        });
      } catch (error) {
        throw new Error(`User with ID ${data.assigned_to} does not exist`);
      }
    }
  } catch (error) {
    // Re-throw validation errors
    throw error;
  }

  return data;
};
