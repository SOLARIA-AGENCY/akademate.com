import type { CollectionConfig } from 'payload';
/**
 * Courses Collection
 *
 * Represents the course catalog for CEP Comunicación's educational programs.
 * Courses are categorized by cycles and can be offered at multiple campuses.
 *
 * Database: PostgreSQL table 'courses'
 *
 * Key Features:
 * - Multi-campus support (courses can be offered at multiple locations)
 * - Modality options: presencial (in-person), online, hibrido (blended)
 * - Financial aid availability tracking
 * - Featured course flag for homepage promotion
 * - Active/inactive status for soft delete functionality
 * - SEO metadata (meta_title, meta_description)
 * - Auto-slug generation from course name
 * - Creator tracking (created_by user_id)
 *
 * Relationships:
 * - Many-to-One: Course → Cycle (required)
 * - Many-to-Many: Course ↔ Campuses (optional, via array)
 * - Many-to-One: Course → User (created_by, optional)
 *
 * Access Control:
 * - Read: Public can see active courses; authenticated staff see all
 * - Create: Admin, Gestor, Marketing
 * - Update: Admin/Gestor (all), Marketing (own courses only)
 * - Delete: Admin, Gestor
 *
 * Validation:
 * - 3-layer validation: Payload fields + Zod schemas + PostgreSQL constraints
 * - Slug uniqueness enforced
 * - Relationship validation (cycle and campuses must exist)
 * - Price and duration must be positive
 * - Modality must be one of: presencial, online, hibrido
 */
export declare const Courses: CollectionConfig;
//# sourceMappingURL=Courses.d.ts.map