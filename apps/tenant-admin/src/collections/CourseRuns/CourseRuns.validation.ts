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
export const VALID_WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const;

export type Weekday = typeof VALID_WEEKDAYS[number];

/**
 * Valid status values for course run workflow
 */
export const VALID_STATUSES = [
  'draft',
  'published',
  'enrollment_open',
  'enrollment_closed',
  'in_progress',
  'completed',
  'cancelled',
] as const;

export type CourseRunStatus = typeof VALID_STATUSES[number];

/**
 * Schema for validating date logic
 */
export const dateValidationSchema = z
  .object({
    start_date: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'start_date must be a valid date' }
    ),
    end_date: z.string().refine(
      (val) => {
        const date = new Date(val);
        return !isNaN(date.getTime());
      },
      { message: 'end_date must be a valid date' }
    ),
    enrollment_deadline: z
      .string()
      .refine(
        (val) => {
          const date = new Date(val);
          return !isNaN(date.getTime());
        },
        { message: 'enrollment_deadline must be a valid date' }
      )
      .optional(),
  })
  .refine(
    (data) => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate > startDate;
    },
    {
      message: 'end_date must be after start_date',
      path: ['end_date'],
    }
  )
  .refine(
    (data) => {
      if (!data.enrollment_deadline) return true;
      const startDate = new Date(data.start_date);
      const enrollmentDeadline = new Date(data.enrollment_deadline);
      return enrollmentDeadline < startDate;
    },
    {
      message: 'enrollment_deadline must be before start_date',
      path: ['enrollment_deadline'],
    }
  );

/**
 * Schema for validating time logic
 */
export const timeValidationSchema = z
  .object({
    schedule_time_start: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
    schedule_time_end: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]$/).optional(),
  })
  .refine(
    (data) => {
      // If one is provided, both must be provided
      if (data.schedule_time_start && !data.schedule_time_end) {
        return false;
      }
      if (!data.schedule_time_start && data.schedule_time_end) {
        return false;
      }
      return true;
    },
    {
      message: 'Both schedule_time_start and schedule_time_end must be provided together',
      path: ['schedule_time_start'],
    }
  )
  .refine(
    (data) => {
      if (!data.schedule_time_start || !data.schedule_time_end) return true;

      const [startHour, startMin, startSec] = data.schedule_time_start.split(':').map(Number);
      const [endHour, endMin, endSec] = data.schedule_time_end.split(':').map(Number);

      const startSeconds = startHour * 3600 + startMin * 60 + startSec;
      const endSeconds = endHour * 3600 + endMin * 60 + endSec;

      return endSeconds > startSeconds;
    },
    {
      message: 'schedule_time_end must be after schedule_time_start',
      path: ['schedule_time_end'],
    }
  );

/**
 * Schema for validating schedule days
 */
export const scheduleDaysSchema = z
  .array(z.enum(VALID_WEEKDAYS))
  .optional()
  .refine(
    (days) => {
      if (!days) return true;
      // Check for duplicates
      const uniqueDays = new Set(days);
      return uniqueDays.size === days.length;
    },
    {
      message: 'schedule_days cannot contain duplicate weekdays',
    }
  );

/**
 * Schema for validating capacity logic
 */
export const capacityValidationSchema = z
  .object({
    max_students: z.number().int().positive().default(30),
    min_students: z.number().int().positive().default(5),
    current_enrollments: z.number().int().min(0).default(0),
  })
  .refine(
    (data) => {
      return data.max_students > data.min_students;
    },
    {
      message: 'max_students must be greater than min_students',
      path: ['max_students'],
    }
  )
  .refine(
    (data) => {
      return data.current_enrollments <= data.max_students;
    },
    {
      message: 'current_enrollments cannot exceed max_students',
      path: ['current_enrollments'],
    }
  )
  .refine(
    (data) => {
      return data.min_students > 0;
    },
    {
      message: 'min_students must be greater than 0',
      path: ['min_students'],
    }
  );

/**
 * Schema for validating price override
 */
export const priceValidationSchema = z.object({
  price_override: z
    .number()
    .min(0, { message: 'price_override cannot be negative' })
    .optional(),
});

/**
 * Schema for validating status enum
 */
export const statusValidationSchema = z.object({
  status: z.enum(VALID_STATUSES).default('draft'),
});

/**
 * Complete CourseRun validation schema (for reference/documentation)
 * Note: This is for documentation purposes. Individual validation schemas are used in hooks.
 */
export const courseRunSchema = z.object({
  // Required fields
  course: z.union([z.number(), z.string()]), // Can be ID or populated object
  start_date: z.string(),
  end_date: z.string(),

  // Optional relationships
  campus: z.union([z.number(), z.string()]).optional(),

  // Scheduling
  enrollment_deadline: z.string().optional(),
  schedule_days: z.array(z.enum(VALID_WEEKDAYS)).optional(),
  schedule_time_start: z.string().optional(),
  schedule_time_end: z.string().optional(),

  // Capacity
  max_students: z.number().int().positive().default(30),
  min_students: z.number().int().positive().default(5),
  current_enrollments: z.number().int().min(0).default(0),

  // Status
  status: z.enum(VALID_STATUSES).default('draft'),

  // Pricing
  price_override: z.number().min(0).optional(),
  financial_aid_available: z.boolean().default(false),

  // Instructor
  instructor_name: z.string().max(255).optional(),
  instructor_bio: z.string().optional(),

  // Internal
  notes: z.string().optional(),
  created_by: z.union([z.number(), z.string()]).optional(),

  // Timestamps (auto-managed)
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export type CourseRunData = z.infer<typeof courseRunSchema>;

/**
 * Helper function to validate weekday
 */
export function isValidWeekday(day: string): day is Weekday {
  return VALID_WEEKDAYS.includes(day as Weekday);
}

/**
 * Helper function to validate status
 */
export function isValidStatus(status: string): status is CourseRunStatus {
  return VALID_STATUSES.includes(status as CourseRunStatus);
}

/**
 * Helper function to format validation errors
 */
export function formatValidationError(error: z.ZodError): string {
  return error.errors.map((err) => `${err.path.join('.')}: ${err.message}`).join('; ');
}
