import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile('apps/tenant-admin/app/api/next/public/payments/paypal/return/route.ts', 'utf8')

test('validates canonical order and provider token before idempotent PayPal capture', () => {
  assert.ok(source.indexOf('validateNextPayPalReturn') < source.indexOf('/capture'))
  assert.match(source, /PayPal-Request-Id': orderId/)
  assert.match(source, /payment=processing/)
  assert.doesNotMatch(source, /reconcileNextPaidOfferEvent|confirmed|enrollment/i)
})

test('keeps PayPal return Next-only and default-off', () => {
  assert.match(source, /AKADEMATE_RUNTIME !== 'next'/)
  assert.match(source, /AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'/)
  assert.doesNotMatch(source, /cepformacion|cepcomunicacion/i)
})
