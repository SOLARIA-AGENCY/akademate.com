import type { CollectionBeforeValidateHook } from 'payload';
import { ValidationError } from 'payload';
import { validateUTMFormat, validateUTMCampaignRequired } from '../Campaigns.validation';

/**
 * Hook: Validate UTM Parameters (beforeValidate)
 *
 * Purpose:
 * - Validate UTM parameter format (lowercase, alphanumeric, hyphens only)
 * - Require utm_campaign if any other UTM parameter is provided
 * - Provide clear error messages for validation failures
 *
 * Validation Rules:
 * 1. UTM parameters must be lowercase
 * 2. Only alphanumeric characters and hyphens allowed
 * 3. No spaces or special characters
 * 4. If any UTM parameter provided, utm_campaign is required
 * 5. Campaign without any UTM parameters is allowed
 *
 * UTM Parameter Reference:
 * - utm_source: Where traffic comes from (e.g., google, facebook, newsletter)
 * - utm_medium: Marketing medium (e.g., cpc, email, social)
 * - utm_campaign: Campaign identifier (e.g., spring-enrollment-2025)
 * - utm_term: Paid keywords (optional)
 * - utm_content: Content variant (optional, for A/B testing)
 *
 * Examples:
 * - Valid: "spring-enrollment-2025", "google-ads", "cpc"
 * - Invalid: "SPRING ENROLLMENT", "Google_Ads", "cpc!"
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Security Considerations (SP-004):
 * - No business intelligence logging
 * - Only log campaign.id and validation status
 * - Error messages don't reflect user input (prevent XSS)
 */
export const validateUTMParameters: CollectionBeforeValidateHook = ({ data, operation }) => {
  // Only validate on create and update
  if (operation !== 'create' && operation !== 'update') {
    return data;
  }

  const { utm_source, utm_medium, utm_campaign, utm_term, utm_content } = data;

  const errors: Array<{ field: string; message: string }> = [];

  // Validate utm_source format
  if (utm_source) {
    const sourceResult = validateUTMFormat(utm_source);
    if (sourceResult !== true) {
      errors.push({
        field: 'utm_source',
        message: sourceResult,
      });
    }
  }

  // Validate utm_medium format
  if (utm_medium) {
    const mediumResult = validateUTMFormat(utm_medium);
    if (mediumResult !== true) {
      errors.push({
        field: 'utm_medium',
        message: mediumResult,
      });
    }
  }

  // Validate utm_campaign format
  if (utm_campaign) {
    const campaignResult = validateUTMFormat(utm_campaign);
    if (campaignResult !== true) {
      errors.push({
        field: 'utm_campaign',
        message: campaignResult,
      });
    }
  }

  // Validate utm_term format
  if (utm_term) {
    const termResult = validateUTMFormat(utm_term);
    if (termResult !== true) {
      errors.push({
        field: 'utm_term',
        message: termResult,
      });
    }
  }

  // Validate utm_content format
  if (utm_content) {
    const contentResult = validateUTMFormat(utm_content);
    if (contentResult !== true) {
      errors.push({
        field: 'utm_content',
        message: contentResult,
      });
    }
  }

  // Validate utm_campaign is required if any other UTM provided
  const campaignRequiredResult = validateUTMCampaignRequired(
    utm_source,
    utm_medium,
    utm_campaign,
    utm_term,
    utm_content
  );

  if (campaignRequiredResult !== true) {
    errors.push({
      field: 'utm_campaign',
      message: campaignRequiredResult,
    });
  }

  // Throw all validation errors together
  if (errors.length > 0) {
    throw new ValidationError({
      errors,
    });
  }

  return data;
};
