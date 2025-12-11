import type { CollectionAfterChangeHook } from 'payload';
/**
 * Hook: triggerLeadCreatedJob
 *
 * Triggers async jobs when a new lead is created using BullMQ.
 *
 * Jobs triggered:
 * 1. Send welcome email to lead
 * 2. Send notification to marketing team
 * 3. Add to MailChimp (if marketing_consent = true)
 * 4. Send WhatsApp notification (if preferred_contact_method = 'whatsapp')
 * 5. Notify assigned user (if lead is pre-assigned)
 * 6. Create audit log entry
 * 7. Update lead analytics dashboard
 *
 * Why async jobs?
 * - Don't block the HTTP response
 * - External API calls can be slow (MailChimp, WhatsApp)
 * - Retry failed operations automatically
 * - Better error handling and monitoring
 *
 * Integration with bullmq-worker-automation:
 * - This hook queues jobs in Redis
 * - Separate worker processes consume the queue
 * - Workers handle email, MailChimp, WhatsApp integrations
 *
 * IMPORTANT:
 * - Only runs on CREATE operations
 * - Errors are logged but don't fail the lead creation
 * - All external integrations are async via job queue
 */
export declare const triggerLeadCreatedJob: CollectionAfterChangeHook;
//# sourceMappingURL=triggerLeadCreatedJob.d.ts.map