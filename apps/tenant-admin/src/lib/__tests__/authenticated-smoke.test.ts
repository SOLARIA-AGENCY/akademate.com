import { describe, expect, it, vi } from 'vitest'

import {
  assertConvocatoriasResponse,
  assertLoginResponse,
  assertSessionResponse,
  runAuthenticatedSmoke,
} from '../../../scripts/authenticated-smoke.mjs'

const env = {
  SMOKE_AUTH_EMAIL: 'smoke.cep@akademate.internal',
  SMOKE_AUTH_PASSWORD: 'A-strong-technical-password-123!',
}

function response(body: unknown, status = 200) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  }
}

describe('authenticated deployment smoke', () => {
  it('accepts only authenticated and operational payloads', () => {
    expect(() => assertLoginResponse({ user: { id: 13 }, token: 'signed-token' })).not.toThrow()
    expect(() => assertSessionResponse({ authenticated: true, user: { id: 13 } })).not.toThrow()
    expect(() => assertConvocatoriasResponse({ success: true, data: [] })).not.toThrow()
  })

  it('rejects a warning response even when the endpoint returns HTTP 200', () => {
    expect(() => assertConvocatoriasResponse({
      success: true,
      data: [],
      warning: 'schema incomplete',
    })).toThrow('not operational')
  })

  it('uses the login token only as an httpOnly-equivalent request cookie', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response({ user: { id: 13 }, token: 'signed-token' }))
      .mockResolvedValueOnce(response({ authenticated: true, user: { id: 13 } }))
      .mockResolvedValueOnce(response({ success: true, data: [] }))

    await runAuthenticatedSmoke('https://cepformacion.akademate.com', { env, fetchImpl })

    expect(fetchImpl).toHaveBeenCalledTimes(3)
    expect(fetchImpl.mock.calls[1][1]).toMatchObject({ headers: { Cookie: 'payload-token=signed-token' } })
    expect(fetchImpl.mock.calls[2][1]).toMatchObject({ headers: { Cookie: 'payload-token=signed-token' } })
  })
})
