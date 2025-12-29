/**
 * @fileoverview Integration tests for Invoices API route
 * Tests: GET /api/billing/invoices
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { GET } from '../route'
import { NextRequest } from 'next/server'

// ============================================================================
// Mocks
// ============================================================================

// Mock Stripe library
vi.mock('@/@payload-config/lib/stripe', () => ({
  isStripeConfigured: vi.fn(),
  listInvoices: vi.fn(),
  getUpcomingInvoice: vi.fn(),
  formatCurrency: vi.fn((amount, currency) => {
    const value = amount / 100
    return `${currency} ${value.toFixed(2)}`
  }),
}))

import { isStripeConfigured, listInvoices, getUpcomingInvoice, formatCurrency } from '@/@payload-config/lib/stripe'

// ============================================================================
// Test Data
// ============================================================================

const validCustomerId = 'cus_test123456'

const mockInvoice = {
  id: 'in_test123',
  number: 'INV-001',
  status: 'paid',
  currency: 'usd',
  subtotal: 29900,
  total_taxes: [{ amount: 6278 }],
  total: 36178,
  amount_paid: 36178,
  amount_due: 0,
  hosted_invoice_url: 'https://invoice.stripe.com/i/test',
  invoice_pdf: 'https://invoice.stripe.com/i/test/pdf',
  created: Math.floor(Date.now() / 1000),
  due_date: null,
  status_transitions: {
    paid_at: Math.floor(Date.now() / 1000),
  },
}

const mockUpcomingInvoice = {
  subtotal: 29900,
  currency: 'usd',
  total_taxes: [{ amount: 6278 }],
  total: 36178,
  period_start: Math.floor(Date.now() / 1000),
  period_end: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
  lines: {
    data: [
      {
        description: 'Pro Plan',
        amount: 29900,
      },
    ],
  },
}

// ============================================================================
// Test Suite
// ============================================================================

describe('GET /api/billing/invoices', () => {
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
        'http://localhost/api/billing/invoices?customerId=cus_test123'
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(503)
      expect(data.error).toBe('Stripe is not configured')
    })

    it('proceeds when Stripe is configured', async () => {
      vi.mocked(isStripeConfigured).mockReturnValue(true)
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
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
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('rejects missing customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/invoices')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects empty customerId', async () => {
      const request = new NextRequest('http://localhost/api/billing/invoices?customerId=')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('accepts optional limit parameter', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=5`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(listInvoices).toHaveBeenCalledWith(validCustomerId, 5)
    })

    it('uses default limit when not provided', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
      expect(listInvoices).toHaveBeenCalledWith(validCustomerId, 10)
    })

    it('rejects limit below minimum (1)', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=0`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects limit above maximum (100)', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=101`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })

    it('rejects non-numeric limit', async () => {
      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=abc`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('Invalid request')
    })
  })

  // ==========================================================================
  // List Invoices Tests
  // ==========================================================================

  describe('List Past Invoices', () => {
    it('returns list of invoices successfully', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.invoices).toHaveLength(1)
      expect(data.invoices[0].id).toBe('in_test123')
    })

    it('returns empty array when no invoices exist', async () => {
      vi.mocked(listInvoices).mockResolvedValue([])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.invoices).toHaveLength(0)
    })

    it('includes formatted amounts in response', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.invoices[0]).toHaveProperty('subtotalFormatted')
      expect(data.invoices[0]).toHaveProperty('totalFormatted')
    })

    it('includes all invoice fields in response', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      const invoice = data.invoices[0]
      expect(invoice).toHaveProperty('id')
      expect(invoice).toHaveProperty('number')
      expect(invoice).toHaveProperty('status')
      expect(invoice).toHaveProperty('currency')
      expect(invoice).toHaveProperty('subtotal')
      expect(invoice).toHaveProperty('tax')
      expect(invoice).toHaveProperty('total')
      expect(invoice).toHaveProperty('amountPaid')
      expect(invoice).toHaveProperty('amountDue')
      expect(invoice).toHaveProperty('hostedInvoiceUrl')
      expect(invoice).toHaveProperty('invoicePdfUrl')
      expect(invoice).toHaveProperty('created')
    })

    it('calculates tax correctly from total_taxes array', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.invoices[0].tax).toBe(6278)
    })

    it('handles invoices without tax', async () => {
      const invoiceWithoutTax = {
        ...mockInvoice,
        total_taxes: null,
      }
      vi.mocked(listInvoices).mockResolvedValue([invoiceWithoutTax])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.invoices[0].tax).toBe(0)
    })

    it('sets hasMore flag correctly when limit reached', async () => {
      const invoices = Array(10).fill(mockInvoice)
      vi.mocked(listInvoices).mockResolvedValue(invoices)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=10`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.hasMore).toBe(true)
    })

    it('sets hasMore to false when fewer results than limit', async () => {
      const invoices = Array(5).fill(mockInvoice)
      vi.mocked(listInvoices).mockResolvedValue(invoices)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=10`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.hasMore).toBe(false)
    })
  })

  // ==========================================================================
  // Upcoming Invoice Tests
  // ==========================================================================

  describe('Get Upcoming Invoice', () => {
    it('returns upcoming invoice when upcoming=true', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(mockUpcomingInvoice as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.id).toBe('upcoming')
      expect(data.status).toBe('upcoming')
    })

    it('returns 404 when no upcoming invoice found', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(null)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(404)
      expect(data.error).toBe('No upcoming invoice found')
    })

    it('includes line items in upcoming invoice response', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(mockUpcomingInvoice as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.lines).toBeDefined()
      expect(data.lines).toHaveLength(1)
      expect(data.lines[0].description).toBe('Pro Plan')
    })

    it('includes period dates in upcoming invoice response', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(mockUpcomingInvoice as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.periodStart).toBeDefined()
      expect(data.periodEnd).toBeDefined()
    })

    it('calculates tax correctly for upcoming invoice', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(mockUpcomingInvoice as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.tax).toBe(6278)
    })

    it('handles upcoming invoice without taxes', async () => {
      const upcomingWithoutTax = {
        ...mockUpcomingInvoice,
        total_taxes: null,
      }
      vi.mocked(getUpcomingInvoice).mockResolvedValue(upcomingWithoutTax as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.tax).toBe(0)
    })
  })

  // ==========================================================================
  // Stripe Integration Tests
  // ==========================================================================

  describe('Stripe Integration', () => {
    it('calls listInvoices with correct parameters', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=20`
      )

      await GET(request)

      expect(listInvoices).toHaveBeenCalledWith(validCustomerId, 20)
    })

    it('calls getUpcomingInvoice when upcoming=true', async () => {
      vi.mocked(getUpcomingInvoice).mockResolvedValue(mockUpcomingInvoice as any)

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&upcoming=true`
      )

      await GET(request)

      expect(getUpcomingInvoice).toHaveBeenCalledWith(validCustomerId)
    })

    it('handles Stripe API errors', async () => {
      vi.mocked(listInvoices).mockRejectedValue(new Error('Stripe API error'))

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list invoices')
    })

    it('handles customer not found error', async () => {
      vi.mocked(listInvoices).mockRejectedValue(new Error('No such customer'))

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list invoices')
    })

    it('handles network errors', async () => {
      vi.mocked(listInvoices).mockRejectedValue(new Error('Network error'))

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('Failed to list invoices')
    })
  })

  // ==========================================================================
  // Response Tests
  // ==========================================================================

  describe('Response Structure', () => {
    it('returns correct response structure for list', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data).toHaveProperty('invoices')
      expect(data).toHaveProperty('hasMore')
      expect(Array.isArray(data.invoices)).toBe(true)
    })

    it('returns error details on validation failure', async () => {
      const request = new NextRequest('http://localhost/api/billing/invoices')

      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data).toHaveProperty('error')
      expect(data).toHaveProperty('details')
    })
  })

  // ==========================================================================
  // Currency Formatting Tests
  // ==========================================================================

  describe('Currency Formatting', () => {
    it('calls formatCurrency for each amount', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      await GET(request)

      expect(formatCurrency).toHaveBeenCalled()
    })

    it('formats amounts in correct currency', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)
      const data = await response.json()

      expect(data.invoices[0].subtotalFormatted).toContain('USD')
      expect(data.invoices[0].totalFormatted).toContain('USD')
    })
  })

  // ==========================================================================
  // Edge Cases
  // ==========================================================================

  describe('Edge Cases', () => {
    it('handles very long customer IDs', async () => {
      const longCustomerId = 'cus_' + 'a'.repeat(100)
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${longCustomerId}`
      )

      const response = await GET(request)

      // Should either accept or reject gracefully
      expect([200, 400, 500]).toContain(response.status)
    })

    it('handles multiple query parameters', async () => {
      vi.mocked(listInvoices).mockResolvedValue([mockInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}&limit=5&upcoming=false&extra=param`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })

    it('handles invoices with missing optional fields', async () => {
      const minimalInvoice = {
        id: 'in_minimal',
        number: null,
        status: 'open',
        currency: 'usd',
        subtotal: 1000,
        total_taxes: null,
        total: 1000,
        amount_paid: 0,
        amount_due: 1000,
        hosted_invoice_url: null,
        invoice_pdf: null,
        created: Math.floor(Date.now() / 1000),
        due_date: null,
        status_transitions: null,
      }
      vi.mocked(listInvoices).mockResolvedValue([minimalInvoice])

      const request = new NextRequest(
        `http://localhost/api/billing/invoices?customerId=${validCustomerId}`
      )

      const response = await GET(request)

      expect(response.status).toBe(200)
    })
  })
})
