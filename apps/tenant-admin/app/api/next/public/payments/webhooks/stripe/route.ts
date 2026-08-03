import Stripe from 'stripe'

import { withNextPublicOfferWriteTransaction } from '@/src/lib/offers/public-offer-database'
import { currentNextPaidOfferConfig } from '@/src/lib/payments/paid-offer-config'
import {
  normalizeStripePaidOfferEvent,
  reconcileNextPaidOfferEvent,
} from '@/src/lib/payments/paid-offer-reconciliation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const MAX_BODY_BYTES = 1_048_576

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function POST(request: Request): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'
  ) return json({ error: 'not_found' }, 404)
  const config = currentNextPaidOfferConfig()
  if (!config?.stripe) return json({ error: 'not_found' }, 404)
  const signature = request.headers.get('stripe-signature')
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (!signature || (Number.isFinite(declared) && declared > MAX_BODY_BYTES)) {
    return json({ error: 'webhook_invalid' }, 400)
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'webhook_invalid' }, 400)
  }
  try {
    const stripe = new Stripe(config.stripe.secretKey, { maxNetworkRetries: 2, timeout: 15_000 })
    const verified = stripe.webhooks.constructEvent(raw, signature, config.stripe.webhookSecret)
    const event = normalizeStripePaidOfferEvent(verified)
    if (!event) return json({ received: true, ignored: true }, 200)
    const result = await withNextPublicOfferWriteTransaction((tx) =>
      reconcileNextPaidOfferEvent(tx, event))
    return json({ received: true, replayed: result.replayed }, 200)
  } catch (error) {
    if (error instanceof Stripe.errors.StripeSignatureVerificationError) {
      return json({ error: 'webhook_invalid' }, 400)
    }
    console.error('[Akademate Next Payments] Stripe webhook reconciliation failed', error)
    return json({ error: 'webhook_reconciliation_failed' }, 500)
  }
}
