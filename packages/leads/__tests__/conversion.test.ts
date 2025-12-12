/**
 * @module @akademate/leads/__tests__/conversion
 * Tests for lead conversion workflow
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  LeadConversionService,
  isValidStatusTransition,
  getNextStatuses,
  checkEligibility,
  LeadStatus,
  type Lead,
  type ConversionRequest,
} from '../src/index.js'

describe('Lead Conversion', () => {
  // ============================================================================
  // Status Transition Tests
  // ============================================================================

  describe('status transitions', () => {
    it('should allow new -> contacted', () => {
      expect(isValidStatusTransition(LeadStatus.NEW, LeadStatus.CONTACTED)).toBe(true)
    })

    it('should allow new -> lost', () => {
      expect(isValidStatusTransition(LeadStatus.NEW, LeadStatus.LOST)).toBe(true)
    })

    it('should allow contacted -> qualified', () => {
      expect(isValidStatusTransition(LeadStatus.CONTACTED, LeadStatus.QUALIFIED)).toBe(true)
    })

    it('should allow qualified -> converted', () => {
      expect(isValidStatusTransition(LeadStatus.QUALIFIED, LeadStatus.CONVERTED)).toBe(true)
    })

    it('should allow lost -> new (reactivation)', () => {
      expect(isValidStatusTransition(LeadStatus.LOST, LeadStatus.NEW)).toBe(true)
    })

    it('should NOT allow new -> qualified (skip contacted)', () => {
      expect(isValidStatusTransition(LeadStatus.NEW, LeadStatus.QUALIFIED)).toBe(false)
    })

    it('should NOT allow new -> converted (skip workflow)', () => {
      expect(isValidStatusTransition(LeadStatus.NEW, LeadStatus.CONVERTED)).toBe(false)
    })

    it('should NOT allow converted -> any (terminal state)', () => {
      expect(isValidStatusTransition(LeadStatus.CONVERTED, LeadStatus.NEW)).toBe(false)
      expect(isValidStatusTransition(LeadStatus.CONVERTED, LeadStatus.LOST)).toBe(false)
    })
  })

  // ============================================================================
  // Next Statuses Tests
  // ============================================================================

  describe('getNextStatuses', () => {
    it('should return [contacted, lost] for new', () => {
      const next = getNextStatuses(LeadStatus.NEW)
      expect(next).toContain(LeadStatus.CONTACTED)
      expect(next).toContain(LeadStatus.LOST)
      expect(next).not.toContain(LeadStatus.QUALIFIED)
    })

    it('should return [qualified, lost] for contacted', () => {
      const next = getNextStatuses(LeadStatus.CONTACTED)
      expect(next).toContain(LeadStatus.QUALIFIED)
      expect(next).toContain(LeadStatus.LOST)
    })

    it('should return [converted, contacted, lost] for qualified', () => {
      const next = getNextStatuses(LeadStatus.QUALIFIED)
      expect(next).toContain(LeadStatus.CONVERTED)
      expect(next).toContain(LeadStatus.CONTACTED)
      expect(next).toContain(LeadStatus.LOST)
    })

    it('should return empty array for converted', () => {
      const next = getNextStatuses(LeadStatus.CONVERTED)
      expect(next).toHaveLength(0)
    })

    it('should return [new] for lost (reactivation)', () => {
      const next = getNextStatuses(LeadStatus.LOST)
      expect(next).toContain(LeadStatus.NEW)
    })
  })

  // ============================================================================
  // Eligibility Check Tests
  // ============================================================================

  describe('eligibility checks', () => {
    it('should pass for fully qualified lead', () => {
      const lead: Partial<Lead> = {
        email: 'test@example.com',
        status: LeadStatus.QUALIFIED,
        gdprConsent: true,
      }
      const result = checkEligibility(lead)
      expect(result.eligible).toBe(true)
      expect(result.failedChecks).toHaveLength(0)
    })

    it('should fail without GDPR consent', () => {
      const lead: Partial<Lead> = {
        email: 'test@example.com',
        status: LeadStatus.QUALIFIED,
        gdprConsent: false,
      }
      const result = checkEligibility(lead)
      expect(result.eligible).toBe(false)
      expect(result.failedChecks.some(c => c.id === 'has_gdpr_consent')).toBe(true)
    })

    it('should fail without email', () => {
      const lead: Partial<Lead> = {
        status: LeadStatus.QUALIFIED,
        gdprConsent: true,
      }
      const result = checkEligibility(lead)
      expect(result.eligible).toBe(false)
      expect(result.failedChecks.some(c => c.id === 'has_email')).toBe(true)
    })

    it('should fail if not in qualified status', () => {
      const lead: Partial<Lead> = {
        email: 'test@example.com',
        status: LeadStatus.CONTACTED,
        gdprConsent: true,
      }
      const result = checkEligibility(lead)
      expect(result.eligible).toBe(false)
      expect(result.failedChecks.some(c => c.id === 'is_qualified')).toBe(true)
    })

    it('should fail if already converted', () => {
      const lead: Partial<Lead> = {
        email: 'test@example.com',
        status: LeadStatus.CONVERTED,
        gdprConsent: true,
      }
      const result = checkEligibility(lead)
      expect(result.eligible).toBe(false)
      expect(result.failedChecks.some(c => c.id === 'not_already_converted')).toBe(true)
    })
  })

  // ============================================================================
  // Conversion Service Tests
  // ============================================================================

  describe('LeadConversionService', () => {
    let service: LeadConversionService
    let onPreConvert: ReturnType<typeof vi.fn>
    let onPostConvert: ReturnType<typeof vi.fn>
    let onConversionFailed: ReturnType<typeof vi.fn>

    beforeEach(() => {
      onPreConvert = vi.fn().mockResolvedValue(undefined)
      onPostConvert = vi.fn().mockResolvedValue(undefined)
      onConversionFailed = vi.fn().mockResolvedValue(undefined)

      service = new LeadConversionService({
        onPreConvert,
        onPostConvert,
        onConversionFailed,
      })
    })

    it('should successfully convert valid request', async () => {
      const request: ConversionRequest = {
        leadId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        courseRunId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174003',
      }

      const result = await service.convert(request)

      expect(result.success).toBe(true)
      expect(result.enrollmentId).toBeDefined()
      expect(result.userId).toBeDefined()
      expect(onPreConvert).toHaveBeenCalledOnce()
      expect(onPostConvert).toHaveBeenCalledOnce()
      expect(onConversionFailed).not.toHaveBeenCalled()
    })

    it('should fail without required fields', async () => {
      const result = await service.convert({
        leadId: '',
        tenantId: '',
        courseRunId: '',
        userId: '',
      })

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(4)
      expect(onConversionFailed).toHaveBeenCalledOnce()
      expect(onPreConvert).not.toHaveBeenCalled()
    })

    it('should include enrollment data in conversion', async () => {
      const request: ConversionRequest = {
        leadId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        courseRunId: '123e4567-e89b-12d3-a456-426614174002',
        userId: '123e4567-e89b-12d3-a456-426614174003',
        enrollmentData: {
          paymentMethod: 'card',
          scholarshipCode: 'BECA2025',
          notes: 'Estudiante prioritario',
        },
      }

      const result = await service.convert(request)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================================
  // canConvert Method Tests
  // ============================================================================

  describe('canConvert', () => {
    let service: LeadConversionService

    beforeEach(() => {
      service = new LeadConversionService()
    })

    it('should return true for convertible lead', () => {
      const lead: Partial<Lead> = {
        status: LeadStatus.QUALIFIED,
        gdprConsent: true,
        email: 'test@example.com',
      }
      const result = service.canConvert(lead)
      expect(result.canConvert).toBe(true)
      expect(result.reasons).toHaveLength(0)
    })

    it('should return false with reasons for non-convertible lead', () => {
      const lead: Partial<Lead> = {
        status: LeadStatus.CONTACTED,
        gdprConsent: false,
      }
      const result = service.canConvert(lead)
      expect(result.canConvert).toBe(false)
      expect(result.reasons.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Mark as Lost Tests
  // ============================================================================

  describe('markAsLost', () => {
    it('should create loss transition', async () => {
      const service = new LeadConversionService()
      const transition = await service.markAsLost({
        leadId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        reason: 'Eligió competidor',
        notes: 'Fue con Academia XYZ por precio',
      })

      expect(transition.toStatus).toBe(LeadStatus.LOST)
      expect(transition.reason).toBe('Eligió competidor')
    })
  })

  // ============================================================================
  // Reactivate Tests
  // ============================================================================

  describe('reactivate', () => {
    it('should create reactivation transition', async () => {
      const service = new LeadConversionService()
      const transition = await service.reactivate({
        leadId: '123e4567-e89b-12d3-a456-426614174000',
        tenantId: '123e4567-e89b-12d3-a456-426614174001',
        userId: '123e4567-e89b-12d3-a456-426614174002',
        notes: 'Volvió a contactar interesado',
      })

      expect(transition.fromStatus).toBe(LeadStatus.LOST)
      expect(transition.toStatus).toBe(LeadStatus.NEW)
    })
  })
})
