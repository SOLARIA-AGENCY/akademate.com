import type { CollectionConfig } from 'payload';
import {
  canCreateCourseRun,
  canReadCourseRuns,
  canUpdateCourseRun,
  canDeleteCourseRun,
} from './access';
import {
  validateCourseRunDates,
  validateCourseRunRelationships,
  trackCourseRunCreator,
  validateEnrollmentCapacity,
  generateCourseRunCode,
  captureCompletionSnapshot,
} from './hooks';
import { VALID_WEEKDAYS, VALID_STATUSES } from './CourseRuns.validation';
import { tenantField } from '../../access/tenantAccess';

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
export const CourseRuns: CollectionConfig = {
  slug: 'course-runs',

  labels: {
    singular: 'Course Run',
    plural: 'Course Runs',
  },

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['course', 'campus', 'start_date', 'end_date', 'status', 'current_enrollments', 'max_students'],
    group: 'Academic',
    description: 'Specific course offerings with scheduling, capacity, and enrollment tracking',
  },

  /**
   * Collection-level access control
   */
  access: {
    create: canCreateCourseRun, // Marketing, Gestor, Admin
    read: canReadCourseRuns, // Public (published only), Lectura (active), Asesor/Marketing/Gestor/Admin (all)
    update: canUpdateCourseRun, // Marketing (own), Gestor, Admin
    delete: canDeleteCourseRun, // Gestor, Admin only
  },

  fields: [
    // ============================================================================
    // REQUIRED RELATIONSHIPS
    // ============================================================================

    {
      name: 'course',
      type: 'relationship',
      relationTo: 'courses',
      required: true,
      index: true,
      admin: {
        description: 'The course being offered in this run',
      },
      validate: (val: any) => {
        if (!val) return 'Course is required';
        return true;
      },
    },

    // ============================================================================
    // OPTIONAL RELATIONSHIPS
    // ============================================================================

    {
      name: 'campus',
      type: 'relationship',
      relationTo: 'campuses',
      index: true,
      admin: {
        description: 'Campus where this course run takes place (optional for online courses)',
      },
    },

    // ============================================================================
    // UNIQUE CODE - Auto-generated
    // ============================================================================

    /**
     * Codigo - Unique auto-generated convocation code
     * Format: {CAMPUS_CODE}-{YEAR}-{SEQUENTIAL}
     * Examples: NOR-2025-001, SC-2025-012, SUR-2026-003
     */
    {
      name: 'codigo',
      type: 'text',
      required: true,
      unique: true,
      index: true,
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Código único auto-generado (ej: NOR-2025-001)',
      },
      validate: (val: string | undefined) => {
        if (!val) return 'El código es obligatorio';
        if (!/^[A-Z]{2,3}-\d{4}-\d{3}$/.test(val)) {
          return 'Formato inválido. Debe ser: CAMPUS-YEAR-001';
        }
        return true;
      },
    },

    // ============================================================================
    // SCHEDULING - Dates
    // ============================================================================

    {
      name: 'start_date',
      type: 'date',
      required: true,
      index: true,
      admin: {
        description: 'Date when the course run starts',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
      validate: (val: any) => {
        if (!val) return 'Start date is required';
        return true;
      },
    },

    {
      name: 'end_date',
      type: 'date',
      required: true,
      admin: {
        description: 'Date when the course run ends (must be after start_date)',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
      validate: (val: any) => {
        if (!val) return 'End date is required';
        return true;
      },
    },

    {
      name: 'enrollment_deadline',
      type: 'date',
      admin: {
        description: 'Last date to enroll (must be before start_date)',
        date: {
          displayFormat: 'yyyy-MM-dd',
        },
      },
    },

    // ============================================================================
    // SCHEDULING - Weekly Schedule
    // ============================================================================

    {
      name: 'schedule_days',
      type: 'select',
      hasMany: true,
      options: VALID_WEEKDAYS.map((day) => ({
        label: day.charAt(0).toUpperCase() + day.slice(1),
        value: day,
      })),
      admin: {
        description: 'Days of the week when classes occur',
      },
    },

    {
      name: 'schedule_time_start',
      type: 'text',
      admin: {
        description: 'Class start time (HH:MM:SS format, e.g., 09:00:00)',
      },
      validate: (val: any) => {
        if (!val) return true; // Optional field
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(val)) {
          return 'Time must be in HH:MM:SS format (e.g., 09:00:00)';
        }
        return true;
      },
    },

    {
      name: 'schedule_time_end',
      type: 'text',
      admin: {
        description: 'Class end time (HH:MM:SS format, e.g., 13:00:00)',
      },
      validate: (val: any) => {
        if (!val) return true; // Optional field
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/;
        if (!timeRegex.test(val)) {
          return 'Time must be in HH:MM:SS format (e.g., 13:00:00)';
        }
        return true;
      },
    },

    // ============================================================================
    // CAPACITY MANAGEMENT
    // ============================================================================

    {
      name: 'max_students',
      type: 'number',
      required: true,
      defaultValue: 30,
      min: 1,
      admin: {
        description: 'Maximum number of students allowed (must be greater than min_students)',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return 'Max students is required';
        if (val < 1) return 'Max students must be at least 1';
        return true;
      },
    },

    {
      name: 'min_students',
      type: 'number',
      required: true,
      defaultValue: 5,
      min: 1,
      admin: {
        description: 'Minimum number of students required to run the course',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return 'Min students is required';
        if (val < 1) return 'Min students must be at least 1';
        return true;
      },
    },

    {
      name: 'current_enrollments',
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
      admin: {
        position: 'sidebar',
        description: 'Current number of enrolled students (auto-managed by enrollment system)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      // SECURITY Layer 2 (Security): Field-level access control prevents API manipulation
      access: {
        read: () => true,
        update: () => false, // Only enrollment system can modify via hooks
      },
    },

    // ============================================================================
    // STATUS WORKFLOW
    // ============================================================================

    {
      name: 'status',
      type: 'select',
      required: true,
      defaultValue: 'draft',
      index: true,
      options: VALID_STATUSES.map((status) => ({
        label: status
          .split('_')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' '),
        value: status,
      })),
      admin: {
        position: 'sidebar',
        description: 'Current status of the course run',
      },
    },

    // ============================================================================
    // PRICING
    // ============================================================================

    {
      name: 'price_override',
      type: 'number',
      min: 0,
      admin: {
        description: 'Override course default price (leave empty to use course price)',
      },
      validate: (val: any) => {
        if (val === undefined || val === null) return true; // Optional field
        if (val < 0) return 'Price override cannot be negative';
        return true;
      },
    },

    {
      name: 'financial_aid_available',
      type: 'checkbox',
      defaultValue: false,
      admin: {
        description: 'Is financial aid available for this course run?',
      },
    },

    // ============================================================================
    // INSTRUCTOR INFORMATION
    // ============================================================================

    {
      name: 'instructor',
      type: 'relationship',
      relationTo: 'staff',
      index: true,
      admin: {
        description: 'Professor assigned to teach this course run',
      },
      // Filter to show only professors (not administrativos)
      filterOptions: ({ data }) => {
        return {
          staff_type: { equals: 'profesor' },
          is_active: { equals: true },
        };
      },
    },

    // ============================================================================
    // INTERNAL NOTES
    // ============================================================================

    {
      name: 'notes',
      type: 'textarea',
      admin: {
        description: 'Internal notes about this course run (not visible to public)',
      },
    },

    // ============================================================================
    // COMPLETION SNAPSHOT - Data captured when course run completes
    // ============================================================================

    {
      name: 'completion_snapshot',
      type: 'group',
      admin: {
        description: 'Historical data captured when the course run was completed',
        condition: (data) => data.status === 'completed',
      },
      fields: [
        {
          name: 'final_student_count',
          type: 'number',
          admin: {
            description: 'Number of students who completed the course',
            readOnly: true,
          },
          access: {
            update: () => false, // Only set by system hook
          },
        },
        {
          name: 'final_occupation_percentage',
          type: 'number',
          admin: {
            description: 'Actual occupation percentage (final_student_count / max_students * 100)',
            readOnly: true,
          },
          access: {
            update: () => false,
          },
        },
        {
          name: 'final_price',
          type: 'number',
          admin: {
            description: 'Final price per student (for historical reference)',
            readOnly: true,
          },
          access: {
            update: () => false,
          },
        },
        {
          name: 'completed_at',
          type: 'date',
          admin: {
            description: 'Date when the course run was marked as completed',
            readOnly: true,
            date: {
              displayFormat: 'yyyy-MM-dd HH:mm:ss',
            },
          },
          access: {
            update: () => false,
          },
        },
      ],
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
        description: 'User who created this course run (auto-populated)',
        readOnly: true, // SECURITY Layer 1 (UX): UI protection
      },
      // SECURITY Layer 2 (Security): Field-level access control prevents API manipulation
      access: {
        read: () => true,
        update: () => false, // Immutable after creation
      },
    },

    /**
     * Tenant - Multi-tenant support
     * Associates course run with a specific academy/organization
     */
    tenantField,
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
      validateCourseRunDates, // 1. Validate date and time logic
      validateCourseRunRelationships, // 2. Validate foreign keys exist
      validateEnrollmentCapacity, // 3. Validate capacity constraints
    ],

    /**
     * Before Change: Run after validation, before database write
     */
    beforeChange: [
      generateCourseRunCode, // 4. Auto-generate unique convocation code
      trackCourseRunCreator, // 5. Auto-populate and protect created_by field
    ],

    /**
     * After Change: Triggered after successful create/update
     */
    afterChange: [
      captureCompletionSnapshot, // Capture final metrics when status changes to "completed"
      // Future: triggerCourseRunNotifications
      // Future: updateSearchIndex
    ],
  },

  /**
   * Timestamps - Automatically add createdAt and updatedAt
   */
  timestamps: true,
};
