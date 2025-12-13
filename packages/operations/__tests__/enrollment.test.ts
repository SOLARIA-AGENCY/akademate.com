/**
 * @module @akademate/operations/__tests__/enrollment
 * Tests for enrollment service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  EnrollmentService,
  EnrollmentError,
  isValidEnrollmentTransition,
  getNextEnrollmentStatuses,
  EnrollmentStatus,
  type Enrollment,
  type EnrollmentRequest,
} from '../src/index.js'

describe('Enrollment Service', () => {
  const validTenantId = '123e4567-e89b-12d3-a456-426614174000'
  const validUserId = '123e4567-e89b-12d3-a456-426614174001'
  const validCourseRunId = '123e4567-e89b-12d3-a456-426614174002'

  // ============================================================================
  // Status Transition Tests
  // ============================================================================

  describe('status transitions', () => {
    it('should allow pending -> active', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.PENDING, EnrollmentStatus.ACTIVE)).toBe(true)
    })

    it('should allow pending -> withdrawn', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.PENDING, EnrollmentStatus.WITHDRAWN)).toBe(true)
    })

    it('should allow active -> completed', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.ACTIVE, EnrollmentStatus.COMPLETED)).toBe(true)
    })

    it('should allow active -> withdrawn', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.ACTIVE, EnrollmentStatus.WITHDRAWN)).toBe(true)
    })

    it('should allow active -> failed', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.ACTIVE, EnrollmentStatus.FAILED)).toBe(true)
    })

    it('should allow withdrawn -> pending (re-enroll)', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.WITHDRAWN, EnrollmentStatus.PENDING)).toBe(true)
    })

    it('should allow failed -> pending (retry)', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.FAILED, EnrollmentStatus.PENDING)).toBe(true)
    })

    it('should NOT allow completed -> any (terminal state)', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.COMPLETED, EnrollmentStatus.ACTIVE)).toBe(false)
      expect(isValidEnrollmentTransition(EnrollmentStatus.COMPLETED, EnrollmentStatus.PENDING)).toBe(false)
    })

    it('should NOT allow pending -> completed (skip active)', () => {
      expect(isValidEnrollmentTransition(EnrollmentStatus.PENDING, EnrollmentStatus.COMPLETED)).toBe(false)
    })
  })

  // ============================================================================
  // Next Statuses Tests
  // ============================================================================

  describe('getNextEnrollmentStatuses', () => {
    it('should return [active, withdrawn] for pending', () => {
      const next = getNextEnrollmentStatuses(EnrollmentStatus.PENDING)
      expect(next).toContain(EnrollmentStatus.ACTIVE)
      expect(next).toContain(EnrollmentStatus.WITHDRAWN)
    })

    it('should return [completed, withdrawn, failed] for active', () => {
      const next = getNextEnrollmentStatuses(EnrollmentStatus.ACTIVE)
      expect(next).toContain(EnrollmentStatus.COMPLETED)
      expect(next).toContain(EnrollmentStatus.WITHDRAWN)
      expect(next).toContain(EnrollmentStatus.FAILED)
    })

    it('should return empty array for completed', () => {
      const next = getNextEnrollmentStatuses(EnrollmentStatus.COMPLETED)
      expect(next).toHaveLength(0)
    })
  })

  // ============================================================================
  // Enrollment Service Tests
  // ============================================================================

  describe('EnrollmentService', () => {
    let service: EnrollmentService
    let onEnrollmentCreated: ReturnType<typeof vi.fn>
    let onStatusChanged: ReturnType<typeof vi.fn>
    let onGraduation: ReturnType<typeof vi.fn>

    beforeEach(() => {
      onEnrollmentCreated = vi.fn().mockResolvedValue(undefined)
      onStatusChanged = vi.fn().mockResolvedValue(undefined)
      onGraduation = vi.fn().mockResolvedValue(undefined)

      service = new EnrollmentService({
        onEnrollmentCreated,
        onStatusChanged,
        onGraduation,
      })
    })

    describe('createEnrollment', () => {
      it('should create enrollment with correct data', async () => {
        const request: EnrollmentRequest = {
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          paymentMethod: 'card',
          notes: 'Test enrollment',
        }

        const enrollment = await service.createEnrollment(request)

        expect(enrollment.tenantId).toBe(validTenantId)
        expect(enrollment.userId).toBe(validUserId)
        expect(enrollment.courseRunId).toBe(validCourseRunId)
        expect(enrollment.status).toBe(EnrollmentStatus.PENDING)
        expect(enrollment.progress).toBe(0)
        expect(enrollment.enrolledAt).toBeInstanceOf(Date)
        expect(onEnrollmentCreated).toHaveBeenCalledOnce()
      })

      it('should include lead reference in metadata', async () => {
        const request: EnrollmentRequest = {
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          leadId: '123e4567-e89b-12d3-a456-426614174003',
        }

        const enrollment = await service.createEnrollment(request)

        expect(enrollment.metadata.leadId).toBe(request.leadId)
      })
    })

    describe('activate', () => {
      it('should activate pending enrollment', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.PENDING,
          progress: 0,
          metadata: {},
        }

        const transition = await service.activate(enrollment, validUserId)

        expect(transition.fromStatus).toBe(EnrollmentStatus.PENDING)
        expect(transition.toStatus).toBe(EnrollmentStatus.ACTIVE)
        expect(onStatusChanged).toHaveBeenCalledOnce()
      })

      it('should throw error for non-pending enrollment', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 50,
          metadata: {},
        }

        await expect(service.activate(enrollment, validUserId)).rejects.toThrow(EnrollmentError)
      })
    })

    describe('complete', () => {
      it('should complete active enrollment meeting requirements', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 85, // Above 80% threshold
          metadata: {},
        }

        const transition = await service.complete(enrollment, validUserId)

        expect(transition.toStatus).toBe(EnrollmentStatus.COMPLETED)
        expect(onStatusChanged).toHaveBeenCalledOnce()
        expect(onGraduation).toHaveBeenCalledOnce()
      })

      it('should throw error if progress below threshold', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 50, // Below 80% threshold
          metadata: {},
        }

        await expect(service.complete(enrollment, validUserId)).rejects.toThrow('Requisitos de graduación no cumplidos')
      })

      it('should throw error for non-active enrollment', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.PENDING,
          progress: 85,
          metadata: {},
        }

        await expect(service.complete(enrollment, validUserId)).rejects.toThrow(EnrollmentError)
      })
    })

    describe('withdraw', () => {
      it('should withdraw active enrollment', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 30,
          metadata: {},
        }

        const transition = await service.withdraw(enrollment, validUserId, 'Personal reasons')

        expect(transition.toStatus).toBe(EnrollmentStatus.WITHDRAWN)
        expect(transition.reason).toBe('Personal reasons')
      })

      it('should throw error for completed enrollment', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.COMPLETED,
          progress: 100,
          metadata: {},
        }

        await expect(service.withdraw(enrollment, validUserId)).rejects.toThrow(EnrollmentError)
      })
    })

    describe('fail', () => {
      it('should mark active enrollment as failed', async () => {
        const enrollment: Enrollment = {
          id: '123e4567-e89b-12d3-a456-426614174000',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 30,
          metadata: {},
        }

        const transition = await service.fail(enrollment, validUserId, 'Failed final exam')

        expect(transition.toStatus).toBe(EnrollmentStatus.FAILED)
        expect(transition.reason).toBe('Failed final exam')
      })
    })
  })

  // ============================================================================
  // Graduation Requirements Tests
  // ============================================================================

  describe('graduation requirements', () => {
    const service = new EnrollmentService()

    it('should pass all requirements for valid enrollment', () => {
      const enrollment: Partial<Enrollment> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: EnrollmentStatus.ACTIVE,
        progress: 85,
      }

      const check = service.checkGraduationRequirements(enrollment)

      expect(check.canGraduate).toBe(true)
      expect(check.requirements.every(r => r.met)).toBe(true)
    })

    it('should fail progress requirement', () => {
      const enrollment: Partial<Enrollment> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: EnrollmentStatus.ACTIVE,
        progress: 60,
      }

      const check = service.checkGraduationRequirements(enrollment)

      expect(check.canGraduate).toBe(false)
      const progressReq = check.requirements.find(r => r.name.includes('Progreso'))
      expect(progressReq?.met).toBe(false)
    })

    it('should fail status requirement', () => {
      const enrollment: Partial<Enrollment> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: EnrollmentStatus.PENDING,
        progress: 85,
      }

      const check = service.checkGraduationRequirements(enrollment)

      expect(check.canGraduate).toBe(false)
    })

    it('should fail expiry requirement', () => {
      const enrollment: Partial<Enrollment> = {
        id: '123e4567-e89b-12d3-a456-426614174000',
        status: EnrollmentStatus.ACTIVE,
        progress: 85,
        expiresAt: new Date('2020-01-01'), // Expired
      }

      const check = service.checkGraduationRequirements(enrollment)

      expect(check.canGraduate).toBe(false)
    })
  })

  // ============================================================================
  // Progress Calculation Tests
  // ============================================================================

  describe('calculateProgress', () => {
    const service = new EnrollmentService()

    it('should calculate weighted progress correctly', () => {
      const progress = service.calculateProgress({
        completedLessons: 8,
        totalLessons: 10,
        completedAssignments: 3,
        totalAssignments: 5,
        attendanceRate: 90,
      })

      // 80% lessons = 40 points, 60% assignments = 18 points, 90% attendance = 18 points
      expect(progress).toBe(76)
    })

    it('should handle zero totals', () => {
      const progress = service.calculateProgress({
        completedLessons: 0,
        totalLessons: 0,
        completedAssignments: 0,
        totalAssignments: 0,
        attendanceRate: 100,
      })

      // Only attendance counts: 100 * 0.2 = 20
      expect(progress).toBe(20)
    })

    it('should cap at 100', () => {
      const progress = service.calculateProgress({
        completedLessons: 10,
        totalLessons: 10,
        completedAssignments: 5,
        totalAssignments: 5,
        attendanceRate: 100,
      })

      // 50 + 30 + 20 = 100
      expect(progress).toBe(100)
    })
  })

  // ============================================================================
  // Can Enroll Tests
  // ============================================================================

  describe('canEnroll', () => {
    const service = new EnrollmentService({ maxEnrollmentsPerUser: 3 })

    it('should allow enrollment when no conflicts', () => {
      const result = service.canEnroll({
        userId: validUserId,
        courseRunId: validCourseRunId,
        existingEnrollments: [],
      })

      expect(result.canEnroll).toBe(true)
    })

    it('should reject if already enrolled in course run', () => {
      const result = service.canEnroll({
        userId: validUserId,
        courseRunId: validCourseRunId,
        existingEnrollments: [{
          id: '1',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.ACTIVE,
          progress: 50,
          metadata: {},
        }],
      })

      expect(result.canEnroll).toBe(false)
      expect(result.reason).toContain('Ya está matriculado')
    })

    it('should reject if max enrollments reached', () => {
      const existingEnrollments: Enrollment[] = [
        { id: '1', tenantId: validTenantId, userId: validUserId, courseRunId: '1', status: EnrollmentStatus.ACTIVE, progress: 0, metadata: {} },
        { id: '2', tenantId: validTenantId, userId: validUserId, courseRunId: '2', status: EnrollmentStatus.ACTIVE, progress: 0, metadata: {} },
        { id: '3', tenantId: validTenantId, userId: validUserId, courseRunId: '3', status: EnrollmentStatus.PENDING, progress: 0, metadata: {} },
      ]

      const result = service.canEnroll({
        userId: validUserId,
        courseRunId: validCourseRunId,
        existingEnrollments,
      })

      expect(result.canEnroll).toBe(false)
      expect(result.reason).toContain('Límite')
    })

    it('should reject if course run is full', () => {
      const result = service.canEnroll({
        userId: validUserId,
        courseRunId: validCourseRunId,
        existingEnrollments: [],
        courseRunCapacity: 30,
        currentEnrollmentCount: 30,
      })

      expect(result.canEnroll).toBe(false)
      expect(result.reason).toContain('completa')
    })

    it('should allow if withdrawn from same course run', () => {
      const result = service.canEnroll({
        userId: validUserId,
        courseRunId: validCourseRunId,
        existingEnrollments: [{
          id: '1',
          tenantId: validTenantId,
          userId: validUserId,
          courseRunId: validCourseRunId,
          status: EnrollmentStatus.WITHDRAWN, // Not active
          progress: 0,
          metadata: {},
        }],
      })

      expect(result.canEnroll).toBe(true)
    })
  })
})
