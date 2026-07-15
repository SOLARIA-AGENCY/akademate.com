import crypto from 'node:crypto'
import { describe, expect, it } from 'vitest'

import {
  generatePayloadPasswordHash,
  getSmokeUserConfig,
  validateExistingSmokeUser,
} from '../../../scripts/ensure-production-smoke-user.mjs'

describe('production smoke user provisioning', () => {
  const env = {
    DATABASE_URL: 'postgresql://akademate:secret@postgres:5432/akademate',
    SMOKE_AUTH_EMAIL: 'smoke.cep@akademate.internal',
    SMOKE_AUTH_PASSWORD: 'A-strong-technical-password-123!',
  }

  it('uses tenant CEP and a non-privileged role by default', () => {
    expect(getSmokeUserConfig(env)).toMatchObject({
      email: 'smoke.cep@akademate.internal',
      tenantId: 1,
    })
  })

  it('rejects credentials that are too short to use in production', () => {
    expect(() => getSmokeUserConfig({ ...env, SMOKE_AUTH_PASSWORD: 'too-short' }))
      .toThrow('at least 24 characters')
  })

  it('uses the same PBKDF2 contract as Payload local authentication', () => {
    const { hash, salt } = generatePayloadPasswordHash('A-strong-technical-password-123!', () => Buffer.alloc(32, 7))
    const expected = crypto.pbkdf2Sync('A-strong-technical-password-123!', salt, 25000, 512, 'sha256').toString('hex')

    expect(salt).toHaveLength(64)
    expect(hash).toBe(expected)
  })

  it('fails closed when a matching email is not the intended active CEP lectura account', () => {
    const expected = getSmokeUserConfig(env)

    expect(() => validateExistingSmokeUser(
      { tenant_id: 2, role: 'lectura', is_active: true },
      expected,
    )).toThrow('different tenant')
    expect(() => validateExistingSmokeUser(
      { tenant_id: 1, role: 'gestor', is_active: true },
      expected,
    )).toThrow('lectura role')
    expect(() => validateExistingSmokeUser(
      { tenant_id: 1, role: 'lectura', is_active: false },
      expected,
    )).toThrow('inactive')
  })
})
