import Image from 'next/image'
import Link from 'next/link'
import { ChevronDown } from 'lucide-react'
import { HeaderMobileMenu } from '@/components/layout/header-mobile-menu'
import { getNavigationLabel, LanguageSelector } from '@/components/layout/header-shared'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { getRequestLocale, getRequestPathname } from '@/lib/i18n/server'
import { localizedHref, stripLocalePrefix } from '@/lib/i18n/routing'
import { publicNavigation } from '@/lib/public-navigation'
import { verticals } from '@/lib/marketing-content'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

export async function Header() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const currentPathname = stripLocalePrefix(await getRequestPathname()).pathname
  const hrefForLocale = (targetLocale: typeof locale) => localizedHref(currentPathname, targetLocale)
  const href = (path: string) => localizedHref(path, locale)

  return (
    <header className="relative sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
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
                  <div className="absolute left-1/2 top-9 w-[720px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(7,22,51,.16)]">
                    <div className="grid grid-cols-2 gap-1">
                      {verticals.map((vertical) => {
                        const localized = getLocalizedVertical(vertical.slug, locale) ?? vertical
                        return (
                          <Link
                            key={vertical.slug}
                            href={href(`/solutions/${vertical.slug}`)}
                            className="rounded-xl p-3 transition hover:bg-blue-50"
                          >
                            <span className="block text-sm font-semibold text-[#071633]">
                              {localized.title}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-slate-500">
                              {vertical.capabilities.join(' · ')}
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                    <Link
                      href={href('/solutions')}
                      className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-[#071633] px-4 text-sm font-semibold text-white"
                    >
                      {dictionary.header.exploreCustomers}
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
            data-analytics-event="cta_demo"
            className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            {dictionary.header.bookDemo}
          </Link>
        </div>

        <HeaderMobileMenu locale={locale} currentPathname={currentPathname} />
      </nav>
    </header>
  )
}
