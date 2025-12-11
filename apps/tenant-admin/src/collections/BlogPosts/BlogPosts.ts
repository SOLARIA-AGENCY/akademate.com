import type { CollectionConfig } from 'payload';
import {
  canCreateBlogPost,
  canReadBlogPosts,
  canUpdateBlogPost,
  canDeleteBlogPost,
} from './access';
import {
  generateSlug,
  trackBlogPostAuthor,
  trackBlogPostCreator,
  setPublicationTimestamp,
  setArchivedTimestamp,
  calculateReadTime,
  validateBlogPostRelationships,
} from './hooks';
import {
  VALID_STATUSES,
  VALID_LANGUAGES,
  validateTitle,
  validateSlug,
  validateExcerpt,
  validateURL,
  validateTags,
  validateMetaTitle,
  validateMetaDescription,
  validateStatusWorkflow,
  validateRelatedCourses,
} from './BlogPosts.validation';

/**
 * BlogPosts Collection - Content Management for Blog Posts
 *
 * This collection manages blog posts with SEO optimization, rich content,
 * publication workflows, and related course linking.
 *
 * Database: PostgreSQL table 'blog_posts'
 *
 * ============================================================================
 * CRITICAL SECURITY NOTICE
 * ============================================================================
 *
 * This collection contains BLOG CONTENT:
 * - Blog post titles, content, excerpts (public-facing content)
 * - SEO metadata (meta_title, meta_description, og_image)
 * - Author tracking (ownership-based permissions)
 * - Publication workflow (draft → published → archived)
 *
 * SECURITY PATTERNS APPLIED:
 * - SP-001: Immutable Fields (author, created_by, published_at, archived_at, view_count, estimated_read_time)
 * - SP-004: No Sensitive Logging (no logging of titles, content, or user data)
 * - Ownership-Based Permissions (Marketing role)
 * - 3-Layer Defense on all immutable fields
 * - URL Security Validation (XSS, open redirect, newline injection prevention)
 *
 * PUBLIC ACCESS: Read published posts only (status=published)
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Published posts only ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All posts ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: All posts ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All posts ✅
 * - UPDATE: Own posts only (author = user.id) ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All posts ✅
 * - UPDATE: All posts ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All posts ✅
 * - UPDATE: All posts ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Content Management:
 * - Title, slug (auto-generated with Spanish normalization), excerpt
 * - Rich text content (Payload richText editor)
 * - Featured image and OG image URLs
 * - Featured flag for homepage
 * - Tags (max 10, lowercase, alphanumeric + hyphens)
 *
 * Publication Workflow:
 * - Status: draft → published → archived (terminal)
 * - Auto-set published_at timestamp (immutable once set)
 * - Auto-set archived_at timestamp (immutable once set)
 *
 * Author & Ownership:
 * - author: Auto-populated with user.id (immutable)
 * - created_by: Auto-populated with user.id (immutable)
 * - Ownership-based update permissions for Marketing
 *
 * SEO Optimization:
 * - meta_title (50-70 chars)
 * - meta_description (120-160 chars)
 * - og_image (social sharing)
 *
 * Related Content:
 * - related_courses (max 5 courses)
 * - Many-to-many relationship
 *
 * Analytics:
 * - view_count (system-managed, immutable)
 * - estimated_read_time (auto-calculated, immutable)
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS (CRITICAL)
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 *
 * 1. author (Author tracking):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): trackBlogPostAuthor hook enforces immutability
 *
 * 2. created_by (Creator tracking):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): trackBlogPostCreator hook enforces immutability
 *
 * 3. published_at (Publication timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): setPublicationTimestamp hook enforces immutability
 *
 * 4. archived_at (Archive timestamp):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): setArchivedTimestamp hook enforces immutability
 *
 * 5. view_count (Analytics metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): System-managed only (future implementation)
 *
 * 6. estimated_read_time (Auto-calculated metric):
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): calculateReadTime hook enforces system calculation
 *
 * Sensitive Data Handling (SP-004):
 * - NO logging of title, excerpt, content (blog content)
 * - NO logging of author names or emails (PII)
 * - NO logging of view_count or business metrics
 * - Only log post.id, user.id, status (non-sensitive)
 *
 * URL Security Validation:
 * - Block triple slashes (malformed URLs)
 * - Block newlines and control characters (XSS prevention)
 * - Block @ in hostname (open redirect prevention)
 * - RFC-compliant URL format validation
 *
 * Status Workflow Validation:
 * - Archived is a terminal status (cannot transition from archived)
 * - Enforced in field validation
 *
 * ============================================================================
 * RELATIONSHIPS
 * ============================================================================
 *
 * BlogPost → User (author, many-to-one):
 * - Auto-populated with user.id
 * - Immutable (ownership tracking)
 * - On user delete: SET NULL
 *
 * BlogPost → User (created_by, many-to-one):
 * - Auto-populated with user.id
 * - Immutable (audit trail)
 * - On user delete: SET NULL
 *
 * BlogPost ↔ Courses (related_courses, many-to-many):
 * - Optional relationship
 * - Max 5 courses per post
 * - On course delete: Remove from array
 */
export const BlogPosts: CollectionConfig = {
  slug: 'blog_posts',

  labels: {
    singular: 'Blog Post',
    plural: 'Blog Posts',
  },

  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'author', 'published_at', 'language', 'featured'],
    group: 'Content',
    description: 'Blog posts with SEO optimization and publication workflow',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateBlogPost, // Marketing, Gestor, Admin
    read: canReadBlogPosts, // Public (published only), All authenticated users
    update: canUpdateBlogPost, // Marketing (own only), Gestor, Admin
    delete: canDeleteBlogPost, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // POST IDENTIFICATION (REQUIRED)
    // ============================================================================

    {
      name: 'title',
      type: 'text',
      required: true,
      minLength: 10,
      maxLength: 120,
      index: true,
      admin: {
        description: 'Blog post title (10-120 characters)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Title is required';
        return validateTitle(val);
      },
    },

    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      maxLength: 150,
      admin: {
        description: 'URL-safe slug (auto-generated from title with Spanish normalization)',
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
      name: 'excerpt',
      type: 'textarea',
      required: true,
      minLength: 50,
      maxLength: 300,
      admin: {
        description: 'Blog post excerpt for previews (50-300 characters)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'Excerpt is required';
        return validateExcerpt(val);
      },
    },

    {
      name: 'content',
      type: 'richText',
      required: true,
      admin: {
        description: 'Main blog post content (rich text)',
      },
      validate: (val: any) => {
        if (!val || !Array.isArray(val) || val.length === 0) {
          return 'Content is required';
        }
        return true;
      },
    },

    // ============================================================================
    // ASSETS (OPTIONAL)
    // ============================================================================

    {
      name: 'featured_image',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Featured image URL (optional)',
      },
      validate: (val: string | undefined) => {
        return validateURL(val, 'Featured image');
      },
    },

    {
      name: 'og_image',
      type: 'text',
      maxLength: 500,
      admin: {
        description: 'Open Graph image for social sharing (optional)',
      },
      validate: (val: string | undefined) => {
        return validateURL(val, 'OG image');
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
    // AUTHOR & OWNERSHIP (IMMUTABLE)
    // ============================================================================

    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Post author (auto-populated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - author never changes
      },
      // SECURITY Layer 3 (Business Logic): trackBlogPostAuthor hook enforces immutability
      hooks: {
        beforeChange: [
          {
            hook: trackBlogPostAuthor,
          },
        ],
      },
    },

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'User who created this post (auto-populated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - created_by never changes
      },
      // SECURITY Layer 3 (Business Logic): trackBlogPostCreator hook enforces immutability
      hooks: {
        beforeChange: [
          {
            hook: trackBlogPostCreator,
          },
        ],
      },
    },

    // ============================================================================
    // TAGS (OPTIONAL)
    // ============================================================================

    {
      name: 'tags',
      type: 'text',
      hasMany: true,
      maxLength: 30,
      admin: {
        description: 'Post tags (max 10, lowercase, alphanumeric + hyphens)',
      },
      validate: (val: string[] | undefined) => {
        return validateTags(val);
      },
    },

    // ============================================================================
    // RELATED CONTENT (OPTIONAL)
    // ============================================================================

    {
      name: 'related_courses',
      type: 'relationship',
      relationTo: 'courses',
      hasMany: true,
      admin: {
        description: 'Related courses (max 5)',
      },
      validate: (val: string[] | undefined) => {
        return validateRelatedCourses(val);
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
        update: () => false, // IMMUTABLE - system-calculated only
      },
      // SECURITY Layer 3 (Business Logic): Future implementation for view tracking
    },

    {
      name: 'estimated_read_time',
      type: 'number',
      min: 1,
      admin: {
        position: 'sidebar',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        description: 'Estimated read time in minutes (auto-calculated, IMMUTABLE)',
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // IMMUTABLE - auto-calculated from content
      },
      // SECURITY Layer 3 (Business Logic): calculateReadTime hook enforces system calculation
      hooks: {
        beforeChange: [
          {
            hook: calculateReadTime,
          },
        ],
      },
    },

    // ============================================================================
    // SEO OPTIMIZATION (OPTIONAL)
    // ============================================================================

    {
      name: 'meta_title',
      type: 'text',
      minLength: 50,
      maxLength: 70,
      admin: {
        description: 'SEO meta title (50-70 characters for optimal search display)',
      },
      validate: (val: string | undefined) => {
        return validateMetaTitle(val);
      },
    },

    {
      name: 'meta_description',
      type: 'textarea',
      minLength: 120,
      maxLength: 160,
      admin: {
        description: 'SEO meta description (120-160 characters for optimal search display)',
      },
      validate: (val: string | undefined) => {
        return validateMetaDescription(val);
      },
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
        if (!VALID_LANGUAGES.includes(val)) {
          return `Language must be one of: ${VALID_LANGUAGES.join(', ')}`;
        }
        return true;
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
      validateBlogPostRelationships, // Validate related courses exist and max 5
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
