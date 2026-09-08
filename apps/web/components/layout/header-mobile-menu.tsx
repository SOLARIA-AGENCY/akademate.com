'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { getNavigationLabel, LanguageSelector } from '@/components/layout/header-shared'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { localizedHref } from '@/lib/i18n/routing'
import type { Locale } from '@/lib/i18n/routing'
import { publicNavigation } from '@/lib/public-navigation'
import { verticals } from '@/lib/marketing-content'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

export function HeaderMobileMenu({
  locale,
  currentPathname,
}: {
  locale: Locale
  currentPathname: string
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const dictionary = getDictionary(locale)
  const hrefForLocale = (targetLocale: Locale) => localizedHref(currentPathname, targetLocale)
  const href = (path: string) => localizedHref(path, locale)

  return (
    <>
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

      {mobileMenuOpen ? (
        <div id="mobile-menu" className="absolute inset-x-0 top-[72px] border-t bg-white px-4 py-5 lg:hidden">
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
                        {(getLocalizedVertical(vertical.slug, locale) ?? vertical).title}
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
                data-analytics-event="cta_demo"
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#071633] font-semibold text-white"
                onClick={() => setMobileMenuOpen(false)}
              >
                {dictionary.header.bookDemo}
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
