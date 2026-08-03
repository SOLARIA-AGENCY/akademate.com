import Stripe from 'stripe'

import type { NextPaidOfferConfig } from './paid-offer-config.ts'
import {
  createPayPalCheckoutAdapter,
  createStripeCheckoutAdapter,
  NextPaymentAdapterError,
  type PaymentCheckoutAdapter,
} from './payment-checkout-adapter.ts'

type Fetch = typeof fetch

export function createPayPalApiClient(
  config: NonNullable<NextPaidOfferConfig['paypal']>,
  request: Fetch = fetch,
) {
  return {
    async request(path: string, init: RequestInit) {
      if (!path.startsWith('/') || path.startsWith('//')) {
        throw new NextPaymentAdapterError('paypal_path_invalid')
      }
      const tokenResponse = await request(`${config.apiBaseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${config.clientId}:${config.clientSecret}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
        signal: AbortSignal.timeout(10_000),
      })
      if (!tokenResponse.ok) throw new NextPaymentAdapterError('paypal_auth_failed')
      const token = await tokenResponse.json() as { access_token?: unknown }
      if (typeof token.access_token !== 'string' || token.access_token.length < 10) {
        throw new NextPaymentAdapterError('paypal_auth_failed')
      }
      const headers = new Headers(init.headers)
      headers.set('Authorization', `Bearer ${token.access_token}`)
      const response = await request(`${config.apiBaseUrl}${path}`, {
        ...init,
        headers,
        signal: AbortSignal.timeout(15_000),
      })
      if (!response.ok) throw new NextPaymentAdapterError('paypal_request_failed')
      return response.json()
    },
  }
}

export function createPaymentCheckoutAdapter(
  config: NextPaidOfferConfig,
  provider: 'stripe' | 'paypal',
): PaymentCheckoutAdapter {
  if (provider === 'stripe') {
    if (!config.stripe) throw new NextPaymentAdapterError('provider_not_configured')
    const stripe = new Stripe(config.stripe.secretKey, {
      maxNetworkRetries: 2,
      timeout: 15_000,
    })
    return createStripeCheckoutAdapter({
      checkoutSessions: {
        create: (params, options) => stripe.checkout.sessions.create(
          params as Parameters<typeof stripe.checkout.sessions.create>[0],
          options,
        ),
      },
    })
  }
  if (!config.paypal) throw new NextPaymentAdapterError('provider_not_configured')
  return createPayPalCheckoutAdapter(createPayPalApiClient(config.paypal))
}
