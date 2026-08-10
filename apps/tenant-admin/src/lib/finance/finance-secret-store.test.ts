import { randomBytes } from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  createInMemoryFinanceSecretStore,
  digestFinanceOAuthState,
} from './finance-secret-store.ts'

const key = randomBytes(32)
const base = {
  tenantId: 'tenant-a',
  connectionId: 'connection-a',
  provider: 'xero',
  purpose: 'refresh_token' as const,
  value: 'refresh-token-only-on-server',
}

describe('finance secret store', () => {
  it('encrypts and decrypts with tenant-bound authenticated data', async () => {
    const store = createInMemoryFinanceSecretStore({ currentKeyVersion: 1, keyring: new Map([[1, key]]) })
    const stored = await store.put(base)
    expect(stored.ciphertext).not.toContain(base.value)
    await expect(store.get({ ...base, ciphertext: stored.ciphertext, keyVersion: stored.keyVersion })).resolves.toBe(base.value)
  })

  it('rejects cross-tenant context, tampering, and unknown key versions', async () => {
    const store = createInMemoryFinanceSecretStore({ currentKeyVersion: 1, keyring: new Map([[1, key]]) })
    const stored = await store.put(base)

    await expect(store.get({ ...base, tenantId: 'tenant-b', ciphertext: stored.ciphertext, keyVersion: stored.keyVersion })).rejects.toThrow('finance_secret_decryption_failed')
    const [iv, tag, encrypted] = stored.ciphertext.split('.')
    const tampered = `${iv}.${tag}.${encrypted[0] === 'A' ? 'B' : 'A'}${encrypted.slice(1)}`
    await expect(store.get({ ...base, ciphertext: tampered, keyVersion: stored.keyVersion })).rejects.toThrow('finance_secret_decryption_failed')
    await expect(store.get({ ...base, ciphertext: stored.ciphertext, keyVersion: 2 })).rejects.toThrow('finance_secret_key_unavailable')
  })

  it('only exposes a digest for OAuth state persistence', () => {
    expect(digestFinanceOAuthState('state-value')).toMatch(/^[a-f0-9]{64}$/)
    expect(digestFinanceOAuthState('state-value')).not.toContain('state-value')
  })
})
