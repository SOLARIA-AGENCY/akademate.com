/**
 * @fileoverview Stripe Checkout Session API
 * Creates checkout sessions for new subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createCheckoutSession,
  isStripeConfigured,
} from '@/lib/stripe'

// ============================================================================
// Schemas
// ============================================================================

const CreateCheckoutSchema = z.object({
  tenantId: z.string().uuid(),
  planTier: z.enum(['starter', 'pro', 'enterprise']),
  interval: z.enum(['month', 'year']),
  successUrl: z.string().url(),
  cancelUrl: z.string().url(),
  customerEmail: z.string().email().optional(),
  stripeCustomerId: z.string().optional(),
})

// ============================================================================
// POST /api/billing/checkout
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Check Stripe configuration
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body = await request.json()
    const validation = CreateCheckoutSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, planTier, interval, successUrl, cancelUrl, customerEmail, stripeCustomerId } = validation.data

    const session = await createCheckoutSession({
      tenantId,
      planTier,
      interval,
      successUrl,
      cancelUrl,
      customerEmail,
      stripeCustomerId,
    })

    return NextResponse.json(session)
  } catch (error) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
