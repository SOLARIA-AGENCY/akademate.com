import { normalizePublicOfferHost, normalizeShareSlug } from '../offers/public-offer-query.ts'
import type { NextPaidOfferOrder, NextPaidOfferOrderInput } from './paid-offer-order.ts'
import type { CanonicalCheckoutOrder, ProviderCheckout } from './payment-checkout-adapter.ts'

type PaymentMethod = NextPaidOfferOrderInput['paymentMethod']

export class NextPaidOfferCheckoutError extends Error {
  readonly code: string
  constructor(code: string) {
    super(code)
    this.name = 'NextPaidOfferCheckoutError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextPaidOfferCheckoutError(code)
}

type AttachedCheckout = ProviderCheckout & {
  orderId: string
  status: 'awaiting_payment'
  replayed: boolean
}

export async function startNextPaidOfferCheckout({
  host,
  shareSlug,
  input,
  availableMethods,
  createOrder,
  createCheckout,
  attachCheckout,
  failCheckout,
  successUrlForOrder,
}: {
  host: string
  shareSlug: string
  input: NextPaidOfferOrderInput
  availableMethods: PaymentMethod[]
  createOrder: () => Promise<NextPaidOfferOrder>
  createCheckout: (order: CanonicalCheckoutOrder) => Promise<ProviderCheckout>
  attachCheckout: (checkout: ProviderCheckout & { orderId: string }) => Promise<AttachedCheckout>
  failCheckout: (orderId: string) => Promise<unknown>
  successUrlForOrder?: (orderId: string) => string
}): Promise<AttachedCheckout> {
  if (!availableMethods.includes(input.paymentMethod)) fail('payment_method_unavailable')
  const normalizedHost = normalizePublicOfferHost(host)
  const normalizedSlug = normalizeShareSlug(shareSlug)
  const order = await createOrder()
  if (order.provider !== input.provider || order.paymentMethod !== input.paymentMethod) {
    fail('paid_order_provider_mismatch')
  }
  if (order.checkoutUrl && order.providerOrderId) {
    return {
      orderId: order.orderId,
      status: 'awaiting_payment',
      providerOrderId: order.providerOrderId,
      checkoutUrl: order.checkoutUrl,
      replayed: true,
    }
  }

  const base = `https://${normalizedHost}`
  try {
    const checkout = await createCheckout({
      orderId: order.orderId,
      provider: order.provider,
      paymentMethod: order.paymentMethod,
      amountCents: order.amountCents,
      currency: order.currency,
      customerEmail: input.email,
      customerName: `${input.firstName} ${input.lastName}`.trim(),
      description: order.offerTitle,
      successUrl: successUrlForOrder?.(order.orderId)
        ?? `${base}/o/${encodeURIComponent(normalizedSlug)}?payment=processing`,
      cancelUrl: `${base}/o/${encodeURIComponent(normalizedSlug)}?payment=cancelled`,
    })
    return await attachCheckout({ orderId: order.orderId, ...checkout })
  } catch {
    try {
      await failCheckout(order.orderId)
    } catch {
      // The database hold expires independently; never replace the provider failure with cleanup noise.
    }
    fail('provider_checkout_unavailable')
  }
}
