/**
 * @fileoverview Subscription Management API
 * Create and list subscriptions
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import { desc, eq } from 'drizzle-orm'
import type Stripe from 'stripe'
import {
  createSubscription,
  createStripeCustomer,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'
import { db, subscriptions } from '@/@payload-config/lib/db'

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

    /* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument -- db uses proxy pattern that ESLint cannot resolve */
    const results = await (db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.tenantId, validation.data.tenantId))
      .orderBy(desc(subscriptions.updatedAt))
      .limit(1)
      .execute() as Promise<SubscriptionRecord[]>)
    /* eslint-enable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument */

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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment -- stripe module has unresolvable types at lint time
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
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment -- stripe module has unresolvable types at lint time
      const customer: Stripe.Customer = await createStripeCustomer({
        tenantId,
        email,
        name,
      })
      customerId = customer.id
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-assignment -- stripe module has unresolvable types at lint time
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
