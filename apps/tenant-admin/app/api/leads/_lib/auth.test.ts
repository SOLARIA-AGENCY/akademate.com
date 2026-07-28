import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { jwtVerifyMock } = vi.hoisted(() => ({ jwtVerifyMock: vi.fn() }))

vi.mock('jose', () => ({ jwtVerify: jwtVerifyMock }))

import { getAuthenticatedUserContext } from './auth'

describe('getAuthenticatedUserContext', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    jwtVerifyMock.mockResolvedValue({ payload: { id: 4, collection: 'users' } })
  })

  it('falls back to signed JWT verification when Payload auth cannot load the user', async () => {
    const previousSecret = process.env.PAYLOAD_SECRET
    process.env.PAYLOAD_SECRET = 'test-secret'
    const payload = {
      auth: vi.fn().mockResolvedValue(null),
      db: { drizzle: { execute: vi.fn().mockResolvedValue({ rows: [{ tenant_id: 1 }] }) } },
      findByID: vi.fn().mockResolvedValue({ id: 4, tenant: 1, role: 'gestor' }),
    }

    try {
      const context = await getAuthenticatedUserContext(
        new NextRequest('http://localhost/api/cursos', {
          headers: { cookie: 'payload-token=signed-token' },
        }),
        payload,
      )

      expect(context).toEqual({ userId: 4, tenantId: 1, role: 'gestor' })
      expect(jwtVerifyMock).toHaveBeenCalledOnce()
    } finally {
      if (previousSecret === undefined) delete process.env.PAYLOAD_SECRET
      else process.env.PAYLOAD_SECRET = previousSecret
    }
  })
})
