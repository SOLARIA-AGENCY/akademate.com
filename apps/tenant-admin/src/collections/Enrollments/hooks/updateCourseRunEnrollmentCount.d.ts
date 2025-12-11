import type { CollectionAfterChangeHook } from 'payload';
/**
 * Hook: updateCourseRunEnrollmentCount
 *
 * Automatically updates CourseRun.current_enrollments when enrollment status changes.
 *
 * Business Logic:
 * - When enrollment status becomes 'confirmed': INCREMENT current_enrollments
 * - When enrollment status changes from 'confirmed' to 'cancelled'/'withdrawn': DECREMENT
 * - Other status changes: No impact on enrollment count
 *
 * Runs: afterChange (after database write completes successfully)
 *
 * Why afterChange?
 * - Ensures enrollment record is committed before updating course run
 * - Maintains data consistency between enrollments and course runs
 * - Rollback safety: If course run update fails, enrollment is already saved
 *
 * Security Considerations:
 * - NO PII in logs (use enrollment.id and course_run.id only)
 * - Only system can modify current_enrollments (not manual)
 * - Prevents race conditions with proper transaction handling
 */
export declare const updateCourseRunEnrollmentCount: CollectionAfterChangeHook;
//# sourceMappingURL=updateCourseRunEnrollmentCount.d.ts.map