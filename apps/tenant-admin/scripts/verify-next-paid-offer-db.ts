import assert from 'node:assert/strict'
import postgres from 'postgres'

import { withNextPublicOfferWriteTransaction } from '../src/lib/offers/public-offer-database.ts'
import {
  NextPaidOfferOrderError,
  attachNextPaidOfferCheckout,
  createNextPaidOfferOrder,
  parseNextPaidOfferOrder,
} from '../src/lib/payments/paid-offer-order.ts'
import { reconcileNextPaidOfferEvent } from '../src/lib/payments/paid-offer-reconciliation.ts'
import { validateNextPayPalReturn } from '../src/lib/payments/paypal-return.ts'

const ownerUrl = process.env.AKADEMATE_NEXT_TEST_OWNER_DATABASE_URL
const appUrl = process.env.AKADEMATE_NEXT_TEST_APP_DATABASE_URL
const appRole = process.env.AKADEMATE_NEXT_DB_APP_USER
if (!ownerUrl || !appUrl || !appRole) throw new Error('Isolated paid-offer database proof configuration is required')
const owner = postgres(ownerUrl, { max: 1, onnotice: () => undefined })
const app = postgres(appUrl, { max: 1, onnotice: () => undefined })
const checks = new Set<string>()
const createdEnrollmentIds: number[] = []

const baseInput = parseNextPaidOfferOrder({
  idempotencyKey: '3f46aca2-4f9e-4c28-95b5-f8222cc03321',
  firstName: 'Paid', lastName: 'Proof', email: 'paid.proof@example.test', phone: '',
  privacyAccepted: true, marketingConsent: false,
  provider: 'stripe', paymentMethod: 'card_or_wallet', companyWebsite: '',
})
const create = (input = baseInput, shareSlug = 'shared-offer') => withNextPublicOfferWriteTransaction((tx) =>
  createNextPaidOfferOrder({
    tx, host: 'learn.tenant-a.example', shareSlug, input,
    privacyNoticeVersion: 'proof-v1', fingerprintPepper: 'p'.repeat(32),
  }))

try {
  const first = await create()
  assert.equal(first.amountCents, 14950)
  assert.equal(first.currency, 'EUR')
  assert.equal(first.offerTitle, 'Offer A')
  checks.add('price-currency-and-title-derived-in-database')

  const replay = await create()
  assert.equal(replay.orderId, first.orderId)
  assert.equal(replay.replayed, true)
  checks.add('order-idempotent-replay')

  await assert.rejects(create(parseNextPaidOfferOrder({
    ...baseInput, firstName: 'Changed',
  })), (error: unknown) => error instanceof NextPaidOfferOrderError
    && error.code === 'paid_order_idempotency_conflict')
  checks.add('idempotency-payload-conflict-rejected')

  await assert.rejects(create(parseNextPaidOfferOrder({
    ...baseInput, idempotencyKey: 'c50d0d28-c38b-48db-a10a-a23ffc04843b',
  })), (error: unknown) => error instanceof NextPaidOfferOrderError
    && error.code === 'paid_order_duplicate_contact')
  checks.add('duplicate-active-contact-rejected')

  await withNextPublicOfferWriteTransaction((tx) => attachNextPaidOfferCheckout({
    tx, orderId: first.orderId, providerOrderId: 'cs_test_paidproof1',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_paidproof1',
  }))
  const processing = await withNextPublicOfferWriteTransaction((tx) =>
    reconcileNextPaidOfferEvent(tx, {
      provider: 'stripe', providerEventId: 'evt_paidproof_processing',
      providerOrderId: 'cs_test_paidproof1', status: 'processing', amountCents: 14950,
      currency: 'EUR', paymentMethodType: 'sepa_debit',
    }))
  assert.equal(processing.status, 'processing')
  assert.equal(processing.enrollmentId, null)
  checks.add('processing-event-does-not-enroll')

  const succeeded = await withNextPublicOfferWriteTransaction((tx) =>
    reconcileNextPaidOfferEvent(tx, {
      provider: 'stripe', providerEventId: 'evt_paidproof_succeeded',
      providerOrderId: 'cs_test_paidproof1', status: 'succeeded', amountCents: 14950,
      currency: 'EUR', paymentMethodType: 'card',
    }))
  assert.equal(succeeded.status, 'succeeded')
  assert.ok(succeeded.enrollmentId)
  createdEnrollmentIds.push(succeeded.enrollmentId!)
  const succeededReplay = await withNextPublicOfferWriteTransaction((tx) =>
    reconcileNextPaidOfferEvent(tx, {
      provider: 'stripe', providerEventId: 'evt_paidproof_succeeded',
      providerOrderId: 'cs_test_paidproof1', status: 'succeeded', amountCents: 14950,
      currency: 'EUR', paymentMethodType: 'card',
    }))
  assert.equal(succeededReplay.replayed, true)
  assert.equal(succeededReplay.enrollmentId, succeeded.enrollmentId)
  checks.add('verified-success-enrolls-once')

  const mismatchInput = parseNextPaidOfferOrder({
    ...baseInput, idempotencyKey: 'a22c4c7c-f0c9-469b-b49c-6470d28ec02d',
    email: 'amount.mismatch@example.test',
  })
  const mismatch = await create(mismatchInput)
  await withNextPublicOfferWriteTransaction((tx) => attachNextPaidOfferCheckout({
    tx, orderId: mismatch.orderId, providerOrderId: 'cs_test_paidproof2',
    checkoutUrl: 'https://checkout.stripe.com/c/pay/cs_test_paidproof2',
  }))
  const reviewed = await withNextPublicOfferWriteTransaction((tx) =>
    reconcileNextPaidOfferEvent(tx, {
      provider: 'stripe', providerEventId: 'evt_paidproof_mismatch',
      providerOrderId: 'cs_test_paidproof2', status: 'succeeded', amountCents: 1,
      currency: 'EUR', paymentMethodType: 'card',
    }))
  assert.equal(reviewed.status, 'requires_review')
  assert.equal(reviewed.enrollmentId, null)
  const [capacity] = await owner<{ current_checkout_holds: number; current_enrollments: number }[]>`
    SELECT current_checkout_holds::integer, current_enrollments::integer
    FROM course_runs WHERE codigo = 'PAID-A'
  `
  assert.deepEqual(capacity, { current_checkout_holds: 0, current_enrollments: 1 })
  checks.add('amount-mismatch-releases-hold-without-enrollment')

  const paypalInput = parseNextPaidOfferOrder({
    ...baseInput, idempotencyKey: '2f956409-072a-4c1f-8511-ee99b31685b7',
    email: 'paypal.return@example.test', provider: 'paypal', paymentMethod: 'paypal',
  })
  const paypal = await create(paypalInput)
  await withNextPublicOfferWriteTransaction((tx) => attachNextPaidOfferCheckout({
    tx, orderId: paypal.orderId, providerOrderId: '5O190127TN364715T',
    checkoutUrl: 'https://www.sandbox.paypal.com/checkoutnow?token=5O190127TN364715T',
  }))
  const paypalReturn = await withNextPublicOfferWriteTransaction((tx) =>
    validateNextPayPalReturn(tx, paypal.orderId, '5O190127TN364715T'))
  assert.equal(paypalReturn.host, 'learn.tenant-a.example')
  await assert.rejects(withNextPublicOfferWriteTransaction((tx) =>
    validateNextPayPalReturn(tx, paypal.orderId, '9FAKE00000000000X')))
  checks.add('paypal-return-requires-canonical-order-token-pair')

  await owner`
    INSERT INTO course_runs (
      course_id, codigo, start_date, end_date, tenant_id, status,
      publication_access, share_slug, conversion_mode, payment_plan,
      offer_price_amount, capacity_policy, max_students, current_enrollments
    )
    SELECT course_id, 'PAID-LAST-SEAT-A', '2099-02-01', '2099-02-02', tenant_id,
      'published', 'public', 'paid-last-seat', 'paid_registration', 'full_amount',
      75, 'limited', 1, 0
    FROM course_runs WHERE codigo='PAID-A'
  `
  const concurrentInputs = [
    parseNextPaidOfferOrder({
      ...baseInput, idempotencyKey: 'f40b81ec-018b-4d84-b51a-df65f90a2b31',
      email: 'last.seat.one@example.test',
    }),
    parseNextPaidOfferOrder({
      ...baseInput, idempotencyKey: '0e505bf9-968e-401c-b27d-075f9f754928',
      email: 'last.seat.two@example.test',
    }),
  ]
  const concurrent = await Promise.allSettled(concurrentInputs.map((value) =>
    create(value, 'paid-last-seat')))
  assert.equal(concurrent.filter((result) => result.status === 'fulfilled').length, 1)
  assert.equal(concurrent.filter((result) => result.status === 'rejected'
    && result.reason instanceof NextPaidOfferOrderError
    && result.reason.code === 'paid_order_sold_out').length, 1)
  const [lastSeat] = await owner<{ current_checkout_holds: number }[]>`
    SELECT current_checkout_holds::integer FROM course_runs WHERE codigo='PAID-LAST-SEAT-A'
  `
  assert.equal(lastSeat?.current_checkout_holds, 1)
  checks.add('concurrent-final-seat-creates-one-hold-and-one-sold-out')

  await assert.rejects(app`INSERT INTO paid_offer_orders (id) VALUES (gen_random_uuid())`,
    (error: unknown) => typeof error === 'object' && error !== null
      && (error as { code?: unknown }).code === '42501')
  const appVisible = await app<{ count: number }[]>`SELECT count(*)::integer AS count FROM paid_offer_orders`
  assert.equal(appVisible[0]?.count, 0)
  checks.add('direct-dml-denied-and-unscoped-read-hidden')

  process.stdout.write(`${JSON.stringify({
    postgres: '16', paidOfferChecks: checks.size,
    canonicalAmountCents: 14950, processingDoesNotEnroll: true,
    successEnrollsOnce: true, mismatchRequiresReview: true, paypalReturnBounded: true,
  })}\n`)
} finally {
  await owner`DELETE FROM paid_offer_payment_events`
  await owner`DELETE FROM paid_offer_orders`
  if (createdEnrollmentIds.length > 0) {
    await owner.unsafe('DELETE FROM enrollments WHERE id = ANY($1::bigint[])', [createdEnrollmentIds])
  }
  await owner`DELETE FROM leads WHERE tenant_id = (SELECT id FROM tenants WHERE slug='tenant-a') AND email IN ('paid.proof@example.test','amount.mismatch@example.test','paypal.return@example.test')`
  await owner`UPDATE course_runs SET current_checkout_holds=0, current_enrollments=0 WHERE codigo='PAID-A'`
  await owner`DELETE FROM course_runs WHERE codigo='PAID-LAST-SEAT-A'`
  await Promise.allSettled([owner.end(), app.end()])
}
