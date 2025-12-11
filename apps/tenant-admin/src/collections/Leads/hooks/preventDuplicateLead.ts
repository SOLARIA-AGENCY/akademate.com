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
export const preventDuplicateLead: FieldHook = async ({ data, req, operation }) => {
  // Only check on creation
  if (operation !== 'create') {
    return data;
  }

  // Need both email and course to check for duplicates
  if (!data?.email || !data?.course) {
    return data;
  }

  try {
    // Calculate 24 hours ago
    const oneDayAgo = new Date();
    oneDayAgo.setHours(oneDayAgo.getHours() - 24);

    // Check for recent duplicate
    const existingLeads = await req.payload.find({
      collection: 'leads',
      where: {
        and: [
          {
            email: {
              equals: data.email,
            },
          },
          {
            course: {
              equals: data.course,
            },
          },
          {
            createdAt: {
              greater_than: oneDayAgo.toISOString(),
            },
          },
        ],
      },
      limit: 1,
    });

    if (existingLeads.docs.length > 0) {
      // Found a duplicate within 24 hours
      console.warn(`[Lead Validation] Duplicate submission prevented for course ${data.course}`);
      // SECURITY: Do NOT log email address (PII)

      throw new Error(
        'You have already submitted a request for this course in the last 24 hours. ' +
          'Please wait before submitting again or contact us directly if you need immediate assistance.'
      );
    }
  } catch (error) {
    // If it's our duplicate error, re-throw it
    if ((error as Error).message.includes('already submitted')) {
      throw error;
    }

    // For other errors (e.g., database issues), log but don't block
    console.error('[Lead Validation] Error checking for duplicates:', error);
    // Allow the lead to be created if duplicate check fails
  }

  return data;
};
