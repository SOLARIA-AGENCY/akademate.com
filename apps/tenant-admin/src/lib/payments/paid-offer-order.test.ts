import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import {
  NextPaidOfferOrderError,
  attachNextPaidOfferCheckout,
  createNextPaidOfferOrder,
  failNextPaidOfferCheckout,
  parseNextPaidOfferOrder,
} from './paid-offer-order.ts'

type Row = Record<string, unknown>

function fakeClient(response: Row[] | Error) {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const client: LearningSqlClient = {
    async unsafe<T extends Row>(query: string, params: unknown[] = []) {
      calls.push({ query: query.replace(/\s+/g, ' ').trim(), params })
      if (response instanceof Error) throw response
      return response as T[]
    },
  }
  return { calls, client }
}

const validInput = {
  idempotencyKey: '9e627afb-c882-42f0-a93b-d08de9e99952',
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ADA@EXAMPLE.COM',
  phone: '+34 600 000 000',
  privacyAccepted: true,
  marketingConsent: false,
  provider: 'stripe',
  paymentMethod: 'card_or_wallet',
  companyWebsite: '',
} as const

test('accepts only canonical provider and method combinations', () => {
  assert.deepEqual(parseNextPaidOfferOrder(validInput), {
    ...validInput,
    email: 'ada@example.com',
  })
  assert.equal(parseNextPaidOfferOrder({
    ...validInput,
    paymentMethod: 'sepa_debit',
  }).paymentMethod, 'sepa_debit')
  assert.equal(parseNextPaidOfferOrder({
    ...validInput,
    provider: 'paypal',
    paymentMethod: 'paypal',
  }).provider, 'paypal')
})

test('rejects client-controlled commercial or tenant fields and mismatched providers', () => {
  for (const input of [
    { ...validInput, tenantId: 7 },
    { ...validInput, amountCents: 1 },
    { ...validInput, currency: 'USD' },
    { ...validInput, successUrl: 'https://attacker.example/success' },
    { ...validInput, privacyAccepted: false },
    { ...validInput, companyWebsite: 'spam.example' },
    { ...validInput, provider: 'paypal', paymentMethod: 'card_or_wallet' },
    { ...validInput, provider: 'stripe', paymentMethod: 'paypal' },
  ]) {
    assert.throws(
      () => parseNextPaidOfferOrder(input),
      (error: unknown) => error instanceof NextPaidOfferOrderError
        && error.code === 'paid_order_invalid',
    )
  }
})

test('derives all commercial values in PostgreSQL and sends only fingerprints and contact data', async () => {
  const row = {
    order_id: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    order_status: 'created',
    provider: 'stripe',
    payment_method: 'card_or_wallet',
    amount_cents: 6000,
    offer_title: 'Creative Leadership Weekend',
    currency: 'EUR',
    expires_at: '2026-08-03T18:00:00.000Z',
    provider_order_id: null,
    provider_checkout_url: null,
    replayed: false,
  }
  const { calls, client } = fakeClient([row])
  const result = await createNextPaidOfferOrder({
    tx: client,
    host: 'north-star.localhost:3000',
    shareSlug: 'creative-leadership-weekend',
    input: parseNextPaidOfferOrder(validInput),
    privacyNoticeVersion: '2026-08-v1',
    fingerprintPepper: 'p'.repeat(32),
  })

  assert.deepEqual(result, {
    orderId: row.order_id,
    status: 'created',
    provider: 'stripe',
    paymentMethod: 'card_or_wallet',
    amountCents: 6000,
    offerTitle: 'Creative Leadership Weekend',
    currency: 'EUR',
    expiresAt: row.expires_at,
    providerOrderId: null,
    checkoutUrl: null,
    replayed: false,
  })
  assert.match(calls[0]?.query ?? '', /akademate_next_create_paid_offer_order/)
  assert.equal(calls[0]?.params[0], 'north-star.localhost')
  assert.equal(calls[0]?.params[1], 'creative-leadership-weekend')
  assert.equal(calls[0]?.params[2], validInput.idempotencyKey)
  assert.equal(calls[0]?.params.includes(6000), false)
  assert.equal(calls[0]?.params.includes('EUR'), false)
  assert.match(String(calls[0]?.params.at(-2)), /^[0-9a-f]{64}$/)
  assert.match(String(calls[0]?.params.at(-1)), /^[0-9a-f]{64}$/)
})

test('returns an already attached checkout on an idempotent replay', async () => {
  const { client } = fakeClient([{
    order_id: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    order_status: 'awaiting_payment',
    provider: 'stripe',
    payment_method: 'card_or_wallet',
    amount_cents: 6000,
    offer_title: 'Creative Leadership Weekend',
    currency: 'EUR',
    expires_at: '2026-08-03T18:00:00.000Z',
    provider_order_id: 'cs_test_existing',
    provider_checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_existing',
    replayed: true,
  }])
  const result = await createNextPaidOfferOrder({
    tx: client,
    host: 'north-star.localhost',
    shareSlug: 'creative-leadership-weekend',
    input: parseNextPaidOfferOrder(validInput),
    privacyNoticeVersion: '2026-08-v1',
    fingerprintPepper: 'p'.repeat(32),
  })
  assert.equal(result.providerOrderId, 'cs_test_existing')
  assert.equal(result.checkoutUrl, 'https://checkout.stripe.com/c/pay/cs_test_existing')
  assert.equal(result.replayed, true)
})

test('attaches or fails a provider checkout only through bounded database commands', async () => {
  const attached = fakeClient([{
    order_id: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    order_status: 'awaiting_payment',
    provider_order_id: 'cs_test_123',
    provider_checkout_url: 'https://checkout.stripe.com/c/pay/cs_test_123',
    replayed: false,
  }])
  const result = await attachNextPaidOfferCheckout({
    tx: attached.client,
    orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    providerOrderId: 'cs_test_123',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_123',
  })
  assert.equal(result.status, 'awaiting_payment')
  assert.match(attached.calls[0]?.query ?? '', /akademate_next_attach_paid_offer_checkout/)

  const failed = fakeClient([{
    order_id: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    order_status: 'failed',
    hold_released: true,
  }])
  assert.deepEqual(await failNextPaidOfferCheckout({
    tx: failed.client,
    orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    failureCode: 'provider_unavailable',
  }), {
    orderId: '62d22ec7-6f99-41b0-86c9-d14dd28964cf',
    status: 'failed',
    holdReleased: true,
  })
  assert.match(failed.calls[0]?.query ?? '', /akademate_next_fail_paid_offer_checkout/)
})

test('maps sold-out, replay conflict and unavailable offers without leaking database details', async () => {
  for (const [message, code] of [
    ['paid_offer_sold_out', 'paid_order_sold_out'],
    ['paid_offer_idempotency_conflict', 'paid_order_idempotency_conflict'],
    ['paid_offer_not_available', 'paid_order_not_available'],
  ]) {
    const { client } = fakeClient(new Error(message))
    await assert.rejects(
      createNextPaidOfferOrder({
        tx: client,
        host: 'north-star.localhost',
        shareSlug: 'creative-leadership-weekend',
        input: parseNextPaidOfferOrder(validInput),
        privacyNoticeVersion: '2026-08-v1',
        fingerprintPepper: 'p'.repeat(32),
      }),
      (error: unknown) => error instanceof NextPaidOfferOrderError && error.code === code,
    )
  }
})
