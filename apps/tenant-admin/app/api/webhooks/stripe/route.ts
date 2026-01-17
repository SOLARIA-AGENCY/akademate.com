/**
 * @fileoverview Stripe Webhook Handler
 * Processes Stripe events for subscription and payment updates
 */

import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { eq } from 'drizzle-orm'
import {
  constructWebhookEvent,
  isStripeConfigured,
} from '@/lib/stripe'
import {
  db,
  subscriptions,
  invoices,
  paymentTransactions,
  tenants,
} from '@/lib/db'
import type Stripe from 'stripe'

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Extracts tenantId from Stripe metadata
 * @throws {Error} If tenantId is missing or invalid
 */
function getTenantIdFromMetadata(metadata: Record<string, string> | null | undefined): string {
  const tenantId = metadata?.tenantId

  if (!tenantId) {
    throw new Error('Missing tenantId in Stripe metadata')
  }

  return tenantId
}

/**
 * Converts Stripe timestamp (unix seconds) to JavaScript Date
 */
function fromUnixTimestamp(timestamp: number | null): Date | null {
  if (!timestamp) return null
  return new Date(timestamp * 1000)
}

/**
 * Maps Stripe subscription status to our database enum
 */
function mapSubscriptionStatus(
  status: Stripe.Subscription.Status
): 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'unpaid' {
  // Map Stripe status to our DB enum values
  switch (status) {
    case 'trialing':
      return 'trialing'
    case 'active':
      return 'active'
    case 'past_due':
      return 'past_due'
    case 'canceled':
      return 'canceled'
    case 'incomplete':
      return 'incomplete'
    case 'incomplete_expired':
      return 'incomplete_expired'
    case 'unpaid':
      return 'unpaid'
    default:
      return 'canceled' // fallback
  }
}

/**
 * Maps Stripe invoice status to our database enum
 */
function mapInvoiceStatus(
  status: Stripe.Invoice.Status
): 'draft' | 'open' | 'paid' | 'void' | 'uncollectible' {
  // Map Stripe status to our DB enum values
  switch (status) {
    case 'draft':
      return 'draft'
    case 'open':
      return 'open'
    case 'paid':
      return 'paid'
    case 'void':
      return 'void'
    case 'uncollectible':
      return 'uncollectible'
    default:
      return 'open' // fallback
  }
}

async function updateTenantStatus(
  tenantId: string,
  status: 'trial' | 'active' | 'suspended' | 'cancelled'
): Promise<void> {
  await db
    .update(tenants)
    .set({
      status,
      updatedAt: new Date(),
    })
    .where(eq(tenants.id, tenantId))
}

/**
 * Upserts a subscription from Stripe data
 */
async function upsertSubscription(stripeSubscription: Stripe.Subscription): Promise<void> {
  const tenantId = getTenantIdFromMetadata(stripeSubscription.metadata)

  // Note: current_period_start/end are now on subscription items in Stripe API 2025-12-15.clover
  const firstItem = stripeSubscription.items.data[0]

  const subscriptionData = {
    tenantId,
    plan: (stripeSubscription.metadata.plan || 'starter') as 'starter' | 'pro' | 'enterprise',
    status: mapSubscriptionStatus(stripeSubscription.status),
    stripeSubscriptionId: stripeSubscription.id,
    stripeCustomerId: typeof stripeSubscription.customer === 'string'
      ? stripeSubscription.customer
      : stripeSubscription.customer?.id || null,
    currentPeriodStart: fromUnixTimestamp(firstItem?.current_period_start ?? null),
    currentPeriodEnd: fromUnixTimestamp(firstItem?.current_period_end ?? null),
    cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
    canceledAt: stripeSubscription.canceled_at ? fromUnixTimestamp(stripeSubscription.canceled_at) : null,
    trialStart: stripeSubscription.trial_start ? fromUnixTimestamp(stripeSubscription.trial_start) : null,
    trialEnd: stripeSubscription.trial_end ? fromUnixTimestamp(stripeSubscription.trial_end) : null,
    metadata: stripeSubscription.metadata as Record<string, unknown>,
    updatedAt: new Date(),
  }

  // Check if subscription exists
  const existing = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
    .limit(1)

  if (existing.length > 0) {
    // Update existing subscription
    await db
      .update(subscriptions)
      .set(subscriptionData)
      .where(eq(subscriptions.stripeSubscriptionId, stripeSubscription.id))
  } else {
    // Create new subscription
    await db.insert(subscriptions).values({
      ...subscriptionData,
      createdAt: new Date(),
    })
  }

  console.log(
    `[Stripe Webhook] Subscription ${existing.length > 0 ? 'updated' : 'created'}: ${stripeSubscription.id}`
  )
}

/**
 * Upserts an invoice from Stripe data
 */
async function upsertInvoice(stripeInvoice: Stripe.Invoice): Promise<void> {
  const tenantId = getTenantIdFromMetadata(stripeInvoice.metadata)

  // Extract line items
  // Note: In Stripe API 2025-12-15.clover, line items structure may vary
  const lineItems = stripeInvoice.lines.data.map((line) => ({
    description: line.description || '',
    quantity: line.quantity || 1,
    unitAmount: (line as any).price?.unit_amount || (line as any).unit_amount || 0,
    amount: line.amount,
  }))

  // Note: tax is now total_taxes array in Stripe API 2025-12-15.clover
  const taxAmount = stripeInvoice.total_taxes?.reduce((sum, tax) => sum + tax.amount, 0) ?? 0

  const invoiceData = {
    tenantId,
    subscriptionId: null, // Will be set if we have subscription reference
    stripeInvoiceId: stripeInvoice.id,
    number: stripeInvoice.number || stripeInvoice.id,
    status: mapInvoiceStatus(stripeInvoice.status || 'open'),
    currency: (stripeInvoice.currency || 'eur').toUpperCase(),
    subtotal: stripeInvoice.subtotal,
    tax: taxAmount,
    total: stripeInvoice.total,
    amountPaid: stripeInvoice.amount_paid,
    amountDue: stripeInvoice.amount_due,
    dueDate: fromUnixTimestamp(stripeInvoice.due_date),
    paidAt: stripeInvoice.status === 'paid' ? fromUnixTimestamp(stripeInvoice.status_transitions.paid_at) : null,
    hostedInvoiceUrl: stripeInvoice.hosted_invoice_url,
    invoicePdfUrl: stripeInvoice.invoice_pdf,
    lineItems,
    metadata: stripeInvoice.metadata as Record<string, unknown>,
    updatedAt: new Date(),
  }

  // Check if invoice exists
  const existing = await db
    .select()
    .from(invoices)
    .where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
    .limit(1)

  if (existing.length > 0) {
    // Update existing invoice
    await db
      .update(invoices)
      .set(invoiceData)
      .where(eq(invoices.stripeInvoiceId, stripeInvoice.id))
  } else {
    // Create new invoice
    await db.insert(invoices).values({
      ...invoiceData,
      createdAt: new Date(),
    })
  }

  console.log(
    `[Stripe Webhook] Invoice ${existing.length > 0 ? 'updated' : 'created'}: ${stripeInvoice.id} (status: ${invoiceData.status})`
  )
}

/**
 * Creates a payment transaction record
 */
async function createPaymentTransaction(params: {
  tenantId: string
  invoiceId: string | null
  stripePaymentIntentId: string | null
  stripeChargeId: string | null
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled' | 'refunded'
  paymentMethodType?: string
  description?: string
  failureCode?: string | null
  failureMessage?: string | null
  metadata?: Record<string, unknown>
}): Promise<void> {
  // Find the invoice UUID if we have a Stripe invoice ID
  let invoiceUuid: string | null = null
  if (params.invoiceId) {
    const invoice = await db
      .select()
      .from(invoices)
      .where(eq(invoices.stripeInvoiceId, params.invoiceId))
      .limit(1)

    if (invoice.length > 0 && invoice[0]) {
      invoiceUuid = invoice[0].id
    }
  }

  await db.insert(paymentTransactions).values({
    tenantId: params.tenantId,
    invoiceId: invoiceUuid,
    stripePaymentIntentId: params.stripePaymentIntentId,
    stripeChargeId: params.stripeChargeId,
    amount: params.amount,
    currency: params.currency.toUpperCase(),
    status: params.status,
    paymentMethodType: params.paymentMethodType || null,
    description: params.description || null,
    failureCode: params.failureCode || null,
    failureMessage: params.failureMessage || null,
    metadata: params.metadata || {},
    createdAt: new Date(),
    updatedAt: new Date(),
  })

  console.log(
    `[Stripe Webhook] Payment transaction created: ${params.status} for ${params.amount} ${params.currency}`
  )
}

// ============================================================================
// Webhook Event Handlers
// ============================================================================

async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  try {
    await upsertSubscription(subscription)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.created:', error)
    throw error
  }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  try {
    await upsertSubscription(subscription)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.updated:', error)
    throw error
  }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  try {
    const tenantId = getTenantIdFromMetadata(subscription.metadata)

    await db
      .update(subscriptions)
      .set({
        status: 'canceled',
        canceledAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

    console.log(`[Stripe Webhook] Subscription canceled: ${subscription.id}`)
  } catch (error) {
    console.error('[Stripe Webhook] Error handling subscription.deleted:', error)
    throw error
  }
}

async function handleInvoicePaid(invoice: Stripe.Invoice) {
  try {
    const tenantId = getTenantIdFromMetadata(invoice.metadata)

    // Upsert invoice with paid status
    await upsertInvoice(invoice)

    // Create successful payment transaction
    // Note: In Stripe API 2025-12-15.clover, charge and payment_intent might not be available directly
    // Using type assertion as these properties may exist at runtime via webhooks
    const invoiceAny = invoice as any
    const chargeId = invoiceAny.charge
      ? (typeof invoiceAny.charge === 'string' ? invoiceAny.charge : invoiceAny.charge?.id || null)
      : null
    const paymentIntentId = invoiceAny.payment_intent
      ? (typeof invoiceAny.payment_intent === 'string' ? invoiceAny.payment_intent : invoiceAny.payment_intent?.id || null)
      : null

    await createPaymentTransaction({
      tenantId,
      invoiceId: invoice.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: 'succeeded',
      description: `Payment for invoice ${invoice.number || invoice.id}`,
      metadata: invoice.metadata as Record<string, unknown>,
    })

    await updateTenantStatus(tenantId, 'active')
  } catch (error) {
    console.error('[Stripe Webhook] Error handling invoice.paid:', error)
    throw error
  }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  try {
    const tenantId = getTenantIdFromMetadata(invoice.metadata)

    // Upsert invoice with failed/uncollectible status
    await upsertInvoice(invoice)

    // Create failed payment transaction
    // Note: In Stripe API 2025-12-15.clover, charge and payment_intent might not be available directly
    // Using type assertion as these properties may exist at runtime via webhooks
    const invoiceAny = invoice as any
    const paymentIntentId = invoiceAny.payment_intent
      ? (typeof invoiceAny.payment_intent === 'string' ? invoiceAny.payment_intent : invoiceAny.payment_intent?.id || null)
      : null

    const chargeId = invoiceAny.charge
      ? (typeof invoiceAny.charge === 'string' ? invoiceAny.charge : invoiceAny.charge?.id || null)
      : null

    // Extract failure information from last payment attempt
    let failureCode: string | null = null
    let failureMessage: string | null = null

    if (invoice.last_finalization_error) {
      failureCode = invoice.last_finalization_error.code || null
      failureMessage = invoice.last_finalization_error.message || null
    }

    await createPaymentTransaction({
      tenantId,
      invoiceId: invoice.id,
      stripePaymentIntentId: paymentIntentId,
      stripeChargeId: chargeId,
      amount: invoice.amount_due,
      currency: invoice.currency,
      status: 'failed',
      description: `Failed payment for invoice ${invoice.number || invoice.id}`,
      failureCode,
      failureMessage,
      metadata: invoice.metadata as Record<string, unknown>,
    })

    console.log(`[Stripe Webhook] Payment failed for invoice: ${invoice.id}`)

    await updateTenantStatus(tenantId, 'suspended')
  } catch (error) {
    console.error('[Stripe Webhook] Error handling invoice.payment_failed:', error)
    throw error
  }
}

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  try {
    const tenantId = getTenantIdFromMetadata(session.metadata)

    console.log(`[Stripe Webhook] Checkout completed: ${session.id} for tenant ${tenantId}`)

    // If this is for a subscription, verify it exists in our database
    if (session.subscription) {
      const subscriptionId = typeof session.subscription === 'string'
        ? session.subscription
        : session.subscription.id

      const existing = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.stripeSubscriptionId, subscriptionId))
        .limit(1)

      if (existing.length === 0) {
        console.warn(
          `[Stripe Webhook] Subscription ${subscriptionId} from checkout not found in database. It should be created via subscription.created event.`
        )
      }
    }

    // If this is a one-time payment, create invoice and transaction
    if (session.mode === 'payment' && session.payment_intent) {
      const paymentIntentId = typeof session.payment_intent === 'string'
        ? session.payment_intent
        : session.payment_intent.id

      await createPaymentTransaction({
        tenantId,
        invoiceId: null,
        stripePaymentIntentId: paymentIntentId,
        stripeChargeId: null,
        amount: session.amount_total || 0,
        currency: session.currency || 'eur',
        status: 'succeeded',
        description: `One-time payment via checkout session ${session.id}`,
        metadata: session.metadata as Record<string, unknown>,
      })
    }
  } catch (error) {
    console.error('[Stripe Webhook] Error handling checkout.session.completed:', error)
    throw error
  }
}

async function handleTrialWillEnd(subscription: Stripe.Subscription) {
  try {
    const tenantId = getTenantIdFromMetadata(subscription.metadata)
    const trialEnd = subscription.trial_end
      ? new Date(subscription.trial_end * 1000)
      : null

    console.log(`[Stripe Webhook] Trial ending soon: ${subscription.id} ends ${trialEnd}`)

    // Update subscription metadata to mark notification sent
    await db
      .update(subscriptions)
      .set({
        metadata: {
          ...subscription.metadata,
          trialEndingNotificationSent: true,
          trialEndingNotificationSentAt: new Date().toISOString(),
        },
        updatedAt: new Date(),
      })
      .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

    // NOTE: Email sending will be implemented separately
    // For now, we just log and update the metadata
  } catch (error) {
    console.error('[Stripe Webhook] Error handling trial_will_end:', error)
    throw error
  }
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
