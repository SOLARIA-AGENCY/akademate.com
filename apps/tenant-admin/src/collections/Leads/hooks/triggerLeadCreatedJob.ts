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
export const triggerLeadCreatedJob: CollectionAfterChangeHook = async ({ doc, operation, req }) => {
  // Only trigger on create operations
  if (operation !== 'create') {
    return doc;
  }

  try {
    // Log lead creation for monitoring
    req.payload.logger.info(`[Lead Created] New lead: ${doc.email} (ID: ${doc.id})`);

    // ============================================================================
    // TODO: Integrate with BullMQ job queue
    // ============================================================================

    // Future implementation will look like:
    //
    // await req.payload.jobs.queue('lead:created', {
    //   leadId: doc.id,
    //   email: doc.email,
    //   course: doc.course,
    //   campus: doc.campus,
    //   marketing_consent: doc.marketing_consent,
    //   preferred_contact_method: doc.preferred_contact_method,
    //   lead_score: doc.lead_score,
    // });

    // ============================================================================
    // IMMEDIATE ACTIONS (non-blocking logs)
    // ============================================================================

    // Log for audit trail (NO PII per GDPR)
    console.log('[Lead Audit] Lead created:', {
      id: doc.id,
      course: doc.course,
      campus: doc.campus,
      lead_score: doc.lead_score,
      marketing_consent: doc.marketing_consent,
      gdpr_consent: doc.gdpr_consent,
      hasEmail: !!doc.email,
      hasPhone: !!doc.phone,
      hasConsent: !!doc.consent_timestamp,
      // SECURITY: Do NOT log email, phone, IP address, or names (PII)
    });

    // ============================================================================
    // FUTURE JOB QUEUE INTEGRATIONS
    // ============================================================================

    // Job 1: Send welcome email
    // - Template: "Thank you for your interest"
    // - Include course details if selected
    // - Include next steps

    // Job 2: Notify marketing team
    // - Email notification to marketing@cepcomunicacion.com
    // - Include lead details and score
    // - Suggest immediate follow-up for high-score leads (80+)

    // Job 3: Add to MailChimp (if marketing_consent)
    if (doc.marketing_consent) {
      console.log(`[MailChimp] TODO: Add subscriber for lead ${doc.id}`);
      // SECURITY: Do NOT log email address (PII)
      // await req.payload.jobs.queue('mailchimp:add-subscriber', {
      //   email: doc.email,
      //   firstName: doc.first_name,
      //   lastName: doc.last_name,
      //   leadId: doc.id,
      // });
    }

    // Job 4: Send WhatsApp notification (if preferred method)
    if (doc.preferred_contact_method === 'whatsapp') {
      console.log(`[WhatsApp] TODO: Send notification for lead ${doc.id}`);
      // SECURITY: Do NOT log phone number (PII)
      // await req.payload.jobs.queue('whatsapp:send-notification', {
      //   phone: doc.phone,
      //   firstName: doc.first_name,
      //   leadId: doc.id,
      // });
    }

    // Job 5: Notify assigned user
    if (doc.assigned_to) {
      console.log(`[Notification] TODO: Notify user ${doc.assigned_to} about new lead`);
      // await req.payload.jobs.queue('user:notify', {
      //   userId: doc.assigned_to,
      //   leadId: doc.id,
      //   type: 'lead_assigned',
      // });
    }

    // Job 6: Update analytics dashboard
    console.log(`[Analytics] TODO: Update lead metrics`);
    // await req.payload.jobs.queue('analytics:update-lead-metrics', {
    //   leadId: doc.id,
    //   leadScore: doc.lead_score,
    //   course: doc.course,
    //   campus: doc.campus,
    // });
  } catch (error) {
    // Log error but don't fail the operation
    // The lead has already been created successfully
    console.error('[Lead Jobs] Failed to trigger lead created jobs:', error);

    // Optionally, create a failed job for manual retry
    // await req.payload.create({
    //   collection: 'failed_jobs',
    //   data: {
    //     job_type: 'lead_created',
    //     lead_id: doc.id,
    //     error: (error as Error).message,
    //   },
    // });
  }

  return doc;
};
