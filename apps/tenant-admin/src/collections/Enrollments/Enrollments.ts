import type { CollectionConfig } from 'payload';
import {
  canCreateEnrollment,
  canReadEnrollments,
  canUpdateEnrollment,
  canDeleteEnrollment,
} from './access';
import {
  validateEnrollmentRelationships,
  validateEnrollmentCapacity,
  trackEnrollmentCreator,
  captureEnrollmentTimestamps,
  validateFinancialData,
  updateCourseRunEnrollmentCount,
} from './hooks';
import {
  VALID_ENROLLMENT_STATUSES,
  VALID_PAYMENT_STATUSES,
  VALID_FINANCIAL_AID_STATUSES,
} from './Enrollments.validation';

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
export const Enrollments: CollectionConfig = {
  slug: 'enrollments',

  labels: {
    singular: 'Enrollment',
    plural: 'Enrollments',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['student', 'course_run', 'status', 'payment_status', 'amount_paid', 'total_amount'],
    group: 'Academic',
    description: 'Student enrollments in course runs with payment and academic tracking',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateEnrollment, // Asesor, Marketing, Gestor, Admin
    read: canReadEnrollments, // All authenticated users
    update: canUpdateEnrollment, // Asesor, Marketing (limited), Gestor, Admin
    delete: canDeleteEnrollment, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // REQUIRED RELATIONSHIPS
    // ============================================================================

    {
      name: 'student',
      type: 'relationship',
      relationTo: 'leads', // NOTE: Using 'leads' as students for now. In production, use dedicated 'students' collection
      required: true,
      index: true,
      admin: {
        description: 'The student enrolling in the course run',
      },
      validate: (val: any) => {
        if (!val) return 'Student is required';
        return true;
      },
    },

    {
      name: 'course_run',
      type: 'relationship',
      relationTo: 'course-runs',
      required: true,
      index: true,
      admin: {
        description: 'The specific course run the student is enrolling in',
      },
      validate: (val: any) => {
        if (!val) return 'Course run is required';
        return true;
      },
    },

    // ============================================================================
    // ENROLLMENT STATUS WORKFLOW
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: VALID_ENROLLMENT_STATUSES.map((status) => ({
        label: status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Current enrollment status',
      },
    },

    // ============================================================================
    // PAYMENT INFORMATION
    // ============================================================================

    {
      name: 'payment_status',
      type: 'select',
      required: true,
      defaultValue: 'pending',
      index: true,
      options: VALID_PAYMENT_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Payment status (auto-calculated based on amounts)',
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    {
      name: 'total_amount',
      type: 'number',
      required: true,
      min: 0,
      admin: {
        description: 'Total amount due for this enrollment',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return 'Total amount is required';
        if (val < 0) return 'Total amount cannot be negative';
        return true;
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    {
      name: 'amount_paid',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Amount already paid by student',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return true; // Has default
        if (val < 0) return 'Amount paid cannot be negative';
        return true;
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // FINANCIAL AID
    // ============================================================================

    {
      name: 'financial_aid_applied',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has the student applied for financial aid?',
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    {
      name: 'financial_aid_amount',
      type: 'number',
      defaultValue: 0,
      min: 0,
      admin: {
        description: 'Amount of financial aid approved/requested',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return true; // Optional
        if (val < 0) return 'Financial aid amount cannot be negative';
        return true;
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    {
      name: 'financial_aid_status',
      type: 'select',
      options: VALID_FINANCIAL_AID_STATUSES.map((status) => ({
        label: status.charAt(0).toUpperCase() + status.slice(1),
        value: status,
      })),
      admin: {
        description: 'Status of financial aid application',
      },
      // Field-level access: Admin and Gestor only
      access: {
        read: () => true,
        update: ({ req: { user } }) => {
          if (!user) return false;
          return ['admin', 'gestor'].includes(user.role);
        },
      },
    },

    // ============================================================================
    // DATES (System-Managed, Immutable)
    // ============================================================================

    {
      name: 'enrolled_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When the student enrolled (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // Immutable
      },
    },

    {
      name: 'confirmed_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When enrollment was confirmed (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // Immutable
      },
    },

    {
      name: 'completed_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When student completed the course (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // Immutable
      },
    },

    {
      name: 'cancelled_at',
      type: 'date',
      admin: {
        position: 'sidebar',
        description: 'When enrollment was cancelled or withdrawn (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
        date: {
          displayFormat: 'yyyy-MM-dd HH:mm:ss',
        },
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // Immutable
      },
    },

    // ============================================================================
    // ACADEMIC TRACKING
    // ============================================================================

    {
      name: 'attendance_percentage',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Student attendance percentage (0-100)',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return true; // Optional
        if (val < 0 || val > 100) return 'Attendance percentage must be between 0 and 100';
        return true;
      },
    },

    {
      name: 'final_grade',
      type: 'number',
      min: 0,
      max: 100,
      admin: {
        description: 'Student final grade (0-100)',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return true; // Optional
        if (val < 0 || val > 100) return 'Final grade must be between 0 and 100';
        return true;
      },
    },

    {
      name: 'certificate_issued',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Has a certificate been issued to the student?',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      // SECURITY Layer 2 (Security): Conditional access - once true, cannot change to false
      access: {
        read: () => true,
        update: ({ data }) => {
          // If already true, cannot be changed
          if (data?.certificate_issued === true) {
            return false;
          }
          return true; // Can be set to true
        },
      },
    },

    {
      name: 'certificate_url',
      type: 'text',
      admin: {
        description: 'URL to the issued certificate (immutable once set)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      validate: (val: any) => {
        if (!val) return true; // Optional
        // Basic URL validation
        try {
          new URL(val);
          return true;
        } catch {
          return 'Certificate URL must be a valid URL';
        }
      },
      // SECURITY Layer 2 (Security): Conditional access - once set, cannot be changed
      access: {
        read: () => true,
        update: ({ data }) => {
          // If already set, cannot be changed
          if (data?.certificate_url) {
            return false;
          }
          return true; // Can be set initially
        },
      },
    },

    // ============================================================================
    // INTERNAL NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this enrollment (not visible to students)',
      },
    },

    {
      name: 'cancellation_reason',
      type: 'textarea',
      admin: {
        description: 'Reason for cancellation or withdrawal',
        condition: (data: any) => {
          return data.status === 'cancelled' || data.status === 'withdrawn';
        },
      },
    },

    // ============================================================================
    // AUDIT TRAIL
    // ============================================================================

    {
      name: 'created_by',
      type: 'relationship',
      relationTo: 'users',
      index: true,
      admin: {
        position: 'sidebar',
        description: 'User who created this enrollment (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      // SECURITY Layer 2 (Security): Field-level access control
      access: {
        read: () => true,
        update: () => false, // Immutable after creation
      },
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
      validateEnrollmentRelationships, // 1. Validate foreign keys exist and course_run is enrollment_open
      validateEnrollmentCapacity, // 2. Check capacity and set waitlisted if full
      validateFinancialData, // 3. Validate financial amounts and auto-calculate payment_status
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      trackEnrollmentCreator, // 4. Auto-populate and protect created_by field
      captureEnrollmentTimestamps, // 5. Auto-capture lifecycle timestamps (enrolled_at, confirmed_at, etc.)
    ],

    /**
     * After Change: Triggered after successful create/update
     */
    afterChange: [
      updateCourseRunEnrollmentCount, // 6. Update course_run.current_enrollments based on status changes
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
