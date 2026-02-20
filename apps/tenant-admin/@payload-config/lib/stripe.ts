/**
 * @fileoverview Stripe Integration Module
 *
 * Provides type-safe Stripe API integration for subscription management,
 * payment processing, and webhook handling.
 *
 * @see https://stripe.com/docs/api
 * @see https://docs.stripe.com/webhooks
 */

import Stripe from 'stripe'
import { z } from 'zod'

// ============================================================================
// Environment Configuration
// ============================================================================

const STRIPE_API_VERSION = '2025-12-15.clover' as const

/**
 * Gets the Stripe secret key from environment variables
 * @returns {string} Stripe secret key or empty string
 */
function getStripeSecretKey(): string {
  return process.env.STRIPE_SECRET_KEY ?? ''
}

/**
 * Gets the Stripe webhook secret from environment variables
 * @returns {string} Stripe webhook secret or empty string
 */
function getStripeWebhookSecret(): string {
  return process.env.STRIPE_WEBHOOK_SECRET ?? ''
}

// ============================================================================
// Stripe Client Initialization
// ============================================================================

let stripeInstance: Stripe | null = null

/**
 * Gets or creates the Stripe client instance
 *
 * @returns {Stripe | null} Stripe client instance or null if not configured
 */
function getStripeClient(): Stripe | null {
  if (!isStripeConfigured()) {
    return null
  }

  if (!stripeInstance) {
    stripeInstance = new Stripe(getStripeSecretKey(), {
      apiVersion: STRIPE_API_VERSION,
      typescript: true,
      appInfo: {
        name: 'Akademate Tenant Admin',
        version: '1.0.0',
      },
    })
  }

  return stripeInstance
}

/**
 * Checks if Stripe is properly configured with API keys
 *
 * @returns {boolean} True if Stripe secret key is configured
 */
export function isStripeConfigured(): boolean {
  const secretKey = getStripeSecretKey()
  return Boolean(secretKey && secretKey.startsWith('sk_'))
}

/**
 * Ensures Stripe is configured, throws error if not
 *
 * @throws {Error} If Stripe is not configured
 */
function ensureStripeConfigured(): void {
  if (!isStripeConfigured()) {
    throw new Error(
      'Stripe is not configured. Please set STRIPE_SECRET_KEY environment variable.'
    )
  }
}

/**
 * Resets the Stripe client instance (for testing purposes)
 * @internal
 */
export function resetStripeInstance(): void {
  stripeInstance = null
}

// Export the stripe instance
export const stripe = getStripeClient()

// ============================================================================
// Validation Schemas
// ============================================================================

const CreateCustomerSchema = z.object({
  email: z.string().email('Invalid email address'),
  name: z.string().min(1, 'Name is required').optional(),
  metadata: z.record(z.string(), z.string()).optional(),
})

const CreateSubscriptionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  metadata: z.record(z.string(), z.string()).optional(),
  trialDays: z.number().int().min(0).max(365).optional(),
})

const CreateCheckoutSessionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  priceId: z.string().min(1, 'Price ID is required'),
  successUrl: z.string().url('Invalid success URL'),
  cancelUrl: z.string().url('Invalid cancel URL'),
  metadata: z.record(z.string(), z.string()).optional(),
})

const CreatePortalSessionSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  returnUrl: z.string().url('Invalid return URL'),
})

// ============================================================================
// Customer Management
// ============================================================================

/**
 * Creates a new Stripe customer
 *
 * @param {Object} options - Customer options
 * @param {string} options.tenantId - Tenant UUID
 * @param {string} options.email - Customer email address
 * @param {string} [options.name] - Customer name
 * @returns {Promise<Stripe.Customer>} Created Stripe customer
 * @throws {Error} If Stripe is not configured or creation fails
 *
 * @example
 * ```typescript
 * const customer = await createStripeCustomer({
 *   tenantId: 'uuid-123',
 *   email: '[email protected]',
 *   name: 'Universidad Example'
 * })
 * ```
 */
export async function createStripeCustomer(options: {
  tenantId: string
  email: string
  name?: string
}): Promise<Stripe.Customer> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  // Validate input
  const validated = CreateCustomerSchema.parse({
    email: options.email,
    name: options.name,
    metadata: { tenantId: options.tenantId },
  })

  try {
    const customer = await client.customers.create({
      email: validated.email,
      name: validated.name,
      metadata: validated.metadata,
    })

    console.log(`[Stripe] Customer created: ${customer.id} (${options.email})`)
    return customer
  } catch (error) {
    console.error('[Stripe] Failed to create customer:', error)
    throw new Error(
      `Failed to create Stripe customer: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Subscription Management
// ============================================================================

/**
 * Creates a new subscription for a customer
 *
 * @param {Object} options - Subscription options
 * @param {string} options.tenantId - Tenant UUID
 * @param {string} options.planTier - Plan tier (starter, pro, enterprise)
 * @param {string} options.interval - Billing interval (month, year)
 * @param {string} options.stripeCustomerId - Stripe customer ID
 * @param {string} [options.paymentMethodId] - Payment method ID
 * @param {number} [options.trialDays] - Number of trial days (0-30)
 * @returns {Promise<Stripe.Subscription>} Created subscription
 * @throws {Error} If Stripe is not configured or creation fails
 *
 * @example
 * ```typescript
 * const subscription = await createSubscription({
 *   tenantId: 'uuid-123',
 *   planTier: 'pro',
 *   interval: 'month',
 *   stripeCustomerId: 'cus_123',
 *   trialDays: 14
 * })
 * ```
 */
export async function createSubscription(options: {
  tenantId: string
  planTier: string
  interval: string
  stripeCustomerId: string
  paymentMethodId?: string
  trialDays?: number
}): Promise<Stripe.Subscription> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  // Note: In a real implementation, you would map planTier + interval to a Stripe Price ID
  // For now, we'll use a placeholder that needs to be implemented
  const priceId = `price_${options.planTier}_${options.interval}` // TODO: Map to actual Stripe Price ID

  try {
    const subscriptionParams: Stripe.SubscriptionCreateParams = {
      customer: options.stripeCustomerId,
      items: [{ price: priceId }],
      metadata: {
        tenantId: options.tenantId,
        planTier: options.planTier,
        interval: options.interval,
      },
    }

    // Add payment method if specified
    if (options.paymentMethodId) {
      subscriptionParams.default_payment_method = options.paymentMethodId
    }

    // Add trial period if specified
    if (options.trialDays && options.trialDays > 0) {
      subscriptionParams.trial_period_days = options.trialDays
    }

    const subscription = await client.subscriptions.create(subscriptionParams)

    console.log(
      `[Stripe] Subscription created: ${subscription.id} (customer: ${options.stripeCustomerId}, status: ${subscription.status})`
    )
    return subscription
  } catch (error) {
    console.error('[Stripe] Failed to create subscription:', error)
    throw new Error(
      `Failed to create subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Retrieves all subscriptions for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Stripe.Subscription[]>} List of customer subscriptions
 * @throws {Error} If Stripe is not configured or retrieval fails
 *
 * @example
 * ```typescript
 * const subscriptions = await getSubscriptions('cus_123')
 * console.log(`Active subscriptions: ${subscriptions.length}`)
 * ```
 */
export async function getSubscriptions(
  customerId: string
): Promise<Stripe.Subscription[]> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  try {
    const subscriptions = await client.subscriptions.list({
      customer: customerId,
      limit: 100,
    })

    return subscriptions.data
  } catch (error) {
    console.error('[Stripe] Failed to get subscriptions:', error)
    throw new Error(
      `Failed to retrieve subscriptions: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Retrieves a single subscription by ID
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>} Subscription object
 * @throws {Error} If Stripe is not configured or retrieval fails
 *
 * @example
 * ```typescript
 * const subscription = await getSubscription('sub_123')
 * console.log(`Status: ${subscription.status}`)
 * ```
 */
export async function getSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!subscriptionId) {
    throw new Error('Subscription ID is required')
  }

  try {
    const subscription = await client.subscriptions.retrieve(subscriptionId)
    return subscription
  } catch (error) {
    console.error('[Stripe] Failed to get subscription:', error)
    throw new Error(
      `Failed to retrieve subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Updates a subscription
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {Object} options - Update options
 * @param {string} [options.planTier] - New plan tier
 * @param {string} [options.interval] - New billing interval
 * @param {boolean} [options.cancelAtPeriodEnd] - Whether to cancel at period end
 * @returns {Promise<Stripe.Subscription>} Updated subscription
 * @throws {Error} If Stripe is not configured or update fails
 *
 * @example
 * ```typescript
 * const subscription = await updateSubscription('sub_123', {
 *   cancelAtPeriodEnd: true
 * })
 * ```
 */
export async function updateSubscription(
  subscriptionId: string,
  options: {
    planTier?: string
    interval?: string
    cancelAtPeriodEnd?: boolean
  }
): Promise<Stripe.Subscription> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!subscriptionId) {
    throw new Error('Subscription ID is required')
  }

  try {
    const updateParams: Stripe.SubscriptionUpdateParams = {}

    if (options.cancelAtPeriodEnd !== undefined) {
      updateParams.cancel_at_period_end = options.cancelAtPeriodEnd
    }

    // Note: Updating items/prices would require more complex logic
    // For now, we only support the cancel_at_period_end flag
    // Full implementation would need to map planTier/interval to price IDs

    const subscription = await client.subscriptions.update(
      subscriptionId,
      updateParams
    )

    console.log(
      `[Stripe] Subscription updated: ${subscriptionId} (cancel_at_period_end: ${subscription.cancel_at_period_end})`
    )
    return subscription
  } catch (error) {
    console.error('[Stripe] Failed to update subscription:', error)
    throw new Error(
      `Failed to update subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Resumes a subscription that was set to cancel at period end
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @returns {Promise<Stripe.Subscription>} Updated subscription
 * @throws {Error} If Stripe is not configured or resumption fails
 *
 * @example
 * ```typescript
 * const subscription = await resumeSubscription('sub_123')
 * console.log(`Resumed, will not cancel: ${!subscription.cancel_at_period_end}`)
 * ```
 */
export async function resumeSubscription(
  subscriptionId: string
): Promise<Stripe.Subscription> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!subscriptionId) {
    throw new Error('Subscription ID is required')
  }

  try {
    const subscription = await client.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    })

    console.log(`[Stripe] Subscription resumed: ${subscriptionId}`)
    return subscription
  } catch (error) {
    console.error('[Stripe] Failed to resume subscription:', error)
    throw new Error(
      `Failed to resume subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Cancels a subscription
 *
 * @param {string} subscriptionId - Stripe subscription ID
 * @param {boolean} [cancelImmediately=false] - If true, cancel immediately; otherwise at period end
 * @returns {Promise<Stripe.Subscription>} Updated subscription
 * @throws {Error} If Stripe is not configured or cancellation fails
 *
 * @example
 * ```typescript
 * // Cancel at end of billing period
 * const subscription = await cancelSubscription('sub_123', false)
 *
 * // Cancel immediately
 * const subscription = await cancelSubscription('sub_123', true)
 * ```
 */
export async function cancelSubscription(
  subscriptionId: string,
  cancelImmediately = false
): Promise<Stripe.Subscription> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!subscriptionId) {
    throw new Error('Subscription ID is required')
  }

  try {
    let subscription: Stripe.Subscription

    if (cancelImmediately) {
      subscription = await client.subscriptions.cancel(subscriptionId)
      console.log(`[Stripe] Subscription canceled immediately: ${subscriptionId}`)
    } else {
      subscription = await client.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })
      // Note: current_period_end is now on subscription items in Stripe API 2025-12-15.clover
      const periodEnd = subscription.items.data[0]?.current_period_end
      const periodEndDate = periodEnd ? new Date(periodEnd * 1000).toISOString() : 'unknown'
      console.log(
        `[Stripe] Subscription will cancel at period end: ${subscriptionId} (ends: ${periodEndDate})`
      )
    }

    return subscription
  } catch (error) {
    console.error('[Stripe] Failed to cancel subscription:', error)
    throw new Error(
      `Failed to cancel subscription: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Checkout & Billing Portal
// ============================================================================

/**
 * Creates a Stripe Checkout session for subscription payment
 *
 * @param {Object} options - Checkout session options
 * @param {string} options.tenantId - Tenant UUID
 * @param {string} options.planTier - Plan tier (starter, pro, enterprise)
 * @param {string} options.interval - Billing interval (month, year)
 * @param {string} options.successUrl - URL to redirect on success
 * @param {string} options.cancelUrl - URL to redirect on cancellation
 * @param {string} [options.customerEmail] - Customer email for new customers
 * @param {string} [options.stripeCustomerId] - Existing Stripe customer ID
 * @returns {Promise<{ sessionId: string; url: string }>} Checkout session details
 * @throws {Error} If Stripe is not configured or creation fails
 *
 * @example
 * ```typescript
 * const session = await createCheckoutSession({
 *   tenantId: 'uuid-123',
 *   planTier: 'pro',
 *   interval: 'month',
 *   successUrl: 'https://app.example.com/success',
 *   cancelUrl: 'https://app.example.com/cancel',
 *   customerEmail: '[email protected]'
 * })
 * // Redirect user to session.url
 * ```
 */
export async function createCheckoutSession(options: {
  tenantId: string
  planTier: string
  interval: string
  successUrl: string
  cancelUrl: string
  customerEmail?: string
  stripeCustomerId?: string
}): Promise<{ sessionId: string; url: string }> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  // Note: In a real implementation, you would map planTier + interval to a Stripe Price ID
  const priceId = `price_${options.planTier}_${options.interval}` // TODO: Map to actual Stripe Price ID

  try {
    const sessionParams: Stripe.Checkout.SessionCreateParams = {
      mode: 'subscription',
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: options.successUrl,
      cancel_url: options.cancelUrl,
      metadata: {
        tenantId: options.tenantId,
        planTier: options.planTier,
        interval: options.interval,
      },
      billing_address_collection: 'required',
      payment_method_collection: 'always',
    }

    // Add customer or email
    if (options.stripeCustomerId) {
      sessionParams.customer = options.stripeCustomerId
    } else if (options.customerEmail) {
      sessionParams.customer_email = options.customerEmail
    }

    const session = await client.checkout.sessions.create(sessionParams)

    if (!session.url) {
      throw new Error('Checkout session URL not generated')
    }

    console.log(
      `[Stripe] Checkout session created: ${session.id} (tenantId: ${options.tenantId})`
    )

    return {
      sessionId: session.id,
      url: session.url,
    }
  } catch (error) {
    console.error('[Stripe] Failed to create checkout session:', error)
    throw new Error(
      `Failed to create checkout session: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Creates a Stripe Billing Portal session for subscription management
 *
 * @param {Object} options - Portal session options
 * @param {string} options.tenantId - Tenant UUID
 * @param {string} options.stripeCustomerId - Stripe customer ID
 * @param {string} options.returnUrl - URL to redirect after portal session
 * @returns {Promise<{ url: string }>} Billing portal URL
 * @throws {Error} If Stripe is not configured or creation fails
 *
 * @example
 * ```typescript
 * const portal = await createBillingPortalSession({
 *   tenantId: 'uuid-123',
 *   stripeCustomerId: 'cus_123',
 *   returnUrl: 'https://app.example.com/account'
 * })
 * // Redirect user to portal.url
 * ```
 */
export async function createBillingPortalSession(options: {
  tenantId: string
  stripeCustomerId: string
  returnUrl: string
}): Promise<{ url: string }> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  // Validate input
  const validated = CreatePortalSessionSchema.parse({
    customerId: options.stripeCustomerId,
    returnUrl: options.returnUrl,
  })

  try {
    const session = await client.billingPortal.sessions.create({
      customer: validated.customerId,
      return_url: validated.returnUrl,
    })

    console.log(
      `[Stripe] Billing portal session created for customer: ${options.stripeCustomerId}`
    )

    return {
      url: session.url,
    }
  } catch (error) {
    console.error('[Stripe] Failed to create billing portal session:', error)
    throw new Error(
      `Failed to create billing portal session: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Invoices
// ============================================================================

/**
 * Retrieves all invoices for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @param {number} [limit=100] - Maximum number of invoices to retrieve
 * @returns {Promise<Stripe.Invoice[]>} List of customer invoices
 * @throws {Error} If Stripe is not configured or retrieval fails
 *
 * @example
 * ```typescript
 * const invoices = await getInvoices('cus_123')
 * const paidInvoices = invoices.filter(inv => inv.status === 'paid')
 * ```
 */
export async function getInvoices(
  customerId: string,
  limit = 100
): Promise<Stripe.Invoice[]> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  try {
    const invoices = await client.invoices.list({
      customer: customerId,
      limit: Math.min(limit, 100),
    })

    return invoices.data
  } catch (error) {
    console.error('[Stripe] Failed to get invoices:', error)
    throw new Error(
      `Failed to retrieve invoices: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Alias for getInvoices (for consistency with API naming)
 */
export const listInvoices = getInvoices

/**
 * Retrieves the upcoming invoice for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Stripe.Invoice | null>} Upcoming invoice or null if none
 * @throws {Error} If Stripe is not configured or retrieval fails
 *
 * @example
 * ```typescript
 * const upcoming = await getUpcomingInvoice('cus_123')
 * if (upcoming) {
 *   console.log(`Next charge: ${upcoming.total}`)
 * }
 * ```
 */
export async function getUpcomingInvoice(
  customerId: string
): Promise<Stripe.Invoice | null> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  try {
    const invoice = await client.invoices.createPreview({
      customer: customerId,
    })

    return invoice
  } catch (error) {
    // Stripe throws an error if there's no upcoming invoice
    if (error instanceof Error && error.message.includes('no upcoming invoice')) {
      return null
    }
    console.error('[Stripe] Failed to get upcoming invoice:', error)
    throw new Error(
      `Failed to retrieve upcoming invoice: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Formats a currency amount in cents to a human-readable string
 *
 * @param {number} amountInCents - Amount in cents
 * @param {string} currency - Currency code (e.g., 'USD', 'EUR')
 * @returns {string} Formatted currency string
 *
 * @example
 * ```typescript
 * formatCurrency(5000, 'USD') // Returns "$50.00"
 * formatCurrency(12345, 'EUR') // Returns "€123.45"
 * ```
 */
export function formatCurrency(amountInCents: number, currency: string): string {
  const amount = amountInCents / 100

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency.toUpperCase(),
    }).format(amount)
  } catch (error) {
    // Fallback for unsupported currencies
    return `${currency.toUpperCase()} ${amount.toFixed(2)}`
  }
}

// ============================================================================
// Payment Methods
// ============================================================================

/**
 * Retrieves all payment methods for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @param {string} [type='card'] - Payment method type
 * @returns {Promise<Stripe.PaymentMethod[]>} List of payment methods
 * @throws {Error} If Stripe is not configured or retrieval fails
 *
 * @example
 * ```typescript
 * const paymentMethods = await getPaymentMethods('cus_123')
 * const cards = paymentMethods.filter(pm => pm.type === 'card')
 * ```
 */
export async function getPaymentMethods(
  customerId: string,
  type: Stripe.PaymentMethodListParams.Type = 'card'
): Promise<Stripe.PaymentMethod[]> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!customerId) {
    throw new Error('Customer ID is required')
  }

  try {
    const paymentMethods = await client.paymentMethods.list({
      customer: customerId,
      type,
      limit: 100,
    })

    return paymentMethods.data
  } catch (error) {
    console.error('[Stripe] Failed to get payment methods:', error)
    throw new Error(
      `Failed to retrieve payment methods: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Alias for getPaymentMethods (for consistency with API naming)
 */
export const listPaymentMethods = getPaymentMethods

/**
 * Attaches a payment method to a customer
 *
 * @param {string} paymentMethodId - Stripe payment method ID
 * @param {string} customerId - Stripe customer ID
 * @returns {Promise<Stripe.PaymentMethod>} Updated payment method
 * @throws {Error} If Stripe is not configured or attachment fails
 *
 * @example
 * ```typescript
 * const method = await attachPaymentMethod('pm_123', 'cus_456')
 * ```
 */
export async function attachPaymentMethod(
  paymentMethodId: string,
  customerId: string
): Promise<Stripe.PaymentMethod> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!paymentMethodId || !customerId) {
    throw new Error('Payment method ID and customer ID are required')
  }

  try {
    const paymentMethod = await client.paymentMethods.attach(paymentMethodId, {
      customer: customerId,
    })

    console.log(
      `[Stripe] Payment method attached: ${paymentMethodId} to customer: ${customerId}`
    )
    return paymentMethod
  } catch (error) {
    console.error('[Stripe] Failed to attach payment method:', error)
    throw new Error(
      `Failed to attach payment method: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

/**
 * Sets a payment method as the default for a customer
 *
 * @param {string} customerId - Stripe customer ID
 * @param {string} paymentMethodId - Stripe payment method ID
 * @returns {Promise<Stripe.Customer>} Updated customer
 * @throws {Error} If Stripe is not configured or update fails
 *
 * @example
 * ```typescript
 * await setDefaultPaymentMethod('cus_123', 'pm_456')
 * ```
 */
export async function setDefaultPaymentMethod(
  customerId: string,
  paymentMethodId: string
): Promise<Stripe.Customer> {
  ensureStripeConfigured()
  const client = getStripeClient()!

  if (!customerId || !paymentMethodId) {
    throw new Error('Customer ID and payment method ID are required')
  }

  try {
    const customer = await client.customers.update(customerId, {
      invoice_settings: {
        default_payment_method: paymentMethodId,
      },
    })

    console.log(
      `[Stripe] Default payment method set: ${paymentMethodId} for customer: ${customerId}`
    )
    return customer
  } catch (error) {
    console.error('[Stripe] Failed to set default payment method:', error)
    throw new Error(
      `Failed to set default payment method: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Webhook Handling
// ============================================================================

/**
 * Constructs and verifies a Stripe webhook event from raw body and signature
 *
 * @param {string | Buffer} payload - Raw webhook payload (must be unparsed)
 * @param {string} signature - Stripe signature from 'stripe-signature' header
 * @returns {Stripe.Event} Verified Stripe event
 * @throws {Error} If signature verification fails or webhook secret is missing
 *
 * @example
 * ```typescript
 * // In Next.js API route
 * const body = await request.text()
 * const signature = request.headers.get('stripe-signature')
 *
 * try {
 *   const event = constructWebhookEvent(body, signature)
 *   // Process event
 * } catch (error) {
 *   // Invalid signature
 *   return new Response('Unauthorized', { status: 401 })
 * }
 * ```
 */
export function constructWebhookEvent(
  payload: string | Buffer,
  signature: string
): Stripe.Event {
  ensureStripeConfigured()
  const client = getStripeClient()!
  const webhookSecret = getStripeWebhookSecret()

  if (!webhookSecret) {
    throw new Error(
      'Webhook secret is not configured. Set STRIPE_WEBHOOK_SECRET environment variable.'
    )
  }

  if (!signature) {
    throw new Error('Webhook signature is missing')
  }

  try {
    const event = client.webhooks.constructEvent(
      payload,
      signature,
      webhookSecret
    )

    console.log(`[Stripe Webhook] Event verified: ${event.type} (${event.id})`)
    return event
  } catch (error) {
    console.error('[Stripe Webhook] Signature verification failed:', error)
    throw new Error(
      `Webhook signature verification failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    )
  }
}

// ============================================================================
// Export Types from Stripe SDK
// ============================================================================

export type {
  Stripe,
  Stripe as default,
}

// Export specific commonly used types
export type StripeCustomer = Stripe.Customer
export type StripeSubscription = Stripe.Subscription
export type StripeInvoice = Stripe.Invoice
export type StripePaymentMethod = Stripe.PaymentMethod
export type StripeCheckoutSession = Stripe.Checkout.Session
export type StripeEvent = Stripe.Event
