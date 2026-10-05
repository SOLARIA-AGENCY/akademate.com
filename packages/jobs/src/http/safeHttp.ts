import { lookup as nodeLookup } from 'node:dns/promises'
import { request as httpsRequest } from 'node:https'
import { isIP } from 'node:net'

export type SafeHttpErrorCode =
  | 'INVALID_URL'
  | 'HTTPS_REQUIRED'
  | 'DNS_ERROR'
  | 'BLOCKED_ADDRESS'
  | 'CROSS_ORIGIN_REDIRECT'
  | 'TOO_MANY_REDIRECTS'
  | 'TIMEOUT'
  | 'RESPONSE_TOO_LARGE'
  | 'NETWORK_ERROR'

export class SafeHttpError extends Error {
  constructor(
    public readonly code: SafeHttpErrorCode,
    message: string,
    options?: ErrorOptions
  ) {
    super(message, options)
    this.name = 'SafeHttpError'
  }
}

export interface SafeHttpAddress {
  address: string
  family: number
}

export type SafeHttpLookup = (hostname: string) => Promise<SafeHttpAddress[]>

export interface SafeHttpNetworkContext {
  approvedAddresses: string[]
  maxResponseBytes: number
}

export type SafeHttpFetch = (
  url: URL,
  init: RequestInit,
  network: SafeHttpNetworkContext
) => Promise<Response>

export interface SafeHttpRequestOptions extends RequestInit {
  maxRedirects?: number
  timeoutMs?: number
  maxResponseBytes?: number
}

export interface SafeHttpClient {
  request(url: string | URL, options?: SafeHttpRequestOptions): Promise<Response>
}

const defaults = {
  maxRedirects: 3,
  timeoutMs: 10_000,
  maxResponseBytes: 1_048_576,
} as const

const parseIpv4 = (address: string): number[] | null => {
  const parts = address.split('.')
  if (parts.length !== 4) return null
  const bytes = parts.map(Number)
  return bytes.every((part) => Number.isInteger(part) && part >= 0 && part <= 255) ? bytes : null
}

const isBlockedIpv4 = (address: string): boolean => {
  const bytes = parseIpv4(address)
  if (!bytes) return true
  const a = bytes[0]!
  const b = bytes[1]!

  return (
    a === 0 ||
    a === 10 ||
    a === 127 ||
    (a === 100 && b >= 64 && b <= 127) ||
    (a === 169 && b === 254) ||
    (a === 172 && b >= 16 && b <= 31) ||
    (a === 192 && b === 0) ||
    (a === 192 && b === 168) ||
    (a === 198 && (b === 18 || b === 19)) ||
    a >= 224
  )
}

const parseIpv6Bytes = (address: string): number[] | null => {
  let normalized = address.toLowerCase().split('%', 1)[0]!
  const dottedTail = normalized.match(/(\d+\.\d+\.\d+\.\d+)$/)?.[1]
  if (dottedTail) {
    const ipv4 = parseIpv4(dottedTail)
    if (!ipv4) return null
    const high = ((ipv4[0]! << 8) | ipv4[1]!).toString(16)
    const low = ((ipv4[2]! << 8) | ipv4[3]!).toString(16)
    normalized = `${normalized.slice(0, -dottedTail.length)}${high}:${low}`
  }

  const compression = normalized.indexOf('::')
  if (compression !== -1 && compression !== normalized.lastIndexOf('::')) return null
  const left = (compression === -1 ? normalized : normalized.slice(0, compression))
    .split(':')
    .filter(Boolean)
  const right = (compression === -1 ? '' : normalized.slice(compression + 2))
    .split(':')
    .filter(Boolean)
  const missing = 8 - left.length - right.length
  if ((compression === -1 && missing !== 0) || (compression !== -1 && missing < 1)) return null
  const groups = [...left, ...Array.from({ length: missing }, () => '0'), ...right]
  if (groups.length !== 8 || groups.some((group) => !/^[0-9a-f]{1,4}$/.test(group))) return null

  return groups.flatMap((group) => {
    const value = Number.parseInt(group, 16)
    return [value >> 8, value & 0xff]
  })
}

const isBlockedAddress = (address: string): boolean => {
  const family = isIP(address)
  if (family === 4) return isBlockedIpv4(address)
  if (family !== 6) return true

  const bytes = parseIpv6Bytes(address)
  if (!bytes) return true
  const isMapped = bytes.slice(0, 10).every((byte) => byte === 0) && bytes[10] === 0xff && bytes[11] === 0xff
  if (isMapped) return isBlockedIpv4(bytes.slice(12).join('.'))

  return (
    bytes.every((byte) => byte === 0) ||
    (bytes.slice(0, 15).every((byte) => byte === 0) && bytes[15] === 1) ||
    (bytes[0]! & 0xfe) === 0xfc ||
    (bytes[0] === 0xfe && (bytes[1]! & 0xc0) === 0x80) ||
    bytes[0] === 0xff
  )
}

const defaultLookup: SafeHttpLookup = async (hostname) => {
  const records = await nodeLookup(hostname, { all: true, verbatim: true })
  return records.map(({ address, family }) => ({ address, family }))
}

const defaultFetch: SafeHttpFetch = async (url, init, network) => {
  const addresses = [...network.approvedAddresses]
  let nextAddress = 0

  return await new Promise<Response>((resolve, reject) => {
    const request = httpsRequest(
      url,
      {
        method: init.method,
        headers: init.headers as Record<string, string> | undefined,
        signal: init.signal ?? undefined,
        lookup: (_hostname, options, callback) => {
          const address = addresses[nextAddress % addresses.length]!
          nextAddress += 1
          const family = isIP(address)
          if (options?.all) {
            callback(null, addresses.map((item) => ({ address: item, family: isIP(item) })))
            return
          }
          callback(null, address, family)
        },
      },
      (incoming) => {
        const chunks: Buffer[] = []
        let receivedBytes = 0
        incoming.on('data', (chunk: Buffer) => {
          receivedBytes += chunk.byteLength
          if (receivedBytes > network.maxResponseBytes) {
            incoming.destroy(
              new SafeHttpError('RESPONSE_TOO_LARGE', 'Outbound response exceeded size limit')
            )
            return
          }
          chunks.push(chunk)
        })
        incoming.on('error', reject)
        incoming.on('end', () => {
          const headers = new Headers()
          for (const [name, value] of Object.entries(incoming.headers)) {
            if (Array.isArray(value)) value.forEach((item) => headers.append(name, item))
            else if (value !== undefined) headers.set(name, value)
          }
          resolve(
            new Response(Buffer.concat(chunks), {
              status: incoming.statusCode ?? 500,
              statusText: incoming.statusMessage,
              headers,
            })
          )
        })
      }
    )
    request.on('error', reject)
    if (init.body !== undefined && init.body !== null) request.write(init.body)
    request.end()
  })
}

const parseUrl = (input: string | URL): URL => {
  try {
    return new URL(input)
  } catch (error) {
    throw new SafeHttpError('INVALID_URL', 'Outbound request URL is invalid', { cause: error })
  }
}

const waitForDeadline = async <T>(promise: Promise<T>, signal: AbortSignal): Promise<T> => {
  if (signal.aborted) throw signal.reason
  return await new Promise<T>((resolve, reject) => {
    const abort = () => reject(signal.reason)
    signal.addEventListener('abort', abort, { once: true })
    void promise.then(
      (value) => {
        signal.removeEventListener('abort', abort)
        resolve(value)
      },
      (error) => {
        signal.removeEventListener('abort', abort)
        reject(error)
      }
    )
  })
}

const resolveAndValidate = async (
  url: URL,
  lookup: SafeHttpLookup,
  signal: AbortSignal
): Promise<string[]> => {
  if (url.protocol !== 'https:') {
    throw new SafeHttpError('HTTPS_REQUIRED', 'Outbound requests require HTTPS')
  }
  if (url.username || url.password) {
    throw new SafeHttpError('INVALID_URL', 'Outbound request URL must not contain credentials')
  }

  let records: SafeHttpAddress[]
  try {
    records = await waitForDeadline(lookup(url.hostname), signal)
  } catch (error) {
    if (signal.aborted) throw signal.reason
    throw new SafeHttpError('DNS_ERROR', 'Outbound destination DNS resolution failed', { cause: error })
  }
  if (records.length === 0) {
    throw new SafeHttpError('DNS_ERROR', 'Outbound destination DNS returned no addresses')
  }
  if (records.some(({ address }) => isBlockedAddress(address))) {
    throw new SafeHttpError('BLOCKED_ADDRESS', 'Outbound destination resolved to a blocked address')
  }
  return [...new Set(records.map(({ address }) => address))]
}

export const createSafeHttpClient = (dependencies: {
  lookup?: SafeHttpLookup
  fetch?: SafeHttpFetch
} = {}): SafeHttpClient => {
  const lookup = dependencies.lookup ?? defaultLookup
  const fetchImpl = dependencies.fetch ?? defaultFetch

  return {
    async request(input, options = {}) {
      const controller = new AbortController()
      const timeoutMs = options.timeoutMs ?? defaults.timeoutMs
      const timeout = setTimeout(
        () => controller.abort(new SafeHttpError('TIMEOUT', 'Outbound request timed out')),
        timeoutMs
      )
      const maxRedirects = options.maxRedirects ?? defaults.maxRedirects
      const maxResponseBytes = options.maxResponseBytes ?? defaults.maxResponseBytes
      let url = parseUrl(input)
      let redirects = 0
      let method = options.method ?? 'GET'
      let body = options.body

      try {
        while (true) {
          const approvedAddresses = await resolveAndValidate(url, lookup, controller.signal)
          let response: Response
          try {
            response = await fetchImpl(
              url,
              { ...options, method, body, redirect: 'manual', signal: controller.signal },
              { approvedAddresses, maxResponseBytes }
            )
          } catch (error) {
            if (controller.signal.aborted) {
              throw new SafeHttpError('TIMEOUT', 'Outbound request timed out', { cause: error })
            }
            if (error instanceof SafeHttpError) throw error
            throw new SafeHttpError('NETWORK_ERROR', 'Outbound request failed', { cause: error })
          }

          if ([301, 302, 303, 307, 308].includes(response.status)) {
            const location = response.headers.get('location')
            if (!location) return response
            if (response.body) {
              await waitForDeadline(response.body.cancel(), controller.signal)
            }
            if (redirects >= maxRedirects) {
              throw new SafeHttpError('TOO_MANY_REDIRECTS', 'Outbound request exceeded redirect limit')
            }
            redirects += 1
            const nextUrl = parseUrl(new URL(location, url))
            if (nextUrl.origin !== url.origin) {
              throw new SafeHttpError(
                'CROSS_ORIGIN_REDIRECT',
                'Outbound request refused a cross-origin redirect'
              )
            }
            url = nextUrl
            if (response.status === 303 || ((response.status === 301 || response.status === 302) && method === 'POST')) {
              method = 'GET'
              body = undefined
            }
            continue
          }

          const declaredLength = Number(response.headers.get('content-length'))
          if (Number.isFinite(declaredLength) && declaredLength > maxResponseBytes) {
            throw new SafeHttpError('RESPONSE_TOO_LARGE', 'Outbound response exceeded size limit')
          }
          let bytes: Uint8Array
          try {
            bytes = new Uint8Array(await waitForDeadline(response.arrayBuffer(), controller.signal))
          } catch (error) {
            if (controller.signal.aborted) {
              throw new SafeHttpError('TIMEOUT', 'Outbound request timed out', { cause: error })
            }
            throw new SafeHttpError('NETWORK_ERROR', 'Outbound response could not be read', {
              cause: error,
            })
          }
          if (bytes.byteLength > maxResponseBytes) {
            throw new SafeHttpError('RESPONSE_TOO_LARGE', 'Outbound response exceeded size limit')
          }
          return new Response(Buffer.from(bytes), {
            status: response.status,
            statusText: response.statusText,
            headers: response.headers,
          })
        }
      } finally {
        clearTimeout(timeout)
      }
    },
  }
}

export const safeHttpClient = createSafeHttpClient()
