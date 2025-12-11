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
/**
 * Valid campaign types
 */
export declare const VALID_CAMPAIGN_TYPES: readonly ["email", "social", "paid_ads", "organic", "event", "referral", "other"];
/**
 * Valid campaign statuses
 */
export declare const VALID_CAMPAIGN_STATUSES: readonly ["draft", "active", "paused", "completed", "archived"];
/**
 * Terminal statuses (cannot transition from these)
 */
export declare const TERMINAL_STATUSES: readonly ["archived"];
/**
 * UTM parameter validation schema
 * - Must be lowercase
 * - Alphanumeric characters and hyphens only
 * - No spaces or special characters
 */
export declare const utmParameterSchema: z.ZodString;
/**
 * Budget validation schema
 * - Must be >= 0
 * - Decimal with max 2 decimal places
 */
export declare const budgetSchema: z.ZodOptional<z.ZodEffects<z.ZodNumber, number, number>>;
/**
 * Target leads validation schema
 * - Must be >= 0
 * - Integer only
 */
export declare const targetLeadsSchema: z.ZodOptional<z.ZodNumber>;
/**
 * Target enrollments validation schema
 * - Must be >= 0
 * - Integer only
 */
export declare const targetEnrollmentsSchema: z.ZodOptional<z.ZodNumber>;
/**
 * Campaign type validation schema
 */
export declare const campaignTypeSchema: z.ZodEnum<["email", "social", "paid_ads", "organic", "event", "referral", "other"]>;
/**
 * Campaign status validation schema
 */
export declare const campaignStatusSchema: z.ZodEnum<["draft", "active", "paused", "completed", "archived"]>;
/**
 * Validate UTM parameter format
 * Returns error message if invalid, true if valid
 */
export declare function validateUTMFormat(value: string | undefined): true | string;
/**
 * Validate date range (end_date >= start_date)
 * Returns error message if invalid, true if valid
 */
export declare function validateDateRange(start_date: string | undefined, end_date: string | undefined): true | string;
/**
 * Validate that start_date is not in the past for draft campaigns
 * Returns error message if invalid, true if valid
 */
export declare function validateStartDateNotPast(start_date: string | undefined, status: string | undefined): true | string;
/**
 * Validate target relationship (target_enrollments <= target_leads)
 * Returns error message if invalid, true if valid
 */
export declare function validateTargetRelationship(target_leads: number | undefined, target_enrollments: number | undefined): true | string;
/**
 * Validate status workflow (prevent transitions from archived)
 * Returns error message if invalid, true if valid
 */
export declare function validateStatusWorkflow(oldStatus: string | undefined, newStatus: string | undefined): true | string;
/**
 * Validate UTM campaign is required if any other UTM parameter is provided
 * Returns error message if invalid, true if valid
 */
export declare function validateUTMCampaignRequired(utm_source: string | undefined, utm_medium: string | undefined, utm_campaign: string | undefined, utm_term: string | undefined, utm_content: string | undefined): true | string;
/**
 * Validate budget format
 * Returns error message if invalid, true if valid
 */
export declare function validateBudget(value: number | undefined): true | string;
/**
 * Validate target leads format
 * Returns error message if invalid, true if valid
 */
export declare function validateTargetLeads(value: number | undefined): true | string;
/**
 * Validate target enrollments format
 * Returns error message if invalid, true if valid
 */
export declare function validateTargetEnrollments(value: number | undefined): true | string;
export type CampaignType = (typeof VALID_CAMPAIGN_TYPES)[number];
export type CampaignStatus = (typeof VALID_CAMPAIGN_STATUSES)[number];
//# sourceMappingURL=Campaigns.validation.d.ts.map