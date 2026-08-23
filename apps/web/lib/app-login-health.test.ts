import { describe, expect, it } from 'vitest'
import { isAppLoginAvailableStatus, probeAppLoginHealth } from './app-login-health'

describe('academy workspace login health', () => {
  it('treats 2xx, 3xx, 401 and 403 as reachable sign-in', () => {
    expect(isAppLoginAvailableStatus(200)).toBe(true)
    expect(isAppLoginAvailableStatus(302)).toBe(true)
    expect(isAppLoginAvailableStatus(401)).toBe(true)
    expect(isAppLoginAvailableStatus(503)).toBe(false)
    expect(isAppLoginAvailableStatus(500)).toBe(false)
  })

  it('does not follow a 503 as a successful login destination', async () => {
    const fetchImpl = (async () => new Response('unavailable', { status: 503 })) as typeof fetch
    await expect(
      probeAppLoginHealth('https://app.akademate.com/auth/login', fetchImpl)
    ).resolves.toEqual({
      available: false,
      status: 503,
    })
  })

  it('fails closed when the probe cannot complete', async () => {
    const fetchImpl = (async () => {
      throw new Error('network')
    }) as typeof fetch
    await expect(
      probeAppLoginHealth('https://app.akademate.com/auth/login', fetchImpl)
    ).resolves.toEqual({
      available: false,
      status: null,
    })
  })
})
