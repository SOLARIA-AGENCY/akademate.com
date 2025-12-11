/**
 * Enrollments Collection - Validation Schemas and Constants
 *
 * This file contains:
 * - Valid enum values for status fields
 * - Zod schemas for comprehensive validation
 * - Reusable validation constants
 *
 * Used by:
 * - Enrollments.ts (field validation)
 * - Hooks (business logic validation)
 * - Tests (validation testing)
 */

import { z } from 'zod';

// ============================================================================
// VALID ENUM VALUES
// ============================================================================

/**
 * Valid enrollment statuses
 * Workflow: pending → confirmed → completed
 * Or: any → cancelled/withdrawn
 * Once completed, cannot change to other status
 */
export const VALID_ENROLLMENT_STATUSES = [
  'pending',
  'confirmed',
  'waitlisted',
  'cancelled',
  'completed',
  'withdrawn',
] as const;

export type EnrollmentStatus = typeof VALID_ENROLLMENT_STATUSES[number];

/**
 * Valid payment statuses
 */
export const VALID_PAYMENT_STATUSES = [
  'pending',
  'partial',
  'paid',
  'refunded',
  'waived',
] as const;

export type PaymentStatus = typeof VALID_PAYMENT_STATUSES[number];

/**
 * Valid financial aid statuses
 */
export const VALID_FINANCIAL_AID_STATUSES = [
  'none',
  'pending',
  'approved',
  'rejected',
] as const;

export type FinancialAidStatus = typeof VALID_FINANCIAL_AID_STATUSES[number];

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * Base enrollment data schema (for creation)
 */
export const enrollmentCreateSchema = z.object({
  // Required relationships
  student: z.number().int().positive({
    message: 'Student ID is required and must be a positive integer',
  }),
  course_run: z.number().int().positive({
    message: 'Course Run ID is required and must be a positive integer',
  }),

  // Enrollment status
  status: z.enum(VALID_ENROLLMENT_STATUSES).default('pending'),

  // Payment information
  payment_status: z.enum(VALID_PAYMENT_STATUSES).default('pending'),
  total_amount: z.number().nonnegative({
    message: 'Total amount must be non-negative',
  }),
  amount_paid: z.number().nonnegative({
    message: 'Amount paid must be non-negative',
  }).default(0),

  // Financial aid (optional)
  financial_aid_applied: z.boolean().default(false),
  financial_aid_amount: z.number().nonnegative({
    message: 'Financial aid amount must be non-negative',
  }).default(0).optional(),
  financial_aid_status: z.enum(VALID_FINANCIAL_AID_STATUSES).optional(),

  // Academic tracking (optional)
  attendance_percentage: z.number().min(0).max(100, {
    message: 'Attendance percentage must be between 0 and 100',
  }).optional(),
  final_grade: z.number().min(0).max(100, {
    message: 'Final grade must be between 0 and 100',
  }).optional(),

  // Certificate (optional, system-managed)
  certificate_issued: z.boolean().default(false),
  certificate_url: z.string().url({
    message: 'Certificate URL must be a valid URL',
  }).optional(),

  // Internal notes (optional)
  notes: z.string().optional(),
  cancellation_reason: z.string().optional(),

  // Dates (system-managed, should not be manually set)
  enrolled_at: z.string().datetime().optional(),
  confirmed_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  cancelled_at: z.string().datetime().optional(),

  // Audit (system-managed)
  created_by: z.number().int().positive().optional(),
}).strict(); // Reject unknown fields

/**
 * Enrollment update schema (for updates)
 * More permissive than create, but with business logic constraints
 */
export const enrollmentUpdateSchema = z.object({
  // Relationships (usually immutable, but schema allows for flexibility)
  student: z.number().int().positive().optional(),
  course_run: z.number().int().positive().optional(),

  // Enrollment status
  status: z.enum(VALID_ENROLLMENT_STATUSES).optional(),

  // Payment information
  payment_status: z.enum(VALID_PAYMENT_STATUSES).optional(),
  total_amount: z.number().nonnegative().optional(),
  amount_paid: z.number().nonnegative().optional(),

  // Financial aid
  financial_aid_applied: z.boolean().optional(),
  financial_aid_amount: z.number().nonnegative().optional(),
  financial_aid_status: z.enum(VALID_FINANCIAL_AID_STATUSES).optional(),

  // Academic tracking
  attendance_percentage: z.number().min(0).max(100).optional(),
  final_grade: z.number().min(0).max(100).optional(),

  // Certificate
  certificate_issued: z.boolean().optional(),
  certificate_url: z.string().url().optional(),

  // Internal notes
  notes: z.string().optional(),
  cancellation_reason: z.string().optional(),

  // Timestamps (immutable, but schema allows - hooks will enforce)
  enrolled_at: z.string().datetime().optional(),
  confirmed_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  cancelled_at: z.string().datetime().optional(),

  // Audit
  created_by: z.number().int().positive().optional(),
}).strict();

/**
 * Refined schema with cross-field validation
 */
export const enrollmentRefinedSchema = enrollmentCreateSchema.refine(
  (data) => {
    // amount_paid must not exceed total_amount
    if (data.amount_paid > data.total_amount) {
      return false;
    }
    return true;
  },
  {
    message: 'Amount paid cannot exceed total amount',
    path: ['amount_paid'],
  }
).refine(
  (data) => {
    // financial_aid_amount must not exceed total_amount
    if (data.financial_aid_amount && data.financial_aid_amount > data.total_amount) {
      return false;
    }
    return true;
  },
  {
    message: 'Financial aid amount cannot exceed total amount',
    path: ['financial_aid_amount'],
  }
).refine(
  (data) => {
    // If financial_aid_applied is true, financial_aid_status is required
    if (data.financial_aid_applied && !data.financial_aid_status) {
      return false;
    }
    return true;
  },
  {
    message: 'Financial aid status is required when financial aid is applied',
    path: ['financial_aid_status'],
  }
);

// ============================================================================
// VALIDATION HELPER FUNCTIONS
// ============================================================================

/**
 * Validates enrollment status transition
 * @param currentStatus - Current enrollment status
 * @param newStatus - Desired new status
 * @returns true if transition is allowed, false otherwise
 */
export function isValidStatusTransition(
  currentStatus: EnrollmentStatus,
  newStatus: EnrollmentStatus
): boolean {
  // Once completed, cannot change to other status
  if (currentStatus === 'completed' && newStatus !== 'completed') {
    return false;
  }

  // All other transitions are allowed
  // pending → confirmed → completed (happy path)
  // Any status → cancelled/withdrawn (exceptional cases)
  return true;
}

/**
 * Calculates payment status based on amounts
 * @param amountPaid - Amount paid by student
 * @param totalAmount - Total amount due
 * @returns Calculated payment status
 */
export function calculatePaymentStatus(
  amountPaid: number,
  totalAmount: number
): PaymentStatus {
  if (amountPaid === 0) {
    return 'pending';
  }

  if (amountPaid >= totalAmount) {
    return 'paid';
  }

  return 'partial';
}

/**
 * Validates that all financial amounts are consistent
 * @param data - Enrollment data to validate
 * @returns Validation result with error message if invalid
 */
export function validateFinancialAmounts(data: {
  total_amount: number;
  amount_paid: number;
  financial_aid_amount?: number;
}): { valid: boolean; error?: string } {
  // amount_paid cannot be negative
  if (data.amount_paid < 0) {
    return { valid: false, error: 'Amount paid cannot be negative' };
  }

  // total_amount cannot be negative
  if (data.total_amount < 0) {
    return { valid: false, error: 'Total amount cannot be negative' };
  }

  // amount_paid cannot exceed total_amount
  if (data.amount_paid > data.total_amount) {
    return { valid: false, error: 'Amount paid cannot exceed total amount' };
  }

  // financial_aid_amount cannot be negative
  if (data.financial_aid_amount !== undefined && data.financial_aid_amount < 0) {
    return { valid: false, error: 'Financial aid amount cannot be negative' };
  }

  // financial_aid_amount cannot exceed total_amount
  if (data.financial_aid_amount !== undefined && data.financial_aid_amount > data.total_amount) {
    return { valid: false, error: 'Financial aid amount cannot exceed total amount' };
  }

  return { valid: true };
}

/**
 * Validates academic tracking fields
 * @param data - Academic data to validate
 * @returns Validation result with error message if invalid
 */
export function validateAcademicData(data: {
  attendance_percentage?: number;
  final_grade?: number;
}): { valid: boolean; error?: string } {
  // Attendance percentage must be 0-100
  if (data.attendance_percentage !== undefined) {
    if (data.attendance_percentage < 0 || data.attendance_percentage > 100) {
      return { valid: false, error: 'Attendance percentage must be between 0 and 100' };
    }
  }

  // Final grade must be 0-100
  if (data.final_grade !== undefined) {
    if (data.final_grade < 0 || data.final_grade > 100) {
      return { valid: false, error: 'Final grade must be between 0 and 100' };
    }
  }

  return { valid: true };
}

/**
 * Type guard to check if a value is a valid enrollment status
 */
export function isValidEnrollmentStatus(value: string): value is EnrollmentStatus {
  return VALID_ENROLLMENT_STATUSES.includes(value as EnrollmentStatus);
}

/**
 * Type guard to check if a value is a valid payment status
 */
export function isValidPaymentStatus(value: string): value is PaymentStatus {
  return VALID_PAYMENT_STATUSES.includes(value as PaymentStatus);
}

/**
 * Type guard to check if a value is a valid financial aid status
 */
export function isValidFinancialAidStatus(value: string): value is FinancialAidStatus {
  return VALID_FINANCIAL_AID_STATUSES.includes(value as FinancialAidStatus);
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
export type EnrollmentUpdateInput = z.infer<typeof enrollmentUpdateSchema>;
