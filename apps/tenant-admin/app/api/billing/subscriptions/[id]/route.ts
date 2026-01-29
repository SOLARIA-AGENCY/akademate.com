/**
 * @fileoverview Single Subscription Management API
 * Get, update, and cancel subscriptions
 */

import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { z } from 'zod'
import {
  getSubscription,
  updateSubscription,
  cancelSubscription,
  resumeSubscription,
  isStripeConfigured,
} from '@/@payload-config/lib/stripe'

// ============================================================================
// Types
// ============================================================================

/** Local Stripe subscription interface for type-safe access */
interface LocalSubscription {
  id: string
  status: string
  cancel_at_period_end: boolean
  trial_start: number | null
  trial_end: number | null
  canceled_at: number | null
  items: {
    data: LocalSubscriptionItem[]
  }
}

/** Subscription item with period properties (Stripe API 2025-12-15.clover) */
interface LocalSubscriptionItem {
  id: string
  current_period_start?: number
  current_period_end?: number
  price: {
    id: string
    product: string | { id: string }
  }
}

/** Response structure for subscription details */
interface SubscriptionResponse {
  id: string
  status: string
  currentPeriodStart: Date
  currentPeriodEnd: Date
  cancelAtPeriodEnd: boolean
  trialStart: Date | null
  trialEnd: Date | null
  items: {
    id: string
    priceId: string
    productId: string
  }[]
}

/** Response structure for subscription status */
interface SubscriptionStatusResponse {
  id: string
  status: string
  cancelAtPeriodEnd: boolean
  canceledAt?: Date | null
}

// ============================================================================
// Helpers
// ============================================================================

/** Type for the isStripeConfigured function */
type IsConfiguredFn = () => boolean

/** Type for async subscription functions */
type GetSubscriptionFn = (id: string) => Promise<unknown>
type UpdateSubscriptionFn = (id: string, options: {
  planTier?: string
  interval?: string
  cancelAtPeriodEnd?: boolean
}) => Promise<unknown>
type ResumeSubscriptionFn = (id: string) => Promise<unknown>
type CancelSubscriptionFn = (id: string, immediately: boolean) => Promise<unknown>

/**
 * Converts raw Stripe subscription to typed local subscription
 */
function toLocalSubscription(raw: unknown): LocalSubscription {
  return raw as LocalSubscription
}

/**
 * Checks if Stripe configuration is available
 */
function checkStripeConfig(): boolean {
  const fn = isStripeConfigured as IsConfiguredFn
  return fn()
}

/**
 * Fetches a subscription by ID
 */
async function fetchSubscription(id: string): Promise<unknown> {
  const fn = getSubscription as GetSubscriptionFn
  return fn(id)
}

/**
 * Updates a subscription
 */
async function modifySubscription(
  id: string,
  options: { planTier?: string; interval?: string; cancelAtPeriodEnd?: boolean }
): Promise<unknown> {
  const fn = updateSubscription as UpdateSubscriptionFn
  return fn(id, options)
}

/**
 * Resumes a subscription
 */
async function reactivateSubscription(id: string): Promise<unknown> {
  const fn = resumeSubscription as ResumeSubscriptionFn
  return fn(id)
}

/**
 * Cancels a subscription
 */
async function terminateSubscription(id: string, immediately: boolean): Promise<unknown> {
  const fn = cancelSubscription as CancelSubscriptionFn
  return fn(id, immediately)
}

/**
 * Builds the full subscription response from a local subscription
 */
function buildSubscriptionResponse(sub: LocalSubscription): SubscriptionResponse {
  const items = sub.items.data
  const firstItem = items[0]
  const currentPeriodStart = firstItem?.current_period_start ?? 0
  const currentPeriodEnd = firstItem?.current_period_end ?? 0

  return {
    id: sub.id,
    status: sub.status,
    currentPeriodStart: new Date(currentPeriodStart * 1000),
    currentPeriodEnd: new Date(currentPeriodEnd * 1000),
    cancelAtPeriodEnd: sub.cancel_at_period_end,
    trialStart: sub.trial_start ? new Date(sub.trial_start * 1000) : null,
    trialEnd: sub.trial_end ? new Date(sub.trial_end * 1000) : null,
    items: items.map((item) => ({
      id: item.id,
      priceId: item.price.id,
      productId: typeof item.price.product === 'string'
        ? item.price.product
        : item.price.product.id,
    })),
  }
}

/**
 * Builds the status response from a local subscription
 */
function buildStatusResponse(sub: LocalSubscription, includeCanceledAt = false): SubscriptionStatusResponse {
  const response: SubscriptionStatusResponse = {
    id: sub.id,
    status: sub.status,
    cancelAtPeriodEnd: sub.cancel_at_period_end,
  }

  if (includeCanceledAt) {
    response.canceledAt = sub.canceled_at ? new Date(sub.canceled_at * 1000) : null
  }

  return response
}

// ============================================================================
// Schemas
// ============================================================================

const UpdateSubscriptionSchema = z.object({
  planTier: z.enum(['starter', 'pro', 'enterprise']).optional(),
  interval: z.enum(['month', 'year']).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
})

// ============================================================================
// GET /api/billing/subscriptions/[id]
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<SubscriptionResponse | { error: string }>> {
  try {
    if (!checkStripeConfig()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id?.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    const rawSubscription = await fetchSubscription(id)

    if (!rawSubscription) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      )
    }

    const subscription = toLocalSubscription(rawSubscription)
    const response = buildSubscriptionResponse(subscription)

    return NextResponse.json(response)
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
): Promise<NextResponse<Omit<SubscriptionStatusResponse, 'canceledAt'> | { error: string; details?: unknown }>> {
  try {
    if (!checkStripeConfig()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id?.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    const body: unknown = await request.json()
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
      const rawSubscription = await reactivateSubscription(id)
      const subscription = toLocalSubscription(rawSubscription)
      const response = buildStatusResponse(subscription)
      return NextResponse.json(response)
    }

    const rawSubscription = await modifySubscription(id, {
      planTier,
      interval,
      cancelAtPeriodEnd,
    })

    const subscription = toLocalSubscription(rawSubscription)
    const response = buildStatusResponse(subscription)

    return NextResponse.json(response)
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
): Promise<NextResponse<SubscriptionStatusResponse | { error: string }>> {
  try {
    if (!checkStripeConfig()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const { id } = await params

    if (!id?.startsWith('sub_')) {
      return NextResponse.json(
        { error: 'Invalid subscription ID' },
        { status: 400 }
      )
    }

    // Check for query params
    const { searchParams } = new URL(request.url)
    const immediately = searchParams.get('immediately') === 'true'

    const rawSubscription = await terminateSubscription(id, immediately)
    const subscription = toLocalSubscription(rawSubscription)
    const response = buildStatusResponse(subscription, true)

    return NextResponse.json(response)
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
