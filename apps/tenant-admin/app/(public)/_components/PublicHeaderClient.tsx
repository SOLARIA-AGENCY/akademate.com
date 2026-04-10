'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ChevronDown, Menu, X } from 'lucide-react'
import type { ResolvedWebsiteNavigationItem, WebsiteLink } from '@/app/lib/website/types'

type Props = {
  brandColor: string
  logoSrc: string
  academyName: string
  navigationItems: ResolvedWebsiteNavigationItem[]
  navigationCta?: WebsiteLink
  topBar: {
    phone: string
    phoneAlternative?: string
    schedule: string
    email: string
  }
}

const SCROLL_DELTA = 12
const TOP_VISIBLE_Y = 24

function hasDropdownContent(item: ResolvedWebsiteNavigationItem): boolean {
  return (item.children?.length ?? 0) > 0 || (item.groups?.length ?? 0) > 0
}

export function PublicHeaderClient({
  brandColor,
  logoSrc,
  academyName,
  navigationItems,
  navigationCta,
  topBar,
}: Props) {
  const [isVisible, setIsVisible] = useState(true)
  const [headerHeight, setHeaderHeight] = useState(0)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [mobileOpenKey, setMobileOpenKey] = useState<string | null>(null)
  const headerRef = useRef<HTMLElement | null>(null)
  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const frameRef = useRef<number | null>(null)

  useEffect(() => {
    const headerNode = headerRef.current
    if (!headerNode) return

    const measure = () => {
      setHeaderHeight(headerNode.offsetHeight)
    }

    measure()

    const observer = new ResizeObserver(() => measure())
    observer.observe(headerNode)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    lastScrollYRef.current = window.scrollY

    const onScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      frameRef.current = window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollYRef.current

        if (currentY < TOP_VISIBLE_Y) {
          setIsVisible(true)
        } else if (delta > SCROLL_DELTA) {
          setIsVisible(false)
        } else if (delta < -SCROLL_DELTA) {
          setIsVisible(true)
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    window.addEventListener('scroll', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
      }
    }
  }, [])

  return (
    <>
      <header
        ref={headerRef}
        className={`fixed left-0 right-0 top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur transition-transform duration-300 motion-reduce:transition-none ${
          isVisible ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <div className="text-white" style={{ backgroundColor: brandColor }}>
          <div className="mx-auto flex max-w-7xl flex-col gap-1.5 px-4 py-1.5 text-xs sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8a19.78 19.78 0 0 1-3.07-8.67A2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.59 2.63a2 2 0 0 1-.45 2.11L8 9.99a16 16 0 0 0 6 6l1.53-1.2a2 2 0 0 1 2.11-.45c.85.27 1.73.47 2.63.59A2 2 0 0 1 22 16.92Z" />
                </svg>
                Teléfono: {topBar.phone}
              </span>
              {topBar.phoneAlternative ? (
                <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
                  <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M22 16.92v3a2 2 0 0 1-2.18 2 19.78 19.78 0 0 1-8.63-3.07A19.5 19.5 0 0 1 5.15 12.8a19.78 19.78 0 0 1-3.07-8.67A2 2 0 0 1 4.06 2h3a2 2 0 0 1 2 1.72c.12.9.32 1.78.59 2.63a2 2 0 0 1-.45 2.11L8 9.99a16 16 0 0 0 6 6l1.53-1.2a2 2 0 0 1 2.11-.45c.85.27 1.73.47 2.63.59A2 2 0 0 1 22 16.92Z" />
                  </svg>
                  Alternativo: {topBar.phoneAlternative}
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                Horario: {topBar.schedule}
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
              </svg>
              Email: {topBar.email}
            </span>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            <img src={logoSrc} alt={academyName} className="h-24 w-auto max-w-[430px] object-contain lg:h-28" />
          </Link>

          <button
            type="button"
            className="inline-flex items-center justify-center rounded-md border border-slate-200 p-2 text-slate-700 lg:hidden"
            onClick={() => setMobileMenuOpen((open) => !open)}
            aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <nav className="hidden items-center gap-4 lg:flex">
            {navigationItems.map((item) => {
              if (item.kind === 'dropdown' && hasDropdownContent(item)) {
                return (
                  <div key={`${item.label}-${item.href}`} className="group relative">
                    <Link
                      href={item.href}
                      className="inline-flex items-center gap-1 text-sm font-medium text-slate-600 transition hover:text-slate-950"
                    >
                      {item.label}
                      <ChevronDown className="h-4 w-4 text-slate-400 transition group-hover:text-slate-700" />
                    </Link>

                    <div className="invisible absolute left-0 top-full z-40 mt-3 min-w-[280px] rounded-xl border border-slate-200 bg-white p-3 opacity-0 shadow-xl transition group-hover:visible group-hover:opacity-100">
                      <Link
                        href={item.href}
                        className="mb-2 block rounded-md px-3 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-50 hover:text-slate-700"
                      >
                        Ver todo {item.label}
                      </Link>

                      {item.groups?.length ? (
                        <div className="space-y-3">
                          {item.groups.map((group) => (
                            <div key={`${item.label}-${group.label}`}>
                              <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                {group.label}
                              </p>
                              <div className="space-y-1">
                                {group.children.map((child) => (
                                  <Link
                                    key={`${item.label}-${child.href}`}
                                    href={child.href}
                                    className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="space-y-1">
                          {item.children?.map((child) => (
                            <Link
                              key={`${item.label}-${child.href}`}
                              href={child.href}
                              className="block rounded-md px-3 py-2 text-sm text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                            >
                              {child.label}
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              }

              return (
                <Link
                  key={`${item.label}-${item.href}`}
                  href={item.href}
                  className="text-sm font-medium text-slate-600 transition hover:text-slate-950"
                >
                  {item.label}
                </Link>
              )
            })}

            {navigationCta ? (
              <Link
                href={navigationCta.href}
                className="rounded-full px-4 py-2 text-sm font-semibold text-white"
                style={{ backgroundColor: brandColor }}
              >
                {navigationCta.label}
              </Link>
            ) : null}
          </nav>
        </div>

        {mobileMenuOpen ? (
          <div className="border-t border-slate-200 bg-white px-4 py-3 lg:hidden">
            <nav className="space-y-1">
              {navigationItems.map((item) => {
                const key = `${item.label}-${item.href}`
                const hasChildren = item.kind === 'dropdown' && hasDropdownContent(item)
                if (!hasChildren) {
                  return (
                    <Link
                      key={key}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="block rounded-md px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
                    >
                      {item.label}
                    </Link>
                  )
                }

                const isOpen = mobileOpenKey === key
                return (
                  <div key={key} className="rounded-md border border-slate-200">
                    <button
                      type="button"
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm font-medium text-slate-700"
                      onClick={() => setMobileOpenKey((current) => (current === key ? null : key))}
                    >
                      <span>{item.label}</span>
                      <ChevronDown className={`h-4 w-4 text-slate-400 transition ${isOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {isOpen ? (
                      <div className="space-y-1 border-t border-slate-200 p-2">
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className="block rounded-md px-2 py-2 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500 hover:bg-slate-50"
                        >
                          Ver todo {item.label}
                        </Link>
                        {item.groups?.length ? (
                          item.groups.map((group) => (
                            <div key={`${key}-${group.label}`} className="py-1">
                              <p className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">
                                {group.label}
                              </p>
                              <div className="space-y-1">
                                {group.children.map((child) => (
                                  <Link
                                    key={`${key}-${child.href}`}
                                    href={child.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    {child.label}
                                  </Link>
                                ))}
                              </div>
                            </div>
                          ))
                        ) : (
                          item.children?.map((child) => (
                            <Link
                              key={`${key}-${child.href}`}
                              href={child.href}
                              onClick={() => setMobileMenuOpen(false)}
                              className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
                            >
                              {child.label}
                            </Link>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                )
              })}

              {navigationCta ? (
                <Link
                  href={navigationCta.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="mt-2 block rounded-full px-4 py-2 text-center text-sm font-semibold text-white"
                  style={{ backgroundColor: brandColor }}
                >
                  {navigationCta.label}
                </Link>
              ) : null}
            </nav>
          </div>
        ) : null}
      </header>
      <div aria-hidden="true" style={{ height: headerHeight }} />
    </>
  )
}
