/**
 * @fileoverview Billing and Payment Type Definitions
 * Types for Stripe integration, subscriptions, invoices, and payments
 */

import { z } from 'zod'

// ============================================================================
// Plan Types
// ============================================================================

export const PlanTier = {
  STARTER: 'starter',
  PRO: 'pro',
  ENTERPRISE: 'enterprise',
} as const

export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier]

export const SubscriptionStatus = {
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  UNPAID: 'unpaid',
} as const

export type SubscriptionStatus = (typeof SubscriptionStatus)[keyof typeof SubscriptionStatus]

export const PaymentStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SUCCEEDED: 'succeeded',
  FAILED: 'failed',
  CANCELED: 'canceled',
  REFUNDED: 'refunded',
} as const

export type PaymentStatus = (typeof PaymentStatus)[keyof typeof PaymentStatus]

const planTierValues = Object.values(PlanTier) as [PlanTier, ...PlanTier[]]
const subscriptionStatusValues = Object.values(SubscriptionStatus) as [
  SubscriptionStatus,
  ...SubscriptionStatus[]
]
const paymentStatusValues = Object.values(PaymentStatus) as [PaymentStatus, ...PaymentStatus[]]

// ============================================================================
// Zod Schemas
// ============================================================================

export const PlanSchema = z.object({
  id: z.string(),
  name: z.string(),
  tier: z.enum(planTierValues),
  priceMonthly: z.number().positive(),
  priceYearly: z.number().positive(),
  currency: z.string().length(3).default('EUR'),
  features: z.array(z.string()),
  limits: z.object({
    users: z.number().int().positive().optional(),
    storage: z.number().int().positive().optional(), // MB
    apiCalls: z.number().int().positive().optional(), // per month
    courses: z.number().int().positive().optional(),
  }).optional(),
  stripePriceIdMonthly: z.string().optional(),
  stripePriceIdYearly: z.string().optional(),
  stripeProductId: z.string().optional(),
  isActive: z.boolean().default(true),
})

export const SubscriptionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  plan: z.enum(planTierValues),
  status: z.enum(subscriptionStatusValues),
  stripeSubscriptionId: z.string().nullable(),
  stripeCustomerId: z.string().nullable(),
  currentPeriodStart: z.date(),
  currentPeriodEnd: z.date(),
  cancelAtPeriodEnd: z.boolean().default(false),
  canceledAt: z.date().nullable().optional(),
  trialStart: z.date().nullable().optional(),
  trialEnd: z.date().nullable().optional(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const InvoiceSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  subscriptionId: z.string().uuid().nullable(),
  stripeInvoiceId: z.string().nullable(),
  number: z.string(),
  status: z.enum(['draft', 'open', 'paid', 'void', 'uncollectible']),
  currency: z.string().length(3).default('EUR'),
  subtotal: z.number().int(), // cents
  tax: z.number().int().default(0), // cents
  total: z.number().int(), // cents
  amountPaid: z.number().int().default(0), // cents
  amountDue: z.number().int(), // cents
  dueDate: z.date().nullable(),
  paidAt: z.date().nullable(),
  hostedInvoiceUrl: z.string().url().nullable(),
  invoicePdfUrl: z.string().url().nullable(),
  lineItems: z.array(z.object({
    description: z.string(),
    quantity: z.number().int().positive(),
    unitAmount: z.number().int(), // cents
    amount: z.number().int(), // cents
  })),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const PaymentMethodSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  stripePaymentMethodId: z.string(),
  type: z.enum(['card', 'sepa_debit', 'bank_transfer']),
  isDefault: z.boolean().default(false),
  card: z.object({
    brand: z.string(),
    last4: z.string().length(4),
    expMonth: z.number().int().min(1).max(12),
    expYear: z.number().int(),
  }).nullable().optional(),
  sepaDebit: z.object({
    bankCode: z.string(),
    last4: z.string().length(4),
    country: z.string().length(2),
  }).nullable().optional(),
  billingDetails: z.object({
    name: z.string().nullable(),
    email: z.string().email().nullable(),
    phone: z.string().nullable(),
    address: z.object({
      line1: z.string().nullable(),
      line2: z.string().nullable(),
      city: z.string().nullable(),
      state: z.string().nullable(),
      postalCode: z.string().nullable(),
      country: z.string().length(2).nullable(),
    }).nullable(),
  }).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
})

export const PaymentTransactionSchema = z.object({
  id: z.string().uuid(),
  tenantId: z.string().uuid(),
  invoiceId: z.string().uuid().nullable(),
  stripePaymentIntentId: z.string().nullable(),
  stripeChargeId: z.string().nullable(),
  amount: z.number().int(), // cents
  currency: z.string().length(3).default('EUR'),
  status: z.enum(paymentStatusValues),
  paymentMethodType: z.string(),
  description: z.string().nullable(),
  failureCode: z.string().nullable(),
  failureMessage: z.string().nullable(),
  metadata: z.record(z.string(), z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
})

// ============================================================================
// Type Inferences
// ============================================================================

export type Plan = z.infer<typeof PlanSchema>
export type Subscription = z.infer<typeof SubscriptionSchema>
export type Invoice = z.infer<typeof InvoiceSchema>
export type PaymentMethod = z.infer<typeof PaymentMethodSchema>
export type PaymentTransaction = z.infer<typeof PaymentTransactionSchema>

// ============================================================================
// Request/Response Types
// ============================================================================

export interface CreateSubscriptionRequest {
  tenantId: string
  planTier: PlanTier
  interval: 'month' | 'year'
  paymentMethodId?: string
  trialDays?: number
}

export interface CreateSubscriptionResponse {
  subscription: Subscription
  clientSecret?: string // For payment confirmation if needed
  stripeSubscriptionId: string
}

export interface UpdateSubscriptionRequest {
  planTier?: PlanTier
  cancelAtPeriodEnd?: boolean
}

export interface CreateCheckoutSessionRequest {
  tenantId: string
  planTier: PlanTier
  interval: 'month' | 'year'
  successUrl: string
  cancelUrl: string
}

export interface CreateCheckoutSessionResponse {
  sessionId: string
  url: string
}

export interface BillingPortalRequest {
  tenantId: string
  returnUrl: string
}

export interface BillingPortalResponse {
  url: string
}

// ============================================================================
// Webhook Types
// ============================================================================

export interface StripeWebhookEvent {
  id: string
  type: string
  data: {
    object: Record<string, unknown>
  }
  created: number
}

export const STRIPE_WEBHOOK_EVENTS = {
  // Subscription events
  'customer.subscription.created': 'customer.subscription.created',
  'customer.subscription.updated': 'customer.subscription.updated',
  'customer.subscription.deleted': 'customer.subscription.deleted',
  'customer.subscription.trial_will_end': 'customer.subscription.trial_will_end',
  // Invoice events
  'invoice.created': 'invoice.created',
  'invoice.paid': 'invoice.paid',
  'invoice.payment_failed': 'invoice.payment_failed',
  'invoice.payment_succeeded': 'invoice.payment_succeeded',
  // Payment events
  'payment_intent.succeeded': 'payment_intent.succeeded',
  'payment_intent.payment_failed': 'payment_intent.payment_failed',
  // Checkout events
  'checkout.session.completed': 'checkout.session.completed',
  'checkout.session.expired': 'checkout.session.expired',
} as const

export type StripeWebhookEventType = keyof typeof STRIPE_WEBHOOK_EVENTS

// ============================================================================
// Price Configuration
// ============================================================================

export interface PlanPricing {
  starter: { monthly: number; yearly: number }
  pro: { monthly: number; yearly: number }
  enterprise: { monthly: number; yearly: number }
}

export const DEFAULT_PRICING: PlanPricing = {
  starter: { monthly: 19900, yearly: 199000 }, // €199/mo, €1990/yr
  pro: { monthly: 29900, yearly: 299000 }, // €299/mo, €2990/yr
  enterprise: { monthly: 59900, yearly: 599000 }, // €599/mo, €5990/yr
}

// ============================================================================
// Usage Metering Types
// ============================================================================

export interface UsageMeter {
  name: string
  quantity: number
  unit: string
  periodStart: Date
  periodEnd: Date
}

export interface UsageRecord {
  tenantId: string
  subscriptionId: string
  meterId: string
  quantity: number
  timestamp: Date
  action: 'increment' | 'set'
}
