import { z } from 'zod'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'

export type NormalizedPaidOfferEvent = {
  provider: 'stripe' | 'paypal'
  providerEventId: string
  providerOrderId: string
  status: 'processing' | 'succeeded' | 'failed' | 'cancelled'
  amountCents: number
  currency: string
  paymentMethodType: string
}

export class NextPaidOfferReconciliationError extends Error {
  readonly code: string
  constructor(code: string) { super(code); this.name = 'NextPaidOfferReconciliationError'; this.code = code }
}
function fail(code: string): never { throw new NextPaidOfferReconciliationError(code) }

const StripeEventSchema = z.object({
  id: z.string().min(3).max(255),
  type: z.string(),
  data: z.object({ object: z.object({
    id: z.string().min(3).max(255),
    amount_total: z.number().int().nonnegative().nullable().optional(),
    currency: z.string().length(3).nullable().optional(),
    payment_status: z.string().optional(),
    payment_method_types: z.array(z.string()).optional(),
  }).passthrough() }),
}).passthrough()

export function normalizeStripePaidOfferEvent(value: unknown): NormalizedPaidOfferEvent | null {
  const typeMap: Record<string, NormalizedPaidOfferEvent['status'] | 'payment_status'> = {
    'checkout.session.completed': 'payment_status',
    'checkout.session.async_payment_succeeded': 'succeeded',
    'checkout.session.async_payment_failed': 'failed',
    'checkout.session.expired': 'cancelled',
  }
  const rawType = typeof value === 'object' && value !== null && 'type' in value ? String(value.type) : ''
  const mapped = typeMap[rawType]
  if (!mapped) return null
  const parsed = StripeEventSchema.safeParse(value)
  if (!parsed.success) fail('stripe_event_invalid')
  const session = parsed.data.data.object
  if (session.amount_total == null || !session.currency) fail('stripe_event_invalid')
  return {
    provider: 'stripe',
    providerEventId: parsed.data.id,
    providerOrderId: session.id,
    status: mapped === 'payment_status'
      ? session.payment_status === 'paid' ? 'succeeded' : 'processing'
      : mapped,
    amountCents: session.amount_total,
    currency: session.currency.toUpperCase(),
    paymentMethodType: session.payment_method_types?.join(',').slice(0, 120) || 'stripe_checkout',
  }
}

function decimalToCents(value: string): number {
  if (!/^\d+(?:\.\d{1,2})?$/.test(value)) fail('paypal_event_invalid')
  const [whole, fraction = ''] = value.split('.')
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents < 0) fail('paypal_event_invalid')
  return cents
}

const PayPalEventSchema = z.object({
  id: z.string().min(3).max(255),
  event_type: z.string(),
  resource: z.record(z.string(), z.unknown()),
}).passthrough()

export function normalizePayPalPaidOfferEvent(value: unknown): NormalizedPaidOfferEvent | null {
  const typeMap: Record<string, NormalizedPaidOfferEvent['status']> = {
    'CHECKOUT.ORDER.APPROVED': 'processing',
    'PAYMENT.CAPTURE.COMPLETED': 'succeeded',
    'PAYMENT.CAPTURE.DENIED': 'failed',
    'CHECKOUT.PAYMENT-APPROVAL.REVERSED': 'cancelled',
  }
  const rawType = typeof value === 'object' && value !== null && 'event_type' in value
    ? String(value.event_type) : ''
  const status = typeMap[rawType]
  if (!status) return null
  const parsed = PayPalEventSchema.safeParse(value)
  if (!parsed.success) fail('paypal_event_invalid')
  const resource = parsed.data.resource
  const amount = resource.amount as { currency_code?: unknown; value?: unknown } | undefined
  const purchaseUnits = resource.purchase_units as Array<{ amount?: { currency_code?: unknown; value?: unknown } }> | undefined
  const resolvedAmount = amount ?? purchaseUnits?.[0]?.amount
  const related = resource.supplementary_data as { related_ids?: { order_id?: unknown } } | undefined
  const providerOrderId = status === 'processing' ? resource.id : related?.related_ids?.order_id
  if (
    typeof providerOrderId !== 'string'
    || typeof resolvedAmount?.currency_code !== 'string'
    || typeof resolvedAmount.value !== 'string'
  ) fail('paypal_event_invalid')
  return {
    provider: 'paypal', providerEventId: parsed.data.id, providerOrderId,
    status, amountCents: decimalToCents(resolvedAmount.value),
    currency: resolvedAmount.currency_code.toUpperCase(), paymentMethodType: 'paypal',
  }
}

type ReconciliationRow = {
  order_id: string
  order_status: string
  enrollment_id: number | null
  event_replayed: boolean
  requires_manual_review: boolean
}

export async function reconcileNextPaidOfferEvent(
  tx: LearningSqlClient,
  event: NormalizedPaidOfferEvent,
) {
  const rows = await tx.unsafe<ReconciliationRow>(`
    SELECT * FROM akademate_next_reconcile_paid_offer_event($1, $2, $3, $4, $5, $6, $7)
  `, [event.provider, event.providerEventId, event.providerOrderId, event.status,
    event.amountCents, event.currency, event.paymentMethodType])
  const row = rows[0]
  if (!row) fail('payment_reconciliation_failed')
  return {
    orderId: row.order_id, status: row.order_status, enrollmentId: row.enrollment_id,
    replayed: row.event_replayed, requiresManualReview: row.requires_manual_review,
  }
}
