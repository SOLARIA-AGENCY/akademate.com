export const HETZNER_ORIGIN = 'https://cepformacion.akademate.com'
export const OVH_ORIGIN = 'https://cepformacion-app.akademate.com'
export const LEAD_ORIGIN = 'https://origin.cepformacion.com'
export const DATA_ORIGIN = HETZNER_ORIGIN
export const BRAND_ORIGIN = HETZNER_ORIGIN
export const PUBLIC_APP_ORIGIN = HETZNER_ORIGIN
export const DASHBOARD_UPSTREAM = OVH_ORIGIN
export const CANONICAL_ORIGIN = 'https://cepformacion.com'
export const PREVIEW_PREFIX = '/preview'
export const TENANT_FORWARD_HOST = 'cepformacion.akademate.com'
export const EDGE_FETCH_HEADER = 'x-cep-edge-fetch'

const REWRITE_ORIGINS = [HETZNER_ORIGIN, OVH_ORIGIN, 'https://origin.cepformacion.com']

const BLOCKED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/auth',
  '/acceso',
  '/api/v1',
  '/api/users',
  '/api/internal',
  '/api/auth',
  '/api/public',
  '/campus-virtual',
]

const REQUEST_PASS = [
  'accept',
  'accept-language',
  'content-type',
  'if-none-match',
  'if-modified-since',
  'next-action',
  'next-router-prefetch',
  'next-router-segment-prefetch',
  'next-router-state-tree',
  'next-url',
  'purpose',
  'rsc',
  'sec-purpose',
]

const RESPONSE_DROP = [
  'alt-svc',
  'cf-cache-status',
  'cf-ray',
  'content-encoding',
  'content-length',
  'nel',
  'report-to',
  'server',
  'set-cookie',
  'transfer-encoding',
  'x-powered-by',
  'x-cep-data-origin',
  'x-cep-html-origin',
]

const STATIC_FALLBACK_PREFIXES = ['/logos/', '/website/', '/stock/']

export type ProxyPublicAppOptions = {
  origin: string
  edgeToken?: string
  forwardedHost?: string
  cacheTtl?: number
}

export function previewSitePath(pathname: string): string | null {
  if (pathname === PREVIEW_PREFIX || pathname === `${PREVIEW_PREFIX}/`) return '/'
  if (!pathname.startsWith(`${PREVIEW_PREFIX}/`)) return null
  return pathname.slice(PREVIEW_PREFIX.length) || '/'
}

export function isBlockedSitePath(pathname: string): boolean {
  const path = pathname.toLowerCase()
  return BLOCKED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

export function isWorkerOwnedPath(pathname: string): boolean {
  return (
    pathname === '/health' ||
    pathname === '/robots.txt' ||
    pathname === '/sitemap.xml' ||
    pathname === '/llms.txt' ||
    pathname === '/.well-known/security.txt' ||
    pathname === '/campus' ||
    pathname === '/campus/' ||
    pathname.startsWith('/website/cep/partners/') ||
    pathname.startsWith('/website/cep/certifications/') ||
    pathname.startsWith('/website/cep/empleo/') ||
    pathname.startsWith('/website/cep/categories/') ||
    pathname === '/internal/purge' ||
    pathname.startsWith('/internal/')
  )
}

export function isOriginFormPath(pathname: string): boolean {
  return pathname === '/api/leads' || pathname === '/api/track'
}

export function rewritePublicText(body: string, canonicalOrigin: string, origins: string[] = REWRITE_ORIGINS): string {
  let result = body
  for (const origin of origins) {
    result = result.replaceAll(origin, canonicalOrigin)
    result = result.replaceAll(origin.replace('https://', 'http://'), canonicalOrigin)
  }
  return result
}

export function rewriteLocation(location: string, canonicalOrigin: string, origins: string[] = REWRITE_ORIGINS): string {
  if (location.startsWith('/')) return location
  return rewritePublicText(location, canonicalOrigin, origins)
}

export function rewriteForwardedNextUrl(value: string, canonicalOrigin: string, dataOrigin = DATA_ORIGIN): string {
  return value.replaceAll(canonicalOrigin, dataOrigin).replaceAll('https://www.cepformacion.com', dataOrigin)
}

export function shouldRewriteBody(contentType: string): boolean {
  const type = contentType.toLowerCase()
  return (
    type.includes('text/html') ||
    type.includes('text/x-component') ||
    type.includes('text/x-ref') ||
    type.includes('application/json') ||
    type.includes('text/plain')
  )
}

export function canonicalOriginForHost(hostname: string, requestOrigin: string): string {
  const host = hostname.toLowerCase()
  if (host === 'cepformacion.com' || host === 'www.cepformacion.com') return CANONICAL_ORIGIN
  return requestOrigin.replace(/\/$/, '')
}

export function isCapturedDashboardResponse(status: number, location: string | null): boolean {
  if (!location) return false
  const path = location.toLowerCase()
  return (
    status >= 300 &&
    status < 400 &&
    (path.includes('/dashboard') || path.includes('/auth/login') || /\/login(?:\/|$|\?)/.test(path))
  )
}

export function shouldFallbackToBrandAsset(pathname: string, status: number): boolean {
  if (status !== 404) return false
  if (pathname === '/favicon.ico' || pathname === '/favicon.png') return true
  return STATIC_FALLBACK_PREFIXES.some((prefix) => pathname === prefix.slice(0, -1) || pathname.startsWith(prefix))
}

export function copyRequestHeaders(
  request: Request,
  canonicalOrigin: string,
  dataOrigin = DATA_ORIGIN,
  extra?: Record<string, string>,
): Headers {
  const headers = new Headers()
  for (const key of REQUEST_PASS) {
    const value = request.headers.get(key)
    if (!value) continue
    headers.set(key, key === 'next-url' ? rewriteForwardedNextUrl(value, canonicalOrigin, dataOrigin) : value)
  }
  headers.set('user-agent', request.headers.get('user-agent') || 'cepformacion-com-worker')
  headers.set('x-cep-worker', '1')
  if (extra) {
    for (const [key, value] of Object.entries(extra)) {
      if (value) headers.set(key, value)
    }
  }
  return headers
}

export function copyResponseHeaders(response: Headers, extra?: HeadersInit): Headers {
  const headers = new Headers(extra)
  response.forEach((value, key) => {
    if (RESPONSE_DROP.includes(key.toLowerCase())) return
    headers.set(key, value)
  })
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')
  return headers
}

async function asProxiedResponse(
  response: Response,
  canonicalOrigin: string,
  method: string,
): Promise<Response> {
  const location = response.headers.get('location')
  const out = copyResponseHeaders(response.headers)
  if (location) out.set('location', rewriteLocation(location, canonicalOrigin))

  const contentType = response.headers.get('content-type') || ''
  if (method !== 'HEAD' && shouldRewriteBody(contentType)) {
    const text = rewritePublicText(await response.text(), canonicalOrigin)
    out.delete('content-encoding')
    out.delete('content-length')
    return new Response(text, { status: response.status, headers: out })
  }
  return new Response(response.body, { status: response.status, headers: out })
}

export async function proxyPublicApp(
  request: Request,
  pathname: string,
  canonicalOrigin: string,
  options: ProxyPublicAppOptions,
): Promise<Response> {
  const incoming = new URL(request.url)
  const origin = options.origin.replace(/\/$/, '')
  const target = new URL(pathname + incoming.search, `${origin}/`)
  const extra: Record<string, string> = {
    'x-forwarded-host': options.forwardedHost || TENANT_FORWARD_HOST,
  }
  if (options.edgeToken) extra[EDGE_FETCH_HEADER] = options.edgeToken
  const headers = copyRequestHeaders(request, canonicalOrigin, origin, extra)
  const method = request.method.toUpperCase()
  const response = await fetch(target.toString(), {
    method,
    headers,
    redirect: 'manual',
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
    cf: options.cacheTtl ? { cacheEverything: true, cacheTtl: options.cacheTtl } : undefined,
  })

  if (isCapturedDashboardResponse(response.status, response.headers.get('location'))) {
    throw new Error('origin captured dashboard')
  }

  if (shouldFallbackToBrandAsset(pathname, response.status)) {
    const fallback = await fetch(`${BRAND_ORIGIN}${pathname}${incoming.search}`, {
      method: 'GET',
      headers: { accept: request.headers.get('accept') || '*/*', 'x-cep-worker': '1' },
      redirect: 'manual',
    })
    if (fallback.ok) return asProxiedResponse(fallback, canonicalOrigin, method)
  }

  return asProxiedResponse(response, canonicalOrigin, method)
}
