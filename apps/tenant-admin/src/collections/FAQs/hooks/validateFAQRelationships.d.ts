/**
 * Hook: Validate FAQ Relationships
 *
 * Validates that related course exists (if provided):
 * - Checks that related_course ID references a valid course
 * - Optional relationship (null/undefined is allowed)
 *
 * SECURITY (SP-004): No logging of course names or IDs
 *
 * @hook beforeValidate
 */
import type { CollectionBeforeValidateHook } from 'payload';
export declare const validateFAQRelationships: CollectionBeforeValidateHook;
//# sourceMappingURL=validateFAQRelationships.d.ts.map