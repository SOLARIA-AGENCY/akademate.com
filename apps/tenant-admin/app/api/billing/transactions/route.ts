/**
 * @fileoverview Billing Transactions API
 * List payment transactions per tenant
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { queryRows } from '@/@payload-config/lib/db'

/** Payment transaction record from database */
interface PaymentTransaction {
  id: string
  tenantId: string
  invoiceId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  amount: number
  currency: string
  status: 'pending' | 'refunded' | 'processing' | 'canceled' | 'succeeded' | 'failed'
  paymentMethodType: string | null
  description: string | null
  failureCode: string | null
  failureMessage: string | null
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/** API response for transactions list */
interface TransactionsResponse {
  transactions: PaymentTransaction[]
}

/** Error response structure */
interface ErrorResponse {
  error: string
  details?: unknown
}

const TransactionsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

// ============================================================================
// GET /api/billing/transactions?tenantId=...&limit=...
// ============================================================================

export async function GET(request: NextRequest): Promise<NextResponse<TransactionsResponse | ErrorResponse>> {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const limit = searchParams.get('limit')

    const validation = TransactionsQuerySchema.safeParse({
      tenantId,
      limit: limit != null ? parseInt(limit, 10) : undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const transactions = await queryRows<PaymentTransaction>(
      `SELECT
         id,
         tenant_id AS "tenantId",
         invoice_id AS "invoiceId",
         stripe_payment_intent_id AS "stripePaymentIntentId",
         stripe_charge_id AS "stripeChargeId",
         amount,
         currency,
         status,
         payment_method_type AS "paymentMethodType",
         description,
         failure_code AS "failureCode",
         failure_message AS "failureMessage",
         metadata,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM payment_transactions
       WHERE tenant_id = $1
       ORDER BY created_at DESC
       LIMIT $2`,
      [validation.data.tenantId, validation.data.limit]
    )

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('List transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to list transactions' },
      { status: 500 }
    )
  }
}
