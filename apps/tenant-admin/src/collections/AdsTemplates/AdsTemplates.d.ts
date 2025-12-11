import type { CollectionConfig } from 'payload';
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
export declare const AdsTemplates: CollectionConfig;
//# sourceMappingURL=AdsTemplates.d.ts.map