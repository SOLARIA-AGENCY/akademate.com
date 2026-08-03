import { NextLearningInfrastructureError } from '@/src/lib/learning/next-learning-transaction'
import { withNextPublicOfferWriteTransaction } from '@/src/lib/offers/public-offer-database'
import { currentNextPaidOfferConfig } from '@/src/lib/payments/paid-offer-config'
import {
  NextPaidOfferCheckoutError,
  startNextPaidOfferCheckout,
} from '@/src/lib/payments/paid-offer-checkout'
import {
  NextPaidOfferOrderError,
  attachNextPaidOfferCheckout,
  createNextPaidOfferOrder,
  failNextPaidOfferCheckout,
  parseNextPaidOfferOrder,
} from '@/src/lib/payments/paid-offer-order'
import { createPaymentCheckoutAdapter } from '@/src/lib/payments/payment-provider-clients'
import { normalizePublicOfferHost } from '@/src/lib/offers/public-offer-query'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const MAX_BODY_BYTES = 8_192

function response(body: unknown, status: number, headers: Record<string, string> = {}) {
  return Response.json(body, {
    status,
    headers: { 'Cache-Control': 'private, no-store', Vary: 'Host', ...headers },
  })
}

function requestHost(request: Request): string {
  return request.headers.get('x-forwarded-host')?.split(',')[0]?.trim()
    || request.headers.get('host')?.trim()
    || ''
}

async function readBody(request: Request): Promise<unknown> {
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    throw new NextPaidOfferOrderError('paid_order_too_large')
  }
  const text = await request.text()
  if (new TextEncoder().encode(text).byteLength > MAX_BODY_BYTES) {
    throw new NextPaidOfferOrderError('paid_order_too_large')
  }
  try { return JSON.parse(text) } catch { throw new NextPaidOfferOrderError('paid_order_invalid') }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PUBLIC_OFFERS_ENABLED !== 'true'
    || process.env.AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'
  ) return response({ error: 'not_found' }, 404)
  const config = currentNextPaidOfferConfig()
  if (!config) return response({ error: 'payment_service_unavailable' }, 503)

  try {
    const [{ slug }, body] = await Promise.all([context.params, readBody(request)])
    const input = parseNextPaidOfferOrder(body)
    const host = requestHost(request)
    const adapter = createPaymentCheckoutAdapter(config, input.provider)
    const result = await startNextPaidOfferCheckout({
      host,
      shareSlug: slug,
      input,
      availableMethods: config.availableMethods,
      createOrder: () => withNextPublicOfferWriteTransaction((tx) => createNextPaidOfferOrder({
        tx, host, shareSlug: slug, input,
        privacyNoticeVersion: config.privacyNoticeVersion,
        fingerprintPepper: config.fingerprintPepper,
      })),
      createCheckout: (order) => adapter.createCheckout(order),
      attachCheckout: ({ orderId, providerOrderId, checkoutUrl }) =>
        withNextPublicOfferWriteTransaction((tx) => attachNextPaidOfferCheckout({
          tx, orderId, providerOrderId, checkoutUrl,
        })),
      failCheckout: (orderId) => withNextPublicOfferWriteTransaction((tx) =>
        failNextPaidOfferCheckout({ tx, orderId, failureCode: 'provider_checkout_failed' })),
      successUrlForOrder: input.provider === 'paypal'
        ? (orderId) => `https://${normalizePublicOfferHost(host)}/api/next/public/payments/paypal/return?order=${encodeURIComponent(orderId)}`
        : undefined,
    })
    return response({
      orderId: result.orderId,
      status: result.status,
      checkoutUrl: result.checkoutUrl,
    }, result.replayed ? 200 : 201)
  } catch (error) {
    if (error instanceof NextPaidOfferOrderError) {
      if (error.code === 'paid_order_too_large') return response({ error: error.code }, 413)
      if (error.code === 'paid_order_invalid') return response({ error: error.code }, 400)
      if (error.code === 'paid_order_sold_out') return response({ error: error.code }, 409)
      if (error.code === 'paid_order_duplicate_contact') return response({ error: error.code }, 409)
      if (error.code === 'paid_order_idempotency_conflict') return response({ error: error.code }, 409)
      if (error.code === 'paid_order_rate_limited') {
        return response({ error: error.code }, 429, { 'Retry-After': '3600' })
      }
      if (error.code === 'paid_order_not_available') return response({ error: 'not_found' }, 404)
      return response({ error: 'payment_service_unavailable' }, 503)
    }
    if (error instanceof NextPaidOfferCheckoutError) {
      if (error.code === 'payment_method_unavailable') return response({ error: error.code }, 400)
      return response({ error: 'payment_service_unavailable' }, 503)
    }
    if (error instanceof NextLearningInfrastructureError) {
      return response({ error: 'payment_service_unavailable' }, 503)
    }
    console.error('[Akademate Next Paid Offers] Unhandled checkout error', error)
    return response({ error: 'internal_error' }, 500)
  }
}
