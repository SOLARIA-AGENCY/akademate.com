import type { CollectionBeforeValidateHook } from 'payload';
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
export declare const validateUTMParameters: CollectionBeforeValidateHook;
//# sourceMappingURL=validateUTMParameters.d.ts.map