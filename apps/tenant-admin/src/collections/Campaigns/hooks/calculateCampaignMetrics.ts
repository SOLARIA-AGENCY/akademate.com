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
export const calculateCampaignMetrics: CollectionAfterReadHook = async ({ doc, req }) => {
  // Skip if no doc or no payload context
  if (!doc || !req.payload) {
    return doc;
  }

  try {
    // Query total leads for this campaign
    const leadsResult = await req.payload.count({
      collection: 'leads',
      where: {
        campaign: {
          equals: doc.id,
        },
      },
    });

    const total_leads = leadsResult.totalDocs;

    // Query total conversions (leads with enrollments)
    // A lead is converted if they have at least one enrollment
    // PERFORMANCE FIX: Use single query with IN operator instead of N+1 queries
    let total_conversions = 0;

    if (total_leads > 0) {
      // First, get all lead IDs for this campaign (limit to reasonable number)
      const leadsForCampaign = await req.payload.find({
        collection: 'leads',
        where: {
          campaign: {
            equals: doc.id,
          },
        },
        limit: 10000, // Reasonable limit to prevent memory issues
        pagination: false,
      });

      const leadIds = leadsForCampaign.docs.map((lead) => lead.id);

      if (leadIds.length > 0) {
        // Single query to get all enrollments for these leads
        // Using 'in' operator to fetch all at once (not N queries)
        const enrollmentsResult = await req.payload.find({
          collection: 'enrollments',
          where: {
            student: {
              in: leadIds, // Single query with IN clause
            },
          },
          limit: 0, // We need all enrollments to count unique students
        });

        // Count unique students (each unique student = 1 conversion)
        // A lead may have multiple enrollments, but we count them once
        if (enrollmentsResult.docs && enrollmentsResult.docs.length > 0) {
          const uniqueStudents = new Set(
            enrollmentsResult.docs.map((enrollment: any) => enrollment.student)
          );
          total_conversions = uniqueStudents.size;
        }
      }
    }

    // Calculate conversion_rate (handle division by zero)
    let conversion_rate: number | undefined = undefined;
    if (total_leads > 0) {
      conversion_rate = Number(((total_conversions / total_leads) * 100).toFixed(2));
    }

    // Calculate cost_per_lead (handle division by zero)
    let cost_per_lead: number | undefined = undefined;
    if (doc.budget !== undefined && doc.budget !== null) {
      if (total_leads > 0) {
        cost_per_lead = Number((doc.budget / total_leads).toFixed(2));
      } else if (doc.budget === 0) {
        cost_per_lead = 0;
      }
      // else: cost_per_lead remains undefined (budget allocated but no leads yet)
    }

    // Attach calculated metrics to document
    // These are virtual fields (not stored in database)
    doc.total_leads = total_leads;
    doc.total_conversions = total_conversions;
    doc.conversion_rate = conversion_rate;
    doc.cost_per_lead = cost_per_lead;

    // Log (NO sensitive business intelligence)
    // SP-004: Only log campaign.id and non-sensitive flags
    console.log('[Campaign Metrics] Calculated', {
      campaignId: doc.id,
      hasLeads: total_leads > 0,
      hasConversions: total_conversions > 0,
    });

    return doc;
  } catch (error) {
    // Log error without exposing sensitive data
    console.error('[Campaign Metrics] Calculation failed', {
      campaignId: doc.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return doc with undefined metrics on error
    doc.total_leads = 0;
    doc.total_conversions = 0;
    doc.conversion_rate = undefined;
    doc.cost_per_lead = undefined;

    return doc;
  }
};
