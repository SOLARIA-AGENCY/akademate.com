import { resolveNextPublicSubmissionConfig } from '../offers/public-offer-submission-config.ts'

type PaidOfferEnvironment = Record<string, string | undefined>

export type NextPaidOfferConfig = {
  privacyNoticeUrl: string
  privacyNoticeVersion: string
  fingerprintPepper: string
  availableMethods: Array<'card_or_wallet' | 'sepa_debit' | 'paypal'>
  stripe: null | { secretKey: string; webhookSecret: string }
  paypal: null | {
    environment: 'sandbox' | 'live'
    apiBaseUrl: 'https://api-m.sandbox.paypal.com' | 'https://api-m.paypal.com'
    clientId: string
    clientSecret: string
    webhookId: string
  }
}

function validSecret(value: string | undefined, pattern: RegExp): value is string {
  return typeof value === 'string' && pattern.test(value)
}

export function resolveNextPaidOfferConfig(
  environment: PaidOfferEnvironment,
): NextPaidOfferConfig | null {
  if (environment.AKADEMATE_NEXT_PAID_OFFERS_ENABLED !== 'true') return null
  const privacy = resolveNextPublicSubmissionConfig(environment)
  if (!privacy) return null

  const stripeKey = environment.AKADEMATE_NEXT_STRIPE_SECRET_KEY
  const stripeWebhook = environment.AKADEMATE_NEXT_STRIPE_WEBHOOK_SECRET
  const hasAnyStripe = Boolean(stripeKey || stripeWebhook)
  const stripe = validSecret(stripeKey, /^sk_(?:test|live)_[A-Za-z0-9]{16,}$/)
    && validSecret(stripeWebhook, /^whsec_[A-Za-z0-9]{24,}$/)
    ? { secretKey: stripeKey, webhookSecret: stripeWebhook }
    : null
  if (hasAnyStripe && !stripe) return null

  const paypalEnvironment = environment.AKADEMATE_NEXT_PAYPAL_ENVIRONMENT
  const paypalClientId = environment.AKADEMATE_NEXT_PAYPAL_CLIENT_ID
  const paypalClientSecret = environment.AKADEMATE_NEXT_PAYPAL_CLIENT_SECRET
  const paypalWebhookId = environment.AKADEMATE_NEXT_PAYPAL_WEBHOOK_ID
  const hasAnyPayPal = Boolean(
    paypalEnvironment || paypalClientId || paypalClientSecret || paypalWebhookId,
  )
  const paypalValid = (paypalEnvironment === 'sandbox' || paypalEnvironment === 'live')
    && validSecret(paypalClientId, /^[A-Za-z0-9_-]{12,}$/)
    && validSecret(paypalClientSecret, /^[A-Za-z0-9_-]{12,}$/)
    && validSecret(paypalWebhookId, /^[A-Za-z0-9_-]{8,}$/)
  const paypal = paypalValid ? {
    environment: paypalEnvironment === 'sandbox' ? 'sandbox' as const : 'live' as const,
    apiBaseUrl: paypalEnvironment === 'sandbox'
      ? 'https://api-m.sandbox.paypal.com' as const
      : 'https://api-m.paypal.com' as const,
    clientId: paypalClientId,
    clientSecret: paypalClientSecret,
    webhookId: paypalWebhookId,
  } : null
  if (hasAnyPayPal && !paypal) return null
  if (!stripe && !paypal) return null

  return {
    ...privacy,
    availableMethods: [
      ...(stripe ? ['card_or_wallet', 'sepa_debit'] as const : []),
      ...(paypal ? ['paypal'] as const : []),
    ],
    stripe,
    paypal,
  }
}

export function currentNextPaidOfferConfig(): NextPaidOfferConfig | null {
  return resolveNextPaidOfferConfig(process.env)
}
