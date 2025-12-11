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
/**
 * Valid enrollment statuses
 * Workflow: pending → confirmed → completed
 * Or: any → cancelled/withdrawn
 * Once completed, cannot change to other status
 */
export declare const VALID_ENROLLMENT_STATUSES: readonly ["pending", "confirmed", "waitlisted", "cancelled", "completed", "withdrawn"];
export type EnrollmentStatus = typeof VALID_ENROLLMENT_STATUSES[number];
/**
 * Valid payment statuses
 */
export declare const VALID_PAYMENT_STATUSES: readonly ["pending", "partial", "paid", "refunded", "waived"];
export type PaymentStatus = typeof VALID_PAYMENT_STATUSES[number];
/**
 * Valid financial aid statuses
 */
export declare const VALID_FINANCIAL_AID_STATUSES: readonly ["none", "pending", "approved", "rejected"];
export type FinancialAidStatus = typeof VALID_FINANCIAL_AID_STATUSES[number];
/**
 * Base enrollment data schema (for creation)
 */
export declare const enrollmentCreateSchema: z.ZodObject<{
    student: z.ZodNumber;
    course_run: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["pending", "confirmed", "waitlisted", "cancelled", "completed", "withdrawn"]>>;
    payment_status: z.ZodDefault<z.ZodEnum<["pending", "partial", "paid", "refunded", "waived"]>>;
    total_amount: z.ZodNumber;
    amount_paid: z.ZodDefault<z.ZodNumber>;
    financial_aid_applied: z.ZodDefault<z.ZodBoolean>;
    financial_aid_amount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    financial_aid_status: z.ZodOptional<z.ZodEnum<["none", "pending", "approved", "rejected"]>>;
    attendance_percentage: z.ZodOptional<z.ZodNumber>;
    final_grade: z.ZodOptional<z.ZodNumber>;
    certificate_issued: z.ZodDefault<z.ZodBoolean>;
    certificate_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    cancellation_reason: z.ZodOptional<z.ZodString>;
    enrolled_at: z.ZodOptional<z.ZodString>;
    confirmed_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    cancelled_at: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    status: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn";
    student: number;
    course_run: number;
    payment_status: "paid" | "pending" | "partial" | "refunded" | "waived";
    total_amount: number;
    amount_paid: number;
    financial_aid_applied: boolean;
    certificate_issued: boolean;
    notes?: string | undefined;
    created_by?: number | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    student: number;
    course_run: number;
    total_amount: number;
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>;
/**
 * Enrollment update schema (for updates)
 * More permissive than create, but with business logic constraints
 */
export declare const enrollmentUpdateSchema: z.ZodObject<{
    student: z.ZodOptional<z.ZodNumber>;
    course_run: z.ZodOptional<z.ZodNumber>;
    status: z.ZodOptional<z.ZodEnum<["pending", "confirmed", "waitlisted", "cancelled", "completed", "withdrawn"]>>;
    payment_status: z.ZodOptional<z.ZodEnum<["pending", "partial", "paid", "refunded", "waived"]>>;
    total_amount: z.ZodOptional<z.ZodNumber>;
    amount_paid: z.ZodOptional<z.ZodNumber>;
    financial_aid_applied: z.ZodOptional<z.ZodBoolean>;
    financial_aid_amount: z.ZodOptional<z.ZodNumber>;
    financial_aid_status: z.ZodOptional<z.ZodEnum<["none", "pending", "approved", "rejected"]>>;
    attendance_percentage: z.ZodOptional<z.ZodNumber>;
    final_grade: z.ZodOptional<z.ZodNumber>;
    certificate_issued: z.ZodOptional<z.ZodBoolean>;
    certificate_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    cancellation_reason: z.ZodOptional<z.ZodString>;
    enrolled_at: z.ZodOptional<z.ZodString>;
    confirmed_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    cancelled_at: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    student?: number | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    course_run?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    total_amount?: number | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    student?: number | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    course_run?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    total_amount?: number | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>;
/**
 * Refined schema with cross-field validation
 */
export declare const enrollmentRefinedSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    student: z.ZodNumber;
    course_run: z.ZodNumber;
    status: z.ZodDefault<z.ZodEnum<["pending", "confirmed", "waitlisted", "cancelled", "completed", "withdrawn"]>>;
    payment_status: z.ZodDefault<z.ZodEnum<["pending", "partial", "paid", "refunded", "waived"]>>;
    total_amount: z.ZodNumber;
    amount_paid: z.ZodDefault<z.ZodNumber>;
    financial_aid_applied: z.ZodDefault<z.ZodBoolean>;
    financial_aid_amount: z.ZodOptional<z.ZodDefault<z.ZodNumber>>;
    financial_aid_status: z.ZodOptional<z.ZodEnum<["none", "pending", "approved", "rejected"]>>;
    attendance_percentage: z.ZodOptional<z.ZodNumber>;
    final_grade: z.ZodOptional<z.ZodNumber>;
    certificate_issued: z.ZodDefault<z.ZodBoolean>;
    certificate_url: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    cancellation_reason: z.ZodOptional<z.ZodString>;
    enrolled_at: z.ZodOptional<z.ZodString>;
    confirmed_at: z.ZodOptional<z.ZodString>;
    completed_at: z.ZodOptional<z.ZodString>;
    cancelled_at: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodNumber>;
}, "strict", z.ZodTypeAny, {
    status: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn";
    student: number;
    course_run: number;
    payment_status: "paid" | "pending" | "partial" | "refunded" | "waived";
    total_amount: number;
    amount_paid: number;
    financial_aid_applied: boolean;
    certificate_issued: boolean;
    notes?: string | undefined;
    created_by?: number | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    student: number;
    course_run: number;
    total_amount: number;
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>, {
    status: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn";
    student: number;
    course_run: number;
    payment_status: "paid" | "pending" | "partial" | "refunded" | "waived";
    total_amount: number;
    amount_paid: number;
    financial_aid_applied: boolean;
    certificate_issued: boolean;
    notes?: string | undefined;
    created_by?: number | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    student: number;
    course_run: number;
    total_amount: number;
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>, {
    status: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn";
    student: number;
    course_run: number;
    payment_status: "paid" | "pending" | "partial" | "refunded" | "waived";
    total_amount: number;
    amount_paid: number;
    financial_aid_applied: boolean;
    certificate_issued: boolean;
    notes?: string | undefined;
    created_by?: number | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    student: number;
    course_run: number;
    total_amount: number;
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>, {
    status: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn";
    student: number;
    course_run: number;
    payment_status: "paid" | "pending" | "partial" | "refunded" | "waived";
    total_amount: number;
    amount_paid: number;
    financial_aid_applied: boolean;
    certificate_issued: boolean;
    notes?: string | undefined;
    created_by?: number | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}, {
    student: number;
    course_run: number;
    total_amount: number;
    status?: "cancelled" | "pending" | "completed" | "confirmed" | "waitlisted" | "withdrawn" | undefined;
    notes?: string | undefined;
    created_by?: number | undefined;
    payment_status?: "paid" | "pending" | "partial" | "refunded" | "waived" | undefined;
    amount_paid?: number | undefined;
    financial_aid_applied?: boolean | undefined;
    financial_aid_amount?: number | undefined;
    financial_aid_status?: "none" | "pending" | "approved" | "rejected" | undefined;
    enrolled_at?: string | undefined;
    confirmed_at?: string | undefined;
    completed_at?: string | undefined;
    cancelled_at?: string | undefined;
    attendance_percentage?: number | undefined;
    final_grade?: number | undefined;
    certificate_issued?: boolean | undefined;
    certificate_url?: string | undefined;
    cancellation_reason?: string | undefined;
}>;
/**
 * Validates enrollment status transition
 * @param currentStatus - Current enrollment status
 * @param newStatus - Desired new status
 * @returns true if transition is allowed, false otherwise
 */
export declare function isValidStatusTransition(currentStatus: EnrollmentStatus, newStatus: EnrollmentStatus): boolean;
/**
 * Calculates payment status based on amounts
 * @param amountPaid - Amount paid by student
 * @param totalAmount - Total amount due
 * @returns Calculated payment status
 */
export declare function calculatePaymentStatus(amountPaid: number, totalAmount: number): PaymentStatus;
/**
 * Validates that all financial amounts are consistent
 * @param data - Enrollment data to validate
 * @returns Validation result with error message if invalid
 */
export declare function validateFinancialAmounts(data: {
    total_amount: number;
    amount_paid: number;
    financial_aid_amount?: number;
}): {
    valid: boolean;
    error?: string;
};
/**
 * Validates academic tracking fields
 * @param data - Academic data to validate
 * @returns Validation result with error message if invalid
 */
export declare function validateAcademicData(data: {
    attendance_percentage?: number;
    final_grade?: number;
}): {
    valid: boolean;
    error?: string;
};
/**
 * Type guard to check if a value is a valid enrollment status
 */
export declare function isValidEnrollmentStatus(value: string): value is EnrollmentStatus;
/**
 * Type guard to check if a value is a valid payment status
 */
export declare function isValidPaymentStatus(value: string): value is PaymentStatus;
/**
 * Type guard to check if a value is a valid financial aid status
 */
export declare function isValidFinancialAidStatus(value: string): value is FinancialAidStatus;
export type EnrollmentCreateInput = z.infer<typeof enrollmentCreateSchema>;
export type EnrollmentUpdateInput = z.infer<typeof enrollmentUpdateSchema>;
//# sourceMappingURL=Enrollments.validation.d.ts.map