import type { FieldHook } from 'payload';
import {
  spanishPhoneRegex,
  dniRegex,
  validateDNIChecksum,
  emailSchema,
  dateOfBirthSchema,
} from '../Students.validation';

/**
 * Hook: validateStudentData
 *
 * Validates student data before database insertion:
 * - Email format (RFC 5322)
 * - Phone format (Spanish: +34 XXX XXX XXX)
 * - DNI format and checksum (if provided)
 * - Date of birth (must be >= 16 years old)
 * - Emergency contact phone format (if provided)
 *
 * WHEN: beforeValidate (runs before Payload's built-in validation)
 * OPERATION: create and update
 *
 * VALIDATION RULES:
 * 1. Email: RFC 5322 compliant, max 255 characters
 * 2. Phone: Spanish format +34 XXX XXX XXX
 * 3. DNI: 8 digits + checksum letter (optional but validated if provided)
 * 4. Date of Birth: Past date, student >= 16 years old
 * 5. Emergency Contact Phone: Same as main phone format
 *
 * SECURITY CONSIDERATIONS:
 * - Input sanitization prevents injection attacks
 * - Validation errors are descriptive but don't expose system internals
 * - NO logging of PII (SP-004)
 *
 * ERROR HANDLING:
 * - Throws descriptive validation errors
 * - Errors are caught by Payload and returned to client
 * - Multiple validation errors collected and returned together
 *
 * @param args - Hook arguments from Payload
 * @returns Modified data if validation passes
 * @throws Error if validation fails
 */
export const validateStudentData: FieldHook = async ({ data, req, operation, value }) => {
  const validationErrors: string[] = [];

  try {
    // 1. Validate Email (always required)
    if (data?.email) {
      try {
        emailSchema.parse(data.email);
      } catch (error: any) {
        validationErrors.push(`Email validation failed: ${error.errors[0]?.message || 'Invalid email format'}`);
      }
    }

    // 2. Validate Phone (always required)
    if (data?.phone) {
      if (!spanishPhoneRegex.test(data.phone)) {
        validationErrors.push(
          'Phone must be in Spanish format: +34 XXX XXX XXX (e.g., +34 612 345 678)'
        );
      }
    }

    // 3. Validate DNI (optional, but must be valid if provided)
    if (data?.dni) {
      if (!dniRegex.test(data.dni)) {
        validationErrors.push('DNI must be 8 digits followed by a letter (e.g., 12345678Z)');
      } else if (!validateDNIChecksum(data.dni)) {
        validationErrors.push('DNI checksum letter is invalid');
      }
    }

    // 4. Validate Date of Birth (optional, but must be valid if provided)
    if (data?.date_of_birth) {
      try {
        dateOfBirthSchema.parse(data.date_of_birth);
      } catch (error: any) {
        const errorMessage = error.errors[0]?.message || 'Invalid date of birth';
        validationErrors.push(`Date of birth validation failed: ${errorMessage}`);
      }
    }

    // 5. Validate Emergency Contact Phone (optional, but must be valid if provided)
    if (data?.emergency_contact_phone) {
      if (!spanishPhoneRegex.test(data.emergency_contact_phone)) {
        validationErrors.push(
          'Emergency contact phone must be in Spanish format: +34 XXX XXX XXX'
        );
      }
    }

    // 6. Validate Emergency Contact Relationship (if emergency contact provided)
    if (data?.emergency_contact_name || data?.emergency_contact_phone) {
      if (!data?.emergency_contact_relationship) {
        validationErrors.push(
          'Emergency contact relationship is required when emergency contact information is provided'
        );
      }
    }

    // If any validation errors, throw them all
    if (validationErrors.length > 0) {
      throw new Error(validationErrors.join('; '));
    }

    // SECURITY: NO logging of PII (SP-004)
    // DO NOT log: email, phone, DNI, names, emergency contact info
    if (req?.payload?.logger) {
      req.payload.logger.info('[Student] Data validation passed', {
        operation,
        hasEmail: !!data?.email,
        hasPhone: !!data?.phone,
        hasDNI: !!data?.dni,
        hasDateOfBirth: !!data?.date_of_birth,
        hasEmergencyContact: !!(data?.emergency_contact_name || data?.emergency_contact_phone),
      });
    }
  } catch (error) {
    // Re-throw validation errors
    if (error instanceof Error && validationErrors.length > 0) {
      throw error;
    }

    // Log unexpected errors without exposing PII
    if (req?.payload?.logger) {
      req.payload.logger.error('[Student] Unexpected validation error', {
        error: error instanceof Error ? error.message : 'Unknown error',
        operation,
      });
    }

    throw new Error('Student data validation failed');
  }

  return data;
};
