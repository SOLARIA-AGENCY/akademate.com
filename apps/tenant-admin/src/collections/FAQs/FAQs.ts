import type { CollectionConfig } from 'payload';
import {
  canCreateFAQ,
  canReadFAQs,
  canUpdateFAQ,
  canDeleteFAQ,
} from './access';
import {
  generateSlug,
  trackFAQCreator,
  setPublicationTimestamp,
  setArchivedTimestamp,
  validateFAQRelationships,
} from './hooks';
import {
  VALID_CATEGORIES,
  VALID_LANGUAGES,
  VALID_STATUSES,
  validateQuestion,
  validateSlug,
  validateAnswer,
  validateCategory,
  validateLanguage,
  validateStatus,
  validateKeywords,
  validateOrder,
  validateStatusWorkflow,
} from './FAQs.validation';

/**
 * FAQs Collection - Frequently Asked Questions Management
 *
 * This collection manages FAQ questions and answers with category organization,
 * multi-language support, publication workflow, and optional course linking.
 *
 * Database: PostgreSQL table 'faqs'
 *
 * ============================================================================
 * CRITICAL SECURITY NOTICE
 * ============================================================================
 *
 * This collection contains FAQ CONTENT:
 * - FAQ questions and answers (public-facing content)
 * - Category-based organization (courses, enrollment, payments, technical, general)
 * - Multi-language support (es, en, ca)
 * - Publication workflow (draft → published → archived)
 * - Creator tracking (created_by, immutable)
 * - View/helpful count tracking (system-managed, immutable)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (created_by, published_at, archived_at, view_count, helpful_count)
 * - SP-004: No Sensitive Logging (no logging of questions, answers, or user data)
 * - Ownership-Based Permissions (Marketing role)
 * - 3-Layer Defense on all immutable fields
 *
 * PUBLIC ACCESS: Read published FAQs only (status=published)
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Published FAQs only ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All FAQs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: All FAQs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All FAQs ✅
 * - UPDATE: Own FAQs only (created_by = user.id) ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All FAQs ✅
 * - UPDATE: All FAQs ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All FAQs ✅
 * - UPDATE: All FAQs ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Content Management:
 * - Question, slug (auto-generated with Spanish normalization), answer (richText)
 * - Category-based organization (5 categories)
 * - Multi-language support (es, en, ca)
 * - Featured flag for homepage
 * - Keywords for search optimization (max 10)
 * - Display order management
 *
 * Publication Workflow:
 * - Status: draft → published → archived (terminal)
 * - Auto-set published_at timestamp (immutable once set)
 * - Auto-set archived_at timestamp (immutable once set)
 *
 * Creator Tracking:
 * - created_by: Auto-populated with user.id (immutable)
 * - Ownership-based update permissions for Marketing
 *
 * Related Content:
 * - related_course (optional single course)
 * - Many-to-one relationship
 *
 * Analytics (System-Managed):
 * - view_count (system-tracked, immutable)
 * - helpful_count (user feedback, system-managed, immutable)
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS (CRITICAL)
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 *
 * 1. created_by (Creator tracking):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): trackFAQCreator hook enforces immutability
 *
 * 2. published_at (Publication timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): setPublicationTimestamp hook enforces immutability
 *
 * 3. archived_at (Archive timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): setArchivedTimestamp hook enforces immutability
 *
 * 4. view_count (Analytics metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): System-managed only (future implementation)
 *
 * 5. helpful_count (User feedback metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): System-managed only (future implementation)
 *
 * Sensitive Data Handling (SP-004):
 * - NO logging of question, answer (FAQ content)
 * - NO logging of user names or emails (PII)
 * - NO logging of view_count or helpful_count (metrics)
 * - Only log faq.id, user.id, status (non-sensitive)
 *
 * Status Workflow Validation:
 * - Archived is a terminal status (cannot transition from archived)
 * - Enforced in field validation
 *
 * ============================================================================
 * RELATIONSHIPS
 * ============================================================================
 *
 * FAQ → User (created_by, many-to-one):
 * - Auto-populated with user.id
 * - Immutable (audit trail)
 * - On user delete: SET NULL
 *
 * FAQ → Course (related_course, many-to-one, optional):
 * - Optional relationship
 * - On course delete: SET NULL
 */
export const FAQs: CollectionConfig = {
  slug: 'faqs',

  labels: {
    singular: 'FAQ',
    plural: 'FAQs',
  },

  admin: {
    useAsTitle: 'question',
    defaultColumns: ['question', 'category', 'status', 'language', 'featured', 'order'],
    group: 'Content',
    description: 'Frequently Asked Questions with category organization and multi-language support',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateFAQ, // Marketing, Gestor, Admin
    read: canReadFAQs, // Public (published only), All authenticated users
    update: canUpdateFAQ, // Marketing (own only), Gestor, Admin
    delete: canDeleteFAQ, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // FAQ IDENTIFICATION (REQUIRED)
    // ============================================================================

    {
      name: 'question',
      type: 'text',
      required: true,
      minLength: 10,
      maxLength: 200,
      index: true,
      admin: {
        description: 'FAQ question (10-200 characters)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Question is required';
        return validateQuestion(val);
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 100,
      admin: {
        description: 'URL-safe slug (auto-generated from question with Spanish normalization)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Slug is required';
        return validateSlug(val);
      },
      hooks: {
        beforeValidate: [generateSlug],
      },
    },

    {
      name: 'answer',
      type: 'richText',
      required: true,
      admin: {
        description: 'FAQ answer (rich text)',
      },
      validate: (val: any) => {
        if (!val || !Array.isArray(val) || val.length === 0) {
          return 'Answer is required';
        }
        return validateAnswer(val);
      },
    },

    // ============================================================================
    // CATEGORIZATION (REQUIRED)
    // ============================================================================

    {
      name: 'category',
      type: 'select',
      required: true,
      index: true,
      options: VALID_CATEGORIES.map((cat) => ({
        label: cat.charAt(0).toUpperCase() + cat.slice(1),
        value: cat,
      })),
      admin: {
        description: 'FAQ category (courses, enrollment, payments, technical, general)',
      },
      validate: (val: any) => {
        if (!val) return 'Category is required';
        return validateCategory(val);
      },
    },

    // ============================================================================
    // PUBLICATION WORKFLOW
    // ============================================================================

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
        description: 'Publication status (draft → published → archived)',
      },
      validate: (val: any, { operation, originalDoc }) => {
        if (!val) return 'Status is required';

        const statusResult = validateStatus(val);
        if (statusResult !== true) return statusResult;

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

    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      index: true,
      admin: {
        position: 'sidebar',
        description: 'Featured on homepage',
      },
    },

    {
      name: 'published_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Publication timestamp (auto-set, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - auto-set by hook
      },
      // SECURITY Layer 3 (Business Logic): setPublicationTimestamp hook enforces immutability
      hooks: {
        beforeChange: [
          {
            hook: setPublicationTimestamp,
          },
        ],
      },
    },

    {
      name: 'archived_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Archive timestamp (auto-set, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - auto-set by hook
      },
      // SECURITY Layer 3 (Business Logic): setArchivedTimestamp hook enforces immutability
      hooks: {
        beforeChange: [
          {
            hook: setArchivedTimestamp,
          },
        ],
      },
    },

    // ============================================================================
    // CREATOR TRACKING (IMMUTABLE)
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'User who created this FAQ (auto-populated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - created_by never changes
      },
      // SECURITY Layer 3 (Business Logic): trackFAQCreator hook enforces immutability
      hooks: {
        beforeChange: [
          {
            hook: trackFAQCreator,
          },
        ],
      },
    },

    // ============================================================================
    // SEARCH & ORGANIZATION (OPTIONAL)
    // ============================================================================

    {
      name: 'keywords',
      type: 'text',
      hasMany: true,
      maxLength: 50,
      admin: {
        description: 'Search keywords (max 10, each max 50 chars)',
      },
      validate: (val: string[] | undefined) => {
        return validateKeywords(val);
      },
    },

    {
      name: 'order',
      type: 'number',
      defaultValue: 0,
      min: 0,
      index: true,
      admin: {
        description: 'Display order (0 = first, higher numbers appear later)',
      },
      validate: (val: number | undefined) => {
        return validateOrder(val);
      },
    },

    // ============================================================================
    // RELATED CONTENT (OPTIONAL)
    // ============================================================================

    {
      name: 'related_course',
      type: 'relationship',
      relationTo: 'courses',
      admin: {
        description: 'Related course (optional)',
      },
    },

    // ============================================================================
    // ANALYTICS (SYSTEM-MANAGED, IMMUTABLE)
    // ============================================================================

    {
      name: 'view_count',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'View count (system-tracked, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-managed only
      },
      // SECURITY Layer 3 (Business Logic): Future implementation for view tracking
    },

    {
      name: 'helpful_count',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Helpful count (user feedback, system-managed, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - system-managed only
      },
      // SECURITY Layer 3 (Business Logic): Future implementation for helpful tracking
    },

    // ============================================================================
    // LANGUAGE (REQUIRED)
    // ============================================================================

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
        return validateLanguage(val);
      },
    },
  ],

  /**
   * Hooks - Business logic and validation
   */
  hooks: {
    /**
     * Before Validate: Run before Payload's built-in validation
     */
    beforeValidate: [
      validateFAQRelationships, // Validate related course exists (if provided)
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
