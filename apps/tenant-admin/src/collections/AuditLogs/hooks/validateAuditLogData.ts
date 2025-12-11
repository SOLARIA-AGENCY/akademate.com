import type { CollectionBeforeValidateHook } from 'payload';
import { VALID_COLLECTION_NAMES, sanitizeChanges } from '../schemas';

/**
 * Hook: validateAuditLogData
 *
 * Validates audit log data before Payload's built-in validation.
 *
 * WHEN: beforeValidate (runs before Payload's validation)
 * OPERATION: create only (updates are blocked)
 *
 * VALIDATIONS:
 * 1. collection_name must match existing Payload collections
 * 2. user_id must reference an existing user (checked via relationship)
 * 3. changes object must be sanitized (remove sensitive fields)
 * 4. Required fields must be present
 *
 * SECURITY CONSIDERATIONS (SP-004: No PII in Logs):
 * - Sanitize changes object to remove passwords, tokens, secrets
 * - Do NOT log the actual data being validated (contains PII)
 * - Only log validation success/failure with non-PII context
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data after validation
 * @throws Error if validation fails
 */
export const validateAuditLogData: CollectionBeforeValidateHook = async ({
  data,
  req,
  operation,
}) => {
  // Only validate on creation (updates are blocked)
  if (operation !== 'create') {
    return data;
  }

  const { payload } = req;

  try {
    // ============================================================================
    // VALIDATION 1: collection_name must be valid
    // ============================================================================

    if (data?.collection_name) {
      const isValidCollection = VALID_COLLECTION_NAMES.includes(
        data.collection_name as (typeof VALID_COLLECTION_NAMES)[number]
      );

      if (!isValidCollection) {
        throw new Error(
          `Invalid collection_name: "${data.collection_name}". ` +
            `Must be one of: ${VALID_COLLECTION_NAMES.join(', ')}`
        );
      }
    }

    // ============================================================================
    // VALIDATION 2: user_id must reference existing user
    // ============================================================================

    if (data?.user_id && payload) {
      try {
        const user = await payload.findByID({
          collection: 'users',
          id: data.user_id,
        });

        if (!user) {
          throw new Error(`User with ID ${data.user_id} does not exist`);
        }

        // Auto-populate user_email and user_role if not provided
        if (!data.user_email && user.email) {
          data.user_email = user.email;
        }
        if (!data.user_role && user.role) {
          data.user_role = user.role;
        }
      } catch (error) {
        throw new Error(
          `Invalid user_id: ${error instanceof Error ? error.message : 'User not found'}`
        );
      }
    }

    // ============================================================================
    // VALIDATION 3: Sanitize changes object (remove sensitive fields)
    // ============================================================================

    if (data?.changes) {
      data.changes = sanitizeChanges(data.changes);
    }

    // ============================================================================
    // VALIDATION 4: Ensure required fields will be present
    // ============================================================================

    // These will be validated by Payload's built-in validation after this hook
    // But we can add custom business logic validation here if needed

    // SECURITY: NO logging of PII (SP-004)
    // DO NOT log: user_email, ip_address, document_id (may contain PII)
    // Only log validation success with non-PII context
    if (payload?.logger) {
      payload.logger.info('[AuditLog] Validation passed');
    }
  } catch (error) {
    // Log validation error without exposing PII
    if (req?.payload?.logger) {
      req.payload.logger.error('[AuditLog] Validation failed');
    }

    // Re-throw error to prevent creation
    throw error;
  }

  return data;
};
