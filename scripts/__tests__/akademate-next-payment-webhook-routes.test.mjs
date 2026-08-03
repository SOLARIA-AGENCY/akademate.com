import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const [stripe, paypal] = await Promise.all([
  readFile('apps/tenant-admin/app/api/next/public/payments/webhooks/stripe/route.ts', 'utf8'),
  readFile('apps/tenant-admin/app/api/next/public/payments/webhooks/paypal/route.ts', 'utf8'),
])

test('verifies provider authenticity before invoking the reconciliation command', () => {
  assert.ok(stripe.indexOf('constructEvent') < stripe.lastIndexOf('reconcileNextPaidOfferEvent'))
  assert.ok(paypal.indexOf('verify-webhook-signature') < paypal.lastIndexOf('reconcileNextPaidOfferEvent'))
  assert.match(paypal, /verification_status !== 'SUCCESS'/)
})

test('keeps webhooks default-off, bounded and free of browser-success fulfillment', () => {
  for (const source of [stripe, paypal]) {
    assert.match(source, /AKADEMATE_RUNTIME !== 'next'/)
    assert.match(source, /AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'/)
    assert.match(source, /MAX_BODY_BYTES/)
    assert.doesNotMatch(source, /redirect|successUrl|enrollment.*insert|cepformacion/i)
  }
})
