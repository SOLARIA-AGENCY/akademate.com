import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto'

export type FinanceSecretPurpose = 'api_key' | 'oauth_state' | 'oauth_verifier' | 'refresh_token' | 'webhook_secret'

export type FinanceSecretStore = {
  put(input: {
    tenantId: string
    connectionId: string
    provider: string
    purpose: FinanceSecretPurpose
    value: string
  }): Promise<{ keyVersion: number; ciphertext: string }>
  get(input: {
    tenantId: string
    connectionId: string
    provider: string
    purpose: FinanceSecretPurpose
    ciphertext: string
    keyVersion: number
  }): Promise<string>
}

type SecretStoreOptions = {
  currentKeyVersion: number
  keyring: ReadonlyMap<number, Buffer>
}

function aadFor(input: {
  tenantId: string
  connectionId: string
  provider: string
  purpose: FinanceSecretPurpose
  keyVersion: number
}): Buffer {
  return Buffer.from([
    input.tenantId,
    input.connectionId,
    input.provider,
    input.purpose,
    `v${input.keyVersion}`,
  ].join(':'), 'utf8')
}

function keyFor(keyring: ReadonlyMap<number, Buffer>, keyVersion: number): Buffer {
  const key = keyring.get(keyVersion)
  if (!key || key.length !== 32) throw new Error('finance_secret_key_unavailable')
  return key
}

export function createInMemoryFinanceSecretStore(options: SecretStoreOptions): FinanceSecretStore {
  const currentKey = keyFor(options.keyring, options.currentKeyVersion)

  return {
    async put(input) {
      const iv = randomBytes(12)
      const aad = aadFor({ ...input, keyVersion: options.currentKeyVersion })
      const cipher = createCipheriv('aes-256-gcm', currentKey, iv)
      cipher.setAAD(aad)
      const encrypted = Buffer.concat([cipher.update(input.value, 'utf8'), cipher.final()])
      const tag = cipher.getAuthTag()
      return {
        keyVersion: options.currentKeyVersion,
        ciphertext: [iv, tag, encrypted].map((part) => part.toString('base64url')).join('.'),
      }
    },
    async get(input) {
      const key = keyFor(options.keyring, input.keyVersion)
      const [ivEncoded, tagEncoded, encryptedEncoded] = input.ciphertext.split('.')
      if (!ivEncoded || !tagEncoded || !encryptedEncoded) throw new Error('finance_secret_ciphertext_invalid')
      const iv = Buffer.from(ivEncoded, 'base64url')
      const tag = Buffer.from(tagEncoded, 'base64url')
      const encrypted = Buffer.from(encryptedEncoded, 'base64url')
      if (iv.length !== 12 || tag.length !== 16) throw new Error('finance_secret_ciphertext_invalid')

      try {
        const decipher = createDecipheriv('aes-256-gcm', key, iv)
        decipher.setAAD(aadFor(input))
        decipher.setAuthTag(tag)
        return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
      } catch {
        throw new Error('finance_secret_decryption_failed')
      }
    },
  }
}

export function digestFinanceOAuthState(state: string): string {
  return createHash('sha256').update(state, 'utf8').digest('hex')
}
