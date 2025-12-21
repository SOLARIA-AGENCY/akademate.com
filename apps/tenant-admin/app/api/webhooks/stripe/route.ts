/**
 * @fileoverview Stripe Webhook Handler
 * Processes Stripe events for subscription and payment updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import {
  constructWebhookEvent,
  isStripeConfigured,
} from '@/lib/stripe'
import type Stripe from 'stripe'

// ============================================================================
// Webhook Event Handlers
// ============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId
  console.log(`[Stripe Webhook] Subscription created: ${subscription.id} for tenant ${tenantId}`)

  // TODO: Update local database with subscription details
  // await db.subscriptions.create({ ... })
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId
  console.log(`[Stripe Webhook] Subscription updated: ${subscription.id} status=${subscription.status}`)

  // TODO: Update local database
  // await db.subscriptions.update({ where: { stripeId: subscription.id }, ... })
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId
  console.log(`[Stripe Webhook] Subscription deleted: ${subscription.id}`)

  // TODO: Update local database - mark as canceled
  // await db.subscriptions.update({ where: { stripeId: subscription.id }, status: 'canceled' })
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Invoice paid: ${invoice.id} amount=${invoice.amount_paid}`)

  // TODO: Record payment, update billing history
  // await db.invoices.create({ ... })
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  console.log(`[Stripe Webhook] Invoice payment failed: ${invoice.id}`)

  // TODO: Send notification to tenant, update status
  // await notificationService.send({ type: 'payment_failed', ... })
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  const tenantId = session.metadata?.tenantId
  console.log(`[Stripe Webhook] Checkout completed: ${session.id} for tenant ${tenantId}`)

  // TODO: Activate subscription, send welcome email
  // await activateSubscription(tenantId, session.subscription)
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  const tenantId = subscription.metadata.tenantId
  const trialEnd = subscription.trial_end
    ? new Date(subscription.trial_end * 1000)
    : null

  console.log(`[Stripe Webhook] Trial ending soon: ${subscription.id} ends ${trialEnd}`)

  // TODO: Send reminder email
  // await notificationService.send({ type: 'trial_ending', tenantId, trialEnd })
}

// ============================================================================
// POST /api/webhooks/stripe
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    if (!isStripeConfigured()) {
      return NextResponse.json(
        { error: 'Stripe is not configured' },
        { status: 503 }
      )
    }

    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'Missing stripe-signature header' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = constructWebhookEvent(body, signature)
    } catch (err) {
      console.error('Webhook signature verification failed:', err)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle the event
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.trial_will_end':
        await handleTrialWillEnd(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session)
        break

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

// Disable body parsing for webhooks (need raw body for signature verification)
export const config = {
  api: {
    bodyParser: false,
  },
}
