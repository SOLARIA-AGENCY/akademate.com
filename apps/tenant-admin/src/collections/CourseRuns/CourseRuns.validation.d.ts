/**
 * CourseRuns Collection - Zod Validation Schemas
 *
 * This module provides Zod schemas for validating CourseRun data.
 * These schemas are used by hooks to ensure data integrity.
 */
import { z } from 'zod';
/**
 * Valid weekday values for schedule_days array
 */
export declare const VALID_WEEKDAYS: readonly ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
export type Weekday = typeof VALID_WEEKDAYS[number];
/**
 * Valid status values for course run workflow
 */
export declare const VALID_STATUSES: readonly ["draft", "published", "enrollment_open", "enrollment_closed", "in_progress", "completed", "cancelled"];
export type CourseRunStatus = typeof VALID_STATUSES[number];
/**
 * Schema for validating date logic
 */
export declare const dateValidationSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    start_date: z.ZodEffects<z.ZodString, string, string>;
    end_date: z.ZodEffects<z.ZodString, string, string>;
    enrollment_deadline: z.ZodOptional<z.ZodEffects<z.ZodString, string, string>>;
}, "strip", z.ZodTypeAny, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}>, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}>, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}, {
    start_date: string;
    end_date: string;
    enrollment_deadline?: string | undefined;
}>;
/**
 * Schema for validating time logic
 */
export declare const timeValidationSchema: z.ZodEffects<z.ZodEffects<z.ZodObject<{
    schedule_time_start: z.ZodOptional<z.ZodString>;
    schedule_time_end: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}>, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}>, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}, {
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
}>;
/**
 * Schema for validating schedule days
 */
export declare const scheduleDaysSchema: z.ZodEffects<z.ZodOptional<z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">>, ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined, ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined>;
/**
 * Schema for validating capacity logic
 */
export declare const capacityValidationSchema: z.ZodEffects<z.ZodEffects<z.ZodEffects<z.ZodObject<{
    max_students: z.ZodDefault<z.ZodNumber>;
    min_students: z.ZodDefault<z.ZodNumber>;
    current_enrollments: z.ZodDefault<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    max_students: number;
    min_students: number;
    current_enrollments: number;
}, {
    max_students?: number | undefined;
    min_students?: number | undefined;
    current_enrollments?: number | undefined;
}>, {
    max_students: number;
    min_students: number;
    current_enrollments: number;
}, {
    max_students?: number | undefined;
    min_students?: number | undefined;
    current_enrollments?: number | undefined;
}>, {
    max_students: number;
    min_students: number;
    current_enrollments: number;
}, {
    max_students?: number | undefined;
    min_students?: number | undefined;
    current_enrollments?: number | undefined;
}>, {
    max_students: number;
    min_students: number;
    current_enrollments: number;
}, {
    max_students?: number | undefined;
    min_students?: number | undefined;
    current_enrollments?: number | undefined;
}>;
/**
 * Schema for validating price override
 */
export declare const priceValidationSchema: z.ZodObject<{
    price_override: z.ZodOptional<z.ZodNumber>;
}, "strip", z.ZodTypeAny, {
    price_override?: number | undefined;
}, {
    price_override?: number | undefined;
}>;
/**
 * Schema for validating status enum
 */
export declare const statusValidationSchema: z.ZodObject<{
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "enrollment_open", "enrollment_closed", "in_progress", "completed", "cancelled"]>>;
}, "strip", z.ZodTypeAny, {
    status: "cancelled" | "in_progress" | "completed" | "enrollment_open" | "draft" | "published" | "enrollment_closed";
}, {
    status?: "cancelled" | "in_progress" | "completed" | "enrollment_open" | "draft" | "published" | "enrollment_closed" | undefined;
}>;
/**
 * Complete CourseRun validation schema (for reference/documentation)
 * Note: This is for documentation purposes. Individual validation schemas are used in hooks.
 */
export declare const courseRunSchema: z.ZodObject<{
    course: z.ZodUnion<[z.ZodNumber, z.ZodString]>;
    start_date: z.ZodString;
    end_date: z.ZodString;
    campus: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    enrollment_deadline: z.ZodOptional<z.ZodString>;
    schedule_days: z.ZodOptional<z.ZodArray<z.ZodEnum<["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"]>, "many">>;
    schedule_time_start: z.ZodOptional<z.ZodString>;
    schedule_time_end: z.ZodOptional<z.ZodString>;
    max_students: z.ZodDefault<z.ZodNumber>;
    min_students: z.ZodDefault<z.ZodNumber>;
    current_enrollments: z.ZodDefault<z.ZodNumber>;
    status: z.ZodDefault<z.ZodEnum<["draft", "published", "enrollment_open", "enrollment_closed", "in_progress", "completed", "cancelled"]>>;
    price_override: z.ZodOptional<z.ZodNumber>;
    financial_aid_available: z.ZodDefault<z.ZodBoolean>;
    instructor_name: z.ZodOptional<z.ZodString>;
    instructor_bio: z.ZodOptional<z.ZodString>;
    notes: z.ZodOptional<z.ZodString>;
    created_by: z.ZodOptional<z.ZodUnion<[z.ZodNumber, z.ZodString]>>;
    createdAt: z.ZodOptional<z.ZodString>;
    updatedAt: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status: "cancelled" | "in_progress" | "completed" | "enrollment_open" | "draft" | "published" | "enrollment_closed";
    course: string | number;
    financial_aid_available: boolean;
    start_date: string;
    end_date: string;
    max_students: number;
    min_students: number;
    current_enrollments: number;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    notes?: string | undefined;
    created_by?: string | number | undefined;
    campus?: string | number | undefined;
    enrollment_deadline?: string | undefined;
    schedule_days?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined;
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
    price_override?: number | undefined;
    instructor_name?: string | undefined;
    instructor_bio?: string | undefined;
}, {
    course: string | number;
    start_date: string;
    end_date: string;
    status?: "cancelled" | "in_progress" | "completed" | "enrollment_open" | "draft" | "published" | "enrollment_closed" | undefined;
    createdAt?: string | undefined;
    updatedAt?: string | undefined;
    notes?: string | undefined;
    financial_aid_available?: boolean | undefined;
    created_by?: string | number | undefined;
    campus?: string | number | undefined;
    enrollment_deadline?: string | undefined;
    schedule_days?: ("monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday")[] | undefined;
    schedule_time_start?: string | undefined;
    schedule_time_end?: string | undefined;
    max_students?: number | undefined;
    min_students?: number | undefined;
    current_enrollments?: number | undefined;
    price_override?: number | undefined;
    instructor_name?: string | undefined;
    instructor_bio?: string | undefined;
}>;
export type CourseRunData = z.infer<typeof courseRunSchema>;
/**
 * Helper function to validate weekday
 */
export declare function isValidWeekday(day: string): day is Weekday;
/**
 * Helper function to validate status
 */
export declare function isValidStatus(status: string): status is CourseRunStatus;
/**
 * Helper function to format validation errors
 */
export declare function formatValidationError(error: z.ZodError): string;
//# sourceMappingURL=CourseRuns.validation.d.ts.map