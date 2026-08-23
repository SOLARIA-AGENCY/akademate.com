export const supportedLocales = ['en', 'es'] as const

export type Locale = (typeof supportedLocales)[number]
export type LocaleSource = 'path' | 'cookie' | 'accept-language' | 'default'

/**
 * English remains the hreflang x-default and the unmatched-language fallback.
 * Spanish visitors (Accept-Language or stored preference) are sent to `/es…`.
 */
export const defaultLocale: Locale = 'en'
export const localePreferenceCookie = 'akademate_locale'

const localeSet = new Set<string>(supportedLocales)

export function isLocale(value: string | null | undefined): value is Locale {
  return typeof value === 'string' && localeSet.has(value.toLowerCase())
}

export function getLocaleFromPathname(pathname: string): Locale | undefined {
  const segment = pathname.split('/').find(Boolean)?.toLowerCase()
  return isLocale(segment) ? segment : undefined
}

export function stripLocalePrefix(pathname: string): { locale?: Locale; pathname: string } {
  const safePathname = toSafePathname(pathname)
  const segments = safePathname.split('/').filter(Boolean)
  const firstSegment = segments[0]?.toLowerCase()

  if (!isLocale(firstSegment)) return { pathname: safePathname }

  const remainingPathname = segments.slice(1).join('/')
  return {
    locale: firstSegment,
    pathname: remainingPathname ? `/${remainingPathname}` : '/',
  }
}

export function parseAcceptLanguage(header: string | null | undefined): Locale | undefined {
  if (!header) return undefined

  const candidates = header
    .split(',')
    .map((part, index) => {
      const [languageRange = '', ...parameters] = part.trim().toLowerCase().split(';')
      const qParameter = parameters.find((parameter) => parameter.trim().startsWith('q='))
      const quality = qParameter ? Number.parseFloat(qParameter.trim().slice(2)) : 1
      return { languageRange, quality: Number.isFinite(quality) ? quality : 0, index }
    })
    .filter((candidate) => candidate.quality > 0)
    .sort((left, right) => right.quality - left.quality || left.index - right.index)

  for (const candidate of candidates) {
    const primaryLanguage = candidate.languageRange.split('-')[0]
    if (isLocale(primaryLanguage)) return primaryLanguage
  }

  return undefined
}

export function resolveLocale({
  pathname,
  cookieLocale,
  acceptLanguage,
}: {
  pathname?: string
  cookieLocale?: string | null
  acceptLanguage?: string | null
}): { locale: Locale; source: LocaleSource } {
  const pathLocale = pathname ? getLocaleFromPathname(pathname) : undefined
  if (pathLocale) return { locale: pathLocale, source: 'path' }

  if (isLocale(cookieLocale))
    return { locale: cookieLocale.toLowerCase() as Locale, source: 'cookie' }

  const acceptedLocale = parseAcceptLanguage(acceptLanguage)
  if (acceptedLocale) return { locale: acceptedLocale, source: 'accept-language' }

  return { locale: defaultLocale, source: 'default' }
}

export function shouldHandleLocalePath(pathname: string): boolean {
  const normalizedPathname = toSafePathname(pathname)

  if (normalizedPathname === '/api' || normalizedPathname.startsWith('/api/')) return false
  if (normalizedPathname === '/_next' || normalizedPathname.startsWith('/_next/')) return false
  if (
    normalizedPathname === '/favicon.ico' ||
    normalizedPathname === '/robots.txt' ||
    normalizedPathname === '/sitemap.xml'
  )
    return false

  const lastSegment = normalizedPathname.split('/').pop() ?? ''
  return !/\.[a-z0-9]+$/i.test(lastSegment)
}

export function getLocaleRoutingPlan({
  pathname,
  cookieLocale,
  acceptLanguage,
}: {
  pathname: string
  cookieLocale?: string | null
  acceptLanguage?: string | null
}):
  | { type: 'next'; locale: Locale; persistLocale: false }
  | { type: 'rewrite'; locale: Locale; pathname: string; persistLocale: true }
  | { type: 'redirect'; locale: Locale; pathname: string; persistLocale: true } {
  const normalizedPathname = toSafePathname(pathname)
  const resolved = resolveLocale({ pathname: normalizedPathname, cookieLocale, acceptLanguage })

  if (!shouldHandleLocalePath(normalizedPathname)) {
    return { type: 'next', locale: resolved.locale, persistLocale: false }
  }

  const withoutLocale = stripLocalePrefix(normalizedPathname)
  if (!withoutLocale.locale) {
    return {
      type: 'redirect',
      locale: resolved.locale,
      pathname: localizePathname(normalizedPathname, resolved.locale),
      persistLocale: true,
    }
  }

  return {
    type: 'rewrite',
    locale: withoutLocale.locale,
    pathname: withoutLocale.pathname,
    persistLocale: true,
  }
}

export function localizePathname(pathname: string, locale: Locale): string {
  const normalizedPathname = toSafePathname(pathname)
  const { pathname: withoutLocale } = stripLocalePrefix(normalizedPathname)
  return withoutLocale === '/' ? `/${locale}` : `/${locale}${withoutLocale}`
}

export function localizedHref(href: string, locale: Locale): string {
  if (href.startsWith('//') || href.includes('\\')) return `/${locale}`
  if (!href.startsWith('/')) return href

  const suffixStart = href.search(/[?#]/)
  const pathname = suffixStart === -1 ? href : href.slice(0, suffixStart)
  const suffix = suffixStart === -1 ? '' : href.slice(suffixStart)
  return `${localizePathname(pathname, locale)}${suffix}`
}

export function localizedAlternates(
  pathname: string,
  locale: Locale = defaultLocale
): {
  canonical: string
  languages: Record<'en' | 'es' | 'x-default', string>
} {
  const { pathname: canonicalPathname } = stripLocalePrefix(pathname)
  return {
    canonical: localizePathname(canonicalPathname, locale),
    languages: {
      en: localizePathname(canonicalPathname, 'en'),
      es: localizePathname(canonicalPathname, 'es'),
      'x-default': localizePathname(canonicalPathname, defaultLocale),
    },
  }
}

function toSafePathname(pathname: string): string {
  if (!pathname.startsWith('/') || pathname.startsWith('//') || pathname.includes('\\')) return '/'

  const segments = pathname.split('/').filter(Boolean)
  return segments.length ? `/${segments.join('/')}` : '/'
}
