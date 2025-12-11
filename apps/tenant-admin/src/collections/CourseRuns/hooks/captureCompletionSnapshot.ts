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
export const captureCompletionSnapshot: CollectionAfterChangeHook = async ({
  doc,
  req,
  previousDoc,
  operation,
}) => {
  // Only process on update operations
  if (operation !== 'update') {
    return doc;
  }

  // Check if status just changed to "completed"
  const wasCompleted = previousDoc?.status === 'completed';
  const isNowCompleted = doc.status === 'completed';

  if (!isNowCompleted || wasCompleted) {
    // Not transitioning to completed, or already was completed
    return doc;
  }

  // Check if snapshot already exists (should not happen, but safety check)
  if (doc.completion_snapshot && doc.completion_snapshot.final_student_count !== undefined) {
    console.log(`[COURSE_RUN] Snapshot already exists for course run ${doc.id}, skipping`);
    return doc;
  }

  try {
    const { payload } = req;

    // Calculate final metrics
    const finalStudentCount = doc.current_enrollments || 0;
    const finalOccupationPercentage = doc.max_students > 0
      ? Math.round((finalStudentCount / doc.max_students) * 100)
      : 0;
    const finalPrice = doc.price_override !== undefined ? doc.price_override : 0;

    // Update the document with snapshot data
    const updated = await payload.update({
      collection: 'course-runs',
      id: doc.id,
      data: {
        completion_snapshot: {
          final_student_count: finalStudentCount,
          final_occupation_percentage: finalOccupationPercentage,
          final_price: finalPrice,
          completed_at: new Date().toISOString(),
        },
      },
    });

    console.log(
      `[COURSE_RUN] Captured completion snapshot for ${doc.codigo}: ` +
      `${finalStudentCount}/${doc.max_students} students (${finalOccupationPercentage}%), ` +
      `€${finalPrice}/student`
    );

    return updated;
  } catch (error) {
    console.error('[COURSE_RUN] Error capturing completion snapshot:', error);
    // Don't throw - let the main operation succeed even if snapshot fails
    return doc;
  }
};
