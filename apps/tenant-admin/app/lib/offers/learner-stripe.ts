import Stripe from 'stripe'
import { assertNotPlatformBillingKey } from '@/src/domain/tenant-learner-stripe'

const STRIPE_API_VERSION = '2025-12-15.clover' as const

export function createLearnerStripeClient(secretKey: string): Stripe {
  assertNotPlatformBillingKey(secretKey)
  return new Stripe(secretKey, {
    apiVersion: STRIPE_API_VERSION,
    typescript: true,
    appInfo: {
      name: 'Akademate Learner Checkout',
      version: '1.0.0',
    },
  })
}

export function constructLearnerWebhookEvent(
  payload: string,
  signature: string,
  webhookSecret: string,
): Stripe.Event {
  return Stripe.webhooks.constructEvent(payload, signature, webhookSecret)
}
