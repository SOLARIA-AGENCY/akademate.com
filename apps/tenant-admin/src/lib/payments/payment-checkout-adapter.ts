export type CanonicalCheckoutOrder = {
  orderId: string
  provider: 'stripe' | 'paypal'
  paymentMethod: 'card_or_wallet' | 'sepa_debit' | 'paypal'
  amountCents: number
  currency: string
  customerEmail: string
  customerName: string
  description: string
  successUrl: string
  cancelUrl: string
}

export type ProviderCheckout = {
  providerOrderId: string
  checkoutUrl: string
}

export interface PaymentCheckoutAdapter {
  createCheckout(order: CanonicalCheckoutOrder): Promise<ProviderCheckout>
}

export class NextPaymentAdapterError extends Error {
  readonly code: string

  constructor(code: string) {
    super(code)
    this.name = 'NextPaymentAdapterError'
    this.code = code
  }
}

function fail(code: string): never {
  throw new NextPaymentAdapterError(code)
}

function requireHttpsUrl(value: string, allowedHosts: Set<string>): string {
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:'
      || url.username
      || url.password
      || !allowedHosts.has(url.hostname.toLowerCase())
    ) fail('provider_checkout_invalid')
    return url.toString()
  } catch (error) {
    if (error instanceof NextPaymentAdapterError) throw error
    fail('provider_checkout_invalid')
  }
}

function validateOrder(order: CanonicalCheckoutOrder): void {
  if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(order.orderId)
    || !Number.isSafeInteger(order.amountCents)
    || order.amountCents <= 0
    || !/^[A-Z]{3}$/.test(order.currency)
    || order.description.length < 1
    || order.description.length > 240
  ) fail('canonical_checkout_invalid')
}

type StripeCheckoutClient = {
  checkoutSessions: {
    create(
      params: Record<string, unknown>,
      options?: { idempotencyKey?: string },
    ): Promise<{ id: string; url: string | null }>
  }
}

export function createStripeCheckoutAdapter(client: StripeCheckoutClient): PaymentCheckoutAdapter {
  return {
    async createCheckout(order) {
      validateOrder(order)
      if (
        order.provider !== 'stripe'
        || (order.paymentMethod !== 'card_or_wallet' && order.paymentMethod !== 'sepa_debit')
      ) fail('provider_method_mismatch')
      if (order.paymentMethod === 'sepa_debit' && order.currency !== 'EUR') {
        fail('payment_method_currency_unsupported')
      }
      const params: Record<string, unknown> = {
        mode: 'payment',
        customer_email: order.customerEmail,
        client_reference_id: order.orderId,
        line_items: [{
          price_data: {
            currency: order.currency.toLowerCase(),
            product_data: { name: order.description },
            unit_amount: order.amountCents,
          },
          quantity: 1,
        }],
        metadata: { akademate_order_id: order.orderId },
        payment_intent_data: { metadata: { akademate_order_id: order.orderId } },
        success_url: order.successUrl,
        cancel_url: order.cancelUrl,
      }
      if (order.paymentMethod === 'sepa_debit') params.payment_method_types = ['sepa_debit']
      const session = await client.checkoutSessions.create(params, { idempotencyKey: order.orderId })
      if (!/^cs_[A-Za-z0-9_]+$/.test(session.id) || !session.url) fail('provider_checkout_invalid')
      return {
        providerOrderId: session.id,
        checkoutUrl: requireHttpsUrl(session.url, new Set(['checkout.stripe.com'])),
      }
    },
  }
}

type PayPalClient = {
  request(path: string, init: RequestInit): Promise<{
    id?: string
    links?: Array<{ rel?: string; href?: string }>
  }>
}

function centsToDecimal(amountCents: number): string {
  return `${Math.floor(amountCents / 100)}.${String(amountCents % 100).padStart(2, '0')}`
}

export function createPayPalCheckoutAdapter(client: PayPalClient): PaymentCheckoutAdapter {
  return {
    async createCheckout(order) {
      validateOrder(order)
      if (order.provider !== 'paypal' || order.paymentMethod !== 'paypal') {
        fail('provider_method_mismatch')
      }
      const response = await client.request('/v2/checkout/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'PayPal-Request-Id': order.orderId,
          Prefer: 'return=representation',
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{
            reference_id: order.orderId,
            description: order.description,
            amount: { currency_code: order.currency, value: centsToDecimal(order.amountCents) },
          }],
          payment_source: {
            paypal: {
              experience_context: {
                return_url: order.successUrl,
                cancel_url: order.cancelUrl,
                user_action: 'PAY_NOW',
              },
            },
          },
        }),
      })
      const approveUrl = response.links?.find((link) => link.rel === 'approve')?.href
      if (!response.id || !/^[A-Z0-9]+$/.test(response.id) || !approveUrl) {
        fail('provider_checkout_invalid')
      }
      return {
        providerOrderId: response.id,
        checkoutUrl: requireHttpsUrl(
          approveUrl,
          new Set(['www.paypal.com', 'paypal.com', 'www.sandbox.paypal.com', 'sandbox.paypal.com']),
        ),
      }
    },
  }
}
