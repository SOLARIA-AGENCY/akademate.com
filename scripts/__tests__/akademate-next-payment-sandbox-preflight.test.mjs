import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import test from 'node:test'

const script = 'scripts/verify-akademate-next-payment-sandbox.mjs'
const base = {
  AKADEMATE_NEXT_PAID_OFFERS_ENABLED: 'true',
  AKADEMATE_NEXT_PUBLIC_SUBMISSIONS_ENABLED: 'true',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_URL: 'https://akademate.example/legal/privacy',
  AKADEMATE_NEXT_PUBLIC_PRIVACY_NOTICE_VERSION: 'sandbox-v1',
  AKADEMATE_NEXT_PUBLIC_SUBMISSION_PEPPER: 'p'.repeat(32),
}

function run(overrides) {
  return spawnSync(process.execPath, ['--experimental-strip-types', script], {
    encoding: 'utf8',
    env: { PATH: process.env.PATH, ...base, ...overrides },
  })
}

test('reports only redacted Stripe sandbox readiness', () => {
  const secretKey = `sk_test_${'a'.repeat(24)}`
  const webhookSecret = `whsec_${'b'.repeat(32)}`
  const result = run({
    AKADEMATE_NEXT_STRIPE_SECRET_KEY: secretKey,
    AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET: webhookSecret,
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout), {
    readyForSandboxNetworkChecks: true,
    providers: ['stripe'],
    methods: ['card_or_wallet', 'sepa_debit'],
    privacyNoticeHost: 'akademate.example',
    secretValues: 'redacted',
  })
  assert.equal(`${result.stdout}${result.stderr}`.includes(secretKey), false)
  assert.equal(`${result.stdout}${result.stderr}`.includes(webhookSecret), false)
})

test('accepts PayPal sandbox without exposing client credentials', () => {
  const clientSecret = 'paypal-client-secret-sandbox'
  const result = run({
    AKADEMATE_NEXT_PAYPAL_ENVIRONMENT: 'sandbox',
    AKADEMATE_NEXT_PAYPAL_CLIENT_ID: 'paypal-client-id-sandbox',
    AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET: clientSecret,
    AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID: 'paypal-webhook-sandbox',
  })
  assert.equal(result.status, 0, result.stderr)
  assert.deepEqual(JSON.parse(result.stdout).providers, ['paypal'])
  assert.equal(`${result.stdout}${result.stderr}`.includes(clientSecret), false)
})

test('fails closed for incomplete, live Stripe or live PayPal configuration', () => {
  for (const environment of [
    { AKADEMATE_NEXT_STRIPE_SECRET_KEY: `sk_test_${'a'.repeat(24)}` },
    {
      AKADEMATE_NEXT_STRIPE_SECRET_KEY: `sk_live_${'a'.repeat(24)}`,
      AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET: `whsec_${'b'.repeat(32)}`,
    },
    {
      AKADEMATE_NEXT_PAYPAL_ENVIRONMENT: 'live',
      AKADEMATE_NEXT_PAYPAL_CLIENT_ID: 'paypal-client-id-live',
      AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET: 'paypal-client-secret-live',
      AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID: 'paypal-webhook-live',
    },
  ]) {
    const result = run(environment)
    assert.notEqual(result.status, 0)
    assert.equal(result.stdout, '')
  }
})
