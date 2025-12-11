import type { CollectionConfig } from 'payload';
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
export declare const FAQs: CollectionConfig;
//# sourceMappingURL=FAQs.d.ts.map