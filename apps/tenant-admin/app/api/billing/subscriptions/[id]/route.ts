/**
 * @fileoverview Single Subscription Management API
 * Get, update, and cancel subscriptions
 */

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Schemas
// ============================================================================

const UpdateSubscriptionSchema = z.object({
  planTier: z.enum(['starter', 'pro', 'enterprise']).optional(),
  interval: z.enum(['month', 'year']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

const CancelSubscriptionSchema = z.object({
  immediately: z.boolean().optional().default(false),
})

// ============================================================================
// GET /api/billing/subscriptions/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id || !id.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    const subscription = await getSubscription(id)

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    // In Stripe API 2025-12-15.clover, current_period_* properties are on subscription items
    const firstItem = subscription.items.data[0]
    const currentPeriodStart = firstItem?.current_period_start ?? 0
    const currentPeriodEnd = firstItem?.current_period_end ?? 0

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      currentPeriodStart: new Date(currentPeriodStart * 1000),
      currentPeriodEnd: new Date(currentPeriodEnd * 1000),
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      trialStart: subscription.trial_start ? new Date(subscription.trial_start * 1000) : null,
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      items: subscription.items.data.map(item => ({
        id: item.id,
        priceId: item.price.id,
        productId: typeof item.price.product === 'string' ? item.price.product : item.price.product.id,
      })),
    })
  } catch (error) {
    console.error('Get subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to get subscription' },
      { status: 500 }
    )
  }
}

// ============================================================================
// PATCH /api/billing/subscriptions/[id]
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id || !id.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const validation = UpdateSubscriptionSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid request', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { planTier, interval, cancelAtPeriodEnd } = validation.data

    // Handle resume subscription
    if (cancelAtPeriodEnd === false) {
      const subscription = await resumeSubscription(id)
      return NextResponse.json({
        id: subscription.id,
        status: subscription.status,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
      })
    }

    const subscription = await updateSubscription(id, {
      planTier,
      interval,
      cancelAtPeriodEnd,
    })

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
    })
  } catch (error) {
    console.error('Update subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    )
  }
}

// ============================================================================
// DELETE /api/billing/subscriptions/[id]
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id || !id.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    // Check for query params
    const { searchParams } = new URL(request.url)
    const immediately = searchParams.get('immediately') === 'true'

    const subscription = await cancelSubscription(id, immediately)

    return NextResponse.json({
      id: subscription.id,
      status: subscription.status,
      cancelAtPeriodEnd: subscription.cancel_at_period_end,
      canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
