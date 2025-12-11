/**
 * Campaigns Collection - Hooks
 *
 * This module exports all hook functions for the Campaigns collection.
 *
 * Hook Execution Order:
 * 1. beforeValidate: validateCampaignDates, validateCampaignTargets, validateUTMParameters
 * 2. [Payload's built-in validation]
 * 3. beforeChange: trackCampaignCreator
 * 4. [Database write]
 * 5. afterRead: calculateCampaignMetrics
 *
 * Security Patterns Applied:
 * - SP-001: Immutable Fields (trackCampaignCreator + field-level access control)
 * - SP-004: No PII/Business Intelligence Logging (all hooks)
 */

export { trackCampaignCreator } from './trackCampaignCreator';
export { validateCampaignDates } from './validateCampaignDates';
export { validateCampaignTargets } from './validateCampaignTargets';
export { validateUTMParameters } from './validateUTMParameters';
export { calculateCampaignMetrics } from './calculateCampaignMetrics';
