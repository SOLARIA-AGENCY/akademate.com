/**
 * Leads Collection - Hooks
 *
 * This module exports all hooks for the Leads collection.
 *
 * Hook execution order:
 * 1. beforeValidate: captureConsentMetadata, validateLeadRelationships, preventDuplicateLead, calculateLeadScore
 * 2. validate: Payload's built-in validation
 * 3. beforeChange: (none currently)
 * 4. afterChange: triggerLeadCreatedJob
 * 5. afterRead: (none currently)
 *
 * GDPR Compliance:
 * - captureConsentMetadata: Records when and where consent was given
 * - All hooks log actions for audit trail
 *
 * Data Quality:
 * - validateLeadRelationships: Ensures referential integrity
 * - preventDuplicateLead: Reduces spam and improves data quality
 * - calculateLeadScore: Auto-scores leads for prioritization
 *
 * Async Processing:
 * - triggerLeadCreatedJob: Queues background jobs for external integrations
 */

export { captureConsentMetadata } from './captureConsentMetadata';
export { validateLeadRelationships } from './validateLeadRelationships';
export { preventDuplicateLead } from './preventDuplicateLead';
export { calculateLeadScore } from './calculateLeadScore';
export { triggerLeadCreatedJob } from './triggerLeadCreatedJob';
