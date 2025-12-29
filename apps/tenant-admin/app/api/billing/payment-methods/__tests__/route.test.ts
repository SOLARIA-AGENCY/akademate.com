/**
 * @fileoverview Integration tests for Payment Methods API route
 * Tests: GET, POST /api/billing/payment-methods
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
  listPaymentMethods: vi.fn(),
  attachPaymentMethod: vi.fn(),
  setDefaultPaymentMethod: vi.fn(),
}))

import {
  isStripeConfigured,
  listPaymentMethods,
  attachPaymentMethod,
  setDefaultPaymentMethod,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Test Data
// ============================================================================

const validCustomerId = 'cus_test123456'
const validPaymentMethodId = 'pm_test123456'

const mockPaymentMethod = {
  id: validPaymentMethodId,
  type: 'card',
  card: {
    brand: 'visa',
    last4: '4242',
    exp_month: 12,
    exp_year: 2025,
    funding: 'credit',
  },
  billing_details: {
    name: 'Test User',
    email: 'test@example.com',
    phone: null,
    address: null,
  },
  created: Math.floor(Date.now() / 1000),
}

// ============================================================================
// GET Tests
// ============================================================================

describe('GET /api/billing/payment-methods', () => {
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
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(isStripeConfigured).toHaveBeenCalled()
    })
  })

  // ==========================================================================
  // Request Validation Tests
  // ==========================================================================

  describe('Request Validation', () => {
    it('accepts valid customerId parameter', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('rejects missing customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods?customerId=')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects whitespace-only customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods?customerId=   ')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })
  })

  // ==========================================================================
  // List Payment Methods Tests
  // ==========================================================================

  describe('List Payment Methods', () => {
    it('returns list of payment methods successfully', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentMethods).toHaveLength(1)
      expect(data.paymentMethods[0].id).toBe(validPaymentMethodId)
    })

    it('returns empty array when no payment methods exist', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentMethods).toHaveLength(0)
    })

    it('includes all payment method fields in response', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      const pm = data.paymentMethods[0]
      expect(pm).toHaveProperty('id')
      expect(pm).toHaveProperty('type')
      expect(pm).toHaveProperty('card')
      expect(pm).toHaveProperty('billingDetails')
      expect(pm).toHaveProperty('created')
    })

    it('formats card details correctly', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      const card = data.paymentMethods[0].card
      expect(card.brand).toBe('visa')
      expect(card.last4).toBe('4242')
      expect(card.expMonth).toBe(12)
      expect(card.expYear).toBe(2025)
      expect(card.funding).toBe('credit')
    })

    it('handles payment methods without cards', async () => {
      const sepaMethod = {
        ...mockPaymentMethod,
        type: 'sepa_debit',
        card: null,
      }
      vi.mocked(listPaymentMethods).mockResolvedValue([sepaMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.paymentMethods[0].card).toBeNull()
    })

    it('includes billing details in response', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      const billing = data.paymentMethods[0].billingDetails
      expect(billing).toHaveProperty('name')
      expect(billing).toHaveProperty('email')
      expect(billing).toHaveProperty('phone')
      expect(billing).toHaveProperty('address')
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    it('calls listPaymentMethods with correct customerId', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      await GET(request)

      expect(listPaymentMethods).toHaveBeenCalledWith(validCustomerId)
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(listPaymentMethods).mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list payment methods')
    })

    it('handles customer not found error', async () => {
      vi.mocked(listPaymentMethods).mockRejectedValue(new Error('No such customer'))

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list payment methods')
    })

    it('handles network errors', async () => {
      vi.mocked(listPaymentMethods).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list payment methods')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    it('returns correct response structure', async () => {
      vi.mocked(listPaymentMethods).mockResolvedValue([mockPaymentMethod] as any)

      const request = new NextRequest(
        `http://localhost/api/billing/payment-methods?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('paymentMethods')
      expect(Array.isArray(data.paymentMethods)).toBe(true)
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('details')
    })
  })
})

// ============================================================================
// POST Tests
// ============================================================================

describe('POST /api/billing/payment-methods', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(isStripeConfigured).mockReturnValue(true)
  })

  const validAttachRequest = {
    customerId: validCustomerId,
    paymentMethodId: validPaymentMethodId,
  }

  // ==========================================================================
  // Stripe Configuration Tests
  // ==========================================================================

  describe('Stripe Configuration', () => {
    it('returns 503 when Stripe is not configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(false)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
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
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)
    })

    it('accepts valid attach request', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.id).toBe(validPaymentMethodId)
    })

    it('accepts request with setAsDefault true', async () => {
      vi.mocked(setDefaultPaymentMethod).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validAttachRequest,
          setAsDefault: true,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.isDefault).toBe(true)
      expect(setDefaultPaymentMethod).toHaveBeenCalledWith(
        validCustomerId,
        validPaymentMethodId
      )
    })

    it('does not set as default when setAsDefault is false', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validAttachRequest,
          setAsDefault: false,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.isDefault).toBe(false)
      expect(setDefaultPaymentMethod).not.toHaveBeenCalled()
    })

    it('defaults setAsDefault to false when not provided', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
      expect(setDefaultPaymentMethod).not.toHaveBeenCalled()
    })

    it('rejects missing customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: validPaymentMethodId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects missing paymentMethodId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: validCustomerId }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: '',
          paymentMethodId: validPaymentMethodId,
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty paymentMethodId', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: validCustomerId,
          paymentMethodId: '',
        }),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
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
  // Attach Payment Method Tests
  // ==========================================================================

  describe('Attach Payment Method', () => {
    it('attaches payment method to customer', async () => {
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      await POST(request)

      expect(attachPaymentMethod).toHaveBeenCalledWith(
        validPaymentMethodId,
        validCustomerId
      )
    })

    it('sets payment method as default when requested', async () => {
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)
      vi.mocked(setDefaultPaymentMethod).mockResolvedValue({} as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...validAttachRequest,
          setAsDefault: true,
        }),
      })

      await POST(request)

      expect(attachPaymentMethod).toHaveBeenCalledWith(
        validPaymentMethodId,
        validCustomerId
      )
      expect(setDefaultPaymentMethod).toHaveBeenCalledWith(
        validCustomerId,
        validPaymentMethodId
      )
    })

    it('returns attached payment method details', async () => {
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.id).toBe(validPaymentMethodId)
      expect(data.type).toBe('card')
      expect(data.card).toBeDefined()
    })

    it('includes card details in response', async () => {
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data.card.brand).toBe('visa')
      expect(data.card.last4).toBe('4242')
      expect(data.card.expMonth).toBe(12)
      expect(data.card.expYear).toBe(2025)
    })

    it('handles payment method without card details', async () => {
      const sepaMethod = {
        ...mockPaymentMethod,
        type: 'sepa_debit',
        card: null,
      }
      vi.mocked(attachPaymentMethod).mockResolvedValue(sepaMethod as any)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(201)
      expect(data.card).toBeNull()
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    it('handles payment method already attached error', async () => {
      vi.mocked(attachPaymentMethod).mockRejectedValue(
        new Error('Payment method is already attached')
      )

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to attach payment method')
    })

    it('handles invalid payment method error', async () => {
      vi.mocked(attachPaymentMethod).mockRejectedValue(
        new Error('No such payment method')
      )

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to attach payment method')
    })

    it('handles customer not found error', async () => {
      vi.mocked(attachPaymentMethod).mockRejectedValue(
        new Error('No such customer')
      )

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to attach payment method')
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(attachPaymentMethod).mockRejectedValue(
        new Error('Stripe API error')
      )

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to attach payment method')
    })

    it('handles network errors', async () => {
      vi.mocked(attachPaymentMethod).mockRejectedValue(
        new Error('Network error')
      )

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to attach payment method')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    beforeEach(() => {
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)
    })

    it('returns 201 status code on success', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)

      expect(response.status).toBe(201)
    })

    it('returns correct response structure', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validAttachRequest),
      })

      const response = await POST(request)
      const data = await response.json()

      expect(data).toHaveProperty('id')
      expect(data).toHaveProperty('type')
      expect(data).toHaveProperty('card')
      expect(data).toHaveProperty('isDefault')
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
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
      vi.mocked(attachPaymentMethod).mockResolvedValue(mockPaymentMethod as any)
    })

    it('handles malformed JSON request body', async () => {
      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: '{invalid-json}',
      })

      const response = await POST(request)

      expect(response.status).toBe(500)
    })

    it('handles very long customer IDs', async () => {
      const longCustomerId = 'cus_' + 'a'.repeat(100)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: longCustomerId,
          paymentMethodId: validPaymentMethodId,
        }),
      })

      const response = await POST(request)

      // Should either accept or reject gracefully
      expect([201, 400, 500]).toContain(response.status)
    })

    it('handles very long payment method IDs', async () => {
      const longPaymentMethodId = 'pm_' + 'a'.repeat(100)

      const request = new NextRequest('http://localhost/api/billing/payment-methods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: validCustomerId,
          paymentMethodId: longPaymentMethodId,
        }),
      })

      const response = await POST(request)

      // Should either accept or reject gracefully
      expect([201, 400, 500]).toContain(response.status)
    })
  })
})
