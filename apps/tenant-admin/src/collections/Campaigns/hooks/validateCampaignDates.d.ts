import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Campaign Dates (beforeValidate)
 *
 * Purpose:
 * - Validate end_date >= start_date (allow same day campaigns)
 * - Validate start_date not in past for draft campaigns
 * - Provide clear error messages for date validation failures
 *
 * Validation Rules:
 * 1. If end_date provided, must be >= start_date
 * 2. Same-day campaigns allowed (start_date == end_date)
 * 3. For draft campaigns, start_date cannot be in the past
 * 4. Active/paused/completed campaigns can have past dates (already running)
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Security Considerations (SP-004):
 * - No PII logging (campaigns don't contain PII)
 * - No business intelligence logging (budget not logged)
 * - Only log campaign.id and validation status
 */
export declare const validateCampaignDates: CollectionBeforeValidateHook;
//# sourceMappingURL=validateCampaignDates.d.ts.map