import type { CollectionConfig } from 'payload';
/**
 * Campaigns Collection - Marketing Campaign Tracking & Analytics
 *
 * This collection manages marketing campaigns with UTM tracking, budget management,
 * and ROI analytics. Campaigns are used to track lead sources and conversion rates.
 *
 * Database: PostgreSQL table 'campaigns' (/infra/postgres/migrations/012_create_campaigns.sql)
 *
 * ============================================================================
 * CRITICAL SECURITY NOTICE
 * ============================================================================
 *
 * This collection contains BUSINESS INTELLIGENCE DATA:
 * - Budget information (financial data)
 * - ROI metrics (cost_per_lead, conversion_rate)
 * - Campaign performance data (total_leads, total_conversions)
 * - Strategic marketing information (UTM parameters, targets)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (created_by, system-calculated metrics)
 * - SP-004: Sensitive Data Handling (NO budget/ROI logging)
 * - Ownership-Based Permissions (Marketing role)
 *
 * PUBLIC ACCESS DENIED - Business intelligence protection
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: NO ❌ (business intelligence protection)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: YES ✅ (can view campaigns for reporting)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌ (advisors don't create campaigns)
 * - READ: YES ✅ (can see campaign attribution for leads)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅ (primary users)
 * - READ: YES ✅ (all campaigns)
 * - UPDATE: YES (own campaigns only - ownership-based) ✅
 * - DELETE: NO ❌ (use status='archived' instead)
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: YES ✅
 * - UPDATE: YES (all campaigns) ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: YES ✅
 * - UPDATE: YES (all campaigns) ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Campaign Management:
 * - Name, description, type (email, social, paid_ads, etc.)
 * - Status workflow: draft → active → paused/completed → archived
 * - Date range tracking (start_date, end_date)
 * - Optional course relationship (campaign for specific course)
 *
 * UTM Tracking:
 * - Full UTM parameter support (source, medium, campaign, term, content)
 * - Format validation (lowercase, alphanumeric, hyphens only)
 * - utm_campaign required if any UTM parameter provided
 *
 * Budget & Targets:
 * - Budget allocation (optional, decimal with 2 places)
 * - Target leads and target enrollments
 * - Validation: target_enrollments <= target_leads
 *
 * Analytics (System-Calculated):
 * - total_leads: Count of leads from this campaign
 * - total_conversions: Leads that enrolled
 * - conversion_rate: (conversions / leads) * 100
 * - cost_per_lead: budget / total_leads
 * - All metrics calculated on-the-fly (not stored)
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS (CRITICAL)
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 *
 * 1. created_by (User ownership tracking):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook enforces immutability
 *
 * 2. total_leads (System-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Calculated in afterRead hook
 *
 * 3. total_conversions (System-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Calculated in afterRead hook
 *
 * 4. conversion_rate (System-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Calculated in afterRead hook
 *
 * 5. cost_per_lead (System-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Calculated in afterRead hook
 *
 * Sensitive Data Handling (SP-004):
 * - NO logging of budget values
 * - NO logging of ROI metrics (cost_per_lead, conversion_rate)
 * - Only log campaign.id, status (non-sensitive)
 * - Hooks log only: campaignId, hasLeads (boolean flags)
 *
 * Ownership-Based Permissions:
 * - Marketing role: Can only update campaigns where created_by = user.id
 * - Prevents privilege escalation
 * - Gestor/Admin: Can update any campaign
 *
 * Status Workflow Validation:
 * - Archived is a terminal status (cannot transition from archived)
 * - Enforced in hooks
 *
 * ============================================================================
 * RELATIONSHIPS
 * ============================================================================
 *
 * Campaign → Course (optional, many-to-one):
 * - A campaign can promote one specific course
 * - Or be general (course = null)
 * - On course delete: SET NULL (campaign remains)
 *
 * Campaign → User (created_by, many-to-one):
 * - Tracks who created the campaign
 * - Used for ownership-based permissions
 * - On user delete: SET NULL
 *
 * Lead → Campaign (reverse, one-to-many):
 * - Leads reference campaigns for attribution
 * - Used to calculate total_leads metric
 *
 * ============================================================================
 * ANALYTICS CALCULATIONS
 * ============================================================================
 *
 * All metrics calculated in real-time via calculateCampaignMetrics hook:
 *
 * total_leads = COUNT(leads WHERE campaign_id = this_campaign)
 *
 * total_conversions = COUNT(leads WHERE campaign_id = this_campaign AND has_enrollment = true)
 *
 * conversion_rate = (total_conversions / total_leads) * 100
 *   - Returns undefined if total_leads = 0
 *   - Rounded to 2 decimal places
 *
 * cost_per_lead = budget / total_leads
 *   - Returns undefined if total_leads = 0
 *   - Returns 0 if budget = 0
 *   - Rounded to 2 decimal places
 */
export declare const Campaigns: CollectionConfig;
//# sourceMappingURL=Campaigns.d.ts.map