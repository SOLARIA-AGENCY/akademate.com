import { describe, expect, it } from 'vitest'
import { CAMPUS_HOST, isCampusHostname, LIVE_CAMPUS_ORIGIN, proxyCampusHost } from './campus-host'

describe('campus preview host', () => {
  it('matches only campus.cepformacion.com', () => {
    expect(isCampusHostname('campus.cepformacion.com')).toBe(true)
    expect(isCampusHostname('CAMPUS.cepformacion.com:443')).toBe(true)
    expect(isCampusHostname('cepformacion.com')).toBe(false)
    expect(isCampusHostname('dashboard.cepformacion.com')).toBe(false)
    expect(isCampusHostname('cepformacion-campus.akademate.com')).toBe(false)
  })

  it('reads the live campus login and keeps the cookie on the cepformacion host', async () => {
    const original = globalThis.fetch
    globalThis.fetch = (async (input) => {
      const url = String(input instanceof Request ? input.url : input)
      expect(url.startsWith(`${LIVE_CAMPUS_ORIGIN}/login`)).toBe(true)
      return new Response('campus', {
        status: 200,
        headers: {
          'content-type': 'text/html',
          location: `${LIVE_CAMPUS_ORIGIN}/login`,
          'set-cookie': 'campus=1; Path=/; Domain=.akademate.com; HttpOnly',
        },
      })
    }) as typeof fetch
    try {
      const response = await proxyCampusHost(new Request(`https://${CAMPUS_HOST}/`), LIVE_CAMPUS_ORIGIN)
      expect(response.status).toBe(200)
      expect(response.headers.get('location')).toBe(`https://${CAMPUS_HOST}/login`)
      expect(response.headers.get('set-cookie')).toBe('campus=1; Path=/; HttpOnly')
    } finally {
      globalThis.fetch = original
    }
  })
})
