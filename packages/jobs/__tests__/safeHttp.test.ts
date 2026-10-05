import { describe, expect, it, vi } from 'vitest'

import {
  SafeHttpError,
  createSafeHttpClient,
  type SafeHttpFetch,
  type SafeHttpLookup,
} from '../src/http/safeHttp'

const publicIp = '93.184.216.34'

const response = (body = 'ok', init: ResponseInit = {}) => new Response(body, init)

const clientWith = (
  addresses: Record<string, string[]>,
  fetchImpl: SafeHttpFetch = async () => response()
) => {
  const lookup: SafeHttpLookup = async (hostname) => {
    const result = addresses[hostname]
    if (!result) throw new Error('ENOTFOUND')
    return result.map((address) => ({ address, family: address.includes(':') ? 6 : 4 }))
  }
  return createSafeHttpClient({ lookup, fetch: fetchImpl })
}

describe('safe HTTP SSRF policy', () => {
  it.each([
    ['localhost', '127.0.0.1'],
    ['RFC1918', '10.0.0.1'],
    ['RFC1918 172', '172.16.0.1'],
    ['RFC1918 192', '192.168.1.1'],
    ['link-local IPv4', '169.254.10.20'],
    ['cloud metadata', '169.254.169.254'],
    ['IPv6 loopback', '::1'],
    ['IPv6 unique-local', 'fc00::1'],
    ['IPv6 link-local', 'fe80::1'],
    ['IPv6 multicast', 'ff02::1'],
    ['IPv4-mapped private IPv6', '::ffff:10.0.0.1'],
    ['IPv4-mapped loopback hex IPv6', '::ffff:7f00:1'],
    ['IPv4-mapped private hex IPv6', '::ffff:a00:1'],
  ])('blocks %s address %s', async (_label, address) => {
    const fetch = vi.fn<SafeHttpFetch>()
    const client = clientWith({ 'blocked.example': [address] }, fetch)

    await expect(client.request('https://blocked.example/hook')).rejects.toMatchObject({
      code: 'BLOCKED_ADDRESS',
    })
    expect(fetch).not.toHaveBeenCalled()
  })

  it('requires HTTPS and fails closed on DNS errors', async () => {
    const client = clientWith({})

    await expect(client.request('http://example.com')).rejects.toMatchObject({ code: 'HTTPS_REQUIRED' })
    await expect(client.request('https://missing.example')).rejects.toMatchObject({ code: 'DNS_ERROR' })
  })

  it('blocks redirects to internal destinations before the next request', async () => {
    const fetch = vi.fn<SafeHttpFetch>(async (url) =>
      url.hostname === 'public.example'
        ? response(null, { status: 302, headers: { location: 'https://internal.example/admin' } })
        : response()
    )
    const client = clientWith(
      { 'public.example': [publicIp], 'internal.example': ['127.0.0.1'] },
      fetch
    )

    await expect(client.request('https://public.example/hook')).rejects.toMatchObject({
      code: 'CROSS_ORIGIN_REDIRECT',
    })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('rejects a 307 cross-origin redirect without replaying headers or body', async () => {
    const fetch = vi.fn<SafeHttpFetch>(async () =>
      response(null, { status: 307, headers: { location: 'https://other.example/collect' } })
    )
    const client = clientWith(
      { 'public.example': [publicIp], 'other.example': ['93.184.216.35'] },
      fetch
    )

    await expect(
      client.request('https://public.example/hook', {
        method: 'POST',
        headers: { Authorization: 'Bearer secret' },
        body: 'sensitive-body',
      })
    ).rejects.toMatchObject({ code: 'CROSS_ORIGIN_REDIRECT' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('revalidates DNS and pins approved addresses on every redirect hop', async () => {
    let resolutions = 0
    const lookup: SafeHttpLookup = async () => {
      resolutions += 1
      return [{ address: resolutions === 1 ? publicIp : '127.0.0.1', family: 4 }]
    }
    const fetch = vi.fn<SafeHttpFetch>(async (_url, _init, network) => {
      expect(network.approvedAddresses).toEqual([publicIp])
      return response(null, { status: 307, headers: { location: 'https://same.example/next' } })
    })
    const client = createSafeHttpClient({ lookup, fetch })

    await expect(client.request('https://same.example/start')).rejects.toMatchObject({
      code: 'BLOCKED_ADDRESS',
    })
    expect(resolutions).toBe(2)
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('enforces redirect, timeout, and response-size limits', async () => {
    const redirecting = clientWith({ 'loop.example': [publicIp] }, async () =>
      response(null, { status: 302, headers: { location: '/again' } })
    )
    await expect(redirecting.request('https://loop.example', { maxRedirects: 1 })).rejects.toMatchObject({
      code: 'TOO_MANY_REDIRECTS',
    })

    const hanging = clientWith({ 'slow.example': [publicIp] }, async (_url, init) => {
      await new Promise<void>((_resolve, reject) => {
        init.signal?.addEventListener('abort', () => reject(init.signal?.reason), { once: true })
      })
      return response()
    })
    await expect(hanging.request('https://slow.example', { timeoutMs: 5 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    })

    const oversized = clientWith({ 'large.example': [publicIp] }, async () => response('123456'))
    await expect(oversized.request('https://large.example', { maxResponseBytes: 5 })).rejects.toMatchObject({
      code: 'RESPONSE_TOO_LARGE',
    })
  })

  it('applies the deadline while DNS resolution is pending and ignores a late answer', async () => {
    let releaseLookup: ((records: Array<{ address: string; family: number }>) => void) | undefined
    const fetch = vi.fn<SafeHttpFetch>()
    const client = createSafeHttpClient({
      lookup: () =>
        new Promise((resolve) => {
          releaseLookup = resolve
        }),
      fetch,
    })

    await expect(client.request('https://slow-dns.example', { timeoutMs: 5 })).rejects.toMatchObject({
      code: 'TIMEOUT',
    })
    releaseLookup?.([{ address: publicIp, family: 4 }])
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fetch).not.toHaveBeenCalled()
  })

  it('rejects a mixed DNS answer when any resolved IP is unsafe', async () => {
    const client = clientWith({ 'mixed.example': [publicIp, '169.254.169.254'] })
    await expect(client.request('https://mixed.example')).rejects.toBeInstanceOf(SafeHttpError)
  })
})
