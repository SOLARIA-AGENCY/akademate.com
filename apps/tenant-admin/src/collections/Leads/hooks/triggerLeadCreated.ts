import { CollectionAfterChangeHook } from 'payload';

/**
 * Trigger events when a new lead is created
 *
 * This hook:
 * 1. Sends notification to marketing team
 * 2. Triggers lead scoring workflow
 * 3. Adds lead to CRM queue (if integration enabled)
 * 4. Creates initial lead activity entry
 */
export const triggerLeadCreated: CollectionAfterChangeHook = async ({
  doc,
  req,
  operation,
}) => {
  // Only trigger on create operations
  if (operation !== 'create') return doc;

  try {
    // TODO: Implement lead creation triggers
    // 1. Send notification email to team
    // 2. Queue lead for scoring
    // 3. Sync with external CRM (if enabled)
    // 4. Create activity log entry

    console.log(`New lead created: ${doc.id} - ${doc.email}`);

    // Example: Queue a job using BullMQ (to be implemented)
    // await req.payload.jobs.queue('process-new-lead', {
    //   leadId: doc.id,
    //   email: doc.email,
    // });
  } catch (error) {
    // Log error but don't fail the operation
    console.error('Failed to trigger lead created events:', error);
  }

  return doc;
};
