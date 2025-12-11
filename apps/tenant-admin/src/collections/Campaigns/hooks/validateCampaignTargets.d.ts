import type { CollectionBeforeValidateHook } from 'payload';
/**
 * Hook: Validate Campaign Targets (beforeValidate)
 *
 * Purpose:
 * - Validate target_enrollments <= target_leads (if both provided)
 * - Validate target_leads >= 0
 * - Validate target_enrollments >= 0
 * - Validate targets are integers (no decimals)
 *
 * Validation Rules:
 * 1. Targets must be >= 0 (non-negative integers)
 * 2. If both provided: target_enrollments <= target_leads
 * 3. Equal targets allowed (100% conversion goal)
 * 4. Either target can be undefined (optional)
 *
 * Execution:
 * - Runs BEFORE Payload's built-in validation
 * - Runs BEFORE database write
 *
 * Security Considerations (SP-004):
 * - No business intelligence logging (targets are sensitive)
 * - Only log campaign.id and validation status
 */
export declare const validateCampaignTargets: CollectionBeforeValidateHook;
//# sourceMappingURL=validateCampaignTargets.d.ts.map