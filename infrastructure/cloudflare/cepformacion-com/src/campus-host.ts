import { stripCookieDomain } from './dashboard-proxy'

export const CAMPUS_HOST = 'campus.cepformacion.com'
export const LIVE_CAMPUS_ORIGIN = 'https://cepformacion-campus.akademate.com'

const REQUEST_KEEP = ['accept', 'accept-language', 'content-type', 'cookie']

export function isCampusHostname(hostname: string): boolean {
  return hostname.split(':')[0].toLowerCase() === CAMPUS_HOST
}

function rewriteCampusLocation(location: string, originBase: string): string {
  if (location.startsWith('/')) return location
  const origin = originBase.replace(/\/$/, '')
  if (location.startsWith(origin)) return `https://${CAMPUS_HOST}${location.slice(origin.length)}`
  return location
}

export async function proxyCampusHost(request: Request, originBase: string): Promise<Response> {
  const incoming = new URL(request.url)
  const origin = originBase.replace(/\/$/, '')
  const path = incoming.pathname === '/' ? '/login' : incoming.pathname
  const target = new URL(path + incoming.search, `${origin}/`)
  const headers = new Headers()
  for (const key of REQUEST_KEEP) {
    const value = request.headers.get(key)
    if (value) headers.set(key, value)
  }
  headers.set('x-forwarded-host', CAMPUS_HOST)
  headers.set('x-forwarded-proto', 'https')
  headers.set('x-cep-worker', '1')
  const method = request.method.toUpperCase()
  const response = await fetch(target.toString(), {
    method,
    headers,
    redirect: 'manual',
    body: method === 'GET' || method === 'HEAD' ? undefined : request.body,
  })
  const next = new Headers()
  response.headers.forEach((value, key) => {
    const name = key.toLowerCase()
    if (name === 'set-cookie' || name === 'location') return
    next.set(key, value)
  })
  const cookies =
    typeof response.headers.getSetCookie === 'function'
      ? response.headers.getSetCookie()
      : response.headers.get('set-cookie')
        ? [response.headers.get('set-cookie') as string]
        : []
  for (const cookie of cookies) {
    if (cookie) next.append('set-cookie', stripCookieDomain(cookie))
  }
  const location = response.headers.get('location')
  if (location) next.set('location', rewriteCampusLocation(location, origin))
  return new Response(response.body, { status: response.status, headers: next })
}
