import { NextRequest, NextResponse } from 'next/server'
import { getLocaleRoutingPlan, localePreferenceCookie } from '@/lib/i18n/routing'

/**
 * Next.js 15 entry point. Routing decisions are framework-neutral in
 * `lib/i18n/routing.ts`, so this handler can be re-exported as `proxy` when
 * this application adopts the Next.js 16 filename convention.
 */
export function middleware(request: NextRequest) {
  const plan = getLocaleRoutingPlan({
    pathname: request.nextUrl.pathname,
    cookieLocale: request.cookies.get(localePreferenceCookie)?.value,
    acceptLanguage: request.headers.get('accept-language'),
  })
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-akademate-locale', plan.locale)

  const response = plan.type === 'rewrite'
    ? (() => {
        const destination = request.nextUrl.clone()
        destination.pathname = plan.pathname
        return NextResponse.rewrite(destination, { request: { headers: requestHeaders } })
      })()
    : NextResponse.next({ request: { headers: requestHeaders } })

  if (plan.persistLocale) {
    response.cookies.set(localePreferenceCookie, plan.locale, {
      httpOnly: true,
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    })
  }

  return response
}

export const config = {
  matcher: '/:path*',
}
