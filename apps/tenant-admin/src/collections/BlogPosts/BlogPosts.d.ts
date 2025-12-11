import type { CollectionConfig } from 'payload';
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
export declare const BlogPosts: CollectionConfig;
//# sourceMappingURL=BlogPosts.d.ts.map