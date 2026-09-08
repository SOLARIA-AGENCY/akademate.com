import { headers } from 'next/headers'
import type { Locale } from '@/lib/i18n/routing'

export async function getRequestLocale(): Promise<Locale> {
  const requestHeaders = await headers()
  const localeFromMiddleware = requestHeaders.get('x-akademate-locale')
  if (localeFromMiddleware === 'en' || localeFromMiddleware === 'es') return localeFromMiddleware
  return 'en'
}

export async function getRequestPathname(): Promise<string> {
  const requestHeaders = await headers()
  return requestHeaders.get('x-akademate-pathname') ?? '/'
}
