/**
 * @fileoverview Stripe Integration Service
 * Handles all Stripe API interactions for subscriptions, payments, and billing
 */

import Stripe from 'stripe'
import type {
  PlanTier,
  CreateSubscriptionRequest,
  CreateSubscriptionResponse,
  CreateCheckoutSessionRequest,
  CreateCheckoutSessionResponse,
  BillingPortalRequest,
  BillingPortalResponse,
  DEFAULT_PRICING,
} from '@akademate/types/billing'

// ============================================================================
// Configuration
// ============================================================================

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY
const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET

// Price IDs from Stripe Dashboard (configured per environment)
const STRIPE_PRICE_IDS = {
  starter: {
    monthly: process.env.STRIPE_PRICE_STARTER_MONTHLY || 'price_starter_monthly',
    yearly: process.env.STRIPE_PRICE_STARTER_YEARLY || 'price_starter_yearly',
  },
  pro: {
    monthly: process.env.STRIPE_PRICE_PRO_MONTHLY || 'price_pro_monthly',
    yearly: process.env.STRIPE_PRICE_PRO_YEARLY || 'price_pro_yearly',
  },
  enterprise: {
    monthly: process.env.STRIPE_PRICE_ENTERPRISE_MONTHLY || 'price_enterprise_monthly',
    yearly: process.env.STRIPE_PRICE_ENTERPRISE_YEARLY || 'price_enterprise_yearly',
  },
} as const

const DEFAULT_TRIAL_DAYS = 14

// ============================================================================
// Stripe Client
// ============================================================================

let stripeClient: Stripe | null = null

export function getStripeClient(): Stripe {
  if (!STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not configured')
  }

  if (!stripeClient) {
    stripeClient = new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  }

  return stripeClient
}

export function isStripeConfigured(): boolean {
  return !!STRIPE_SECRET_KEY
}

// ============================================================================
// Customer Management
// ============================================================================

export async function createStripeCustomer(params: {
  tenantId: string
  email: string
  name?: string
  metadata?: Record<string, string>
}): Promise<Stripe.Customer> {
  const stripe = getStripeClient()

  return stripe.customers.create({
    email: params.email,
    name: params.name,
    metadata: {
      tenantId: params.tenantId,
      ...params.metadata,
    },
  })
}

export async function getStripeCustomer(customerId: string): Promise<Stripe.Customer | null> {
  const stripe = getStripeClient()

  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return null
    return customer as Stripe.Customer
  } catch {
    return null
  }
}

export async function updateStripeCustomer(
  customerId: string,
  params: Stripe.CustomerUpdateParams
): Promise<Stripe.Customer> {
  const stripe = getStripeClient()
  return stripe.customers.update(customerId, params)
}

// ============================================================================
// Subscription Management
// ============================================================================

export async function createSubscription(
  request: CreateSubscriptionRequest & { stripeCustomerId: string }
): Promise<CreateSubscriptionResponse> {
  const stripe = getStripeClient()

  const priceId = STRIPE_PRICE_IDS[request.planTier][request.interval === 'year' ? 'yearly' : 'monthly']

  const subscriptionParams: Stripe.SubscriptionCreateParams = {
    customer: request.stripeCustomerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    payment_settings: {
      save_default_payment_method: 'on_subscription',
    },
    expand: ['latest_invoice.payment_intent'],
    metadata: {
      tenantId: request.tenantId,
      planTier: request.planTier,
    },
  }

  // Add trial if specified
  if (request.trialDays && request.trialDays > 0) {
    subscriptionParams.trial_period_days = request.trialDays
  }

  // Add default payment method if provided
  if (request.paymentMethodId) {
    subscriptionParams.default_payment_method = request.paymentMethodId
  }

  const stripeSubscription = await stripe.subscriptions.create(subscriptionParams)

  // Extract client secret for frontend payment confirmation
  let clientSecret: string | undefined
  const latestInvoice = stripeSubscription.latest_invoice as Stripe.Invoice | null
  if (latestInvoice?.payment_intent) {
    const paymentIntent = latestInvoice.payment_intent as Stripe.PaymentIntent
    clientSecret = paymentIntent.client_secret ?? undefined
  }

  return {
    subscription: {
      id: crypto.randomUUID(), // Local DB ID
      tenantId: request.tenantId,
      plan: request.planTier,
      status: mapStripeStatus(stripeSubscription.status),
      stripeSubscriptionId: stripeSubscription.id,
      stripeCustomerId: request.stripeCustomerId,
      currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
      cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
      trialStart: stripeSubscription.trial_start ? new Date(stripeSubscription.trial_start * 1000) : undefined,
      trialEnd: stripeSubscription.trial_end ? new Date(stripeSubscription.trial_end * 1000) : undefined,
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    clientSecret,
    stripeSubscriptionId: stripeSubscription.id,
  }
}

export async function getSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
  const stripe = getStripeClient()

  try {
    return await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'default_payment_method'],
    })
  } catch {
    return null
  }
}

export async function updateSubscription(
  subscriptionId: string,
  params: {
    planTier?: PlanTier
    interval?: 'month' | 'year'
    cancelAtPeriodEnd?: boolean
  }
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()

  const updateParams: Stripe.SubscriptionUpdateParams = {}

  // Handle plan/interval change
  if (params.planTier && params.interval) {
    const priceId = STRIPE_PRICE_IDS[params.planTier][params.interval === 'year' ? 'yearly' : 'monthly']

    // Get current subscription to find the item ID
    const currentSub = await stripe.subscriptions.retrieve(subscriptionId)
    const itemId = currentSub.items.data[0].id

    updateParams.items = [{ id: itemId, price: priceId }]
    updateParams.proration_behavior = 'create_prorations'
  }

  // Handle cancellation
  if (params.cancelAtPeriodEnd !== undefined) {
    updateParams.cancel_at_period_end = params.cancelAtPeriodEnd
  }

  return stripe.subscriptions.update(subscriptionId, updateParams)
}

export async function cancelSubscription(
  subscriptionId: string,
  immediately = false
): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()

  if (immediately) {
    return stripe.subscriptions.cancel(subscriptionId)
  } else {
    return stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    })
  }
}

export async function resumeSubscription(subscriptionId: string): Promise<Stripe.Subscription> {
  const stripe = getStripeClient()
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: false,
  })
}

// ============================================================================
// Checkout Sessions
// ============================================================================

export async function createCheckoutSession(
  request: CreateCheckoutSessionRequest & { stripeCustomerId?: string; customerEmail?: string }
): Promise<CreateCheckoutSessionResponse> {
  const stripe = getStripeClient()

  const priceId = STRIPE_PRICE_IDS[request.planTier][request.interval === 'year' ? 'yearly' : 'monthly']

  const sessionParams: Stripe.Checkout.SessionCreateParams = {
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: request.successUrl,
    cancel_url: request.cancelUrl,
    subscription_data: {
      trial_period_days: DEFAULT_TRIAL_DAYS,
      metadata: {
        tenantId: request.tenantId,
        planTier: request.planTier,
      },
    },
    metadata: {
      tenantId: request.tenantId,
    },
    allow_promotion_codes: true,
    billing_address_collection: 'required',
    tax_id_collection: { enabled: true },
  }

  // Use existing customer or collect email
  if (request.stripeCustomerId) {
    sessionParams.customer = request.stripeCustomerId
  } else if (request.customerEmail) {
    sessionParams.customer_email = request.customerEmail
  }

  const session = await stripe.checkout.sessions.create(sessionParams)

  return {
    sessionId: session.id,
    url: session.url!,
  }
}

// ============================================================================
// Billing Portal
// ============================================================================

export async function createBillingPortalSession(
  request: BillingPortalRequest & { stripeCustomerId: string }
): Promise<BillingPortalResponse> {
  const stripe = getStripeClient()

  const session = await stripe.billingPortal.sessions.create({
    customer: request.stripeCustomerId,
    return_url: request.returnUrl,
  })

  return {
    url: session.url,
  }
}

// ============================================================================
// Invoices
// ============================================================================

export async function listInvoices(customerId: string, limit = 10): Promise<Stripe.Invoice[]> {
  const stripe = getStripeClient()

  const invoices = await stripe.invoices.list({
    customer: customerId,
    limit,
  })

  return invoices.data
}

export async function getInvoice(invoiceId: string): Promise<Stripe.Invoice | null> {
  const stripe = getStripeClient()

  try {
    return await stripe.invoices.retrieve(invoiceId)
  } catch {
    return null
  }
}

export async function getUpcomingInvoice(customerId: string): Promise<Stripe.UpcomingInvoice | null> {
  const stripe = getStripeClient()

  try {
    return await stripe.invoices.retrieveUpcoming({ customer: customerId })
  } catch {
    return null
  }
}

// ============================================================================
// Payment Methods
// ============================================================================

export async function listPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
  const stripe = getStripeClient()

  const methods = await stripe.paymentMethods.list({
    customer: customerId,
    type: 'card',
  })

  return methods.data
}

export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  const stripe = getStripeClient()

  return stripe.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  })
}

export async function detachPaymentMethod(paymentMethodId: string): Promise<Stripe.PaymentMethod> {
  const stripe = getStripeClient()
  return stripe.paymentMethods.detach(paymentMethodId)
}

export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  const stripe = getStripeClient()

  return stripe.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
  })
}

// ============================================================================
// Webhook Handling
// ============================================================================

export function constructWebhookEvent(
  payload: Buffer | string,
  signature: string
): Stripe.Event {
  if (!STRIPE_WEBHOOK_SECRET) {
    throw new Error('STRIPE_WEBHOOK_SECRET is not configured')
  }

  const stripe = getStripeClient()
  return stripe.webhooks.constructEvent(payload, signature, STRIPE_WEBHOOK_SECRET)
}

// ============================================================================
// Utilities
// ============================================================================

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  const statusMap: Record<string, string> = {
    active: 'active',
    canceled: 'canceled',
    incomplete: 'incomplete',
    incomplete_expired: 'incomplete_expired',
    past_due: 'past_due',
    trialing: 'trialing',
    unpaid: 'unpaid',
    paused: 'past_due', // Map paused to past_due
  }
  return statusMap[status] || status
}

export function formatCurrency(amountCents: number, currency = 'EUR'): string {
  const amount = amountCents / 100
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency,
  }).format(amount)
}

export function getPriceForPlan(
  planTier: PlanTier,
  interval: 'month' | 'year'
): { priceId: string; amount: number } {
  const priceId = STRIPE_PRICE_IDS[planTier][interval === 'year' ? 'yearly' : 'monthly']

  // Amount in cents (would come from Stripe in production)
  const amounts: Record<PlanTier, { monthly: number; yearly: number }> = {
    starter: { monthly: 19900, yearly: 199000 },
    pro: { monthly: 29900, yearly: 299000 },
    enterprise: { monthly: 59900, yearly: 599000 },
  }

  return {
    priceId,
    amount: amounts[planTier][interval === 'year' ? 'yearly' : 'monthly'],
  }
}
