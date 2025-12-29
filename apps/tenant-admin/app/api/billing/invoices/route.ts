/**
 * @fileoverview Invoice Management API
 * List and retrieve invoices
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  listInvoices,
  getUpcomingInvoice,
  formatCurrency,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Schemas
// ============================================================================

const ListInvoicesSchema = z.object({
  customerId: z.string().min(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
})

// ============================================================================
// GET /api/billing/invoices
// ============================================================================

export async function GET(request: NextRequest) {
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
      const upcomingInvoice = await getUpcomingInvoice(validCustomerId)

      if (!upcomingInvoice) {
        return NextResponse.json(
          { error: 'No upcoming invoice found' },
          { status: 404 }
        )
      }

      // Calculate total tax from total_taxes array (Stripe API 2025-12-15.clover)
      const totalTax = upcomingInvoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0

      return NextResponse.json({
        id: 'upcoming',
        status: 'upcoming',
        currency: upcomingInvoice.currency,
        subtotal: upcomingInvoice.subtotal,
        tax: totalTax,
        total: upcomingInvoice.total,
        subtotalFormatted: formatCurrency(upcomingInvoice.subtotal, upcomingInvoice.currency.toUpperCase()),
        totalFormatted: formatCurrency(upcomingInvoice.total, upcomingInvoice.currency.toUpperCase()),
        periodStart: upcomingInvoice.period_start ? new Date(upcomingInvoice.period_start * 1000) : null,
        periodEnd: upcomingInvoice.period_end ? new Date(upcomingInvoice.period_end * 1000) : null,
        lines: upcomingInvoice.lines.data.map(line => ({
          description: line.description,
          amount: line.amount,
          amountFormatted: formatCurrency(line.amount, upcomingInvoice.currency.toUpperCase()),
        })),
      })
    }

    // List past invoices
    const invoices = await listInvoices(validCustomerId, validLimit)

    return NextResponse.json({
      invoices: invoices.map(invoice => {
        // Calculate total tax from total_taxes array (Stripe API 2025-12-15.clover)
        const totalTax = invoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0

        return {
          id: invoice.id,
          number: invoice.number,
          status: invoice.status,
          currency: invoice.currency,
          subtotal: invoice.subtotal,
          tax: totalTax,
          total: invoice.total,
          amountPaid: invoice.amount_paid,
          amountDue: invoice.amount_due,
          subtotalFormatted: formatCurrency(invoice.subtotal, invoice.currency.toUpperCase()),
          totalFormatted: formatCurrency(invoice.total, invoice.currency.toUpperCase()),
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          invoicePdfUrl: invoice.invoice_pdf,
          created: new Date(invoice.created * 1000),
          dueDate: invoice.due_date ? new Date(invoice.due_date * 1000) : null,
          paidAt: invoice.status_transitions?.paid_at
            ? new Date(invoice.status_transitions.paid_at * 1000)
            : null,
        }
      }),
      hasMore: invoices.length === validLimit,
    })
  } catch (error) {
    console.error('List invoices error:', error)
    return NextResponse.json(
      { error: 'Failed to list invoices' },
      { status: 500 }
    )
  }
}
