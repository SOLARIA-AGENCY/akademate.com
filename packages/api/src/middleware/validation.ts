/**
 * @module @akademate/api/middleware/validation
 * Request validation middleware using Zod
 */

import { z } from 'zod'
import { ApiError } from '../errors'

// ============================================================================
// Validation Schemas
// ============================================================================

export const PaginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
})

export type PaginationParams = z.infer<typeof PaginationSchema>

export const SortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
})

export type SortParams = z.infer<typeof SortSchema>

export const FilterSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
})

export type FilterParams = z.infer<typeof FilterSchema>

export const ListQuerySchema = PaginationSchema.merge(SortSchema).merge(FilterSchema)
export type ListQueryParams = z.infer<typeof ListQuerySchema>

// ============================================================================
// UUID Validation
// ============================================================================

export const UuidSchema = z.string().uuid('Invalid UUID format')
export const UuidParamSchema = z.object({ id: UuidSchema })

// ============================================================================
// Common Field Schemas
// ============================================================================

export const EmailSchema = z.string().email('Invalid email format').toLowerCase()
export const PhoneSchema = z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number')
export const SlugSchema = z.string().regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with hyphens')
export const UrlSchema = z.string().url('Invalid URL format')

// ============================================================================
// Validation Functions
// ============================================================================

export function validateBody<T extends z.ZodType>(
  schema: T,
  body: unknown
): z.infer<T> {
  const result = schema.safeParse(body)

  if (!result.success) {
    throw ApiError.fromZodError(result.error)
  }

  return result.data
}

export function validateQuery<T extends z.ZodType>(
  schema: T,
  searchParams: URLSearchParams
): z.infer<T> {
  const params = Object.fromEntries(searchParams.entries())
  return validateBody(schema, params)
}

export function validateParams<T extends z.ZodType>(
  schema: T,
  params: Record<string, string | undefined>
): z.infer<T> {
  return validateBody(schema, params)
}

// ============================================================================
// Schema Builders
// ============================================================================

export function createListQuerySchema<T extends z.ZodRawShape>(
  additionalFilters?: T
) {
  const base = ListQuerySchema
  if (additionalFilters) {
    return base.extend(additionalFilters)
  }
  return base
}

export function createEntitySchema<T extends z.ZodRawShape>(shape: T) {
  return z.object({
    id: UuidSchema,
    tenantId: UuidSchema,
    createdAt: z.date(),
    updatedAt: z.date(),
    ...shape,
  })
}

// ============================================================================
// Request Body Schemas for Common Operations
// ============================================================================

export const CreateCourseSchema = z.object({
  title: z.string().min(1).max(200),
  slug: SlugSchema.optional(),
  description: z.string().optional(),
  shortDescription: z.string().max(300).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('EUR'),
  duration: z.number().int().min(0).optional(),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
})

export type CreateCourseInput = z.infer<typeof CreateCourseSchema>

export const UpdateCourseSchema = CreateCourseSchema.partial()
export type UpdateCourseInput = z.infer<typeof UpdateCourseSchema>

export const CreateCourseRunSchema = z.object({
  courseId: UuidSchema,
  name: z.string().min(1).max(200),
  modality: z.enum(['presential', 'online', 'hybrid']).default('presential'),
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
  enrollmentDeadline: z.coerce.date().optional(),
  maxStudents: z.number().int().min(1).optional(),
  minStudents: z.number().int().min(0).optional(),
  price: z.number().min(0).optional(),
  currency: z.string().length(3).default('EUR'),
  centerId: UuidSchema.optional(),
  instructorId: UuidSchema.optional(),
  cycleId: UuidSchema.optional(),
})

export type CreateCourseRunInput = z.infer<typeof CreateCourseRunSchema>

export const CreateEnrollmentSchema = z.object({
  userId: UuidSchema,
  courseRunId: UuidSchema,
  status: z.enum(['pending', 'active', 'completed', 'withdrawn', 'failed']).default('pending'),
})

export type CreateEnrollmentInput = z.infer<typeof CreateEnrollmentSchema>

export const CreateLeadSchema = z.object({
  email: EmailSchema,
  name: z.string().min(1).max(200).optional(),
  phone: PhoneSchema.optional(),
  source: z.enum(['website', 'referral', 'social', 'ads', 'event', 'other']).default('website'),
  courseRunId: UuidSchema.optional(),
  campaignId: UuidSchema.optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).default([]),
  gdprConsent: z.boolean(),
})

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>
