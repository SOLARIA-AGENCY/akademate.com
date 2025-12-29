/**
 * @fileoverview Integration tests for Single Subscription API route
 * Tests: GET, PATCH, DELETE /api/billing/subscriptions/[id]
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, PATCH, DELETE } from '../route'
import { NextRequest } from 'next/server'

// ============================================================================
// Mocks
// ============================================================================

// Mock Stripe library
vi.mock('@/@payload-config/lib/stripe', () => ({
  isStripeConfigured: vi.fn(),
  getSubscription: vi.fn(),
  updateSubscription: vi.fn(),
  resumeSubscription: vi.fn(),
  cancelSubscription: vi.fn(),
}))

import {
  isStripeConfigured,
  getSubscription,
  updateSubscription,
  resumeSubscription,
  cancelSubscription,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Test Data
// ============================================================================

const validSubscriptionId = 'sub_test123456'
const invalidSubscriptionId = 'invalid_id'

const mockSubscription = {
  id: validSubscriptionId,
  status: 'active',
  cancel_at_period_end: false,
  trial_start: null,
  trial_end: null,
  canceled_at: null,
  items: {
    data: [{
      id: 'si_test123',
      current_period_start: Math.floor(Date.now() / 1000),
      current_period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      price: {
        id: 'price_pro_month',
        product: 'prod_test123',
      },
    }],
  },
}

// ============================================================================
// GET Tests
// ============================================================================

describe('GET /api/billing/subscriptions/[id]', () => {
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

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // ID Validation Tests
  // ==========================================================================

  describe('Subscription ID Validation', () => {
    it('accepts valid subscription ID format', async () => {
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
    })

    it('rejects invalid subscription ID format', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${invalidSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: invalidSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid subscription ID')
    })

    it('rejects empty subscription ID', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions/')
      const response = await GET(request, { params: Promise.resolve({ id: '' }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid subscription ID')
    })
  })

  // ==========================================================================
  // Retrieval Tests
  // ==========================================================================

  describe('Subscription Retrieval', () => {
    it('returns subscription successfully', async () => {
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe(validSubscriptionId)
    })

    it('returns 404 when subscription not found', async () => {
      vi.mocked(getSubscription).mockResolvedValue(null as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('Subscription not found')
    })

    it('includes all subscription fields in response', async () => {
      vi.mocked(getSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('currentPeriodStart')
      expect(data).toHaveProperty('currentPeriodEnd')
      expect(data).toHaveProperty('cancelAtPeriodEnd')
      expect(data).toHaveProperty('items')
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(getSubscription).mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`
      )
      const response = await GET(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to get subscription')
    })
  })
})

// ============================================================================
// PATCH Tests
// ============================================================================

describe('PATCH /api/billing/subscriptions/[id]', () => {
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

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: true }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(updateSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: true }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // ID Validation Tests
  // ==========================================================================

  describe('Subscription ID Validation', () => {
    it('rejects invalid subscription ID format', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${invalidSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: true }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: invalidSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid subscription ID')
    })
  })

  // ==========================================================================
  // Update Tests
  // ==========================================================================

  describe('Subscription Updates', () => {
    it('updates subscription with cancelAtPeriodEnd', async () => {
      vi.mocked(updateSubscription).mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: true }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cancelAtPeriodEnd).toBe(true)
      expect(updateSubscription).toHaveBeenCalledWith(validSubscriptionId, {
        planTier: undefined,
        interval: undefined,
        cancelAtPeriodEnd: true,
      })
    })

    it('resumes subscription when cancelAtPeriodEnd is false', async () => {
      vi.mocked(resumeSubscription).mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: false,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: false }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cancelAtPeriodEnd).toBe(false)
      expect(resumeSubscription).toHaveBeenCalledWith(validSubscriptionId)
    })

    it('updates subscription with planTier', async () => {
      vi.mocked(updateSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planTier: 'enterprise' }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(updateSubscription).toHaveBeenCalledWith(validSubscriptionId, {
        planTier: 'enterprise',
        interval: undefined,
        cancelAtPeriodEnd: undefined,
      })
    })

    it('updates subscription with interval', async () => {
      vi.mocked(updateSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interval: 'year' }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(updateSubscription).toHaveBeenCalledWith(validSubscriptionId, {
        planTier: undefined,
        interval: 'year',
        cancelAtPeriodEnd: undefined,
      })
    })

    it('handles empty update body', async () => {
      vi.mocked(updateSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({}),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
    })

    it('rejects invalid planTier', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ planTier: 'premium' }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid interval', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ interval: 'weekly' }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(updateSubscription).mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cancelAtPeriodEnd: true }),
        }
      )
      const response = await PATCH(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to update subscription')
    })
  })
})

// ============================================================================
// DELETE Tests
// ============================================================================

describe('DELETE /api/billing/subscriptions/[id]', () => {
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

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // ID Validation Tests
  // ==========================================================================

  describe('Subscription ID Validation', () => {
    it('rejects invalid subscription ID format', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${invalidSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: invalidSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid subscription ID')
    })
  })

  // ==========================================================================
  // Cancellation Tests
  // ==========================================================================

  describe('Subscription Cancellation', () => {
    it('cancels subscription at period end by default', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        status: 'active',
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.cancelAtPeriodEnd).toBe(true)
      expect(cancelSubscription).toHaveBeenCalledWith(validSubscriptionId, false)
    })

    it('cancels subscription immediately when immediately=true', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
        canceled_at: Math.floor(Date.now() / 1000),
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}?immediately=true`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('canceled')
      expect(data.canceledAt).toBeDefined()
      expect(cancelSubscription).toHaveBeenCalledWith(validSubscriptionId, true)
    })

    it('includes cancellation timestamp when canceled', async () => {
      const canceledAt = Math.floor(Date.now() / 1000)
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        status: 'canceled',
        canceled_at: canceledAt,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}?immediately=true`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(data.canceledAt).toBeDefined()
    })

    it('handles cancellation with immediately=false explicitly', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}?immediately=false`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
      expect(cancelSubscription).toHaveBeenCalledWith(validSubscriptionId, false)
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(cancelSubscription).mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to cancel subscription')
    })

    it('handles already canceled subscription', async () => {
      vi.mocked(cancelSubscription).mockRejectedValue(
        new Error('Subscription is already canceled')
      )

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to cancel subscription')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    it('returns all required fields in response', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('status')
      expect(data).toHaveProperty('cancelAtPeriodEnd')
      expect(data).toHaveProperty('canceledAt')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles subscription in trial period', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        status: 'trialing',
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
    })

    it('handles subscription past due', async () => {
      vi.mocked(cancelSubscription).mockResolvedValue({
        ...mockSubscription,
        status: 'past_due',
        cancel_at_period_end: true,
      } as any)

      const request = new NextRequest(
        `http://localhost/api/billing/subscriptions/${validSubscriptionId}`,
        { method: 'DELETE' }
      )
      const response = await DELETE(request, { params: Promise.resolve({ id: validSubscriptionId }) })

      expect(response.status).toBe(200)
    })
  })
})
