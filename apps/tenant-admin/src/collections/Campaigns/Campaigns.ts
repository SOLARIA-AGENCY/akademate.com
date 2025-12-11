import type { CollectionConfig } from 'payload';
import {
  canCreateCampaign,
  canReadCampaigns,
  canUpdateCampaign,
  canDeleteCampaign,
} from './access';
import {
  trackCampaignCreator,
  validateCampaignDates,
  validateCampaignTargets,
  validateUTMParameters,
  calculateCampaignMetrics,
} from './hooks';
import {
  VALID_CAMPAIGN_TYPES,
  VALID_CAMPAIGN_STATUSES,
  validateStatusWorkflow,
  validateBudget,
} from './Campaigns.validation';
import { tenantField } from '../../access/tenantAccess';

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
export const Campaigns: CollectionConfig = {
  slug: 'campaigns',

  labels: {
    singular: 'Campaign',
    plural: 'Campaigns',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'campaign_type', 'status', 'start_date', 'total_leads', 'conversion_rate'],
    group: 'Marketing',
    description: 'Marketing campaigns with UTM tracking, budget management, and ROI analytics',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateCampaign, // Marketing, Gestor, Admin
    read: canReadCampaigns, // All authenticated users (business intelligence protection)
    update: canUpdateCampaign, // Marketing (own only), Gestor, Admin
    delete: canDeleteCampaign, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // CAMPAIGN IDENTIFICATION (REQUIRED)
    // ============================================================================

    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 255,
      admin: {
        description: 'Unique campaign name (e.g., "Spring Enrollment 2025")',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Campaign name is required';
        if (val.length > 255) return 'Campaign name must be 255 characters or less';
        return true;
      },
    },

    {
      name: 'description',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Campaign description and objectives (optional)',
      },
    },

    {
      name: 'campaign_type',
      type: 'select',
      required: true,
      index: true,
      options: VALID_CAMPAIGN_TYPES.map((type) => ({
        label: type
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: type,
      })),
      admin: {
        description: 'Type of marketing campaign',
      },
      validate: (val: any) => {
        if (!val) return 'Campaign type is required';
        if (!VALID_CAMPAIGN_TYPES.includes(val)) {
          return `Campaign type must be one of: ${VALID_CAMPAIGN_TYPES.join(', ')}`;
        }
        return true;
      },
    },

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: VALID_CAMPAIGN_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Campaign status (draft → active → paused/completed → archived)',
      },
      validate: (val: any, { operation, originalDoc }) => {
        if (!val) return 'Status is required';
        if (!VALID_CAMPAIGN_STATUSES.includes(val)) {
          return `Status must be one of: ${VALID_CAMPAIGN_STATUSES.join(', ')}`;
        }

        // On update: validate status workflow
        if (operation === 'update' && originalDoc?.status) {
          const workflowResult = validateStatusWorkflow(originalDoc.status, val);
          if (workflowResult !== true) {
            return workflowResult;
          }
        }

        return true;
      },
    },

    // ============================================================================
    // COURSE RELATIONSHIP (OPTIONAL)
    // ============================================================================

    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      index: true,
      admin: {
        description: 'Optional: Specific course this campaign promotes',
      },
      // Note: On course delete, this field is SET NULL (campaign remains)
    },

    // ============================================================================
    // UTM PARAMETERS (TRACKING)
    // ============================================================================

    {
      name: 'utm_source',
      type: 'text',
      maxLength: 255,
      index: true,
      admin: {
        description: 'UTM Source: Traffic source (e.g., google, facebook, newsletter)',
      },
      // Validation handled in validateUTMParameters hook
    },

    {
      name: 'utm_medium',
      type: 'text',
      maxLength: 255,
      index: true,
      admin: {
        description: 'UTM Medium: Marketing medium (e.g., cpc, email, social)',
      },
      // Validation handled in validateUTMParameters hook
    },

    {
      name: 'utm_campaign',
      type: 'text',
      maxLength: 255,
      index: true,
      admin: {
        description: 'UTM Campaign: Campaign identifier (REQUIRED if any other UTM provided)',
      },
      // Validation handled in validateUTMParameters hook
    },

    {
      name: 'utm_term',
      type: 'text',
      maxLength: 255,
      admin: {
        description: 'UTM Term: Paid keywords (optional)',
      },
      // Validation handled in validateUTMParameters hook
    },

    {
      name: 'utm_content',
      type: 'text',
      maxLength: 255,
      admin: {
        description: 'UTM Content: Content variant for A/B testing (optional)',
      },
      // Validation handled in validateUTMParameters hook
    },

    // ============================================================================
    // DATE RANGE
    // ============================================================================

    {
      name: 'start_date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Campaign start date (REQUIRED)',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
      validate: (val: any) => {
        if (!val) return 'Start date is required';
        return true;
      },
      // Additional validation in validateCampaignDates hook
    },

    {
      name: 'end_date',
      type: 'date',
      admin: {
        description: 'Campaign end date (optional - leave blank for ongoing campaigns)',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
      // Validation handled in validateCampaignDates hook (must be >= start_date)
    },

    // ============================================================================
    // BUDGET & TARGETS (OPTIONAL)
    // ============================================================================

    {
      name: 'budget',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Campaign budget (optional, in EUR)',
      },
      validate: (val: any) => {
        if (val !== undefined && val !== null) {
          const result = validateBudget(val);
          if (result !== true) return result;
        }
        return true;
      },
    },

    {
      name: 'target_leads',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Target number of leads (optional)',
      },
      // Validation handled in validateCampaignTargets hook
    },

    {
      name: 'target_enrollments',
      type: 'number',
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Target number of enrollments (optional, must be <= target_leads)',
      },
      // Validation handled in validateCampaignTargets hook
    },

    // ============================================================================
    // SYSTEM-CALCULATED ANALYTICS (IMMUTABLE)
    // ============================================================================

    {
      name: 'total_leads',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-calculated: Total leads from this campaign (IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Calculated in calculateCampaignMetrics hook
    },

    {
      name: 'total_conversions',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-calculated: Leads that enrolled (IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Calculated in calculateCampaignMetrics hook
    },

    {
      name: 'conversion_rate',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-calculated: (conversions / leads) * 100 (IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Calculated in calculateCampaignMetrics hook
    },

    {
      name: 'cost_per_lead',
      type: 'number',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Auto-calculated: budget / total_leads (IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Calculated in calculateCampaignMetrics hook
    },

    // ============================================================================
    // INTERNAL NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this campaign (not visible to public)',
      },
    },

    // ============================================================================
    // AUDIT TRAIL (IMMUTABLE)
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'User who created this campaign (auto-populated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - created_by never changes
      },
      // SECURITY Layer 3 (Business Logic): trackCampaignCreator hook enforces immutability
    },

    /**
     * Tenant - Multi-tenant support
     * Associates campaign with a specific academy/organization
     */
    tenantField,
  ],

  /**
   * Hooks - Business logic and validation
   */
  hooks: {
    /**
     * Before Validate: Run before Payload's built-in validation
     * Order matters: Execute in sequence
     */
    beforeValidate: [
      validateCampaignDates, // 1. Validate date range (end >= start)
      validateCampaignTargets, // 2. Validate target_enrollments <= target_leads
      validateUTMParameters, // 3. Validate UTM format and requirements
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      {
        // Apply to created_by field only
        fieldName: 'created_by',
        hook: trackCampaignCreator,
      },
    ],

    /**
     * After Read: Run after database read, before returning to client
     */
    afterRead: [
      calculateCampaignMetrics, // Calculate real-time analytics metrics
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
