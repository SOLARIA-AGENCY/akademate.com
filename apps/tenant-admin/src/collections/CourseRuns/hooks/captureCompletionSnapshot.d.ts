import type { CollectionAfterChangeHook } from 'payload';
/**
 * Hook: captureCompletionSnapshot
 *
 * Captures final metrics when a course run is marked as "completed".
 * This creates a historical snapshot for analytics and future planning.
 *
 * Captured Data:
 * - final_student_count: Number of students who completed the course
 * - final_occupation_percentage: Actual occupation rate
 * - final_price: Price charged per student
 * - completed_at: Timestamp when completed
 *
 * Use Cases:
 * - Determine if it's worthwhile to re-run a course
 * - Analyze historical success rates by campus/course/time
 * - Generate reports on revenue and occupancy trends
 *
 * Trigger Condition:
 * - Only runs when status changes TO "completed" (not already completed)
 * - Snapshot is immutable once set (not overwritten on subsequent updates)
 */
export declare const captureCompletionSnapshot: CollectionAfterChangeHook;
//# sourceMappingURL=captureCompletionSnapshot.d.ts.map