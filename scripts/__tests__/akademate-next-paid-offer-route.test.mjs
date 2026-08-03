import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

const source = await readFile('apps/tenant-admin/app/api/next/public/offers/[slug]/checkout/route.ts', 'utf8')

test('keeps paid checkout Next-only, default-off, size bounded and POST-only', () => {
  assert.match(source, /AKADEMATE_RUNTIME !== 'next'/)
  assert.match(source, /AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true'/)
  assert.match(source, /MAX_BODY_BYTES/)
  assert.match(source, /export async function POST/)
  assert.doesNotMatch(source, /export async function (GET|PUT|PATCH|DELETE)/)
})

test('derives orders in PostgreSQL and never accepts commercial or tenant selectors in the route', () => {
  assert.match(source, /createNextPaidOfferOrder/)
  assert.match(source, /attachNextPaidOfferCheckout/)
  assert.match(source, /failNextPaidOfferCheckout/)
  assert.doesNotMatch(source, /tenantId|amountCents|cancelUrl/)
  assert.doesNotMatch(source, /cepformacion|cepcomunicacion|api\/billing/i)
})
