import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Blog Post Relationships (beforeValidate)
 *
 * Purpose:
 * - Validate related_courses array
 * - Enforce max 5 courses limit
 * - Verify courses exist in database
 *
 * Execution:
 * - Runs BEFORE validation
 * - Can throw errors to prevent creation/update
 *
 * Validation Rules:
 * - Max 5 related courses
 * - All course IDs must exist in courses collection
 * - Course IDs must be valid format
 *
 * Security Pattern: SP-004 (No Sensitive Logging)
 * - Logs only post.id and course count (non-sensitive)
 * - NEVER logs course names or post content
 *
 * @param args - Collection hook arguments
 * @returns Validated data
 */
export declare const validateBlogPostRelationships: CollectionBeforeValidateHook;
//# sourceMappingURL=validateBlogPostRelationships.d.ts.map