import type { CollectionConfig } from 'payload';
import {
  canCreateAdsTemplate,
  canReadAdsTemplates,
  canUpdateAdsTemplate,
  canDeleteAdsTemplate,
} from './access';
import {
  trackTemplateCreator,
  setArchivedTimestamp,
  validateTemplateContent,
  validateAssetURLs,
  validateTagsHook,
} from './hooks';
import {
  VALID_TEMPLATE_TYPES,
  VALID_STATUSES,
  VALID_TONES,
  VALID_LANGUAGES,
  validateTemplateName,
  validateStatusWorkflow,
} from './AdsTemplates.validation';

/**
 * AdsTemplates Collection - Reusable Marketing Ad Templates
 *
 * This collection manages reusable ad templates for marketing campaigns
 * (email templates, social media posts, display ads, landing page copy, etc.).
 *
 * Database: PostgreSQL table 'ads_templates'
 *
 * ============================================================================
 * CRITICAL SECURITY NOTICE
 * ============================================================================
 *
 * This collection contains CONFIDENTIAL MARKETING ASSETS:
 * - Marketing copy and creative content (headline, body_copy, CTA)
 * - Strategic messaging (tone, target_audience)
 * - Asset URLs (may contain tracking parameters)
 * - Template usage patterns (competitive intelligence)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (created_by, version, usage_count, last_used_at, archived_at)
 * - SP-004: Sensitive Data Handling (NO logging of copy, URLs, tags)
 * - Ownership-Based Permissions (Marketing role)
 * - 3-Layer Defense on all immutable fields
 *
 * PUBLIC ACCESS DENIED - Marketing asset protection
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: NO ❌ (confidential marketing assets)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: YES ✅ (view only)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: YES ✅ (view for reference)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅ (primary users)
 * - READ: YES ✅ (all templates)
 * - UPDATE: YES (own templates only - ownership-based) ✅
 * - DELETE: NO ❌ (use active=false for soft delete)
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: YES ✅
 * - UPDATE: YES (all templates) ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: YES ✅
 * - UPDATE: YES (all templates) ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Template Management:
 * - Name, description, type (email, social_post, display_ad, etc.)
 * - Status workflow: draft → active → archived (terminal)
 * - Optional campaign relationship
 * - Multi-language support (es, en, ca)
 *
 * Template Content:
 * - headline: Ad headline/subject line (max 100 chars)
 * - body_copy: Main ad copy (richtext)
 * - call_to_action: CTA text (max 50 chars)
 * - cta_url: CTA destination URL
 *
 * Asset Management:
 * - primary_image_url, secondary_image_url
 * - video_url, thumbnail_url
 * - All URLs validated (http/https only)
 *
 * Template Metadata:
 * - target_audience: Target demographic (textarea)
 * - tone: Ad tone (professional, casual, urgent, friendly, educational, promotional)
 * - tags: Template tags (max 10, lowercase, alphanumeric + hyphens)
 *
 * Versioning & Tracking:
 * - version: Version number (immutable, starts at 1)
 * - usage_count: System-tracked (read-only)
 * - last_used_at: Last usage timestamp (system-tracked)
 *
 * Soft Delete:
 * - active: Boolean flag (default: true)
 * - archived_at: Timestamp when archived (auto-set)
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
 *   - Layer 3 (Business Logic): trackTemplateCreator hook enforces immutability
 *
 * 2. version (Version tracking):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Set on create, immutable thereafter
 *
 * 3. usage_count (System-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): System-managed only
 *
 * 4. last_used_at (System-calculated timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): System-managed only
 *
 * 5. archived_at (Archive timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): setArchivedTimestamp hook enforces immutability
 *
 * Sensitive Data Handling (SP-004):
 * - NO logging of headline, body_copy, call_to_action (confidential marketing copy)
 * - NO logging of URLs (may contain tracking parameters)
 * - NO logging of tags (marketing strategy)
 * - Only log template.id, template_type, status (non-sensitive)
 *
 * Ownership-Based Permissions:
 * - Marketing role: Can only update templates where created_by = user.id
 * - Prevents privilege escalation
 * - Gestor/Admin: Can update any template
 *
 * Status Workflow Validation:
 * - Archived is a terminal status (cannot transition from archived)
 * - Enforced in field validation
 *
 * ============================================================================
 * RELATIONSHIPS
 * ============================================================================
 *
 * AdsTemplate → Campaign (optional, many-to-one):
 * - A template can be associated with one specific campaign
 * - Or be general (campaign = null)
 * - On campaign delete: SET NULL (template remains)
 *
 * AdsTemplate → User (created_by, many-to-one):
 * - Tracks who created the template
 * - Used for ownership-based permissions
 * - On user delete: SET NULL
 */
export const AdsTemplates: CollectionConfig = {
  slug: 'ads_templates',

  labels: {
    singular: 'Ad Template',
    plural: 'Ad Templates',
  },

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'template_type', 'status', 'language', 'created_by', 'version'],
    group: 'Marketing',
    description: 'Reusable ad templates for marketing campaigns (email, social, display ads)',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateAdsTemplate, // Marketing, Gestor, Admin
    read: canReadAdsTemplates, // All authenticated users
    update: canUpdateAdsTemplate, // Marketing (own only), Gestor, Admin
    delete: canDeleteAdsTemplate, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // TEMPLATE IDENTIFICATION (REQUIRED)
    // ============================================================================

    {
      name: 'name',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 100,
      admin: {
        description: 'Unique template name (e.g., "Spring Email Template 2025")',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Template name is required';
        return validateTemplateName(val);
      },
    },

    {
      name: 'description',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Template description and usage notes (optional)',
      },
    },

    {
      name: 'template_type',
      type: 'select',
      required: true,
      index: true,
      options: VALID_TEMPLATE_TYPES.map((type) => ({
        label: type
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: type,
      })),
      admin: {
        description: 'Type of marketing template',
      },
      validate: (val: any) => {
        if (!val) return 'Template type is required';
        if (!VALID_TEMPLATE_TYPES.includes(val)) {
          return `Template type must be one of: ${VALID_TEMPLATE_TYPES.join(', ')}`;
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
      options: VALID_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Template status (draft → active → archived)',
      },
      validate: (val: any, { operation, originalDoc }) => {
        if (!val) return 'Status is required';
        if (!VALID_STATUSES.includes(val)) {
          return `Status must be one of: ${VALID_STATUSES.join(', ')}`;
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
    // CAMPAIGN RELATIONSHIP (OPTIONAL)
    // ============================================================================

    {
      name: 'campaign',
      type: 'relationship',
      relationTo: 'campaigns',
      index: true,
      admin: {
        description: 'Optional: Specific campaign this template is for',
      },
      // Note: On campaign delete, this field is SET NULL (template remains)
    },

    // ============================================================================
    // TEMPLATE CONTENT (REQUIRED)
    // ============================================================================

    {
      name: 'headline',
      type: 'text',
      required: true,
      maxLength: 100,
      admin: {
        description: 'Ad headline or email subject line (max 100 characters)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Headline is required';
        if (val.length > 100) return 'Headline must be 100 characters or less';
        return true;
      },
    },

    {
      name: 'body_copy',
      type: 'richText',
      required: true,
      admin: {
        description: 'Main ad copy or email body (rich text)',
      },
      validate: (val: any) => {
        if (!val) return 'Body copy is required';
        return true;
      },
    },

    {
      name: 'call_to_action',
      type: 'text',
      maxLength: 50,
      admin: {
        description: 'Call-to-action text (e.g., "Enroll Now") - max 50 characters',
      },
    },

    {
      name: 'cta_url',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Call-to-action destination URL (optional)',
      },
      // Validation handled in validateAssetURLs hook
    },

    // ============================================================================
    // ASSET MANAGEMENT (OPTIONAL)
    // ============================================================================

    {
      name: 'primary_image_url',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Main image/creative URL (optional)',
      },
      // Validation handled in validateAssetURLs hook
    },

    {
      name: 'secondary_image_url',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Secondary image URL (optional)',
      },
      // Validation handled in validateAssetURLs hook
    },

    {
      name: 'video_url',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Video asset URL (optional)',
      },
      // Validation handled in validateAssetURLs hook
    },

    {
      name: 'thumbnail_url',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Thumbnail preview URL (optional)',
      },
      // Validation handled in validateAssetURLs hook
    },

    // ============================================================================
    // TEMPLATE METADATA
    // ============================================================================

    {
      name: 'target_audience',
      type: 'textarea',
      maxLength: 1000,
      admin: {
        description: 'Target demographic/audience description (optional)',
      },
    },

    {
      name: 'tone',
      type: 'select',
      required: true,
      defaultValue: 'professional',
      options: VALID_TONES.map((tone) => ({
        label: tone.charAt(0).toUpperCase() + tone.slice(1),
        value: tone,
      })),
      admin: {
        description: 'Ad tone and style',
      },
      validate: (val: any) => {
        if (!val) return 'Tone is required';
        if (!VALID_TONES.includes(val)) {
          return `Tone must be one of: ${VALID_TONES.join(', ')}`;
        }
        return true;
      },
    },

    {
      name: 'language',
      type: 'select',
      required: true,
      defaultValue: 'es',
      index: true,
      options: VALID_LANGUAGES.map((lang) => ({
        label: lang === 'es' ? 'Spanish' : lang === 'en' ? 'English' : 'Catalan',
        value: lang,
      })),
      admin: {
        description: 'Content language',
      },
      validate: (val: any) => {
        if (!val) return 'Language is required';
        if (!VALID_LANGUAGES.includes(val)) {
          return `Language must be one of: ${VALID_LANGUAGES.join(', ')}`;
        }
        return true;
      },
    },

    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      maxLength: 50,
      admin: {
        description: 'Template tags for filtering/search (max 10, lowercase, alphanumeric + hyphens)',
      },
      // Validation handled in validateTags hook
    },

    // ============================================================================
    // VERSIONING & TRACKING (IMMUTABLE - SYSTEM-MANAGED)
    // ============================================================================

    {
      name: 'version',
      type: 'number',
      defaultValue: 1,
      min: 1,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Template version number (immutable, starts at 1)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - cannot change version after creation
      },
      // SECURITY Layer 3 (Business Logic): No hook needed (set once on create)
    },

    {
      name: 'usage_count',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'How many times this template has been used (system-tracked, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Future implementation for campaign usage tracking
    },

    {
      name: 'last_used_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Last usage timestamp (system-tracked, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-tracked only
      },
      // SECURITY Layer 3 (Business Logic): Future implementation for campaign usage tracking
    },

    // ============================================================================
    // SOFT DELETE (IMMUTABLE TIMESTAMP)
    // ============================================================================

    {
      name: 'active',
      type: 'checkbox',
      defaultValue: true,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Active status (false = soft deleted)',
      },
    },

    {
      name: 'archived_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'When template was archived (auto-set, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - auto-set by hook
      },
      // SECURITY Layer 3 (Business Logic): setArchivedTimestamp hook enforces immutability
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
        description: 'User who created this template (auto-populated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - created_by never changes
      },
      // SECURITY Layer 3 (Business Logic): trackTemplateCreator hook enforces immutability
    },
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
      validateTemplateContent, // 1. Validate headline/CTA lengths
      validateAssetURLs, // 2. Validate all URL fields
      validateTagsHook, // 3. Validate tag format and count
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      {
        // Apply to created_by field only
        fieldName: 'created_by',
        hook: trackTemplateCreator,
      },
      {
        // Apply to archived_at field only
        fieldName: 'archived_at',
        hook: setArchivedTimestamp,
      },
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
