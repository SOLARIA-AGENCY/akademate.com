import { describe, expect, it } from 'vitest'
import {
  getLocaleRoutingPlan,
  localizedAlternates,
  localizedHref,
  localizePathname,
  parseAcceptLanguage,
  resolveLocale,
  shouldHandleLocalePath,
  stripLocalePrefix,
} from '@/lib/i18n/routing'

describe('public locale routing', () => {
  it('normalizes locale-prefixed paths without producing duplicate prefixes', () => {
    expect(stripLocalePrefix('/es')).toEqual({ locale: 'es', pathname: '/' })
    expect(stripLocalePrefix('/en/features')).toEqual({ locale: 'en', pathname: '/features' })
    expect(localizePathname('/es/features', 'en')).toBe('/en/features')
    expect(localizedHref('/en/features?source=nav#overview', 'es')).toBe(
      '/es/features?source=nav#overview'
    )
    expect(localizedAlternates('/es/pricing', 'es')).toEqual({
      canonical: '/es/pricing',
      languages: { en: '/en/pricing', es: '/es/pricing', 'x-default': '/en/pricing' },
    })
  })

  it('gives an explicit path precedence, then a stored preference, then the browser header', () => {
    expect(
      resolveLocale({
        pathname: '/en/pricing',
        cookieLocale: 'es',
        acceptLanguage: 'es-ES,es;q=0.9',
      })
    ).toEqual({ locale: 'en', source: 'path' })
    expect(
      resolveLocale({ pathname: '/pricing', cookieLocale: 'es', acceptLanguage: 'en-GB,en;q=0.9' })
    ).toEqual({ locale: 'es', source: 'cookie' })
    expect(resolveLocale({ pathname: '/pricing', acceptLanguage: 'es-ES, en;q=0.8' })).toEqual({
      locale: 'es',
      source: 'accept-language',
    })
    expect(resolveLocale({ pathname: '/pricing', acceptLanguage: 'de-DE,de;q=0.9' })).toEqual({
      locale: 'en',
      source: 'default',
    })
  })

  it('parses Spanish and English browser headers safely', () => {
    expect(parseAcceptLanguage('es-ES,es;q=0.9,en;q=0.8')).toBe('es')
    expect(parseAcceptLanguage('fr;q=0.3, en-GB;q=0.9, es;q=0.8')).toBe('en')
    expect(parseAcceptLanguage('%%% , de;q=not-a-number')).toBeUndefined()
  })

  it('rewrites a locale URL internally and leaves legacy URLs usable', () => {
    expect(getLocaleRoutingPlan({ pathname: '/es/contacto', cookieLocale: 'en' })).toEqual({
      type: 'rewrite',
      locale: 'es',
      pathname: '/contacto',
      persistLocale: true,
    })
    expect(getLocaleRoutingPlan({ pathname: '/pricing', cookieLocale: 'es' })).toEqual({
      type: 'next',
      locale: 'es',
      persistLocale: false,
    })
  })

  it('does not route API, Next assets, or static files through the locale layer', () => {
    expect(shouldHandleLocalePath('/api/leads')).toBe(false)
    expect(shouldHandleLocalePath('/_next/static/chunks/app.js')).toBe(false)
    expect(shouldHandleLocalePath('/images/marketing/hero.png')).toBe(false)
    expect(shouldHandleLocalePath('/favicon.ico')).toBe(false)
    expect(shouldHandleLocalePath('/es/features')).toBe(true)
  })

  it('never turns an unsafe path-like value into an external redirect target', () => {
    expect(localizedHref('//attacker.example/path', 'es')).toBe('/es')
    expect(localizedHref('/\\attacker.example/path', 'en')).toBe('/en')
    expect(
      getLocaleRoutingPlan({ pathname: '//attacker.example/path', cookieLocale: 'es' })
    ).toEqual({
      type: 'next',
      locale: 'es',
      persistLocale: false,
    })
  })
})
