/**
 * @fileoverview Subscription Management API
 * Create and list subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import {
  createSubscription,
  createStripeCustomer,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'
import { db, subscriptions } from '@/@payload-config/lib/db'

// ============================================================================
// Schemas
// ============================================================================

const CreateSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
  planTier: z.enum(['starter', 'pro', 'enterprise']),
  interval: z.enum(['month', 'year']),
  email: z.string().email(),
  name: z.string().optional(),
  paymentMethodId: z.string().optional(),
  trialDays: z.number().int().min(0).max(30).optional(),
  stripeCustomerId: z.string().optional(),
})

const GetSubscriptionSchema = z.object({
  tenantId: z.string().uuid(),
})

// ============================================================================
// GET /api/billing/subscriptions?tenantId=...
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const tenantId = searchParams.get('tenantId')

    const validation = GetSubscriptionSchema.safeParse({ tenantId })

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid tenantId' },
        { status: 400 }
      )
    }

    const [subscription] = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, validation.data.tenantId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1)
      .execute()

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(subscription)
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

// ============================================================================
// POST /api/billing/subscriptions
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
    const validation = CreateSubscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, planTier, interval, email, name, paymentMethodId, trialDays, stripeCustomerId } = validation.data

    // Get or create Stripe customer
    let customerId = stripeCustomerId
    if (!customerId) {
      const customer = await createStripeCustomer({
        tenantId,
        email,
        name,
      })
      customerId = customer.id
    }

    const result = await createSubscription({
      tenantId,
      planTier,
      interval,
      paymentMethodId,
      trialDays,
      stripeCustomerId: customerId,
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Create subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    )
  }
}
