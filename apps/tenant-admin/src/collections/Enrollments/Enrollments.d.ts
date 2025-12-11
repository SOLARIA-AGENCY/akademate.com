import type { CollectionConfig } from 'payload';
/**
 * Enrollments Collection - Student Course Enrollment Management
 *
 * This collection manages student enrollments in course runs, including:
 * - Enrollment lifecycle (pending → confirmed → completed)
 * - Payment tracking and financial aid
 * - Academic tracking (attendance, grades, certificates)
 * - Capacity management (integrated with CourseRuns)
 *
 * Database: PostgreSQL table 'enrollments' (/infra/postgres/migrations/007_create_enrollments.sql)
 *
 * ============================================================================
 * ACCESS CONTROL MODEL (6-TIER RBAC)
 * ============================================================================
 *
 * Public (Unauthenticated):
 * - CREATE: NO ❌
 * - READ: NO ❌ (privacy protection)
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Lectura Role:
 * - CREATE: NO ❌
 * - READ: All enrollments (view only) ✅
 * - UPDATE: NO ❌
 * - DELETE: NO ❌
 *
 * Asesor Role:
 * - CREATE: YES (manual enrollment) ✅
 * - READ: All enrollments ✅
 * - UPDATE: Status changes, notes ✅
 * - DELETE: NO ❌
 *
 * Marketing Role:
 * - CREATE: YES (manual enrollment) ✅
 * - READ: All enrollments ✅
 * - UPDATE: Limited (notes only) ✅
 * - DELETE: NO ❌
 *
 * Gestor Role:
 * - CREATE: YES ✅
 * - READ: All enrollments ✅
 * - UPDATE: All fields except financial ✅
 * - DELETE: YES (with restrictions) ✅
 *
 * Admin Role:
 * - CREATE: YES ✅
 * - READ: All enrollments ✅
 * - UPDATE: All fields ✅
 * - DELETE: YES (unrestricted) ✅
 *
 * ============================================================================
 * KEY FEATURES
 * ============================================================================
 *
 * Enrollment Management:
 * - One student can enroll once per course run (unique constraint)
 * - Status workflow: pending → confirmed → completed
 * - Or: any status → cancelled/withdrawn
 * - Capacity validation and waitlist management
 *
 * Payment Tracking:
 * - Total amount, amount paid, payment status
 * - Auto-calculated payment status based on amounts
 * - Financial aid application and approval workflow
 * - Support for refunds and waivers
 *
 * Academic Tracking:
 * - Attendance percentage (0-100)
 * - Final grade (0-100)
 * - Certificate issuance and URL storage
 *
 * Real-Time Capacity:
 * - Validates against CourseRun.max_students
 * - Auto-updates CourseRun.current_enrollments
 * - Automatic waitlist when course is full
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
 * - enrolled_at, confirmed_at, completed_at, cancelled_at: System-managed timestamps
 *   - Layer 1 (UX): admin.readOnly = true
 *   - Layer 2 (Security): access.update = false
 *   - Layer 3 (Business Logic): Hook enforces immutability
 *
 * - certificate_issued: Once true, cannot be revoked
 *   - Layer 1 (UX): admin.readOnly = true (when true)
 *   - Layer 2 (Security): access.update = conditional
 *   - Layer 3 (Business Logic): Hook prevents change from true to false
 *
 * - certificate_url: Immutable once set
 *   - Layer 1 (UX): admin.readOnly = true (when set)
 *   - Layer 2 (Security): access.update = conditional
 *   - Layer 3 (Business Logic): Hook prevents changes
 *
 * Financial Data Protection:
 * - Payment fields have field-level access control
 * - Only Admin and Gestor can modify financial data
 * - Auto-calculation prevents manipulation
 *
 * PII Protection (SP-004):
 * - Students have PII (names, emails, etc.)
 * - NEVER log student details in hooks
 * - Use enrollment.id and student.id only in logs
 *
 * Data Integrity:
 * - Comprehensive validation hooks
 * - Relationship integrity enforced
 * - Unique constraint: one enrollment per student per course_run
 * - Cascade delete when student or course_run deleted
 */
export declare const Enrollments: CollectionConfig;
//# sourceMappingURL=Enrollments.d.ts.map