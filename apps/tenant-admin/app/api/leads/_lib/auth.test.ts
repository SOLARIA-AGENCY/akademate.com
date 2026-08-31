import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { jwtVerifyMock } = vi.hoisted(() => ({
  jwtVerifyMock: vi.fn(),
}))

vi.mock('jose', () => ({
  jwtVerify: jwtVerifyMock,
}))

import { getAuthenticatedUserContext, isSuperadmin } from './auth'

function requestWithToken(token = 'live-cookie'): NextRequest {
  return new NextRequest('http://localhost/api/cursos', {
    headers: { cookie: `payload-token=${token}` },
  })
}

describe('getAuthenticatedUserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.PAYLOAD_SECRET = 'test-secret'
  })

  it('tries original request headers with payload.auth before reconstructing cookies', async () => {
    const payload = {
      auth: vi.fn(async () => ({
        user: { id: 3, role: 'superadmin', tenant: null },
      })),
      findByID: vi.fn(),
      db: { drizzle: { execute: vi.fn() } },
    }

    await getAuthenticatedUserContext(requestWithToken('live-cookie'), payload)

    expect(payload.auth).toHaveBeenCalled()
    const firstCall = payload.auth.mock.calls[0]?.[0] as { headers?: Headers }
    expect(firstCall.headers?.get('cookie')).toContain('payload-token=live-cookie')
  })

  it('returns Payload superadmin with null tenantId without forcing JWT', async () => {
    const payload = {
      auth: vi.fn(async () => ({
        user: { id: 3, role: 'superadmin', tenant: null },
      })),
      findByID: vi.fn(),
      db: { drizzle: { execute: vi.fn() } },
    }

    const ctx = await getAuthenticatedUserContext(requestWithToken(), payload)

    expect(ctx).toEqual({ userId: 3, tenantId: null, role: 'superadmin' })
    expect(isSuperadmin(ctx)).toBe(true)
    expect(jwtVerifyMock).not.toHaveBeenCalled()
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('falls through to JWT when Payload auth fails to hydrate', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { id: 4 } })
    const payload = {
      auth: vi.fn(async () => {
        throw new Error('column operating_profile_plan_tier does not exist')
      }),
      findByID: vi.fn(async () => {
        throw new Error('column operating_profile_plan_tier does not exist')
      }),
      db: {
        drizzle: {
          execute: vi.fn(async () => [{ tenant_id: 1, role: 'admin' }]),
        },
      },
    }

    const ctx = await getAuthenticatedUserContext(requestWithToken(), payload)

    expect(ctx).toEqual({ userId: 4, tenantId: 1, role: 'admin' })
    expect(payload.findByID).not.toHaveBeenCalled()
  })

  it('uses JWT when a non-superadmin Payload session has no tenant', async () => {
    jwtVerifyMock.mockResolvedValue({ payload: { id: 9 } })
    const payload = {
      auth: vi.fn(async () => ({
        user: { id: 9, role: 'asesor', tenant: null },
      })),
      findByID: vi.fn(async () => ({ id: 9, role: 'asesor', tenant: 1 })),
      db: {
        drizzle: {
          execute: vi.fn(async () => []),
        },
      },
    }

    const ctx = await getAuthenticatedUserContext(requestWithToken(), payload)

    expect(ctx).toEqual({ userId: 9, tenantId: 1, role: 'asesor' })
    expect(jwtVerifyMock).toHaveBeenCalled()
    expect(payload.findByID).toHaveBeenCalled()
  })
})
