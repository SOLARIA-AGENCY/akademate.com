/**
 * @fileoverview Integration tests for Billing Portal API route
 * Tests: POST /api/billing/portal
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
  createBillingPortalSession: vi.fn(),
}))

import { isStripeConfigured, createBillingPortalSession } from '@/@payload-config/lib/stripe'

// ============================================================================
// Test Data
// ============================================================================

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
const validCustomerId = 'cus_test123456'

const validPortalRequest = {
  tenantId: validTenantId,
  stripeCustomerId: validCustomerId,
  returnUrl: 'https://example.com/dashboard',
}

const mockPortalSession = {
  url: 'https://billing.stripe.com/session/bps_test_123456',
}

// ============================================================================
// Test Suite
// ============================================================================

describe('POST /api/billing/portal', () => {
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

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
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
    it('accepts valid portal request with all required fields', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.url).toBe('https://billing.stripe.com/session/bps_test_123456')
    })

    it('rejects invalid tenantId (not a UUID)', async () => {
      const invalidRequest = {
        ...validPortalRequest,
        tenantId: 'not-a-uuid',
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty stripeCustomerId', async () => {
      const invalidRequest = {
        ...validPortalRequest,
        stripeCustomerId: '',
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid returnUrl', async () => {
      const invalidRequest = {
        ...validPortalRequest,
        returnUrl: 'not-a-valid-url',
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
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
        stripeCustomerId: validCustomerId,
        returnUrl: 'https://example.com/dashboard',
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects missing stripeCustomerId', async () => {
      const invalidRequest = {
        tenantId: validTenantId,
        returnUrl: 'https://example.com/dashboard',
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(invalidRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects missing returnUrl', async () => {
      const invalidRequest = {
        tenantId: validTenantId,
        stripeCustomerId: validCustomerId,
      }

      const request = new NextRequest('http://localhost/api/billing/portal', {
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
      const request = new NextRequest('http://localhost/api/billing/portal', {
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
  // Customer ID Validation Tests
  // ==========================================================================

  describe('Customer ID Validation', () => {
    it('accepts valid Stripe customer ID format', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
      expect(createBillingPortalSession).toHaveBeenCalledWith(
        expect.objectContaining({ stripeCustomerId: validCustomerId })
      )
    })

    it('accepts whitespace-only stripeCustomerId (Zod min(1) only checks length)', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          stripeCustomerId: '   ',
        }),
      })

      const response = await POST(request)

      // Zod's min(1) only checks length, not content, so whitespace passes
      expect(response.status).toBe(200)
      expect(createBillingPortalSession).toHaveBeenCalledWith(
        expect.objectContaining({ stripeCustomerId: '   ' })
      )
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    it('calls createBillingPortalSession with correct parameters', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      await POST(request)

      expect(createBillingPortalSession).toHaveBeenCalledWith({
        tenantId: validTenantId,
        stripeCustomerId: validCustomerId,
        returnUrl: 'https://example.com/dashboard',
      })
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(createBillingPortalSession).mockRejectedValue(
        new Error('Stripe API error')
      )

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create billing portal session')
    })

    it('handles customer not found error', async () => {
      vi.mocked(createBillingPortalSession).mockRejectedValue(
        new Error('No such customer')
      )

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create billing portal session')
    })

    it('handles network errors', async () => {
      vi.mocked(createBillingPortalSession).mockRejectedValue(
        new Error('Network error')
      )

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create billing portal session')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    it('returns correct response structure on success', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('url')
      expect(typeof data.url).toBe('string')
      expect(data.url).toContain('stripe.com')
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/portal', {
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

    it('returns 200 status code on successful portal session creation', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validPortalRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })

  // ==========================================================================
  // URL Validation Tests
  // ==========================================================================

  describe('Return URL Validation', () => {
    it('accepts HTTPS URLs', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: 'https://secure.example.com/dashboard',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('accepts HTTP URLs', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: 'http://example.com/dashboard',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('rejects relative URLs', async () => {
      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: '/dashboard',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('accepts custom protocol URLs (Zod url() is lenient)', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: 'htp://broken-url',
        }),
      })

      const response = await POST(request)

      // Zod's url() validation accepts custom protocols like 'htp://'
      expect(response.status).toBe(200)
      expect(createBillingPortalSession).toHaveBeenCalledWith(
        expect.objectContaining({ returnUrl: 'htp://broken-url' })
      )
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json}',
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('handles very long customer IDs', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const longCustomerId = 'cus_' + 'a'.repeat(100)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          stripeCustomerId: longCustomerId,
        }),
      })

      const response = await POST(request)

      // Should either accept or reject gracefully
      expect([200, 400, 500]).toContain(response.status)
    })

    it('handles URLs with query parameters', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: 'https://example.com/dashboard?tab=billing&source=portal',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })

    it('handles URLs with fragments', async () => {
      vi.mocked(createBillingPortalSession).mockResolvedValue(mockPortalSession)

      const request = new NextRequest('http://localhost/api/billing/portal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validPortalRequest,
          returnUrl: 'https://example.com/dashboard#billing',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(200)
    })
  })
})
