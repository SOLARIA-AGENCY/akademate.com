import type { CollectionBeforeValidateHook } from 'payload';

/**
 * Hook: validateStudentRelationships
 *
 * Validates foreign key relationships before database insertion:
 * - created_by: User who created the student must exist
 *
 * WHEN: beforeValidate (runs before Payload's validation)
 * OPERATION: create only (relationships set once)
 *
 * VALIDATION RULES:
 * 1. If created_by is provided, verify user exists in users collection
 * 2. Only validate on creation (created_by is immutable)
 *
 * WHY THIS HOOK:
 * - Ensures referential integrity before database write
 * - Provides clear error messages for invalid relationships
 * - Prevents orphaned records and database errors
 * - Catches issues early in the request lifecycle
 *
 * SECURITY CONSIDERATIONS:
 * - Validates relationships exist before committing to database
 * - Prevents invalid foreign keys
 * - NO logging of PII (SP-004)
 *
 * DATABASE CONSTRAINTS:
 * This hook provides early validation, but database also enforces:
 * - FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
 *
 * ERROR HANDLING:
 * - Throws descriptive errors if relationships are invalid
 * - Errors are user-friendly and actionable
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data if validation passes
 * @throws Error if relationship validation fails
 */
export const validateStudentRelationships: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  const logger: { info?: (message: string, meta?: Record<string, unknown>) => void; error?: (message: string, meta?: Record<string, unknown>) => void } | undefined = req?.payload?.logger;
  // Only validate on creation
  if (operation !== 'create') {
    return data;
  }

  try {
    // Validate created_by user exists
    if (data?.created_by) {
      const userId = typeof data.created_by === 'string' ? data.created_by : data.created_by.id;

      try {
        const user = await req.payload.findByID({
          collection: 'users' as any,
          id: userId,
        });

        if (!user) {
          throw new Error(`User with ID ${userId} not found`);
        }

        // SECURITY: NO logging of user details (could contain PII)
        // Only log validation success
        if (logger) {
          logger.info('[Student] Relationship validation passed', {
            operation,
            hasCreatedBy: !!data.created_by,
          });
        }
      } catch (error) {
        // User not found or access denied
        throw new Error(
          `Invalid created_by user: ${error instanceof Error ? error.message : 'User not found'}`
        );
      }
    }
  } catch (error) {
    // Log error without exposing PII
    if (logger) {
      logger.error('[Student] Relationship validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation,
      });
    }

    // Re-throw validation error
    throw error;
  }

  return data;
};
