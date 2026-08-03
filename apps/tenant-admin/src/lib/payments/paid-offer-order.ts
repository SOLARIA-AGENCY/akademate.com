import { createHmac } from 'node:crypto'
import { z } from 'zod'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import { normalizePublicOfferHost, normalizeShareSlug } from '../offers/public-offer-query.ts'

const PaidOrderSchema = z.object({
  idempotencyKey: z.string().uuid(),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(120),
  email: z.string().trim().toLowerCase().email().max(254),
  phone: z.string().trim().min(4).max(32).optional().or(z.literal('')),
  privacyAccepted: z.literal(true),
  marketingConsent: z.boolean().default(false),
  provider: z.enum(['stripe', 'paypal']),
  paymentMethod: z.enum(['card_or_wallet', 'sepa_debit', 'paypal']),
  companyWebsite: z.string().max(200).default(''),
}).strict().superRefine((value, context) => {
  const compatible = value.provider === 'stripe'
    ? value.paymentMethod === 'card_or_wallet' || value.paymentMethod === 'sepa_debit'
    : value.paymentMethod === 'paypal'
  if (!compatible) context.addIssue({ code: 'custom', message: 'provider_method_mismatch' })
})

export type NextPaidOfferOrderInput = z.infer<typeof PaidOrderSchema>

type PaidOrderStatus = 'created' | 'provider_pending' | 'awaiting_payment' | 'processing' | 'succeeded' | 'failed' | 'cancelled' | 'expired' | 'requires_review'

type PaidOrderRow = {
  order_id: string
  order_status: PaidOrderStatus
  provider: 'stripe' | 'paypal'
  payment_method: 'card_or_wallet' | 'sepa_debit' | 'paypal'
  amount_cents: number | string
  offer_title: string
  currency: string
  expires_at: string | Date
  provider_order_id: string | null
  provider_checkout_url: string | null
  replayed: boolean
}

export type NextPaidOfferOrder = {
  orderId: string
  status: PaidOrderRow['order_status']
  provider: PaidOrderRow['provider']
  paymentMethod: PaidOrderRow['payment_method']
  amountCents: number
  offerTitle: string
  currency: string
  expiresAt: string
  providerOrderId: string | null
  checkoutUrl: string | null
  replayed: boolean
}

export class NextPaidOfferOrderError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextPaidOfferOrderError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextPaidOfferOrderError(code)
}

export function parseNextPaidOfferOrder(value: unknown): NextPaidOfferOrderInput {
  const parsed = PaidOrderSchema.safeParse(value)
  if (!parsed.success || parsed.data.companyWebsite !== '') fail('paid_order_invalid')
  return parsed.data
}

function requireServerValue(value: string, pattern: RegExp, code: string): string {
  if (!pattern.test(value)) fail(code)
  return value
}

function fingerprint(pepper: string, purpose: string, value: string): string {
  requireServerValue(pepper, /^.{32,}$/, 'paid_order_pepper_invalid')
  return createHmac('sha256', pepper).update(`${purpose}\0${value}`).digest('hex')
}

function mapDatabaseError(error: unknown): never {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('paid_offer_sold_out')) fail('paid_order_sold_out')
  if (message.includes('paid_offer_idempotency_conflict')) fail('paid_order_idempotency_conflict')
  if (message.includes('paid_offer_rate_limited')) fail('paid_order_rate_limited')
  if (message.includes('paid_offer_duplicate_contact')) fail('paid_order_duplicate_contact')
  if (message.includes('paid_offer_not_available')) fail('paid_order_not_available')
  throw error
}

function iso(value: string | Date): string {
  const parsed = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(parsed.getTime())) fail('paid_order_response_invalid')
  return parsed.toISOString()
}

export async function createNextPaidOfferOrder({
  tx,
  host,
  shareSlug,
  input,
  privacyNoticeVersion,
  fingerprintPepper,
}: {
  tx: LearningSqlClient
  host: string
  shareSlug: string
  input: NextPaidOfferOrderInput
  privacyNoticeVersion: string
  fingerprintPepper: string
}): Promise<NextPaidOfferOrder> {
  const normalizedHost = normalizePublicOfferHost(host)
  const normalizedSlug = normalizeShareSlug(shareSlug)
  const noticeVersion = requireServerValue(
    privacyNoticeVersion,
    /^[a-zA-Z0-9][a-zA-Z0-9._-]{2,63}$/,
    'paid_order_privacy_notice_invalid',
  )
  const canonicalPayload = JSON.stringify({
    host: normalizedHost,
    slug: normalizedSlug,
    idempotencyKey: input.idempotencyKey,
    firstName: input.firstName,
    lastName: input.lastName,
    email: input.email,
    phone: input.phone || null,
    privacyAccepted: input.privacyAccepted,
    marketingConsent: input.marketingConsent,
    provider: input.provider,
    paymentMethod: input.paymentMethod,
    privacyNoticeVersion: noticeVersion,
  })
  const payloadFingerprint = fingerprint(fingerprintPepper, 'paid-offer-order-payload', canonicalPayload)
  const contactFingerprint = fingerprint(
    fingerprintPepper,
    'paid-offer-order-contact',
    `${normalizedHost}\0${normalizedSlug}\0${input.email}`,
  )

  try {
    const rows = await tx.unsafe<PaidOrderRow>(`
      SELECT * FROM akademate_next_create_paid_offer_order(
        $1, $2, $3::uuid, $4, $5, $6, $7, $8, $9,
        $10, $11, $12, $13, $14
      )
    `, [
      normalizedHost,
      normalizedSlug,
      input.idempotencyKey,
      input.firstName,
      input.lastName,
      input.email,
      input.phone || null,
      input.privacyAccepted,
      input.marketingConsent,
      input.provider,
      input.paymentMethod,
      noticeVersion,
      payloadFingerprint,
      contactFingerprint,
    ])
    const row = rows[0]
    if (!row) fail('paid_order_not_available')
    const amountCents = Number(row.amount_cents)
    if (!Number.isSafeInteger(amountCents) || amountCents <= 0 || row.currency !== 'EUR') {
      fail('paid_order_response_invalid')
    }
    if (typeof row.offer_title !== 'string' || row.offer_title.trim().length === 0) {
      fail('paid_order_response_invalid')
    }
    return {
      orderId: row.order_id,
      status: row.order_status,
      provider: row.provider,
      paymentMethod: row.payment_method,
      amountCents,
      offerTitle: row.offer_title,
      currency: row.currency,
      expiresAt: iso(row.expires_at),
      providerOrderId: row.provider_order_id,
      checkoutUrl: row.provider_checkout_url,
      replayed: row.replayed,
    }
  } catch (error) {
    mapDatabaseError(error)
  }
}

type AttachedCheckoutRow = {
  order_id: string
  order_status: PaidOrderStatus
  provider_order_id: string
  provider_checkout_url: string
  replayed: boolean
}

export async function attachNextPaidOfferCheckout({
  tx,
  orderId,
  providerOrderId,
  checkoutUrl,
}: {
  tx: LearningSqlClient
  orderId: string
  providerOrderId: string
  checkoutUrl: string
}) {
  try {
    const rows = await tx.unsafe<AttachedCheckoutRow>(`
      SELECT * FROM akademate_next_attach_paid_offer_checkout($1::uuid, $2, $3)
    `, [orderId, providerOrderId, checkoutUrl])
    const row = rows[0]
    if (!row || row.order_status !== 'awaiting_payment') fail('paid_order_checkout_attach_failed')
    return {
      orderId: row.order_id,
      status: 'awaiting_payment' as const,
      providerOrderId: row.provider_order_id,
      checkoutUrl: row.provider_checkout_url,
      replayed: row.replayed,
    }
  } catch (error) {
    mapDatabaseError(error)
  }
}

type FailedCheckoutRow = {
  order_id: string
  order_status: PaidOrderStatus
  hold_released: boolean
}

export async function failNextPaidOfferCheckout({
  tx,
  orderId,
  failureCode,
}: {
  tx: LearningSqlClient
  orderId: string
  failureCode: string
}) {
  try {
    const rows = await tx.unsafe<FailedCheckoutRow>(`
      SELECT * FROM akademate_next_fail_paid_offer_checkout($1::uuid, $2)
    `, [orderId, failureCode])
    const row = rows[0]
    if (!row) fail('paid_order_checkout_fail_failed')
    return {
      orderId: row.order_id,
      status: row.order_status,
      holdReleased: row.hold_released,
    }
  } catch (error) {
    mapDatabaseError(error)
  }
}
