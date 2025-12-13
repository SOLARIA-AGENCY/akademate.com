/**
 * @module @akademate/operations/enrollment
 * Enrollment service for academic operations
 */

import {
  EnrollmentStatus,
  type Enrollment,
  type EnrollmentRequest,
  type EnrollmentTransition,
  type GraduationCheck,
} from './types.js'

// ============================================================================
// Status Transitions
// ============================================================================

const VALID_TRANSITIONS: Record<EnrollmentStatus, EnrollmentStatus[]> = {
  [EnrollmentStatus.PENDING]: [EnrollmentStatus.ACTIVE, EnrollmentStatus.WITHDRAWN],
  [EnrollmentStatus.ACTIVE]: [EnrollmentStatus.COMPLETED, EnrollmentStatus.WITHDRAWN, EnrollmentStatus.FAILED],
  [EnrollmentStatus.COMPLETED]: [], // Terminal state
  [EnrollmentStatus.WITHDRAWN]: [EnrollmentStatus.PENDING], // Can re-enroll
  [EnrollmentStatus.FAILED]: [EnrollmentStatus.PENDING], // Can retry
}

/**
 * Check if status transition is valid
 */
export function isValidEnrollmentTransition(from: EnrollmentStatus, to: EnrollmentStatus): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false
}

/**
 * Get available next statuses for enrollment
 */
export function getNextEnrollmentStatuses(currentStatus: EnrollmentStatus): EnrollmentStatus[] {
  return VALID_TRANSITIONS[currentStatus] ?? []
}

// ============================================================================
// Enrollment Service
// ============================================================================

export interface EnrollmentServiceConfig {
  onEnrollmentCreated?: (enrollment: Enrollment) => Promise<void>
  onStatusChanged?: (transition: EnrollmentTransition) => Promise<void>
  onGraduation?: (enrollment: Enrollment) => Promise<void>
  maxEnrollmentsPerUser?: number
  allowConcurrentEnrollments?: boolean
}

export class EnrollmentService {
  private config: EnrollmentServiceConfig

  constructor(config: EnrollmentServiceConfig = {}) {
    this.config = {
      maxEnrollmentsPerUser: 5,
      allowConcurrentEnrollments: true,
      ...config,
    }
  }

  /**
   * Create new enrollment from request
   */
  async createEnrollment(request: EnrollmentRequest): Promise<Enrollment> {
    const now = new Date()

    const enrollment: Enrollment = {
      id: crypto.randomUUID(),
      tenantId: request.tenantId,
      userId: request.userId,
      courseRunId: request.courseRunId,
      status: EnrollmentStatus.PENDING,
      enrolledAt: now,
      progress: 0,
      metadata: {
        leadId: request.leadId,
        paymentMethod: request.paymentMethod,
        scholarshipCode: request.scholarshipCode,
        notes: request.notes,
      },
    }

    if (this.config.onEnrollmentCreated) {
      await this.config.onEnrollmentCreated(enrollment)
    }

    return enrollment
  }

  /**
   * Activate a pending enrollment
   */
  async activate(enrollment: Enrollment, userId: string): Promise<EnrollmentTransition> {
    if (enrollment.status !== EnrollmentStatus.PENDING) {
      throw new EnrollmentError(
        `No se puede activar una matrícula en estado ${enrollment.status}`,
        'INVALID_STATUS'
      )
    }

    const transition: EnrollmentTransition = {
      enrollmentId: enrollment.id!,
      fromStatus: enrollment.status,
      toStatus: EnrollmentStatus.ACTIVE,
      userId,
      timestamp: new Date(),
    }

    if (this.config.onStatusChanged) {
      await this.config.onStatusChanged(transition)
    }

    return transition
  }

  /**
   * Complete an enrollment (graduation)
   */
  async complete(enrollment: Enrollment, userId: string): Promise<EnrollmentTransition> {
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new EnrollmentError(
        `Solo se pueden completar matrículas activas, estado actual: ${enrollment.status}`,
        'INVALID_STATUS'
      )
    }

    const graduationCheck = this.checkGraduationRequirements(enrollment)
    if (!graduationCheck.canGraduate) {
      const unmetRequirements = graduationCheck.requirements
        .filter(r => !r.met)
        .map(r => r.name)
        .join(', ')
      throw new EnrollmentError(
        `Requisitos de graduación no cumplidos: ${unmetRequirements}`,
        'REQUIREMENTS_NOT_MET'
      )
    }

    const transition: EnrollmentTransition = {
      enrollmentId: enrollment.id!,
      fromStatus: enrollment.status,
      toStatus: EnrollmentStatus.COMPLETED,
      userId,
      timestamp: new Date(),
    }

    if (this.config.onStatusChanged) {
      await this.config.onStatusChanged(transition)
    }

    if (this.config.onGraduation) {
      await this.config.onGraduation({ ...enrollment, status: EnrollmentStatus.COMPLETED })
    }

    return transition
  }

  /**
   * Withdraw from enrollment
   */
  async withdraw(enrollment: Enrollment, userId: string, reason?: string): Promise<EnrollmentTransition> {
    if (!isValidEnrollmentTransition(enrollment.status, EnrollmentStatus.WITHDRAWN)) {
      throw new EnrollmentError(
        `No se puede retirar una matrícula en estado ${enrollment.status}`,
        'INVALID_STATUS'
      )
    }

    const transition: EnrollmentTransition = {
      enrollmentId: enrollment.id!,
      fromStatus: enrollment.status,
      toStatus: EnrollmentStatus.WITHDRAWN,
      userId,
      reason,
      timestamp: new Date(),
    }

    if (this.config.onStatusChanged) {
      await this.config.onStatusChanged(transition)
    }

    return transition
  }

  /**
   * Mark enrollment as failed
   */
  async fail(enrollment: Enrollment, userId: string, reason: string): Promise<EnrollmentTransition> {
    if (enrollment.status !== EnrollmentStatus.ACTIVE) {
      throw new EnrollmentError(
        `Solo se pueden reprobar matrículas activas, estado actual: ${enrollment.status}`,
        'INVALID_STATUS'
      )
    }

    const transition: EnrollmentTransition = {
      enrollmentId: enrollment.id!,
      fromStatus: enrollment.status,
      toStatus: EnrollmentStatus.FAILED,
      userId,
      reason,
      timestamp: new Date(),
    }

    if (this.config.onStatusChanged) {
      await this.config.onStatusChanged(transition)
    }

    return transition
  }

  /**
   * Check graduation requirements
   */
  checkGraduationRequirements(enrollment: Partial<Enrollment>): GraduationCheck {
    const requirements: GraduationCheck['requirements'] = []

    // Requirement 1: Minimum progress (80%)
    const progressMet = (enrollment.progress ?? 0) >= 80
    requirements.push({
      name: 'Progreso mínimo (80%)',
      met: progressMet,
      details: `Progreso actual: ${enrollment.progress ?? 0}%`,
    })

    // Requirement 2: Active status
    const statusMet = enrollment.status === EnrollmentStatus.ACTIVE
    requirements.push({
      name: 'Estado activo',
      met: statusMet,
      details: `Estado actual: ${enrollment.status}`,
    })

    // Requirement 3: Not expired
    const notExpired = !enrollment.expiresAt || enrollment.expiresAt > new Date()
    requirements.push({
      name: 'Matrícula vigente',
      met: notExpired,
      details: enrollment.expiresAt
        ? `Vence: ${enrollment.expiresAt.toISOString()}`
        : 'Sin fecha de vencimiento',
    })

    return {
      enrollmentId: enrollment.id ?? '',
      canGraduate: requirements.every(r => r.met),
      requirements,
    }
  }

  /**
   * Update enrollment progress
   */
  calculateProgress(params: {
    completedLessons: number
    totalLessons: number
    completedAssignments: number
    totalAssignments: number
    attendanceRate: number
  }): number {
    const { completedLessons, totalLessons, completedAssignments, totalAssignments, attendanceRate } = params

    // Weight: 50% lessons, 30% assignments, 20% attendance
    const lessonProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 50 : 0
    const assignmentProgress = totalAssignments > 0 ? (completedAssignments / totalAssignments) * 30 : 0
    const attendanceProgress = attendanceRate * 0.2

    return Math.round(lessonProgress + assignmentProgress + attendanceProgress)
  }

  /**
   * Check if user can enroll in course run
   */
  canEnroll(params: {
    userId: string
    courseRunId: string
    existingEnrollments: Enrollment[]
    courseRunCapacity?: number
    currentEnrollmentCount?: number
  }): { canEnroll: boolean; reason?: string } {
    const { userId, courseRunId, existingEnrollments, courseRunCapacity, currentEnrollmentCount } = params

    // Check if already enrolled in this course run
    const existingInCourseRun = existingEnrollments.find(
      e => e.courseRunId === courseRunId && e.userId === userId &&
        [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE].includes(e.status as EnrollmentStatus)
    )
    if (existingInCourseRun) {
      return { canEnroll: false, reason: 'Ya está matriculado en esta convocatoria' }
    }

    // Check max enrollments per user
    const activeEnrollments = existingEnrollments.filter(
      e => e.userId === userId &&
        [EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE].includes(e.status as EnrollmentStatus)
    )
    if (activeEnrollments.length >= (this.config.maxEnrollmentsPerUser ?? 5)) {
      return { canEnroll: false, reason: `Límite de ${this.config.maxEnrollmentsPerUser} matrículas activas alcanzado` }
    }

    // Check course run capacity
    if (courseRunCapacity && currentEnrollmentCount && currentEnrollmentCount >= courseRunCapacity) {
      return { canEnroll: false, reason: 'La convocatoria está completa' }
    }

    return { canEnroll: true }
  }
}

// ============================================================================
// Error Types
// ============================================================================

export class EnrollmentError extends Error {
  code: string

  constructor(message: string, code: string) {
    super(message)
    this.name = 'EnrollmentError'
    this.code = code
  }
}
