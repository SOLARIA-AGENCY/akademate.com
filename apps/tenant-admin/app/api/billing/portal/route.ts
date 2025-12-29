/**
 * @fileoverview Stripe Billing Portal API
 * Creates billing portal sessions for customer self-service
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createBillingPortalSession,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Schemas
// ============================================================================

const CreatePortalSchema = z.object({
  tenantId: z.string().uuid(),
  stripeCustomerId: z.string().min(1),
  returnUrl: z.string().url(),
})

// ============================================================================
// POST /api/billing/portal
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validation = CreatePortalSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, stripeCustomerId, returnUrl } = validation.data

    const session = await createBillingPortalSession({
      tenantId,
      returnUrl,
      stripeCustomerId,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
