import type { FieldHook } from 'payload';
/**
 * Hook: preventDuplicateLead
 *
 * Prevents duplicate lead submissions from the same user within 24 hours.
 *
 * Duplicate criteria:
 * - Same email address
 * - Same course
 * - Within 24 hours
 *
 * Why prevent duplicates?
 * - Reduces spam submissions
 * - Prevents accidental double-clicks
 * - Improves data quality
 * - Reduces processing overhead
 *
 * IMPORTANT:
 * - Only runs on CREATE operations
 * - Requires both email AND course to check for duplicates
 * - Different courses for the same email are allowed
 * - After 24 hours, the same user can submit again
 */
export declare const preventDuplicateLead: FieldHook;
//# sourceMappingURL=preventDuplicateLead.d.ts.map