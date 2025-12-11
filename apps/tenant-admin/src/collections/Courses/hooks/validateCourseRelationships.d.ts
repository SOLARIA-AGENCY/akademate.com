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
export declare const validateCourseRelationships: FieldHook;
//# sourceMappingURL=validateCourseRelationships.d.ts.map