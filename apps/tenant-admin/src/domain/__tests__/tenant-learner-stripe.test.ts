import { afterEach, describe, expect, it } from 'vitest'
import {
  assertNotPlatformBillingKey,
  buildStoredConnection,
  decryptSecret,
  encryptSecret,
  isLearnerStripeConnected,
  toPublicConnection,
  validateLearnerStripeInput,
} from '../tenant-learner-stripe'

describe('tenant learner stripe', () => {
  const originalSecret = process.env.STRIPE_SECRET_KEY

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.STRIPE_SECRET_KEY
    else process.env.STRIPE_SECRET_KEY = originalSecret
  })

  it('encrypts and decrypts restricted keys without exposing plaintext', () => {
    const cipher = encryptSecret('rk_test_workshop_secret')
    expect(cipher.startsWith('enc:v1:')).toBe(true)
    expect(cipher).not.toContain('rk_test_workshop_secret')
    expect(decryptSecret(cipher)).toBe('rk_test_workshop_secret')
  })

  it('rejects platform billing keys and incomplete settings payloads', () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_platform_billing'
    expect(() => assertNotPlatformBillingKey('sk_test_platform_billing')).toThrow(/platform billing/)
    expect(validateLearnerStripeInput({ publishableKey: 'pk_live_abc', secretKey: 'not-a-key' })).toContain(
      'secretKey must be a restricted rk_ or secret sk_ key',
    )
  })

  it('never returns ciphertext on the public settings view', () => {
    const stored = buildStoredConnection(7, {
      publishableKey: 'pk_test_abc123',
      secretKey: 'rk_test_secret9999',
      webhookSecret: 'whsec_abc',
    })
    const publicView = toPublicConnection(stored)

    expect(publicView.connected).toBe(true)
    expect(publicView.secretLast4).toBe('9999')
    expect(publicView.hasWebhookSecret).toBe(true)
    expect(publicView.webhookPath).toBe('/api/webhooks/stripe-offers/7')
    expect(JSON.stringify(publicView)).not.toContain('rk_test_secret9999')
    expect(JSON.stringify(publicView)).not.toContain(stored.secretCiphertext)
    expect(isLearnerStripeConnected(publicView)).toBe(true)
  })
})
