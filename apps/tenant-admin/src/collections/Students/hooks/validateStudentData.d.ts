import type { FieldHook } from 'payload';
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
export declare const validateStudentData: FieldHook;
//# sourceMappingURL=validateStudentData.d.ts.map