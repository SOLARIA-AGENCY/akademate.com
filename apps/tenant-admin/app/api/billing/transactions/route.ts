/**
 * @fileoverview Billing Transactions API
 * List payment transactions per tenant
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import { db, paymentTransactions } from '@/@payload-config/lib/db'

const TransactionsQuerySchema = z.object({
  tenantId: z.string().uuid(),
  limit: z.coerce.number().int().min(1).max(100).optional().default(50),
})

// ============================================================================
// GET /api/billing/transactions?tenantId=...&limit=...
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')
    const limit = searchParams.get('limit')

    const validation = TransactionsQuerySchema.safeParse({
      tenantId,
      limit: limit ? parseInt(limit, 10) : undefined,
    })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const transactions = await db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.tenantId, validation.data.tenantId))
      .orderBy(desc(paymentTransactions.createdAt))
      .limit(validation.data.limit)
      .execute()

    return NextResponse.json({ transactions })
  } catch (error) {
    console.error('List transactions error:', error)
    return NextResponse.json(
      { error: 'Failed to list transactions' },
      { status: 500 }
    )
  }
}
