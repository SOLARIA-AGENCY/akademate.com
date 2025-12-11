import type { CollectionAfterReadHook } from 'payload';
/**
 * Hook: Calculate Campaign Metrics (afterRead)
 *
 * Purpose:
 * - Auto-calculate total_leads (count leads with this campaign)
 * - Auto-calculate total_conversions (count leads with enrollments)
 * - Auto-calculate conversion_rate (conversions / leads * 100)
 * - Auto-calculate cost_per_lead (budget / total_leads)
 * - Handle division by zero gracefully
 *
 * Metrics Calculated:
 * 1. total_leads: COUNT(leads WHERE campaign_id = this_campaign)
 * 2. total_conversions: COUNT(DISTINCT students in enrollments WHERE lead.campaign = this_campaign)
 * 3. conversion_rate: (total_conversions / total_leads) * 100 (percentage)
 * 4. cost_per_lead: budget / total_leads (cost per lead acquired)
 *
 * Division by Zero Handling:
 * - conversion_rate: undefined if total_leads = 0
 * - cost_per_lead: undefined if total_leads = 0, 0 if budget = 0
 *
 * Execution:
 * - Runs AFTER database read
 * - Calculates metrics on-the-fly (not stored in database)
 * - Ensures real-time accuracy
 *
 * Performance Optimization:
 * - Uses single query with IN operator to fetch all enrollments at once
 * - Avoids N+1 query pattern (was: 1 query per lead = N queries)
 * - Now: 3 queries total (1 for lead count, 1 for lead IDs, 1 for all enrollments)
 * - Handles up to 10,000 leads per campaign before pagination needed
 *
 * Security Considerations (SP-001 + SP-004):
 * - System-calculated fields are read-only (Layer 2: access.update = false)
 * - No business intelligence logging (budget, conversion rates not logged)
 * - Only log campaign.id and basic flags (hasLeads: boolean)
 * - NEVER log: budget, cost_per_lead, conversion_rate values
 */
export declare const calculateCampaignMetrics: CollectionAfterReadHook;
//# sourceMappingURL=calculateCampaignMetrics.d.ts.map