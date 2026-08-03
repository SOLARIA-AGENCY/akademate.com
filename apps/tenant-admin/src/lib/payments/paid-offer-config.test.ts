import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveNextPaidOfferConfig } from './paid-offer-config.ts'

const base = {
  AKADEMATE_NEXT_PAID_OFFERS_ENABLED: 'true',
  AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED: 'true',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: 'https://akademate.com/legal/privacy',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION: '2026-08-v1',
  AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: 'p'.repeat(32),
}

test('is default-off and exposes only fully configured providers', () => {
  assert.equal(resolveNextPaidOfferConfig({}), null)
  assert.deepEqual(resolveNextPaidOfferConfig({
    ...base,
    AKADEMATE_NEXT_STRIPE_SECRET_KEY: 'sk_test_12345678901234567890',
    AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET: `whsec_${'s'.repeat(32)}`,
  })?.availableMethods, ['card_or_wallet', 'sepa_debit'])
  assert.deepEqual(resolveNextPaidOfferConfig({
    ...base,
    AKADEMATE_NEXT_PAYPAL_ENVIRONMENT: 'sandbox',
    AKADEMATE_NEXT_PAYPAL_CLIENT_ID: 'client-id-long-enough',
    AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET: 'client-secret-long-enough',
    AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID: '8PT597110X687430L',
  })?.availableMethods, ['paypal'])
})

test('fails closed for partial secrets, invalid privacy custody or unknown PayPal environments', () => {
  for (const environment of [
    { ...base, AKADEMATE_NEXT_STRIPE_SECRET_KEY: 'sk_test_partial' },
    { ...base, AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET: `whsec_${'s'.repeat(32)}` },
    {
      ...base,
      AKADEMATE_NEXT_PAYPAL_ENVIRONMENT: 'production',
      AKADEMATE_NEXT_PAYPAL_CLIENT_ID: 'client-id-long-enough',
      AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET: 'client-secret-long-enough',
      AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID: '8PT597110X687430L',
    },
    {
      ...base,
      AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: 'short',
      AKADEMATE_NEXT_STRIPE_SECRET_KEY: 'sk_test_12345678901234567890',
      AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET: `whsec_${'s'.repeat(32)}`,
    },
  ]) assert.equal(resolveNextPaidOfferConfig(environment), null)
})
