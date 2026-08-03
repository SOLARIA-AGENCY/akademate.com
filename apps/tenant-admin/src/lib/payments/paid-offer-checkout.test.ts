import assert from 'node:assert/strict'
import test from 'node:test'

import type { NextPaidOfferOrderInput } from './paid-offer-order.ts'
import {
  NextPaidOfferCheckoutError,
  startNextPaidOfferCheckout,
} from './paid-offer-checkout.ts'

const input: NextPaidOfferOrderInput = {
  idempotencyKey: '9e627afb-c882-42f0-a93b-d08de9e99952',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phone: '',
  privacyAccepted: true,
  marketingConsent: false,
  provider: 'stripe',
  paymentMethod: 'card_or_wallet',
  companyWebsite: '',
}

const order = {
  orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
  status: 'created' as const,
  provider: 'stripe' as const,
  paymentMethod: 'card_or_wallet' as const,
  amountCents: 24900,
  offerTitle: 'Creative Leadership Weekend',
  currency: 'EUR',
  expiresAt: '2026-08-03T18:00:00.000Z',
  providerOrderId: null,
  checkoutUrl: null,
  replayed: false,
}

test('creates a canonical checkout and attaches it after the network boundary', async () => {
  const sequence: string[] = []
  let canonical: Record<string, unknown> | undefined
  const result = await startNextPaidOfferCheckout({
    host: 'north-star.akademate.com',
    shareSlug: 'creative-leadership-weekend',
    input,
    availableMethods: ['card_or_wallet'],
    createOrder: async () => { sequence.push('create-order'); return order },
    createCheckout: async (value) => {
      sequence.push('provider')
      canonical = value as unknown as Record<string, unknown>
      return {
        providerOrderId: 'cs_test_123',
        checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
      }
    },
    attachCheckout: async (value) => {
      sequence.push('attach')
      return { ...value, status: 'awaiting_payment' as const, replayed: false }
    },
    failCheckout: async () => { sequence.push('fail') },
  })
  assert.deepEqual(sequence, ['create-order', 'provider', 'attach'])
  assert.equal(canonical?.amountCents, 24900)
  assert.equal(canonical?.description, order.offerTitle)
  assert.equal(canonical?.successUrl, 'https://north-star.akademate.com/o/creative-leadership-weekend?payment=processing')
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_123')
})

test('replays an already attached checkout without calling the provider', async () => {
  let providerCalls = 0
  const result = await startNextPaidOfferCheckout({
    host: 'north-star.akademate.com',
    shareSlug: 'creative-leadership-weekend',
    input,
    availableMethods: ['card_or_wallet'],
    createOrder: async () => ({
      ...order,
      status: 'awaiting_payment',
      providerOrderId: 'cs_test_existing',
      checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_existing',
      replayed: true,
    }),
    createCheckout: async () => { providerCalls += 1; throw new Error('unreachable') },
    attachCheckout: async () => { throw new Error('unreachable') },
    failCheckout: async () => {},
  })
  assert.equal(providerCalls, 0)
  assert.equal(result.replayed, true)
})

test('rejects unavailable methods before reserving a seat and releases a hold after provider failure', async () => {
  let created = false
  await assert.rejects(startNextPaidOfferCheckout({
    host: 'north-star.akademate.com', shareSlug: 'offer', input,
    availableMethods: ['paypal'],
    createOrder: async () => { created = true; return order },
    createCheckout: async () => { throw new Error('unreachable') },
    attachCheckout: async () => { throw new Error('unreachable') },
    failCheckout: async () => {},
  }), (error: unknown) => error instanceof NextPaidOfferCheckoutError
    && error.code === 'payment_method_unavailable')
  assert.equal(created, false)

  let releasedOrder: string | null = null
  await assert.rejects(startNextPaidOfferCheckout({
    host: 'north-star.akademate.com', shareSlug: 'offer', input,
    availableMethods: ['card_or_wallet'],
    createOrder: async () => order,
    createCheckout: async () => { throw new Error('provider_down') },
    attachCheckout: async () => { throw new Error('unreachable') },
    failCheckout: async (orderId) => { releasedOrder = orderId },
  }), (error: unknown) => error instanceof NextPaidOfferCheckoutError
    && error.code === 'provider_checkout_unavailable')
  assert.equal(releasedOrder, order.orderId)
})
