/**
 * @fileoverview Invoice Management API
 * List and retrieve invoices
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import {
  listInvoices as stripeListInvoices,
  getUpcomingInvoice as stripeGetUpcomingInvoice,
  formatCurrency as stripeFormatCurrency,
  isStripeConfigured as stripeIsConfigured,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Types
// ============================================================================

/** Minimal tax amount interface for Stripe invoice total_taxes array */
interface TaxAmount {
  amount: number
}

/** Formatted invoice line item for API response */
interface FormattedInvoiceLine {
  description: string | null
  amount: number
  amountFormatted: string
}

/** Formatted upcoming invoice for API response */
interface FormattedUpcomingInvoice {
  id: string
  status: string
  currency: string
  subtotal: number
  tax: number
  total: number
  subtotalFormatted: string
  totalFormatted: string
  periodStart: Date | null
  periodEnd: Date | null
  lines: FormattedInvoiceLine[]
}

/** Formatted invoice for API response */
interface FormattedInvoice {
  id: string
  number: string | null
  status: Stripe.Invoice['status']
  currency: string
  subtotal: number
  tax: number
  total: number
  amountPaid: number
  amountDue: number
  subtotalFormatted: string
  totalFormatted: string
  hostedInvoiceUrl: string | null
  invoicePdfUrl: string | null
  created: Date
  dueDate: Date | null
  paidAt: Date | null
}

/** API response for list invoices */
interface ListInvoicesResponse {
  invoices: FormattedInvoice[]
  hasMore: boolean
}

// ============================================================================
// Type-Safe Wrappers
// These wrappers provide explicit return types for functions imported through
// path aliases that ESLint cannot resolve. The source functions are properly
// typed in @/@payload-config/lib/stripe.
// ============================================================================

/**
 * Type-safe wrapper for isStripeConfigured
 */
function isStripeConfigured(): boolean {
   
  return stripeIsConfigured() as unknown as boolean
}

/**
 * Type-safe wrapper for formatCurrency
 */
function formatCurrency(amountInCents: number, currency: string): string {
   
  return stripeFormatCurrency(amountInCents, currency) as unknown as string
}

/**
 * Type-safe wrapper for listInvoices
 */
async function listInvoices(customerId: string, limit: number): Promise<Stripe.Invoice[]> {
   
  return stripeListInvoices(customerId, limit) as unknown as Promise<Stripe.Invoice[]>
}

/**
 * Type-safe wrapper for getUpcomingInvoice
 */
async function getUpcomingInvoice(customerId: string): Promise<Stripe.Invoice | null> {
   
  return stripeGetUpcomingInvoice(customerId) as unknown as Promise<Stripe.Invoice | null>
}

// ============================================================================
// Schemas
// ============================================================================

const ListInvoicesSchema = z.object({
  customerId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate total tax from invoice total_taxes array
 * Uses Stripe API 2025-12-15.clover format
 */
function calculateTotalTax(invoice: Stripe.Invoice): number {
  const totalTaxes = invoice.total_taxes as TaxAmount[] | null | undefined
  return totalTaxes?.reduce((sum: number, tax: TaxAmount) => sum + tax.amount, 0) ?? 0
}

/**
 * Format an invoice line item for API response
 */
function formatInvoiceLine(
  line: Stripe.InvoiceLineItem,
  currency: string
): FormattedInvoiceLine {
  return {
    description: line.description,
    amount: line.amount,
    amountFormatted: formatCurrency(line.amount, currency.toUpperCase()),
  }
}

/**
 * Format an upcoming invoice for API response
 */
function formatUpcomingInvoice(invoice: Stripe.Invoice): FormattedUpcomingInvoice {
  const totalTax = calculateTotalTax(invoice)
  const currency = invoice.currency ?? 'usd'
  const currencyUpper = currency.toUpperCase()

  return {
    id: 'upcoming',
    status: 'upcoming',
    currency,
    subtotal: invoice.subtotal ?? 0,
    tax: totalTax,
    total: invoice.total ?? 0,
    subtotalFormatted: formatCurrency(invoice.subtotal ?? 0, currencyUpper),
    totalFormatted: formatCurrency(invoice.total ?? 0, currencyUpper),
    periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
    periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
    lines: invoice.lines.data.map((line: Stripe.InvoiceLineItem) =>
      formatInvoiceLine(line, currencyUpper)
    ),
  }
}

/**
 * Format an invoice for API response
 */
function formatInvoice(invoice: Stripe.Invoice): FormattedInvoice {
  const totalTax = calculateTotalTax(invoice)
  const currency = invoice.currency ?? 'usd'
  const currencyUpper = currency.toUpperCase()

  return {
    id: invoice.id,
    number: invoice.number,
    status: invoice.status,
    currency,
    subtotal: invoice.subtotal ?? 0,
    tax: totalTax,
    total: invoice.total ?? 0,
    amountPaid: invoice.amount_paid ?? 0,
    amountDue: invoice.amount_due ?? 0,
    subtotalFormatted: formatCurrency(invoice.subtotal ?? 0, currencyUpper),
    totalFormatted: formatCurrency(invoice.total ?? 0, currencyUpper),
    hostedInvoiceUrl: invoice.hosted_invoice_url,
    invoicePdfUrl: invoice.invoice_pdf,
    created: new Date(invoice.created * 1000),
    dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
    paidAt: invoice.status_transitions?.paid_at
      ? new Date(invoice.status_transitions.paid_at * 1000)
      : null,
  }
}

// ============================================================================
// GET /api/billing/invoices
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { searchParams } = new URL(request.url)
    const customerId = searchParams.get('customerId')
    const limit = searchParams.get('limit')
    const upcoming = searchParams.get('upcoming')

    // Validate params
    const validation = ListInvoicesSchema.safeParse({
      customerId,
      limit: limit ? parseInt(limit) : undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { customerId: validCustomerId, limit: validLimit } = validation.data

    // Get upcoming invoice if requested
    if (upcoming === 'true') {
      const upcomingInvoice: Stripe.Invoice | null = await getUpcomingInvoice(validCustomerId)

      if (!upcomingInvoice) {
        return NextResponse.json(
          { error: 'No upcoming invoice found' },
          { status: 404 }
        )
      }

      return NextResponse.json(formatUpcomingInvoice(upcomingInvoice))
    }

    // List past invoices
    const invoices: Stripe.Invoice[] = await listInvoices(validCustomerId, validLimit)

    const response: ListInvoicesResponse = {
      invoices: invoices.map((invoice: Stripe.Invoice) => formatInvoice(invoice)),
      hasMore: invoices.length === validLimit,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error('List invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    )
  }
}
