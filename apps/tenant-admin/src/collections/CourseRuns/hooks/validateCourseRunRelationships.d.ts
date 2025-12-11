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
export declare const validateCourseRunRelationships: CollectionBeforeValidateHook;
//# sourceMappingURL=validateCourseRunRelationships.d.ts.map