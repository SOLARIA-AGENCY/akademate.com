'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import { useLocale } from '@/components/i18n/locale-provider'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizedHref, stripLocalePrefix } from '@/lib/i18n/routing'
import { publicNavigation } from '@/lib/public-navigation'
import { verticals } from '@/lib/marketing-content'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()
  const locale = useLocale()
  const dictionary = getDictionary(locale)
  const currentPathname = stripLocalePrefix(pathname ?? '/').pathname
  const hrefForLocale = (targetLocale: typeof locale) =>
    localizedHref(currentPathname, targetLocale)
  const href = (path: string) => localizedHref(path, locale)

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <a
        href="#content"
        className="sr-only z-[60] rounded-md bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-blue-600"
      >
        {dictionary.header.skipToContent}
      </a>
      <nav
        aria-label="Primary navigation"
        className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8"
      >
        <Link
          href={href('/')}
          className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600"
        >
          <Image src="/logos/akademate-icon-48.png" alt="" width={34} height={34} priority />
          <span className="text-sm font-extrabold tracking-[0.12em] text-[#071633]">AKADEMATE</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {publicNavigation.map((item) => {
            const route = item.href.split('#')[0] || '/'
            const active = route !== '/' && currentPathname.startsWith(route)
            if (item.href === '/solutions')
              return (
                <details key={item.href} className="group relative">
                  <summary
                    className={`flex cursor-pointer list-none items-center gap-1 text-sm font-medium transition hover:text-blue-700 ${active ? 'text-blue-700' : 'text-slate-600'}`}
                  >
                    {getNavigationLabel(item.href, dictionary)}
                    <ChevronDown
                      className="h-4 w-4 transition group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="absolute left-1/2 top-9 w-[620px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(7,22,51,.16)]">
                    <div className="grid grid-cols-2 gap-1">
                      {verticals.map((vertical) => (
                        <Link
                          key={vertical.slug}
                          href={href(`/solutions/${vertical.slug}`)}
                          className="rounded-xl p-3 transition hover:bg-blue-50"
                        >
                          <span className="block text-sm font-semibold text-[#071633]">
                            {vertical.title}
                          </span>
                          <span className="mt-1 block text-xs leading-5 text-slate-500">
                            {vertical.capabilities.join(' · ')}
                          </span>
                        </Link>
                      ))}
                    </div>
                    <Link
                      href={href('/solutions')}
                      className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-[#071633] px-4 text-sm font-semibold text-white"
                    >
                      {dictionary.header.exploreCustomers}{' '}
                      <ArrowRight className="h-4 w-4" aria-hidden="true" />
                    </Link>
                  </div>
                </details>
              )
            return (
              <Link
                key={item.href}
                href={href(item.href)}
                className={`text-sm font-medium transition hover:text-blue-700 ${active ? 'text-blue-700' : 'text-slate-600'}`}
              >
                {getNavigationLabel(item.href, dictionary)}
              </Link>
            )
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <LanguageSelector locale={locale} hrefForLocale={hrefForLocale} dictionary={dictionary} />
          <Link
            href={href('/contacto?asunto=demo')}
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {dictionary.header.bookDemo} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#071633] hover:bg-slate-100 lg:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="mobile-menu"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className="sr-only">
            {mobileMenuOpen ? dictionary.header.closeMenu : dictionary.header.openMenu}
          </span>
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div id="mobile-menu" className="border-t bg-white px-4 py-5 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {publicNavigation.map((item) => (
              <div key={item.href}>
                <Link
                  href={href(item.href)}
                  className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {getNavigationLabel(item.href, dictionary)}
                </Link>
                {item.href === '/solutions' ? (
                  <div className="grid grid-cols-2 gap-1 px-2 pb-3">
                    {verticals.map((vertical) => (
                      <Link
                        key={vertical.slug}
                        href={href(`/solutions/${vertical.slug}`)}
                        className="rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-blue-50"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {vertical.title}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <div className="mt-3 px-3">
              <LanguageSelector
                locale={locale}
                hrefForLocale={hrefForLocale}
                dictionary={dictionary}
                onNavigate={() => setMobileMenuOpen(false)}
                mobile
              />
            </div>
            <div className="mt-4 border-t pt-4">
              <Link
                href={href('/contacto?asunto=demo')}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#071633] font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {dictionary.header.bookDemo}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}

function getNavigationLabel(href: string, dictionary: ReturnType<typeof getDictionary>) {
  const labels: Record<string, string> = {
    '/features': dictionary.navigation.features,
    '/solutions': dictionary.navigation.solutions,
    '/pricing': dictionary.navigation.pricing,
    '/blog': dictionary.navigation.blog,
    '/news': dictionary.navigation.news,
    '/download': dictionary.navigation.download,
    '/sobre-nosotros': dictionary.navigation.company,
  }
  return labels[href] ?? href
}

function LanguageSelector({
  locale,
  hrefForLocale,
  dictionary,
  onNavigate,
  mobile = false,
}: {
  locale: ReturnType<typeof useLocale>
  hrefForLocale: (locale: ReturnType<typeof useLocale>) => string
  dictionary: ReturnType<typeof getDictionary>
  onNavigate?: () => void
  mobile?: boolean
}) {
  const commonClassName = mobile
    ? 'inline-flex min-h-11 items-center rounded-full border border-slate-200 p-1 text-sm font-semibold text-slate-600'
    : 'inline-flex min-h-11 items-center rounded-full border border-slate-200 p-1 text-xs font-semibold text-slate-600'

  return (
    <div className={commonClassName} role="group" aria-label={dictionary.header.chooseLanguage}>
      <a
        href={hrefForLocale('en')}
        lang="en"
        aria-current={locale === 'en' ? 'page' : undefined}
        className={`rounded-full px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${locale === 'en' ? 'bg-[#071633] text-white' : 'hover:bg-slate-100'}`}
        onClick={onNavigate}
      >
        EN<span className="sr-only"> — {dictionary.language.english}</span>
      </a>
      <a
        href={hrefForLocale('es')}
        lang="es"
        aria-current={locale === 'es' ? 'page' : undefined}
        className={`rounded-full px-3 py-2 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 ${locale === 'es' ? 'bg-[#071633] text-white' : 'hover:bg-slate-100'}`}
        onClick={onNavigate}
      >
        ES<span className="sr-only"> — {dictionary.language.spanish}</span>
      </a>
    </div>
  )
}
