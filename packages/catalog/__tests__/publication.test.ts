/**
 * @module @akademate/catalog/__tests__/publication
 * Tests for publication workflow state machine
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  PublicationService,
  PublicationError,
  isValidTransition,
  canTransition,
  getNextStates,
  PublicationStatus,
} from '../src/index.js'

describe('Publication Workflow', () => {
  // ============================================================================
  // Transition Validation Tests
  // ============================================================================

  describe('isValidTransition', () => {
    it('should allow draft -> review', () => {
      expect(isValidTransition(PublicationStatus.DRAFT, PublicationStatus.REVIEW)).toBe(true)
    })

    it('should allow review -> published', () => {
      expect(isValidTransition(PublicationStatus.REVIEW, PublicationStatus.PUBLISHED)).toBe(true)
    })

    it('should allow review -> draft (rejection)', () => {
      expect(isValidTransition(PublicationStatus.REVIEW, PublicationStatus.DRAFT)).toBe(true)
    })

    it('should allow published -> archived', () => {
      expect(isValidTransition(PublicationStatus.PUBLISHED, PublicationStatus.ARCHIVED)).toBe(true)
    })

    it('should allow published -> draft (unpublish)', () => {
      expect(isValidTransition(PublicationStatus.PUBLISHED, PublicationStatus.DRAFT)).toBe(true)
    })

    it('should allow archived -> draft (restore)', () => {
      expect(isValidTransition(PublicationStatus.ARCHIVED, PublicationStatus.DRAFT)).toBe(true)
    })

    it('should NOT allow draft -> published (skip review)', () => {
      expect(isValidTransition(PublicationStatus.DRAFT, PublicationStatus.PUBLISHED)).toBe(false)
    })

    it('should NOT allow archived -> published (must restore first)', () => {
      expect(isValidTransition(PublicationStatus.ARCHIVED, PublicationStatus.PUBLISHED)).toBe(false)
    })
  })

  // ============================================================================
  // Role-Based Access Tests
  // ============================================================================

  describe('canTransition', () => {
    it('should allow admin to unpublish', () => {
      expect(canTransition(
        PublicationStatus.PUBLISHED,
        PublicationStatus.DRAFT,
        ['admin']
      )).toBe(true)
    })

    it('should NOT allow gestor to unpublish', () => {
      expect(canTransition(
        PublicationStatus.PUBLISHED,
        PublicationStatus.DRAFT,
        ['gestor']
      )).toBe(false)
    })

    it('should allow instructor to submit for review', () => {
      expect(canTransition(
        PublicationStatus.DRAFT,
        PublicationStatus.REVIEW,
        ['instructor']
      )).toBe(true)
    })

    it('should allow gestor to publish from review', () => {
      expect(canTransition(
        PublicationStatus.REVIEW,
        PublicationStatus.PUBLISHED,
        ['gestor']
      )).toBe(true)
    })

    it('should NOT allow student to perform any transition', () => {
      expect(canTransition(
        PublicationStatus.DRAFT,
        PublicationStatus.REVIEW,
        ['student']
      )).toBe(false)
    })
  })

  // ============================================================================
  // Next States Tests
  // ============================================================================

  describe('getNextStates', () => {
    it('should return review and archived for admin in draft state', () => {
      const states = getNextStates(PublicationStatus.DRAFT, ['admin'])
      expect(states).toContain(PublicationStatus.REVIEW)
      expect(states).toContain(PublicationStatus.ARCHIVED)
    })

    it('should return all options for admin in review state', () => {
      const states = getNextStates(PublicationStatus.REVIEW, ['admin'])
      expect(states).toContain(PublicationStatus.DRAFT)
      expect(states).toContain(PublicationStatus.PUBLISHED)
      expect(states).toContain(PublicationStatus.ARCHIVED)
    })

    it('should return limited options for gestor in published state', () => {
      const states = getNextStates(PublicationStatus.PUBLISHED, ['gestor'])
      expect(states).toContain(PublicationStatus.ARCHIVED)
      expect(states).not.toContain(PublicationStatus.DRAFT) // Only admin can unpublish
    })

    it('should return empty array for student', () => {
      const states = getNextStates(PublicationStatus.DRAFT, ['student'])
      expect(states).toHaveLength(0)
    })
  })

  // ============================================================================
  // Publication Service Tests
  // ============================================================================

  describe('PublicationService', () => {
    let service: PublicationService
    let onPublish: ReturnType<typeof vi.fn>
    let onUnpublish: ReturnType<typeof vi.fn>
    let onArchive: ReturnType<typeof vi.fn>

    beforeEach(() => {
      onPublish = vi.fn().mockResolvedValue(undefined)
      onUnpublish = vi.fn().mockResolvedValue(undefined)
      onArchive = vi.fn().mockResolvedValue(undefined)

      service = new PublicationService({
        onPublish,
        onUnpublish,
        onArchive,
      })
    })

    it('should execute valid transition', async () => {
      const event = await service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.REVIEW,
        toStatus: PublicationStatus.PUBLISHED,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
      })

      expect(event.fromStatus).toBe(PublicationStatus.REVIEW)
      expect(event.toStatus).toBe(PublicationStatus.PUBLISHED)
      expect(event.timestamp).toBeInstanceOf(Date)
      expect(onPublish).toHaveBeenCalledOnce()
    })

    it('should call onUnpublish when unpublishing', async () => {
      await service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.PUBLISHED,
        toStatus: PublicationStatus.DRAFT,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
      })

      expect(onUnpublish).toHaveBeenCalledOnce()
      expect(onPublish).not.toHaveBeenCalled()
    })

    it('should call onArchive when archiving', async () => {
      await service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.PUBLISHED,
        toStatus: PublicationStatus.ARCHIVED,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
      })

      expect(onArchive).toHaveBeenCalledOnce()
    })

    it('should throw INVALID_TRANSITION for invalid state change', async () => {
      await expect(service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.DRAFT,
        toStatus: PublicationStatus.PUBLISHED, // Skip review!
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
      })).rejects.toThrow(PublicationError)

      await expect(service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.DRAFT,
        toStatus: PublicationStatus.PUBLISHED,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
      })).rejects.toMatchObject({ code: 'INVALID_TRANSITION' })
    })

    it('should throw UNAUTHORIZED for insufficient permissions', async () => {
      await expect(service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.PUBLISHED,
        toStatus: PublicationStatus.DRAFT,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['gestor'], // Only admin can unpublish
      })).rejects.toThrow(PublicationError)

      await expect(service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.PUBLISHED,
        toStatus: PublicationStatus.DRAFT,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['gestor'],
      })).rejects.toMatchObject({ code: 'UNAUTHORIZED' })
    })

    it('should include reason in event when provided', async () => {
      const event = await service.transition({
        entityType: 'course',
        entityId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        fromStatus: PublicationStatus.REVIEW,
        toStatus: PublicationStatus.DRAFT,
        userId: '123e4567-e89b-12d3-a456-426614174002',
        userRoles: ['admin'],
        reason: 'Missing images and descriptions',
      })

      expect(event.reason).toBe('Missing images and descriptions')
    })
  })

  // ============================================================================
  // Helper Method Tests
  // ============================================================================

  describe('canPublish helper', () => {
    const service = new PublicationService()

    it('should return true for review -> published with admin', () => {
      expect(service.canPublish(PublicationStatus.REVIEW, ['admin'])).toBe(true)
    })

    it('should return false for draft -> published (invalid)', () => {
      expect(service.canPublish(PublicationStatus.DRAFT, ['admin'])).toBe(false)
    })
  })

  describe('canUnpublish helper', () => {
    const service = new PublicationService()

    it('should return true for admin on published content', () => {
      expect(service.canUnpublish(PublicationStatus.PUBLISHED, ['admin'])).toBe(true)
    })

    it('should return false for gestor on published content', () => {
      expect(service.canUnpublish(PublicationStatus.PUBLISHED, ['gestor'])).toBe(false)
    })

    it('should return false for draft content', () => {
      expect(service.canUnpublish(PublicationStatus.DRAFT, ['admin'])).toBe(false)
    })
  })
})
