/**
 * Campaigns Collection - Validation Schemas
 *
 * This file contains all validation logic for the Campaigns collection using Zod.
 *
 * Validation Rules:
 * - UTM parameters: lowercase, alphanumeric, hyphens only
 * - Date range: end_date >= start_date (allow same day)
 * - Budget: >= 0, decimal with 2 places
 * - Targets: >= 0, target_enrollments <= target_leads
 * - Status workflow: archived is terminal state
 * - Name: unique across all campaigns
 */

import { z } from 'zod';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Valid campaign types
 */
export const VALID_CAMPAIGN_TYPES = [
  'email',
  'social',
  'paid_ads',
  'organic',
  'event',
  'referral',
  'other',
] as const;

/**
 * Valid campaign statuses
 */
export const VALID_CAMPAIGN_STATUSES = [
  'draft',
  'active',
  'paused',
  'completed',
  'archived',
] as const;

/**
 * Terminal statuses (cannot transition from these)
 */
export const TERMINAL_STATUSES = ['archived'] as const;

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

/**
 * UTM parameter validation schema
 * - Must be lowercase
 * - Alphanumeric characters and hyphens only
 * - No spaces or special characters
 */
export const utmParameterSchema = z
  .string()
  .regex(/^[a-z0-9-]+$/, {
    message: 'UTM parameters must be lowercase alphanumeric with hyphens only (no spaces or special characters)',
  })
  .min(1, 'UTM parameter cannot be empty')
  .max(255, 'UTM parameter must be 255 characters or less');

/**
 * Budget validation schema
 * - Must be >= 0
 * - Decimal with max 2 decimal places
 */
export const budgetSchema = z
  .number()
  .min(0, 'Budget must be greater than or equal to 0')
  .finite('Budget must be a valid number')
  .refine(
    (val) => {
      // Check for max 2 decimal places
      const decimalPlaces = (val.toString().split('.')[1] || '').length;
      return decimalPlaces <= 2;
    },
    {
      message: 'Budget must have at most 2 decimal places',
    }
  )
  .optional();

/**
 * Target leads validation schema
 * - Must be >= 0
 * - Integer only
 */
export const targetLeadsSchema = z
  .number()
  .int('Target leads must be an integer')
  .min(0, 'Target leads must be greater than or equal to 0')
  .optional();

/**
 * Target enrollments validation schema
 * - Must be >= 0
 * - Integer only
 */
export const targetEnrollmentsSchema = z
  .number()
  .int('Target enrollments must be an integer')
  .min(0, 'Target enrollments must be greater than or equal to 0')
  .optional();

/**
 * Campaign type validation schema
 */
export const campaignTypeSchema = z.enum(VALID_CAMPAIGN_TYPES, {
  errorMap: () => ({
    message: `Campaign type must be one of: ${VALID_CAMPAIGN_TYPES.join(', ')}`,
  }),
});

/**
 * Campaign status validation schema
 */
export const campaignStatusSchema = z.enum(VALID_CAMPAIGN_STATUSES, {
  errorMap: () => ({
    message: `Status must be one of: ${VALID_CAMPAIGN_STATUSES.join(', ')}`,
  }),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Validate UTM parameter format
 * Returns error message if invalid, true if valid
 */
export function validateUTMFormat(value: string | undefined): true | string {
  if (!value) return true; // Optional field

  const result = utmParameterSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate date range (end_date >= start_date)
 * Returns error message if invalid, true if valid
 */
export function validateDateRange(
  start_date: string | undefined,
  end_date: string | undefined
): true | string {
  if (!start_date || !end_date) return true; // Both optional

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (end < start) {
    return 'End date must be on or after start date';
  }

  return true;
}

/**
 * Validate that start_date is not in the past for draft campaigns
 * Returns error message if invalid, true if valid
 */
export function validateStartDateNotPast(
  start_date: string | undefined,
  status: string | undefined
): true | string {
  // Only validate for draft campaigns
  if (status !== 'draft') return true;
  if (!start_date) return true;

  const start = new Date(start_date);
  const now = new Date();

  // Reset time to start of day for comparison
  start.setHours(0, 0, 0, 0);
  now.setHours(0, 0, 0, 0);

  if (start < now) {
    return 'Start date cannot be in the past for draft campaigns';
  }

  return true;
}

/**
 * Validate target relationship (target_enrollments <= target_leads)
 * Returns error message if invalid, true if valid
 */
export function validateTargetRelationship(
  target_leads: number | undefined,
  target_enrollments: number | undefined
): true | string {
  // Both must be provided for validation
  if (target_leads === undefined || target_enrollments === undefined) return true;

  if (target_enrollments > target_leads) {
    return 'Target enrollments cannot exceed target leads';
  }

  return true;
}

/**
 * Validate status workflow (prevent transitions from archived)
 * Returns error message if invalid, true if valid
 */
export function validateStatusWorkflow(
  oldStatus: string | undefined,
  newStatus: string | undefined
): true | string {
  if (!oldStatus || !newStatus) return true;

  // Archived is a terminal status
  if (oldStatus === 'archived' && newStatus !== 'archived') {
    return 'Cannot transition from archived status (archived is a terminal state)';
  }

  return true;
}

/**
 * Validate UTM campaign is required if any other UTM parameter is provided
 * Returns error message if invalid, true if valid
 */
export function validateUTMCampaignRequired(
  utm_source: string | undefined,
  utm_medium: string | undefined,
  utm_campaign: string | undefined,
  utm_term: string | undefined,
  utm_content: string | undefined
): true | string {
  const hasAnyUTM = utm_source || utm_medium || utm_term || utm_content;

  if (hasAnyUTM && !utm_campaign) {
    return 'utm_campaign is required when any other UTM parameter is provided';
  }

  return true;
}

/**
 * Validate budget format
 * Returns error message if invalid, true if valid
 */
export function validateBudget(value: number | undefined): true | string {
  if (value === undefined) return true; // Optional

  const result = budgetSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate target leads format
 * Returns error message if invalid, true if valid
 */
export function validateTargetLeads(value: number | undefined): true | string {
  if (value === undefined) return true; // Optional

  const result = targetLeadsSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

/**
 * Validate target enrollments format
 * Returns error message if invalid, true if valid
 */
export function validateTargetEnrollments(value: number | undefined): true | string {
  if (value === undefined) return true; // Optional

  const result = targetEnrollmentsSchema.safeParse(value);
  if (!result.success) {
    return result.error.errors[0].message;
  }

  return true;
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type CampaignType = (typeof VALID_CAMPAIGN_TYPES)[number];
export type CampaignStatus = (typeof VALID_CAMPAIGN_STATUSES)[number];
