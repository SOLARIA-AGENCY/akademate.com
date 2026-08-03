import assert from 'node:assert/strict'
import test from 'node:test'

import {
  NextPaymentAdapterError,
  createPayPalCheckoutAdapter,
  createStripeCheckoutAdapter,
  type CanonicalCheckoutOrder,
} from './payment-checkout-adapter.ts'

const order: CanonicalCheckoutOrder = {
  orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
  provider: 'stripe',
  paymentMethod: 'card_or_wallet',
  amountCents: 24900,
  currency: 'EUR',
  customerEmail: 'ada@example.com',
  customerName: 'Ada Lovelace',
  description: 'Creative Leadership Weekend',
  successUrl: 'https://north-star.akademate.com/o/creative-leadership-weekend?payment=return',
  cancelUrl: 'https://north-star.akademate.com/o/creative-leadership-weekend?payment=cancelled',
}

test('Stripe derives a hosted one-time Checkout Session with server-owned amount and idempotency', async () => {
  const calls: Array<{ params: Record<string, unknown>; options: Record<string, unknown> }> = []
  const adapter = createStripeCheckoutAdapter({
    checkoutSessions: {
      async create(params, options) {
        calls.push({ params, options })
        return { id: 'cs_test_123', url: 'https://checkout.stripe.com/c/pay/cs_test_123' }
      },
    },
  })

  const result = await adapter.createCheckout(order)
  assert.deepEqual(result, {
    providerOrderId: 'cs_test_123',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
  })
  assert.equal(calls[0]?.options.idempotencyKey, order.orderId)
  assert.equal(calls[0]?.params.mode, 'payment')
  assert.deepEqual(calls[0]?.params.line_items, [{
    price_data: {
      currency: 'eur',
      product_data: { name: order.description },
      unit_amount: order.amountCents,
    },
    quantity: 1,
  }])
  assert.equal('payment_method_types' in (calls[0]?.params ?? {}), false)
})

test('Stripe restricts an explicit SEPA checkout to EUR and never confirms synchronously', async () => {
  const calls: Array<Record<string, unknown>> = []
  const adapter = createStripeCheckoutAdapter({
    checkoutSessions: {
      async create(params) {
        calls.push(params)
        return { id: 'cs_test_sepa', url: 'https://checkout.stripe.com/c/pay/cs_test_sepa' }
      },
    },
  })
  await adapter.createCheckout({ ...order, paymentMethod: 'sepa_debit' })
  assert.deepEqual(calls[0]?.payment_method_types, ['sepa_debit'])
  await assert.rejects(
    adapter.createCheckout({ ...order, paymentMethod: 'sepa_debit', currency: 'USD' }),
    (error: unknown) => error instanceof NextPaymentAdapterError
      && error.code === 'payment_method_currency_unsupported',
  )
})

test('PayPal creates a CAPTURE order with canonical amount and request id', async () => {
  const calls: Array<{ path: string; init: RequestInit }> = []
  const adapter = createPayPalCheckoutAdapter({
    async request(path, init) {
      calls.push({ path, init })
      return {
        id: '5O190127TN364715T',
        links: [{ rel: 'approve', href: 'https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T' }],
      }
    },
  })
  const result = await adapter.createCheckout({ ...order, provider: 'paypal', paymentMethod: 'paypal' })
  assert.equal(result.providerOrderId, '5O190127TN364715T')
  assert.equal(calls[0]?.path, '/v2/checkout/orders')
  const headers = new Headers(calls[0]?.init.headers)
  assert.equal(headers.get('PayPal-Request-Id'), order.orderId)
  assert.deepEqual(JSON.parse(String(calls[0]?.init.body)), {
    intent: 'CAPTURE',
    purchase_units: [{
      reference_id: order.orderId,
      description: order.description,
      amount: { currency_code: 'EUR', value: '249.00' },
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
  })
})

test('adapters reject provider mismatch and malformed provider redirects', async () => {
  const stripe = createStripeCheckoutAdapter({
    checkoutSessions: { async create() { return { id: 'cs_1', url: 'javascript:alert(1)' } } },
  })
  await assert.rejects(
    stripe.createCheckout({ ...order, provider: 'paypal', paymentMethod: 'paypal' }),
    (error: unknown) => error instanceof NextPaymentAdapterError,
  )

  const paypal = createPayPalCheckoutAdapter({
    async request() { return { id: 'order', links: [{ rel: 'approve', href: 'https://evil.example' }] } },
  })
  await assert.rejects(
    paypal.createCheckout({ ...order, provider: 'paypal', paymentMethod: 'paypal' }),
    (error: unknown) => error instanceof NextPaymentAdapterError
      && error.code === 'provider_checkout_invalid',
  )
})
