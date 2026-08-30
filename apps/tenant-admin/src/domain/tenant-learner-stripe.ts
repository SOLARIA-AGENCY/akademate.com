import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'node:crypto'

export const LEARNER_STRIPE_STATUSES = ['disconnected', 'connected'] as const
export type LearnerStripeStatus = (typeof LEARNER_STRIPE_STATUSES)[number]

export type LearnerStripeConnectionInput = {
  publishableKey?: string
  secretKey?: string
  webhookSecret?: string
  connectAccountId?: string
}

export type LearnerStripeStoredConnection = {
  tenantId: number
  status: LearnerStripeStatus
  publishableKey: string
  secretCiphertext: string
  webhookSecretCiphertext: string
  secretLast4: string
  connectAccountId: string
  livemode: boolean
}

export type LearnerStripePublicConnection = {
  status: LearnerStripeStatus
  connected: boolean
  publishableKey: string
  secretLast4: string
  hasWebhookSecret: boolean
  connectAccountId: string
  livemode: boolean
  webhookPath: string
}

const ENC_PREFIX = 'enc:v1:'

function getEncryptionKey(): Buffer {
  const raw =
    process.env.TENANT_PAYMENTS_ENCRYPTION_KEY ||
    process.env.PAYLOAD_SECRET ||
    'dev-only-tenant-payments-key'
  return createHash('sha256').update(raw).digest()
}

export function encryptSecret(plain: string): string {
  if (!plain) return ''
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getEncryptionKey(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${ENC_PREFIX}${Buffer.concat([iv, tag, encrypted]).toString('base64url')}`
}

export function decryptSecret(ciphertext: string): string {
  if (!ciphertext) return ''
  if (!ciphertext.startsWith(ENC_PREFIX)) {
    throw new Error('Unsupported secret encoding')
  }
  const raw = Buffer.from(ciphertext.slice(ENC_PREFIX.length), 'base64url')
  const iv = raw.subarray(0, 12)
  const tag = raw.subarray(12, 28)
  const encrypted = raw.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getEncryptionKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function maskKey(value: string): string {
  const trimmed = value.trim()
  if (trimmed.length < 8) return ''
  return trimmed.slice(-4)
}

export function isPublishableKey(value: string): boolean {
  return /^pk_(test|live)_/.test(value.trim())
}

export function isLearnerSecretKey(value: string): boolean {
  return /^(rk_|sk_(test|live)_)/.test(value.trim())
}

export function isWebhookSecret(value: string): boolean {
  return /^whsec_/.test(value.trim())
}

export function isConnectAccountId(value: string): boolean {
  return /^acct_/.test(value.trim())
}

export function assertNotPlatformBillingKey(secretKey: string): void {
  const platform = process.env.STRIPE_SECRET_KEY
  if (platform && secretKey && secretKey === platform) {
    throw new Error('Learner checkout cannot use the platform billing Stripe key')
  }
}

export function validateLearnerStripeInput(input: LearnerStripeConnectionInput): string[] {
  const errors: string[] = []
  const publishableKey = input.publishableKey?.trim() ?? ''
  const secretKey = input.secretKey?.trim() ?? ''
  const webhookSecret = input.webhookSecret?.trim() ?? ''
  const connectAccountId = input.connectAccountId?.trim() ?? ''

  if (!isPublishableKey(publishableKey)) {
    errors.push('publishableKey must start with pk_test_ or pk_live_')
  }
  if (!isLearnerSecretKey(secretKey)) {
    errors.push('secretKey must be a restricted rk_ or secret sk_ key')
  }
  if (webhookSecret && !isWebhookSecret(webhookSecret)) {
    errors.push('webhookSecret must start with whsec_')
  }
  if (connectAccountId && !isConnectAccountId(connectAccountId)) {
    errors.push('connectAccountId must start with acct_')
  }
  return errors
}

export function buildStoredConnection(
  tenantId: number,
  input: LearnerStripeConnectionInput,
): LearnerStripeStoredConnection {
  const publishableKey = input.publishableKey?.trim() ?? ''
  const secretKey = input.secretKey?.trim() ?? ''
  const webhookSecret = input.webhookSecret?.trim() ?? ''
  const connectAccountId = input.connectAccountId?.trim() ?? ''
  assertNotPlatformBillingKey(secretKey)

  return {
    tenantId,
    status: 'connected',
    publishableKey,
    secretCiphertext: encryptSecret(secretKey),
    webhookSecretCiphertext: webhookSecret ? encryptSecret(webhookSecret) : '',
    secretLast4: maskKey(secretKey),
    connectAccountId,
    livemode: publishableKey.startsWith('pk_live_') || secretKey.includes('_live_'),
  }
}

export function toPublicConnection(
  stored: LearnerStripeStoredConnection | null,
): LearnerStripePublicConnection {
  if (!stored || stored.status !== 'connected') {
    return {
      status: 'disconnected',
      connected: false,
      publishableKey: '',
      secretLast4: '',
      hasWebhookSecret: false,
      connectAccountId: '',
      livemode: false,
      webhookPath: stored?.tenantId ? `/api/webhooks/stripe-offers/${stored.tenantId}` : '',
    }
  }

  return {
    status: 'connected',
    connected: true,
    publishableKey: stored.publishableKey,
    secretLast4: stored.secretLast4,
    hasWebhookSecret: Boolean(stored.webhookSecretCiphertext),
    connectAccountId: stored.connectAccountId,
    livemode: stored.livemode,
    webhookPath: `/api/webhooks/stripe-offers/${stored.tenantId}`,
  }
}

export function isLearnerStripeConnected(
  stored: LearnerStripeStoredConnection | LearnerStripePublicConnection | null,
): boolean {
  return stored?.status === 'connected'
}

export function resolveLearnerSecret(stored: LearnerStripeStoredConnection): string {
  const secret = decryptSecret(stored.secretCiphertext)
  assertNotPlatformBillingKey(secret)
  return secret
}

export function resolveLearnerWebhookSecret(stored: LearnerStripeStoredConnection): string {
  if (!stored.webhookSecretCiphertext) return ''
  return decryptSecret(stored.webhookSecretCiphertext)
}
