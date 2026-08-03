import { withNextPublicOfferWriteTransaction } from '@/src/lib/offers/public-offer-database'
import { currentNextPaidOfferConfig } from '@/src/lib/payments/paid-offer-config'
import { createPayPalApiClient } from '@/src/lib/payments/payment-provider-clients'
import { NextPayPalReturnError, validateNextPayPalReturn } from '@/src/lib/payments/paypal-return'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

export async function GET(request: Request): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'
  ) return json({ error: 'not_found' }, 404)
  const config = currentNextPaidOfferConfig()
  if (!config?.paypal) return json({ error: 'not_found' }, 404)
  const query = new URL(request.url).searchParams
  const orderId = query.get('order') ?? ''
  const providerOrderId = query.get('token') ?? ''
  try {
    const canonical = await withNextPublicOfferWriteTransaction((tx) =>
      validateNextPayPalReturn(tx, orderId, providerOrderId))
    if (canonical.status !== 'succeeded') {
      const client = createPayPalApiClient(config.paypal)
      await client.request(`/v2/checkout/orders/${encodeURIComponent(providerOrderId)}/capture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PayPal-Request-Id': orderId,
          Prefer: 'return=representation',
        },
        body: '{}',
      })
    }
    return Response.redirect(
      `https://${canonical.host}/o/${encodeURIComponent(canonical.shareSlug)}?payment=processing`,
      303,
    )
  } catch (error) {
    if (error instanceof NextPayPalReturnError) {
      return json({ error: error.code === 'paypal_return_invalid' ? error.code : 'not_found' },
        error.code === 'paypal_return_invalid' ? 400 : 404)
    }
    console.error('[Akademate Next Payments] PayPal capture return failed', error)
    return json({ error: 'payment_service_unavailable' }, 503)
  }
}
