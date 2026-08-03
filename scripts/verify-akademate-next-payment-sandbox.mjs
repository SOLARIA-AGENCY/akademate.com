import { resolveNextPaidOfferConfig } from '../apps/tenant-admin/src/lib/payments/paid-offer-config.ts'

const config = resolveNextPaidOfferConfig(process.env)
if (!config) throw new Error('paid_offer_sandbox_config_incomplete')
if (config.stripe && !config.stripe.secretKey.startsWith('sk_test_')) {
  throw new Error('paid_offer_sandbox_rejects_live_stripe')
}
if (config.paypal && config.paypal.environment !== 'sandbox') {
  throw new Error('paid_offer_sandbox_rejects_live_paypal')
}

const providers = [
  ...(config.stripe ? ['stripe'] : []),
  ...(config.paypal ? ['paypal'] : []),
]
process.stdout.write(`${JSON.stringify({
  readyForSandboxNetworkChecks: true,
  providers,
  methods: config.availableMethods,
  privacyNoticeHost: new URL(config.privacyNoticeUrl).hostname,
  secretValues: 'redacted',
})}\n`)
