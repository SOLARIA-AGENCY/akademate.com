/**
 * @fileoverview Integration tests for Subscriptions API route
 * Tests: POST /api/billing/subscriptions
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET, POST } from '../route'
import { NextRequest } from 'next/server'

// ============================================================================
// Mocks
// ============================================================================

// Mock Stripe library
vi.mock('@/@payload-config/lib/stripe', () => ({
  isStripeConfigured: vi.fn(),
  createSubscription: vi.fn(),
  createStripeCustomer: vi.fn(),
}))

import { isStripeConfigured, createSubscription, createStripeCustomer } from '@/@payload-config/lib/stripe'

const { mockDbOperations, resetDbMocks, setExecuteQueue } = vi.hoisted(() => {
  let executeQueue: unknown[] = []

  const mockDbOperations = {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    execute: vi.fn(async () => executeQueue.shift()),
  }

  const resetDbMocks = () => {
    vi.clearAllMocks()
    executeQueue = []
    mockDbOperations.execute.mockImplementation(async () => executeQueue.shift())
  }

  const setExecuteQueue = (queue: unknown[]) => {
    executeQueue = queue
  }

  return {
    mockDbOperations,
    resetDbMocks,
    setExecuteQueue,
  }
})

vi.mock('@/@payload-config/lib/db', () => ({
  db: mockDbOperations,
  subscriptions: {
    tenantId: 'tenant_id',
    updatedAt: 'updated_at',
  },
}))

// ============================================================================
// Test Data
// ============================================================================

const validTenantId = '550e8400-e29b-41d4-a716-446655440000'
const validCustomerId = 'cus_test123456'
const validSubscriptionId = 'sub_test123456'
const validEmail = 'test@example.com'

const validSubscriptionRequest = {
  tenantId: validTenantId,
  planTier: 'pro',
  interval: 'month',
  email: validEmail,
}

const mockCustomer = {
  id: validCustomerId,
  email: validEmail,
  metadata: { tenantId: validTenantId },
}

const mockSubscription = {
  id: validSubscriptionId,
  status: 'active',
  customer: validCustomerId,
  items: {
    data: [{
      id: 'si_test123',
      price: {
        id: 'price_pro_month',
        product: 'prod_test123',
      },
    }],
  },
}

const mockDbSubscription = {
  id: 'sub_db_123',
  tenantId: validTenantId,
  plan: 'pro',
  status: 'active',
  stripeSubscriptionId: validSubscriptionId,
  stripeCustomerId: validCustomerId,
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
}

// ============================================================================
// Test Suite
// ============================================================================

describe('POST /api/billing/subscriptions', () => {
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

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Request Validation Tests
  // ==========================================================================

  describe('Request Validation', () => {
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('accepts valid subscription request with required fields', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(validSubscriptionId)
    })

    it('accepts request with optional name field', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          name: 'Test Company',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createStripeCustomer).toHaveBeenCalledWith(
        expect.objectContaining({ name: 'Test Company' })
      )
    })

    it('accepts request with paymentMethodId', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          paymentMethodId: 'pm_test123',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ paymentMethodId: 'pm_test123' })
      )
    })

    it('accepts request with trialDays', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          trialDays: 14,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ trialDays: 14 })
      )
    })

    it('accepts request with existing stripeCustomerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          stripeCustomerId: validCustomerId,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createStripeCustomer).not.toHaveBeenCalled()
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ stripeCustomerId: validCustomerId })
      )
    })

    it('rejects invalid tenantId (not a UUID)', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          tenantId: 'not-a-uuid',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid planTier', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          planTier: 'premium',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid interval', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          interval: 'weekly',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects invalid email', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          email: 'not-an-email',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects missing email', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: validTenantId,
          planTier: 'pro',
          interval: 'month',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects trialDays below minimum (0)', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          trialDays: -1,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects trialDays above maximum (30)', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          trialDays: 31,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
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
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('accepts starter plan', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          planTier: 'starter',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'starter' })
      )
    })

    it('accepts pro plan', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          planTier: 'pro',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'pro' })
      )
    })

    it('accepts enterprise plan', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          planTier: 'enterprise',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ planTier: 'enterprise' })
      )
    })
  })

  // ==========================================================================
  // Interval Tests
  // ==========================================================================

  describe('Billing Interval Validation', () => {
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('accepts monthly interval', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          interval: 'month',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'month' })
      )
    })

    it('accepts yearly interval', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          interval: 'year',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ interval: 'year' })
      )
    })
  })

  // ==========================================================================
  // Customer Creation Tests
  // ==========================================================================

  describe('Customer Creation', () => {
    beforeEach(() => {
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('creates new customer when stripeCustomerId not provided', async () => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      await POST(request)

      expect(createStripeCustomer).toHaveBeenCalledWith({
        tenantId: validTenantId,
        email: validEmail,
        name: undefined,
      })
    })

    it('uses existing customer when stripeCustomerId provided', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          stripeCustomerId: validCustomerId,
        }),
      })

      await POST(request)

      expect(createStripeCustomer).not.toHaveBeenCalled()
      expect(createSubscription).toHaveBeenCalledWith(
        expect.objectContaining({ stripeCustomerId: validCustomerId })
      )
    })

    it('passes customer name when provided', async () => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          name: 'Universidad Test',
        }),
      })

      await POST(request)

      expect(createStripeCustomer).toHaveBeenCalledWith({
        tenantId: validTenantId,
        email: validEmail,
        name: 'Universidad Test',
      })
    })

    it('handles customer creation errors', async () => {
      vi.mocked(createStripeCustomer).mockRejectedValue(
        new Error('Customer creation failed')
      )

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create subscription')
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('calls createSubscription with correct parameters', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      await POST(request)

      expect(createSubscription).toHaveBeenCalledWith({
        tenantId: validTenantId,
        planTier: 'pro',
        interval: 'month',
        paymentMethodId: undefined,
        trialDays: undefined,
        stripeCustomerId: validCustomerId,
      })
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(createSubscription).mockRejectedValue(
        new Error('Stripe API error')
      )

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create subscription')
    })

    it('handles payment errors', async () => {
      vi.mocked(createSubscription).mockRejectedValue(
        new Error('Your card was declined')
      )

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create subscription')
    })

    it('handles network errors', async () => {
      vi.mocked(createSubscription).mockRejectedValue(
        new Error('Network error')
      )

      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to create subscription')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('returns 201 status code on success', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('returns subscription object on success', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validSubscriptionRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.id).toBe(validSubscriptionId)
      expect(data.status).toBe('active')
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
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
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    beforeEach(() => {
      vi.mocked(createStripeCustomer).mockResolvedValue(mockCustomer as any)
      vi.mocked(createSubscription).mockResolvedValue(mockSubscription as any)
    })

    it('handles malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json}',
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('accepts trialDays of 0', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          trialDays: 0,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('accepts trialDays of 30 (maximum)', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          trialDays: 30,
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('handles email with plus addressing', async () => {
      const request = new NextRequest('http://localhost/api/billing/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validSubscriptionRequest,
          email: 'test+billing@example.com',
        }),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })
  })
})

// ============================================================================
// GET /api/billing/subscriptions
// ============================================================================

describe('GET /api/billing/subscriptions', () => {
  beforeEach(() => {
    resetDbMocks()
  })

  it('returns 400 when tenantId is missing', async () => {
    const request = new NextRequest('http://localhost/api/billing/subscriptions')
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(400)
    expect(data.error).toBe('Invalid tenantId')
  })

  it('returns 404 when subscription is not found', async () => {
    setExecuteQueue([[]])

    const request = new NextRequest(`http://localhost/api/billing/subscriptions?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(404)
    expect(data.error).toBe('Subscription not found')
  })

  it('returns subscription when found', async () => {
    setExecuteQueue([[mockDbSubscription]])

    const request = new NextRequest(`http://localhost/api/billing/subscriptions?tenantId=${validTenantId}`)
    const response = await GET(request)
    const data = await response.json()

    expect(response.status).toBe(200)
    expect(data.id).toBe(mockDbSubscription.id)
  })
})
