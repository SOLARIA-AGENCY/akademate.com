/**
 * @fileoverview Subscription Management API
 * Create and list subscriptions
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import type Stripe from 'stripe'
import {
  createSubscription,
  createStripeCustomer,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'
import { queryRows } from '@/@payload-config/lib/db'

// ============================================================================
// Types
// ============================================================================

/** Database subscription record */
interface SubscriptionRecord {
  id: string
  tenantId: string
  plan: 'starter' | 'pro' | 'enterprise'
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid'
  stripeSubscriptionId: string | null
  stripeCustomerId: string | null
  currentPeriodStart: Date | null
  currentPeriodEnd: Date | null
  cancelAtPeriodEnd: boolean
  canceledAt: Date | null
  trialStart: Date | null
  trialEnd: Date | null
  usageMeter: { metric: string; value: number; unit?: string | null; limit?: number | string | null; updatedAt?: string }[]
  metadata: Record<string, unknown>
  createdAt: Date
  updatedAt: Date
}

/** Input type for subscription creation request body (used for documentation) */
type _CreateSubscriptionInput = z.infer<typeof CreateSubscriptionSchema>

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

    const results = await queryRows<SubscriptionRecord>(
      `SELECT
         id,
         tenant_id AS "tenantId",
         plan,
         status,
         stripe_subscription_id AS "stripeSubscriptionId",
         stripe_customer_id AS "stripeCustomerId",
         current_period_start AS "currentPeriodStart",
         current_period_end AS "currentPeriodEnd",
         cancel_at_period_end AS "cancelAtPeriodEnd",
         canceled_at AS "canceledAt",
         trial_start AS "trialStart",
         trial_end AS "trialEnd",
         usage_meter AS "usageMeter",
         metadata,
         created_at AS "createdAt",
         updated_at AS "updatedAt"
       FROM subscriptions
       WHERE tenant_id = $1
       ORDER BY updated_at DESC
       LIMIT 1`,
      [validation.data.tenantId]
    )

    const subscription = results[0]

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
     
    const stripeConfigured: boolean = isStripeConfigured()
    if (!stripeConfigured) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body: unknown = await request.json()
    const validation = CreateSubscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { tenantId, planTier, interval, email, name, paymentMethodId, trialDays, stripeCustomerId } = validation.data

    // Get or create Stripe customer
    let customerId: string | undefined = stripeCustomerId
    if (!customerId) {
       
      const customer: Stripe.Customer = await createStripeCustomer({
        tenantId,
        email,
        name,
      })
      customerId = customer.id
    }

     
    const result: Stripe.Subscription = await createSubscription({
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
