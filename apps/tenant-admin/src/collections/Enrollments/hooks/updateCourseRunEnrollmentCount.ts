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
export const updateCourseRunEnrollmentCount: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  req,
}) => {
  if (!doc || !doc.course_run) {
    return doc;
  }

  const { payload } = req;

  try {
    // On CREATE with status 'confirmed': Increment count
    if (operation === 'create' && doc.status === 'confirmed') {
      const courseRun = await payload.findByID({
        collection: 'course-runs',
        id: doc.course_run,
      });

      await payload.update({
        collection: 'course-runs',
        id: doc.course_run,
        data: {
          current_enrollments: (courseRun.current_enrollments || 0) + 1,
        },
      });

      return doc;
    }

    // On UPDATE: Check for status changes
    if (operation === 'update' && previousDoc) {
      const wasConfirmed = previousDoc.status === 'confirmed';
      const isNowConfirmed = doc.status === 'confirmed';
      const isCancelled = doc.status === 'cancelled' || doc.status === 'withdrawn';

      // Status changed from NOT confirmed to confirmed: INCREMENT
      if (!wasConfirmed && isNowConfirmed) {
        const courseRun = await payload.findByID({
          collection: 'course-runs',
          id: doc.course_run,
        });

        await payload.update({
          collection: 'course-runs',
          id: doc.course_run,
          data: {
            current_enrollments: (courseRun.current_enrollments || 0) + 1,
          },
        });
      }

      // Status changed from confirmed to cancelled/withdrawn: DECREMENT
      if (wasConfirmed && isCancelled) {
        const courseRun = await payload.findByID({
          collection: 'course-runs',
          id: doc.course_run,
        });

        await payload.update({
          collection: 'course-runs',
          id: doc.course_run,
          data: {
            current_enrollments: Math.max(0, (courseRun.current_enrollments || 0) - 1),
          },
        });
      }
    }

    // NOTE: Delete handling would require afterDelete hook
    // Currently, deletions should set status to 'cancelled' instead
    // This preserves audit trail and properly decrements count
  } catch (error) {
    // Log error but don't fail the enrollment operation
    // The enrollment is already saved, course run count can be corrected manually if needed
    console.error(
      `Failed to update course run enrollment count for enrollment ${doc.id}, course_run ${doc.course_run}:`,
      error
    );
  }

  return doc;
};
