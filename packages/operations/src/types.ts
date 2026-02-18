/**
 * @module @akademate/operations/types
 * Domain types for academic operations
 */

import { z } from 'zod'

// ============================================================================
// Enrollment Status
// ============================================================================

export const EnrollmentStatus = {
  PENDING: 'pending',
  ACTIVE: 'active',
  COMPLETED: 'completed',
  WITHDRAWN: 'withdrawn',
  FAILED: 'failed',
} as const

export type EnrollmentStatus = (typeof EnrollmentStatus)[keyof typeof EnrollmentStatus]

// ============================================================================
// Session Types
// ============================================================================

export const SessionType = {
  CLASS: 'class',
  EXAM: 'exam',
  WORKSHOP: 'workshop',
  TUTORING: 'tutoring',
  LAB: 'lab',
  PRESENTATION: 'presentation',
} as const

export type SessionType = (typeof SessionType)[keyof typeof SessionType]

// ============================================================================
// Attendance Status
// ============================================================================

export const AttendanceStatus = {
  PRESENT: 'present',
  ABSENT: 'absent',
  LATE: 'late',
  EXCUSED: 'excused',
  PENDING: 'pending',
} as const

export type AttendanceStatus = (typeof AttendanceStatus)[keyof typeof AttendanceStatus]

// ============================================================================
// Payment Status
// ============================================================================

export const PaymentStatus = {
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  OVERDUE: 'overdue',
  REFUNDED: 'refunded',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

// ============================================================================
// Zod Schemas for Validation
// ============================================================================

export const EnrollmentSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  courseRunId: z.string().uuid(),
  status: z.enum(['pending', 'active', 'completed', 'withdrawn', 'failed']).default('pending'),
  enrolledAt: z.date().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  expiresAt: z.date().optional(),
  progress: z.number().min(0).max(100).default(0),
  lastAccessAt: z.date().optional(),
  certificateUrl: z.string().url().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const EnrollmentRequestSchema = z.object({
  tenantId: z.string().uuid(),
  userId: z.string().uuid(),
  courseRunId: z.string().uuid(),
  leadId: z.string().uuid().optional(),
  paymentMethod: z.string().max(50).optional(),
  scholarshipCode: z.string().max(50).optional(),
  notes: z.string().max(2000).optional(),
})

export const SessionSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  courseRunId: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().max(2000).optional(),
  type: z.enum(['class', 'exam', 'workshop', 'tutoring', 'lab', 'presentation']).default('class'),
  instructorId: z.string().uuid().optional(),
  centerId: z.string().uuid().optional(),
  room: z.string().max(100).optional(),
  startTime: z.date(),
  endTime: z.date(),
  isOnline: z.boolean().default(false),
  meetingUrl: z.string().url().optional(),
  maxAttendees: z.number().int().positive().optional(),
  isRecorded: z.boolean().default(false),
  recordingUrl: z.string().url().optional(),
  materials: z.array(z.string().uuid()).default([]),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const AttendanceSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  sessionId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  userId: z.string().uuid(),
  status: z.enum(['present', 'absent', 'late', 'excused', 'pending']).default('pending'),
  checkInTime: z.date().optional(),
  checkOutTime: z.date().optional(),
  duration: z.number().int().min(0).optional(), // minutes attended
  notes: z.string().max(500).optional(),
  excuseReason: z.string().max(500).optional(),
  excuseDocumentUrl: z.string().url().optional(),
  markedBy: z.string().uuid().optional(), // instructor/admin who marked
  metadata: z.record(z.string(), z.unknown()).default({}),
})

export const PaymentSchema = z.object({
  id: z.string().uuid().optional(),
  tenantId: z.string().uuid(),
  enrollmentId: z.string().uuid(),
  amount: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
  status: z.enum(['pending', 'partial', 'paid', 'overdue', 'refunded']).default('pending'),
  method: z.string().max(50).optional(),
  transactionId: z.string().max(100).optional(),
  paidAt: z.date().optional(),
  dueDate: z.date().optional(),
  installmentNumber: z.number().int().positive().optional(),
  totalInstallments: z.number().int().positive().optional(),
  scholarshipDiscount: z.number().min(0).max(100).default(0),
  notes: z.string().max(1000).optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
})

// ============================================================================
// Type Inferences
// ============================================================================

export type Enrollment = z.infer<typeof EnrollmentSchema>
export type EnrollmentRequest = z.infer<typeof EnrollmentRequestSchema>
export type Session = z.infer<typeof SessionSchema>
export type Attendance = z.infer<typeof AttendanceSchema>
export type Payment = z.infer<typeof PaymentSchema>

// ============================================================================
// Calendar Types
// ============================================================================

export interface CalendarEvent {
  id: string
  title: string
  type: SessionType
  start: Date
  end: Date
  courseRunId: string
  courseRunName?: string
  instructorName?: string
  location?: string
  isOnline: boolean
  meetingUrl?: string
  color?: string
}

export interface CalendarFilter {
  tenantId: string
  userId?: string
  courseRunId?: string
  instructorId?: string
  centerId?: string
  startDate: Date
  endDate: Date
  types?: SessionType[]
}

// ============================================================================
// Attendance Summary Types
// ============================================================================

export interface AttendanceSummary {
  enrollmentId: string
  userId: string
  userName?: string
  totalSessions: number
  attended: number
  absent: number
  late: number
  excused: number
  attendanceRate: number // percentage
  lastAttendance?: Date
}

export interface SessionAttendanceSummary {
  sessionId: string
  sessionTitle: string
  totalEnrolled: number
  present: number
  absent: number
  late: number
  excused: number
  pending: number
  attendanceRate: number
}

// ============================================================================
// Enrollment Transition Types
// ============================================================================

export interface EnrollmentTransition {
  enrollmentId: string
  fromStatus: EnrollmentStatus
  toStatus: EnrollmentStatus
  userId: string
  reason?: string
  notes?: string
  timestamp: Date
}

export interface GraduationCheck {
  enrollmentId: string
  canGraduate: boolean
  requirements: {
    name: string
    met: boolean
    details?: string
  }[]
}
