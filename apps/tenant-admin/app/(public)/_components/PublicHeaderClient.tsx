'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'

type NavItem = {
  label: string
  href: string
}

type NavCta = {
  label: string
  href: string
}

type Props = {
  brandColor: string
  logoSrc: string
  academyName: string
  navigationItems: NavItem[]
  navigationCta?: NavCta
}

const SCROLL_DELTA = 12
const TOP_VISIBLE_Y = 24

export function PublicHeaderClient({
  brandColor,
  logoSrc,
  academyName,
  navigationItems,
  navigationCta,
}: Props) {
  const [isVisible, setIsVisible] = useState(true)
  const [headerHeight, setHeaderHeight] = useState(0)
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
                Teléfono: 922 219 257
              </span>
              <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2" />
                </svg>
                Horario: Lunes a viernes 10 a 14 - 16 a 20
              </span>
            </div>
            <span className="inline-flex items-center gap-1.5 font-semibold uppercase tracking-[0.08em]">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="5" width="18" height="14" rx="2" />
                <path strokeLinecap="round" strokeLinejoin="round" d="m3 7 9 6 9-6" />
              </svg>
              Email: info@cursostenerife.es
            </span>
          </div>
        </div>
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-2.5 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center">
            <img src={logoSrc} alt={academyName} className="h-24 w-auto max-w-[430px] object-contain lg:h-28" />
          </Link>
          <nav className="hidden items-center gap-4 lg:flex">
            {navigationItems.map((item) => (
              <Link key={item.href} href={item.href} className="text-sm font-medium text-slate-600 transition hover:text-slate-950">
                {item.label}
              </Link>
            ))}
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
      </header>
      <div aria-hidden="true" style={{ height: headerHeight }} />
    </>
  )
}
