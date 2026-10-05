// @vitest-environment node

import { beforeEach, describe, expect, it } from 'vitest'
import { SignJWT } from 'jose'
import {
  extractLegacyPayloadToken,
  signSessionV2,
  verifyPayloadToken,
  verifySessionV2,
  verifyAvailableSession,
  type VerifiedPrincipal,
} from '@/lib/server/session'

const encoder = new TextEncoder()
const NOW_SECONDS = 1_800_000_000

const principal: VerifiedPrincipal = {
  userId: 'user-7',
  tenantId: 'tenant-2',
  roles: ['admin'],
  sessionVersion: 1,
  sessionId: 'session-9',
  issuedAt: NOW_SECONDS,
  expiresAt: NOW_SECONDS + 60 * 60,
}

async function createPayloadToken(
  secret: string,
  overrides: Record<string, unknown> = {},
): Promise<string> {
  return new SignJWT({
    id: 'user-7',
    collection: 'users',
    tenant: 'tenant-2',
    role: 'admin',
    session_version: 1,
    ...overrides,
  })
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setJti('payload-session-1')
    .setIssuedAt(NOW_SECONDS)
    .setExpirationTime(NOW_SECONDS + 60 * 60)
    .sign(encoder.encode(secret))
}

describe('server session principal contract', () => {
  beforeEach(() => {
    process.env.SESSION_SIGNING_SECRET_CURRENT = 'current-session-secret-that-is-long-enough'
    process.env.SESSION_SIGNING_SECRET_PREVIOUS = 'previous-session-secret-that-is-long-enough'
    process.env.PAYLOAD_SECRET = 'payload-secret-that-is-long-enough'
  })

  it('round-trips the exact VerifiedPrincipal fields with the current secret', async () => {
    const token = await signSessionV2(principal, { now: NOW_SECONDS })
    const verified = await verifySessionV2(token, { now: NOW_SECONDS + 1 })

    expect(verified).toEqual(principal)
    expect(Object.keys(verified).sort()).toEqual([
      'expiresAt',
      'issuedAt',
      'roles',
      'sessionId',
      'sessionVersion',
      'tenantId',
      'userId',
    ])
  })

  it('accepts a v2 token signed with the previous rotation secret', async () => {
    process.env.SESSION_SIGNING_SECRET_CURRENT = process.env.SESSION_SIGNING_SECRET_PREVIOUS
    const token = await signSessionV2(principal, { now: NOW_SECONDS })
    process.env.SESSION_SIGNING_SECRET_CURRENT = 'current-session-secret-that-is-long-enough'

    await expect(verifySessionV2(token, { now: NOW_SECONDS + 1 })).resolves.toEqual(principal)
  })

  it('rejects expired v2 sessions', async () => {
    const token = await signSessionV2(principal, { now: NOW_SECONDS })

    await expect(verifySessionV2(token, { now: principal.expiresAt + 1 })).rejects.toThrow()
  })

  it('rejects v2 sessions whose signed lifetime exceeds 12 hours', async () => {
    const oversized = {
      ...principal,
      expiresAt: NOW_SECONDS + 12 * 60 * 60 + 1,
    }

    await expect(signSessionV2(oversized, { now: NOW_SECONDS })).rejects.toThrow(
      /12 hours/i,
    )
  })

  it('verifies a Payload token cryptographically before creating a principal', async () => {
    const token = await createPayloadToken(process.env.PAYLOAD_SECRET!)

    await expect(verifyPayloadToken(token, { now: NOW_SECONDS + 1 })).resolves.toEqual({
      userId: 'user-7',
      tenantId: 'tenant-2',
      roles: ['admin'],
      sessionVersion: 1,
      sessionId: 'payload-session-1',
      issuedAt: NOW_SECONDS,
      expiresAt: NOW_SECONDS + 60 * 60,
    })
  })

  it('uses the Payload sid as the verified principal sessionId', async () => {
    const token = await new SignJWT({
      id: 'user-7',
      collection: 'users',
      tenant: 'tenant-2',
      role: 'admin',
      session_version: 1,
      sid: 'payload-native-session',
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(NOW_SECONDS)
      .setExpirationTime(NOW_SECONDS + 60 * 60)
      .sign(encoder.encode(process.env.PAYLOAD_SECRET!))

    await expect(verifyPayloadToken(token, { now: NOW_SECONDS + 1 })).resolves.toMatchObject({
      sessionId: 'payload-native-session',
    })
  })

  it('rejects a forged Payload token even when its identity claims look valid', async () => {
    const forged = await createPayloadToken('attacker-controlled-secret')

    await expect(verifyPayloadToken(forged, { now: NOW_SECONDS + 1 })).rejects.toThrow()
  })

  it('rejects Payload token class confusion', async () => {
    const now = NOW_SECONDS
    const missingCollection = await new SignJWT({
      id: 'user-7', tenant: 'tenant-2', role: 'admin', session_version: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(encoder.encode(process.env.PAYLOAD_SECRET!))
    const wrongCollection = await createPayloadToken(process.env.PAYLOAD_SECRET!, {
      collection: 'api-keys',
    })
    const wrongType = await new SignJWT({
      id: 'user-7', collection: 'users', tenant: 'tenant-2', role: 'admin', session_version: 1,
    })
      .setProtectedHeader({ alg: 'HS256', typ: 'akademate_session_v2' })
      .setIssuedAt(now)
      .setExpirationTime(now + 3600)
      .sign(encoder.encode(process.env.PAYLOAD_SECRET!))

    await expect(verifyPayloadToken(missingCollection, { now: now + 1 })).rejects.toThrow()
    await expect(verifyPayloadToken(wrongCollection, { now: now + 1 })).rejects.toThrow()
    await expect(verifyPayloadToken(wrongType, { now: now + 1 })).rejects.toThrow()
  })

  it('rejects deleted, inactive, version-mismatched, role-changed and tenant-changed users', async () => {
    const token = await createPayloadToken(process.env.PAYLOAD_SECRET!)
    const base = { tenantId: 'tenant-2', roles: ['admin'], sessionVersion: 1, isActive: true }

    for (const resolved of [
      null,
      { ...base, isActive: false },
      { ...base, sessionVersion: 2 },
      { ...base, roles: ['gestor'] },
      { ...base, tenantId: 'tenant-9' },
    ]) {
      await expect(
        verifyPayloadToken(token, {
          now: NOW_SECONDS + 1,
          resolveIdentity: async () => resolved,
          requireResolvedIdentity: true,
        }),
      ).rejects.toThrow()
    }
  })

  it('revalidates v2 principals against current persisted identity', async () => {
    const token = await signSessionV2(principal, { now: NOW_SECONDS })

    await expect(
      verifyAvailableSession(
        { sessionV2: token },
        {
          now: NOW_SECONDS + 1,
          resolveIdentity: async () => ({
            tenantId: 'tenant-2', roles: ['admin'], sessionVersion: 2, isActive: true,
          }),
          requireResolvedIdentity: true,
        },
      ),
    ).resolves.toBeNull()
  })

  it('extracts only an embedded token from well-formed legacy JSON', () => {
    expect(extractLegacyPayloadToken(JSON.stringify({ token: 'payload.jwt.value' }))).toBe(
      'payload.jwt.value',
    )
    expect(extractLegacyPayloadToken('%7Bmalformed')).toBeNull()
    expect(extractLegacyPayloadToken(JSON.stringify({ user: principal }))).toBeNull()
  })

  it('preserves the exact impersonation substructure', async () => {
    const impersonated: VerifiedPrincipal = {
      ...principal,
      impersonation: {
        actorUserId: 'admin-1',
        reason: 'Investigate support case SUP-42',
      },
    }
    const token = await signSessionV2(impersonated, { now: NOW_SECONDS })

    await expect(verifySessionV2(token, { now: NOW_SECONDS + 1 })).resolves.toEqual(impersonated)
  })
})
