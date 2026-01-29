/**
 * @fileoverview Stripe Checkout Session API
 * Creates checkout sessions for new subscriptions
 */

import type { NextRequest} from 'next/server';
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  createCheckoutSession as createCheckoutSessionImport,
  isStripeConfigured as isStripeConfiguredImport,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Types
// ============================================================================

/** Response from Stripe checkout session creation */
interface CheckoutSessionResponse {
  sessionId: string
  url: string
}

/** Options for creating a checkout session */
interface CreateCheckoutSessionOptions {
  tenantId: string
  planTier: string
  interval: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  stripeCustomerId?: string
}

// ============================================================================
// Typed Wrappers
// ============================================================================

/** Type-safe wrapper for isStripeConfigured */
const isStripeConfigured = isStripeConfiguredImport as () => boolean

/** Type-safe wrapper for createCheckoutSession */
const createCheckoutSession = createCheckoutSessionImport as (
  options: CreateCheckoutSessionOptions
) => Promise<CheckoutSessionResponse>

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

    const body: unknown = await request.json()
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
  } catch (error: unknown) {
    console.error('Checkout session error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
