/**
 * @module @akademate/leads/__tests__/schemas
 * Tests for lead validation schemas
 */

import { describe, it, expect } from 'vitest'
import {
  LeadCaptureSchema,
  LeadSchema,
  LeadStatusTransitionSchema,
  GdprConsentSchema,
} from '../src/index.js'

describe('Lead Schemas', () => {
  const validTenantId = '123e4567-e89b-12d3-a456-426614174000'
  const validLeadId = '123e4567-e89b-12d3-a456-426614174001'
  const validUserId = '123e4567-e89b-12d3-a456-426614174002'

  // ============================================================================
  // Lead Capture Schema Tests
  // ============================================================================

  describe('LeadCaptureSchema', () => {
    it('should validate minimal capture form', () => {
      const result = LeadCaptureSchema.safeParse({
        email: 'test@example.com',
        name: 'Juan García',
        gdprConsent: true,
      })
      expect(result.success).toBe(true)
    })

    it('should validate full capture form', () => {
      const result = LeadCaptureSchema.safeParse({
        email: 'test@example.com',
        name: 'Juan García',
        phone: '+34612345678',
        courseRunId: validLeadId,
        message: 'Estoy interesado en el curso',
        source: 'website',
        campaignId: validTenantId,
        utmSource: 'google',
        utmMedium: 'cpc',
        utmCampaign: 'cursos-2025',
        gdprConsent: true,
        marketingConsent: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = LeadCaptureSchema.safeParse({
        email: 'not-an-email',
        name: 'Test',
        gdprConsent: true,
      })
      expect(result.success).toBe(false)
    })

    it('should reject without GDPR consent', () => {
      const result = LeadCaptureSchema.safeParse({
        email: 'test@example.com',
        name: 'Test',
        gdprConsent: false,
      })
      expect(result.success).toBe(false)
    })

    it('should reject short names', () => {
      const result = LeadCaptureSchema.safeParse({
        email: 'test@example.com',
        name: 'J',
        gdprConsent: true,
      })
      expect(result.success).toBe(false)
    })

    // Spanish phone validation tests
    describe('Spanish phone validation', () => {
      it('should accept valid mobile starting with 6', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '612345678',
          gdprConsent: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid mobile starting with 7', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '712345678',
          gdprConsent: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept valid landline starting with 9', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '912345678',
          gdprConsent: true,
        })
        expect(result.success).toBe(true)
      })

      it('should accept phone with +34 prefix', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '+34612345678',
          gdprConsent: true,
        })
        expect(result.success).toBe(true)
      })

      it('should reject invalid phone format', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '123456789', // Doesn't start with 6, 7, or 9
          gdprConsent: true,
        })
        expect(result.success).toBe(false)
      })

      it('should reject phone with wrong length', () => {
        const result = LeadCaptureSchema.safeParse({
          email: 'test@example.com',
          name: 'Test',
          phone: '6123456', // Too short
          gdprConsent: true,
        })
        expect(result.success).toBe(false)
      })
    })

    it('should apply defaults', () => {
      const result = LeadCaptureSchema.parse({
        email: 'test@example.com',
        name: 'Test',
        gdprConsent: true,
      })
      expect(result.source).toBe('website')
      expect(result.marketingConsent).toBe(false)
    })
  })

  // ============================================================================
  // Lead Schema Tests
  // ============================================================================

  describe('LeadSchema', () => {
    it('should validate minimal lead', () => {
      const result = LeadSchema.safeParse({
        tenantId: validTenantId,
        email: 'test@example.com',
      })
      expect(result.success).toBe(true)
    })

    it('should validate full lead', () => {
      const result = LeadSchema.safeParse({
        id: validLeadId,
        tenantId: validTenantId,
        email: 'test@example.com',
        name: 'Juan García',
        phone: '+34612345678',
        source: 'referral',
        status: 'qualified',
        courseRunId: validLeadId,
        campaignId: validTenantId,
        notes: 'Muy interesado',
        tags: ['vip', 'urgente'],
        score: 85,
        gdprConsent: true,
        gdprConsentAt: new Date(),
        marketingConsent: true,
        marketingConsentAt: new Date(),
        metadata: { utm_source: 'google' },
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid score', () => {
      const result = LeadSchema.safeParse({
        tenantId: validTenantId,
        email: 'test@example.com',
        score: 150, // Above 100
      })
      expect(result.success).toBe(false)
    })

    it('should reject negative score', () => {
      const result = LeadSchema.safeParse({
        tenantId: validTenantId,
        email: 'test@example.com',
        score: -10,
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid status', () => {
      const result = LeadSchema.safeParse({
        tenantId: validTenantId,
        email: 'test@example.com',
        status: 'invalid',
      })
      expect(result.success).toBe(false)
    })

    it('should apply defaults', () => {
      const result = LeadSchema.parse({
        tenantId: validTenantId,
        email: 'test@example.com',
      })
      expect(result.source).toBe('website')
      expect(result.status).toBe('new')
      expect(result.score).toBe(0)
      expect(result.tags).toEqual([])
      expect(result.gdprConsent).toBe(false)
    })
  })

  // ============================================================================
  // Status Transition Schema Tests
  // ============================================================================

  describe('LeadStatusTransitionSchema', () => {
    it('should validate transition', () => {
      const result = LeadStatusTransitionSchema.safeParse({
        leadId: validLeadId,
        fromStatus: 'new',
        toStatus: 'contacted',
        userId: validUserId,
      })
      expect(result.success).toBe(true)
    })

    it('should validate transition with reason', () => {
      const result = LeadStatusTransitionSchema.safeParse({
        leadId: validLeadId,
        fromStatus: 'qualified',
        toStatus: 'lost',
        userId: validUserId,
        reason: 'Eligió competidor',
        notes: 'Detalles adicionales...',
      })
      expect(result.success).toBe(true)
    })

    it('should reject invalid status values', () => {
      const result = LeadStatusTransitionSchema.safeParse({
        leadId: validLeadId,
        fromStatus: 'invalid',
        toStatus: 'contacted',
        userId: validUserId,
      })
      expect(result.success).toBe(false)
    })
  })

  // ============================================================================
  // GDPR Consent Schema Tests
  // ============================================================================

  describe('GdprConsentSchema', () => {
    it('should validate consent record', () => {
      const result = GdprConsentSchema.safeParse({
        leadId: validLeadId,
        consentType: 'marketing',
        granted: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Mozilla/5.0...',
        timestamp: new Date(),
        version: 'v2.1',
      })
      expect(result.success).toBe(true)
    })

    it('should validate all consent types', () => {
      const consentTypes = ['marketing', 'data_processing', 'third_party', 'profiling']
      for (const type of consentTypes) {
        const result = GdprConsentSchema.safeParse({
          leadId: validLeadId,
          consentType: type,
          granted: true,
          ipAddress: '192.168.1.1',
          userAgent: 'Test',
          timestamp: new Date(),
          version: 'v1.0',
        })
        expect(result.success).toBe(true)
      }
    })

    it('should reject invalid consent type', () => {
      const result = GdprConsentSchema.safeParse({
        leadId: validLeadId,
        consentType: 'invalid',
        granted: true,
        ipAddress: '192.168.1.1',
        userAgent: 'Test',
        timestamp: new Date(),
        version: 'v1.0',
      })
      expect(result.success).toBe(false)
    })

    it('should reject invalid IP address', () => {
      const result = GdprConsentSchema.safeParse({
        leadId: validLeadId,
        consentType: 'marketing',
        granted: true,
        ipAddress: 'not-an-ip',
        userAgent: 'Test',
        timestamp: new Date(),
        version: 'v1.0',
      })
      expect(result.success).toBe(false)
    })
  })
})
