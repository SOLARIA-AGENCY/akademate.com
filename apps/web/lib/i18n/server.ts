import { cookies, headers } from 'next/headers'
import { localePreferenceCookie, resolveLocale, type Locale } from '@/lib/i18n/routing'

export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers()
  const localeFromMiddleware = requestHeaders.get('x-akademate-locale')

  if (localeFromMiddleware === 'en' || localeFromMiddleware === 'es') return localeFromMiddleware

  const cookieStore = await cookies()
  return resolveLocale({
    cookieLocale: cookieStore.get(localePreferenceCookie)?.value,
    acceptLanguage: requestHeaders.get('accept-language'),
  }).locale
}
