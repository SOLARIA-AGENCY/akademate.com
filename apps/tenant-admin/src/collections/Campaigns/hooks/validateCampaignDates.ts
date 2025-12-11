import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';
import { validateDateRange, validateStartDateNotPast } from '../Campaigns.validation';

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
export const validateCampaignDates: CollectionBeforeValidateHook = ({ data, operation }) => {
  // Only validate on create and update
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  const { start_date, end_date, status } = data;

  // Validate date range (end >= start)
  const dateRangeResult = validateDateRange(start_date, end_date);
  if (dateRangeResult !== true) {
    throw new ValidationError({
      errors: [
        {
          field: 'end_date',
          message: dateRangeResult,
        },
      ],
    });
  }

  // Validate start_date not in past for draft campaigns
  const startDateResult = validateStartDateNotPast(start_date, status);
  if (startDateResult !== true) {
    throw new ValidationError({
      errors: [
        {
          field: 'start_date',
          message: startDateResult,
        },
      ],
    });
  }

  return data;
};
