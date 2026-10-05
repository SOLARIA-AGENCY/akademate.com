import { DATA_ORIGIN, OVH_ORIGIN, rewritePublicText, shouldRewriteBody } from './proxy'

export const DASHBOARD_HOST = 'dashboard.cepformacion.com'
export const DASHBOARD_ORIGIN = `https://${DASHBOARD_HOST}`

const VISITOR_ROOTS = ['/blog', '/noticias', '/empleo', '/agencia-colocacion', '/faq', '/legal', '/contacto', '/quienes-somos']

export function isDashboardVisitorPath(pathname: string): boolean {
  if (pathname === '/' || pathname === '') return true
  if (pathname.startsWith('/p/')) return true
  return VISITOR_ROOTS.some((root) => pathname === root || pathname.startsWith(`${root}/`))
}

export function dashboardVisitorRedirect(request: Request): Response | null {
  const method = request.method.toUpperCase()
  if (method !== 'GET' && method !== 'HEAD') return null
  const url = new URL(request.url)
  if (!isDashboardVisitorPath(url.pathname)) return null
  return Response.redirect(`${DASHBOARD_ORIGIN}/dashboard`, 307)
}

const REQUEST_DROP = [
  'accept-encoding',
  'cf-connecting-ip',
  'cf-ew-via',
  'cf-ray',
  'cf-visitor',
  'cdn-loop',
  'connection',
  'content-length',
  'host',
  'keep-alive',
  'transfer-encoding',
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
  'transfer-encoding',
]

export function isDashboardHostname(hostname: string): boolean {
  return hostname.toLowerCase().replace(/:\d+$/, '') === DASHBOARD_HOST
}

export function rewriteDashboardLocation(location: string, originBase: string): string {
  if (!location || location.startsWith('/')) return location
  const origin = originBase.replace(/\/$/, '')
  return location
    .replaceAll(origin, DASHBOARD_ORIGIN)
    .replaceAll(OVH_ORIGIN, DASHBOARD_ORIGIN)
    .replaceAll(DATA_ORIGIN, DASHBOARD_ORIGIN)
    .replaceAll(origin.replace('https://', 'http://'), DASHBOARD_ORIGIN)
    .replaceAll(OVH_ORIGIN.replace('https://', 'http://'), DASHBOARD_ORIGIN)
    .replaceAll(DATA_ORIGIN.replace('https://', 'http://'), DASHBOARD_ORIGIN)
}

export function stripCookieDomain(setCookie: string): string {
  return setCookie.replace(/;\s*domain=[^;]*/gi, '')
}

function copyIncomingHeaders(request: Request): Headers {
  const headers = new Headers()
  request.headers.forEach((value, key) => {
    if (REQUEST_DROP.includes(key.toLowerCase())) return
    headers.set(key, value)
  })
  headers.set('x-forwarded-host', DASHBOARD_HOST)
  headers.set('x-forwarded-proto', 'https')
  return headers
}

function rewriteSetCookies(source: Headers, target: Headers): void {
  const cookies =
    typeof source.getSetCookie === 'function'
      ? source.getSetCookie()
      : source.get('set-cookie')
        ? [source.get('set-cookie') as string]
        : []
  for (const cookie of cookies) {
    if (cookie) target.append('set-cookie', stripCookieDomain(cookie))
  }
}

export async function proxyDashboard(request: Request, originBase: string): Promise<Response> {
  const incoming = new URL(request.url)
  const origin = originBase.replace(/\/$/, '')
  const target = new URL(incoming.pathname + incoming.search, `${origin}/`)
  const method = request.method.toUpperCase()
  const response = await fetch(target.toString(), {
    method,
    headers: copyIncomingHeaders(request),
    redirect: 'manual',
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
  })

  const headers = new Headers()
  response.headers.forEach((value, key) => {
    const name = key.toLowerCase()
    if (RESPONSE_DROP.includes(name) || name === 'set-cookie' || name === 'location') return
    headers.set(key, value)
  })
  rewriteSetCookies(response.headers, headers)
  const location = response.headers.get('location')
  if (location) headers.set('location', rewriteDashboardLocation(location, origin))
  headers.set('x-content-type-options', 'nosniff')
  headers.set('referrer-policy', 'strict-origin-when-cross-origin')

  const contentType = response.headers.get('content-type') || ''
  if (method !== 'HEAD' && shouldRewriteBody(contentType)) {
    const text = rewritePublicText(await response.text(), DASHBOARD_ORIGIN, [origin, DATA_ORIGIN, OVH_ORIGIN])
    headers.delete('content-encoding')
    headers.delete('content-length')
    return new Response(text, { status: response.status, headers })
  }

  return new Response(response.body, { status: response.status, headers })
}
