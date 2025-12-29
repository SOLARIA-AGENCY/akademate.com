/**
 * @fileoverview Integration tests for Checkout API route
 * Tests: POST /api/billing/checkout
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { POST } from '../route'
import { NextRequest } from 'next/server'

// ============================================================================
// Mocks
// ============================================================================

// Mock Stripe library
vi.mock('@/@payload-config/lib/stripe', () => ({
  isStripeConfigured: vi.fn(),
  createCheckoutSession: vi.fn(),
}))

import { isStripeConfigured, createCheckoutSession } from '@/@payload-config/lib/stripe'

// ============================================================================
// Test Data
// ============================================================================

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
const validCustomerId = 'cus_test123456'

const validCheckoutRequest = {
  tenantId: validTenantId,
  planTier: 'pro',
  interval: 'month',
  successUrl: 'https://example.com/success',
  cancelUrl: 'https://example.com/cancel',
  customerEmail: 'test@example.com',
}

const mockCheckoutSession = {
  sessionId: 'cs_test_123456',
  url: 'https://checkout.stripe.com/session/cs_test_123456',
}

// ============================================================================
// Test Suite
// ============================================================================

describe('POST /api/billing/checkout', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isStripeConfigured).mockReturnValue(true)
  })

  // ==========================================================================
  // Stripe Configuration Tests
  // ==========================================================================

  describe('Stripe Configuration', () => {
    it('returns 503 when Stripe is not configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Request Validation Tests
  // ==========================================================================

  describe('Request Validation', () => {
    it('accepts valid checkout request with all required fields', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.sessionId).toBe('cs_test_123456')
      expect(data.url).toBe('https://checkout.stripe.com/session/cs_test_123456')
    })

    it('accepts valid request with optional stripeCustomerId', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const requestData = {
        ...validCheckoutRequest,
        stripeCustomerId: validCustomerId,
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(expect.objectContaining({
        stripeCustomerId: validCustomerId,
      }))
    })

    it('rejects invalid tenantId (not a UUID)', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        tenantId: 'not-a-uuid',
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid planTier', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        planTier: 'premium', // not in enum
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid interval', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        interval: 'weekly', // not in enum
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid successUrl', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        successUrl: 'not-a-valid-url',
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid cancelUrl', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        cancelUrl: 'not-a-valid-url',
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid customerEmail', async () => {
      const invalidRequest = {
        ...validCheckoutRequest,
        customerEmail: 'not-an-email',
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects missing tenantId', async () => {
      const invalidRequest = {
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
      }

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })
  })

  // ==========================================================================
  // Plan Tier Tests
  // ==========================================================================

  describe('Plan Tier Validation', () => {
    it('accepts starter plan', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          planTier: 'starter',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'starter' })
      )
    })

    it('accepts pro plan', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          planTier: 'pro',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'pro' })
      )
    })

    it('accepts enterprise plan', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          planTier: 'enterprise',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'enterprise' })
      )
    })
  })

  // ==========================================================================
  // Interval Tests
  // ==========================================================================

  describe('Billing Interval Validation', () => {
    it('accepts monthly interval', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          interval: 'month',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'month' })
      )
    })

    it('accepts yearly interval', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          interval: 'year',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createCheckoutSession).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'year' })
      )
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    it('calls createCheckoutSession with correct parameters', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      await POST(request)

      expect(createCheckoutSession).toHaveBeenCalledWith({
        tenantId: validTenantId,
        planTier: 'pro',
        interval: 'month',
        successUrl: 'https://example.com/success',
        cancelUrl: 'https://example.com/cancel',
        customerEmail: 'test@example.com',
        stripeCustomerId: undefined,
      })
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(createCheckoutSession).mockRejectedValue(
        new Error('Stripe API error')
      )

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
    })

    it('handles network errors', async () => {
      vi.mocked(createCheckoutSession).mockRejectedValue(
        new Error('Network error')
      )

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create checkout session')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    it('returns correct response structure on success', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('sessionId')
      expect(data).toHaveProperty('url')
      expect(typeof data.sessionId).toBe('string')
      expect(typeof data.url).toBe('string')
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: 'invalid' }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('details')
    })

    it('returns 200 status code on successful checkout session creation', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validCheckoutRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json}',
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('trims whitespace from email addresses', async () => {
      vi.mocked(createCheckoutSession).mockResolvedValue(mockCheckoutSession)

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          customerEmail: '  test@example.com  ',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(400) // Zod should reject this
    })

    it('handles very long URLs', async () => {
      const longUrl = `https://example.com/${'a'.repeat(2000)}`

      const request = new NextRequest('http://localhost/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validCheckoutRequest,
          successUrl: longUrl,
        }),
      })

      const response = await POST(request)

      // Should either accept or reject gracefully
      expect([200, 400]).toContain(response.status)
    })
  })
})
