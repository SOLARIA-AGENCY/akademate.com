import type { CollectionConfig } from 'payload';
/**
 * CourseRuns Collection - Course Instance Management
 *
 * This collection manages specific offerings/instances of courses, including:
 * - Scheduling (start/end dates, weekly schedule)
 * - Capacity management (min/max students, current enrollments)
 * - Status workflow (draft → published → enrollment_open → in_progress → completed)
 * - Campus assignment
 * - Pricing overrides
 * - Instructor details
 *
 * Database: PostgreSQL table 'course_runs' (/infra/postgres/migrations/006_create_course_runs.sql)
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: Only published/enrollment_open runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All active runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: NO ❌
 * - READ: All runs ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: Own runs only ✅ (created_by = user.id)
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: All runs ✅
 * - DELETE: YES ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All runs ✅
 * - UPDATE: All runs ✅
 * - DELETE: YES ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Course Instance Management:
 * - Each CourseRun represents a specific offering of a Course
 * - Multiple runs can exist for the same course
 * - Tracks scheduling, capacity, and enrollment status
 *
 * Scheduling:
 * - Start/end dates with validation (end > start)
 * - Enrollment deadline (must be before start date)
 * - Weekly schedule (days + time slots)
 *
 * Capacity Tracking:
 * - Min/max students with validation (max > min)
 * - Current enrollment count (system-managed, not manually editable)
 * - Capacity-based business logic support
 *
 * Status Workflow:
 * - draft: Initial state, not visible to public
 * - published: Visible to public, not yet accepting enrollments
 * - enrollment_open: Accepting student enrollments
 * - enrollment_closed: No longer accepting enrollments
 * - in_progress: Course run has started
 * - completed: Course run has finished
 * - cancelled: Course run cancelled
 *
 * Pricing Flexibility:
 * - Can override course default price
 * - Financial aid availability flag
 *
 * Multi-campus Support:
 * - Optional campus assignment
 * - Supports online-only courses (no campus)
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
 * - current_enrollments: Only enrollment system can modify
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook prevents manual changes
 *
 * Ownership-Based Permissions:
 * - Marketing users can only update course runs they created
 * - Enforced via created_by field match in access control
 *
 * Data Integrity:
 * - Comprehensive validation hooks for dates, times, capacity
 * - Relationship validation ensures referential integrity
 * - No PII in logs (no personal data collected in this collection)
 */
export declare const CourseRuns: CollectionConfig;
//# sourceMappingURL=CourseRuns.d.ts.map