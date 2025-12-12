/**
 * @module @akademate/catalog/types
 * Domain types for academic catalog
 */

import { z } from 'zod'

// ============================================================================
// Publication Status
// ============================================================================

export const PublicationStatus = {
  DRAFT: 'draft',
  REVIEW: 'review',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
} as const

export type PublicationStatus = (typeof PublicationStatus)[keyof typeof PublicationStatus]

// ============================================================================
// Course Modality
// ============================================================================

export const Modality = {
  PRESENTIAL: 'presential',
  ONLINE: 'online',
  HYBRID: 'hybrid',
} as const

export type Modality = (typeof Modality)[keyof typeof Modality]

// ============================================================================
// Course Run Status
// ============================================================================

export const CourseRunStatus = {
  SCHEDULED: 'scheduled',
  ENROLLING: 'enrolling',
  IN_PROGRESS: 'in_progress',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
} as const

export type CourseRunStatus = (typeof CourseRunStatus)[keyof typeof CourseRunStatus]

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const CourseSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(5000).optional(),
  shortDescription: z.string().max(300).optional(),
  status: z.enum(['draft', 'review', 'published', 'archived']).default('draft'),
  featuredImage: z.string().url().optional(),
  duration: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('EUR'),
  objectives: z.array(z.string()).default([]),
  requirements: z.array(z.string()).default([]),
  targetAudience: z.string().max(1000).optional(),
  seoTitle: z.string().max(70).optional(),
  seoDescription: z.string().max(160).optional(),
  seoKeywords: z.array(z.string()).default([]),
})

export const CycleSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional(),
  level: z.string().max(100).optional(),
  duration: z.number().int().positive().optional(),
})

export const CenterSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  name: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  address: z.string().max(500).optional(),
  city: z.string().max(100).optional(),
  postalCode: z.string().max(20).optional(),
  country: z.string().length(2).default('ES'),
  phone: z.string().max(20).optional(),
  email: z.string().email().optional(),
  coordinates: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }).optional(),
  capacity: z.number().int().positive().optional(),
  facilities: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
})

export const InstructorSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  bio: z.string().max(2000).optional(),
  specializations: z.array(z.string()).default([]),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
})

export const CourseRunSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  courseId: z.string().uuid(),
  cycleId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  instructorId: z.string().uuid().optional(),
  name: z.string().min(1).max(200),
  modality: z.enum(['presential', 'online', 'hybrid']).default('presential'),
  status: z.enum(['scheduled', 'enrolling', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  enrollmentDeadline: z.date().optional(),
  maxStudents: z.number().int().positive().optional(),
  minStudents: z.number().int().positive().optional(),
  price: z.number().nonnegative().optional(),
  currency: z.string().length(3).default('EUR'),
  schedule: z.record(z.unknown()).default({}),
})

// ============================================================================
// Type Inferences
// ============================================================================

export type Course = z.infer<typeof CourseSchema>
export type Cycle = z.infer<typeof CycleSchema>
export type Center = z.infer<typeof CenterSchema>
export type Instructor = z.infer<typeof InstructorSchema>
export type CourseRun = z.infer<typeof CourseRunSchema>

// ============================================================================
// Publication Workflow Types
// ============================================================================

export interface PublicationTransition {
  from: PublicationStatus
  to: PublicationStatus
  allowedRoles: string[]
}

export interface PublicationEvent {
  entityType: 'course' | 'courseRun'
  entityId: string
  tenantId: string
  fromStatus: PublicationStatus
  toStatus: PublicationStatus
  userId: string
  timestamp: Date
  reason?: string
}
