import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: validateEnrollmentRelationships
 *
 * Validates that all required relationships exist and are valid before enrollment.
 *
 * Validations:
 * 1. Student exists in database
 * 2. CourseRun exists in database
 * 3. CourseRun status is 'enrollment_open' (accepting enrollments)
 *
 * Throws validation error if any check fails.
 *
 * Runs: beforeValidate (earliest possible point to check relationships)
 *
 * Security Considerations:
 * - NO PII in logs (use IDs only, never student names/emails)
 * - Prevents orphaned enrollments
 * - Enforces business rules before database write
 */
export declare const validateEnrollmentRelationships: CollectionBeforeValidateHook;
//# sourceMappingURL=validateEnrollmentRelationships.d.ts.map