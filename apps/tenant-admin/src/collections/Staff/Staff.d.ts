import type { CollectionConfig } from 'payload';
/**
 * Staff Collection - Personal Management (Profesores y Administrativos)
 *
 * Manages all personnel (professors and administrative staff) across all campuses.
 * This collection supports two types of staff members:
 * - Profesores: Teaching staff assigned to course runs
 * - Administrativos: Administrative staff assigned to campuses
 *
 * Database: PostgreSQL table 'staff'
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Active professors only (name, bio, specialties) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All staff (basic info only) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: All staff ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: NO ❌
 * - READ: All staff ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All staff ✅
 * - UPDATE: YES ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Staff Types:
 * - Profesor: Teaching staff (assigned to course runs)
 * - Administrativo: Administrative staff (assigned to campuses)
 *
 * Personal Information:
 * - Full name, email, phone
 * - Biography/description
 * - Photo (media upload)
 * - Active/inactive status
 *
 * Specialties (Professors only):
 * - Multiple specialties (e.g., "Marketing Digital", "Diseño Gráfico")
 * - Used for filtering and assignment
 *
 * Campus Assignment:
 * - Each staff member assigned to a primary campus
 * - Professors can teach at multiple campuses (via course runs)
 * - Administrativos work at their assigned campus
 *
 * ============================================================================
 * SECURITY CONSIDERATIONS
 * ============================================================================
 *
 * Immutable Fields (SP-001: Defense in Depth):
 * - created_by: Auto-populated on create, immutable after creation
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook enforces immutability
 *
 * PII Protection:
 * - Email and phone not exposed in public API
 * - Personal data only visible to authenticated users with proper permissions
 * - No PII in application logs
 *
 * Data Integrity:
 * - Email validation (unique per staff member)
 * - Phone validation (Spanish format)
 * - Campus relationship validation
 * - Active status controls visibility
 */
export declare const Staff: CollectionConfig;
//# sourceMappingURL=Staff.d.ts.map