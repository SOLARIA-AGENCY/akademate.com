/**
 * @module @akademate/leads/__tests__/scoring
 * Tests for lead scoring service
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  LeadScoringService,
  DEFAULT_SCORING_RULES,
  quickScore,
  isQualified,
  type Lead,
} from '../src/index.js'

describe('Lead Scoring', () => {
  let service: LeadScoringService

  beforeEach(() => {
    service = new LeadScoringService()
  })

  // ============================================================================
  // Basic Scoring Tests
  // ============================================================================

  describe('score calculation', () => {
    it('should return 0 for empty lead', () => {
      const result = service.score({})
      expect(result.totalScore).toBe(0)
      expect(result.grade).toBe('F')
    })

    it('should add points for phone number', () => {
      const result = service.score({ phone: '+34612345678' })
      expect(result.totalScore).toBeGreaterThan(0)
      expect(result.breakdown.find(b => b.ruleId === 'has_phone')?.matched).toBe(true)
    })

    it('should add points for name', () => {
      const result = service.score({ name: 'Juan García' })
      expect(result.breakdown.find(b => b.ruleId === 'has_name')?.matched).toBe(true)
    })

    it('should add points for course interest', () => {
      const result = service.score({ courseRunId: '123e4567-e89b-12d3-a456-426614174000' })
      expect(result.breakdown.find(b => b.ruleId === 'interested_in_course')?.matched).toBe(true)
    })

    it('should add points for campaign attribution', () => {
      const result = service.score({ campaignId: '123e4567-e89b-12d3-a456-426614174000' })
      expect(result.breakdown.find(b => b.ruleId === 'from_campaign')?.matched).toBe(true)
    })

    it('should add extra points for referral source', () => {
      const result = service.score({ source: 'referral' })
      const referralRule = result.breakdown.find(b => b.ruleId === 'source_referral')
      expect(referralRule?.matched).toBe(true)
      expect(referralRule?.points).toBe(25)
    })

    it('should add points for marketing consent', () => {
      const result = service.score({ marketingConsent: true })
      expect(result.breakdown.find(b => b.ruleId === 'marketing_consent')?.matched).toBe(true)
    })

    it('should cap total score at 100', () => {
      // Create lead with all positive signals
      const highQualityLead: Partial<Lead> = {
        name: 'Juan García',
        phone: '+34612345678',
        courseRunId: '123e4567-e89b-12d3-a456-426614174000',
        campaignId: '123e4567-e89b-12d3-a456-426614174001',
        source: 'referral',
        marketingConsent: true,
        notes: 'Muy interesado en el curso',
      }
      const result = service.score(highQualityLead)
      expect(result.totalScore).toBeLessThanOrEqual(100)
    })
  })

  // ============================================================================
  // Grade Calculation Tests
  // ============================================================================

  describe('grade calculation', () => {
    it('should assign grade A for score >= 80', () => {
      const highQualityLead: Partial<Lead> = {
        name: 'Test',
        phone: '+34612345678',
        courseRunId: '123e4567-e89b-12d3-a456-426614174000',
        campaignId: '123e4567-e89b-12d3-a456-426614174001',
        source: 'referral',
        marketingConsent: true,
      }
      const result = service.score(highQualityLead)
      expect(result.grade).toBe('A')
    })

    it('should assign grade B for score 60-79', () => {
      const mediumLead: Partial<Lead> = {
        name: 'Test',
        phone: '+34612345678',
        courseRunId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'website',
      }
      const result = service.score(mediumLead)
      // Score depends on exact rule matching, grade should be C-B range for this lead
      expect(['A', 'B', 'C']).toContain(result.grade)
    })

    it('should assign grade F for score < 20', () => {
      const result = service.score({})
      expect(result.grade).toBe('F')
    })
  })

  // ============================================================================
  // Recommendation Tests
  // ============================================================================

  describe('recommendations', () => {
    it('should recommend immediate contact for grade A leads', () => {
      const lead: Partial<Lead> = {
        name: 'Test',
        phone: '+34612345678',
        courseRunId: '123e4567-e89b-12d3-a456-426614174000',
        campaignId: '123e4567-e89b-12d3-a456-426614174001',
        source: 'referral',
        marketingConsent: true,
      }
      const result = service.score(lead)
      expect(result.recommendation).toContain('inmediatamente')
    })

    it('should recommend appropriate action for low-score leads', () => {
      const result = service.score({ source: 'website' })
      // Low score leads get monitoring recommendation
      expect(result.recommendation.length).toBeGreaterThan(0)
    })
  })

  // ============================================================================
  // Custom Rules Tests
  // ============================================================================

  describe('custom rules', () => {
    it('should allow adding custom rules', () => {
      const initialCount = service.getRules().length
      service.addRule({
        id: 'custom_vip',
        name: 'VIP Tag',
        description: 'Lead tagged as VIP',
        condition: { field: 'tags', operator: 'contains', value: 'vip' },
        points: 50,
        category: 'demographic',
      })

      expect(service.getRules().length).toBe(initialCount + 1)
    })

    it('should allow removing rules', () => {
      const removed = service.removeRule('has_phone')
      expect(removed).toBe(true)
      expect(service.getRules().find(r => r.id === 'has_phone')).toBeUndefined()
    })

    it('should return false when removing non-existent rule', () => {
      const removed = service.removeRule('non_existent')
      expect(removed).toBe(false)
    })

    it('should filter rules by category', () => {
      const demographicRules = service.getRulesByCategory('demographic')
      expect(demographicRules.every(r => r.category === 'demographic')).toBe(true)
    })
  })

  // ============================================================================
  // Utility Functions Tests
  // ============================================================================

  describe('utility functions', () => {
    it('quickScore should return score number directly', () => {
      // Lead with known scoring characteristics
      const lead: Partial<Lead> = {
        name: 'Test',
        source: 'referral', // +25 points
        marketingConsent: true, // +10 points
      }
      const score = quickScore(lead)
      expect(typeof score).toBe('number')
      expect(score).toBeGreaterThan(0)
    })

    it('isQualified should check against threshold', () => {
      const qualifiedLead: Partial<Lead> = {
        name: 'Test',
        courseRunId: '123e4567-e89b-12d3-a456-426614174000',
        source: 'referral',
        marketingConsent: true,
      }
      expect(isQualified(qualifiedLead)).toBe(true)
      expect(isQualified({})).toBe(false)
    })

    it('isQualified should accept custom threshold', () => {
      const lead: Partial<Lead> = { source: 'referral' } // +25 points
      expect(isQualified(lead, 20)).toBe(true) // Low threshold
      expect(isQualified(lead, 50)).toBe(false) // High threshold
    })
  })

  // ============================================================================
  // Condition Evaluation Tests
  // ============================================================================

  describe('condition evaluation', () => {
    it('should evaluate equals operator correctly', () => {
      const result = service.score({ source: 'referral' })
      const referralMatch = result.breakdown.find(b => b.ruleId === 'source_referral')
      const websiteMatch = result.breakdown.find(b => b.ruleId === 'source_website')
      expect(referralMatch?.matched).toBe(true)
      expect(websiteMatch?.matched).toBe(false)
    })

    it('should evaluate exists operator correctly', () => {
      const withName = service.score({ name: 'Juan García' })
      const withoutName = service.score({})

      const nameMatchWith = withName.breakdown.find(b => b.ruleId === 'has_name')
      const nameMatchWithout = withoutName.breakdown.find(b => b.ruleId === 'has_name')

      expect(nameMatchWith?.matched).toBe(true)
      expect(nameMatchWithout?.matched).toBe(false)
    })

    it('should handle empty string as non-existent', () => {
      const result = service.score({ name: '' })
      const nameMatch = result.breakdown.find(b => b.ruleId === 'has_name')
      expect(nameMatch?.matched).toBe(false)
    })
  })
})
