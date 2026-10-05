import { resolveSharedCookieDomain } from '@/app/api/_lib/cookie-domain'
import { LEGACY_SESSION_COOKIES, SESSION_V2_COOKIE } from './session'

export const AUTH_COOKIE_NAMES = [
  'payload-token', SESSION_V2_COOKIE, ...LEGACY_SESSION_COOKIES,
] as const

type CookieStore = {
  delete(...args: [name: string] | [options: { name: string; path?: string; domain?: string }]): unknown
}

function requestHost(request?: Request): string | null {
  if (!request) return null
  if (process.env.TRUST_PROXY_HEADERS === 'true') {
    const forwarded = request.headers.get('x-forwarded-host')
    if (forwarded) return forwarded
  }
  return request.headers.get('host') || new URL(request.url).host
}

export function resolveAuthCookieDomain(request?: Request): string | undefined {
  return resolveSharedCookieDomain(requestHost(request))
}

export function resolveAuthCookieOptions(request: Request, maxAge: number) {
  const domain = resolveAuthCookieDomain(request)
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge,
    ...(domain ? { domain } : {}),
  } as const
}

export function clearCookieVariants(
  store: CookieStore,
  names: readonly string[],
  request?: Request,
): void {
  const domain = resolveAuthCookieDomain(request)
  for (const name of names) {
    store.delete(name)
    if (domain) store.delete({ name, path: '/', domain })
  }
}
