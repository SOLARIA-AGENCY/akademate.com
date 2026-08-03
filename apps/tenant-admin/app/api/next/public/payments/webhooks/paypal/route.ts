import { withNextPublicOfferWriteTransaction } from '@/src/lib/offers/public-offer-database'
import { currentNextPaidOfferConfig } from '@/src/lib/payments/paid-offer-config'
import { createPayPalApiClient } from '@/src/lib/payments/payment-provider-clients'
import {
  normalizePayPalPaidOfferEvent,
  reconcileNextPaidOfferEvent,
} from '@/src/lib/payments/paid-offer-reconciliation'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
const MAX_BODY_BYTES = 1_048_576

function json(body: unknown, status: number) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'private, no-store' } })
}

function requiredHeader(request: Request, name: string): string | null {
  const value = request.headers.get(name)
  return value && value.length <= 2_048 ? value : null
}

export async function POST(request: Request): Promise<Response> {
  if (
    process.env.AKADEMATE_RUNTIME !== 'next'
    || process.env.AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'
  ) return json({ error: 'not_found' }, 404)
  const config = currentNextPaidOfferConfig()
  if (!config?.paypal) return json({ error: 'not_found' }, 404)
  const declared = Number(request.headers.get('content-length') ?? 0)
  if (Number.isFinite(declared) && declared > MAX_BODY_BYTES) {
    return json({ error: 'webhook_invalid' }, 400)
  }
  const raw = await request.text()
  if (new TextEncoder().encode(raw).byteLength > MAX_BODY_BYTES) {
    return json({ error: 'webhook_invalid' }, 400)
  }
  let webhookEvent: unknown
  try { webhookEvent = JSON.parse(raw) } catch { return json({ error: 'webhook_invalid' }, 400) }
  const transmissionId = requiredHeader(request, 'paypal-transmission-id')
  const transmissionTime = requiredHeader(request, 'paypal-transmission-time')
  const certUrl = requiredHeader(request, 'paypal-cert-url')
  const authAlgo = requiredHeader(request, 'paypal-auth-algo')
  const transmissionSig = requiredHeader(request, 'paypal-transmission-sig')
  if (!transmissionId || !transmissionTime || !certUrl || !authAlgo || !transmissionSig) {
    return json({ error: 'webhook_invalid' }, 400)
  }
  try {
    const client = createPayPalApiClient(config.paypal)
    const verification = await client.request('/v1/notifications/verify-webhook-signature', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        transmission_id: transmissionId,
        transmission_time: transmissionTime,
        cert_url: certUrl,
        auth_algo: authAlgo,
        transmission_sig: transmissionSig,
        webhook_id: config.paypal.webhookId,
        webhook_event: webhookEvent,
      }),
    }) as { verification_status?: unknown }
    if (verification.verification_status !== 'SUCCESS') {
      return json({ error: 'webhook_invalid' }, 400)
    }
    const event = normalizePayPalPaidOfferEvent(webhookEvent)
    if (!event) return json({ received: true, ignored: true }, 200)
    const result = await withNextPublicOfferWriteTransaction((tx) =>
      reconcileNextPaidOfferEvent(tx, event))
    return json({ received: true, replayed: result.replayed }, 200)
  } catch (error) {
    console.error('[Akademate Next Payments] PayPal webhook reconciliation failed', error)
    return json({ error: 'webhook_reconciliation_failed' }, 500)
  }
}
