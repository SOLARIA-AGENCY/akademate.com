import assert from 'node:assert/strict'
import test from 'node:test'

import type { LearningSqlClient } from '../learning/next-learning-transaction.ts'
import {
  NextPaidOfferReconciliationError,
  normalizePayPalPaidOfferEvent,
  normalizeStripePaidOfferEvent,
  reconcileNextPaidOfferEvent,
} from './paid-offer-reconciliation.ts'

test('normalizes Stripe completed, delayed success, failure and expiry without trusting redirects', () => {
  assert.equal(normalizeStripePaidOfferEvent({
    id: 'evt_1', type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', amount_total: 24900, currency: 'eur', payment_status: 'unpaid' } },
  })?.status, 'processing')
  assert.equal(normalizeStripePaidOfferEvent({
    id: 'evt_2', type: 'checkout.session.completed',
    data: { object: { id: 'cs_test_1', amount_total: 24900, currency: 'eur', payment_status: 'paid' } },
  })?.status, 'succeeded')
  assert.equal(normalizeStripePaidOfferEvent({
    id: 'evt_3', type: 'checkout.session.async_payment_succeeded',
    data: { object: { id: 'cs_test_1', amount_total: 24900, currency: 'eur' } },
  })?.status, 'succeeded')
  assert.equal(normalizeStripePaidOfferEvent({
    id: 'evt_4', type: 'checkout.session.async_payment_failed',
    data: { object: { id: 'cs_test_1', amount_total: 24900, currency: 'eur' } },
  })?.status, 'failed')
  assert.equal(normalizeStripePaidOfferEvent({
    id: 'evt_5', type: 'checkout.session.expired',
    data: { object: { id: 'cs_test_1', amount_total: 24900, currency: 'eur' } },
  })?.status, 'cancelled')
  assert.equal(normalizeStripePaidOfferEvent({ id: 'evt_x', type: 'customer.created', data: { object: {} } }), null)
})

test('normalizes PayPal approval as processing and capture completion as paid evidence', () => {
  assert.equal(normalizePayPalPaidOfferEvent({
    id: 'WH-1', event_type: 'CHECKOUT.ORDER.APPROVED',
    resource: { id: '5O190127TN364715T', purchase_units: [{ amount: { currency_code: 'EUR', value: '249.00' } }] },
  })?.status, 'processing')
  assert.deepEqual(normalizePayPalPaidOfferEvent({
    id: 'WH-2', event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: {
      id: 'CAPTURE1', amount: { currency_code: 'EUR', value: '249.00' },
      supplementary_data: { related_ids: { order_id: '5O190127TN364715T' } },
    },
  }), {
    provider: 'paypal', providerEventId: 'WH-2', providerOrderId: '5O190127TN364715T',
    status: 'succeeded', amountCents: 24900, currency: 'EUR', paymentMethodType: 'paypal',
  })
  assert.throws(() => normalizePayPalPaidOfferEvent({
    id: 'WH-X', event_type: 'PAYMENT.CAPTURE.COMPLETED',
    resource: { amount: { currency_code: 'EUR', value: '249.999' } },
  }), NextPaidOfferReconciliationError)
})

test('calls only the bounded reconciliation command and validates its response', async () => {
  const calls: Array<{ query: string; params: unknown[] }> = []
  const tx: LearningSqlClient = {
    async unsafe<T>(query: string, params: unknown[] = []) {
      calls.push({ query, params })
      return [{
        order_id: '62d22ec7-6f99-41b0-86c9-d14dd28964cf', order_status: 'succeeded',
        enrollment_id: 91, event_replayed: false, requires_manual_review: false,
      }] as T[]
    },
  }
  const result = await reconcileNextPaidOfferEvent(tx, {
    provider: 'stripe', providerEventId: 'evt_1', providerOrderId: 'cs_test_1',
    status: 'succeeded', amountCents: 24900, currency: 'EUR', paymentMethodType: 'card',
  })
  assert.equal(result.enrollmentId, 91)
  assert.match(calls[0]?.query ?? '', /akademate_next_reconcile_paid_offer_event/)
  assert.deepEqual(calls[0]?.params.slice(0, 4), ['stripe', 'evt_1', 'cs_test_1', 'succeeded'])
})
