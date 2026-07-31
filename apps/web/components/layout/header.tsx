'use client'

import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { ArrowRight, ChevronDown, Menu, X } from 'lucide-react'
import { publicNavigation } from '@/lib/public-navigation'
import { verticals } from '@/lib/marketing-content'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-xl">
      <a href="#content" className="sr-only z-[60] rounded-md bg-white px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-blue-600">Skip to content</a>
      <nav aria-label="Primary navigation" className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600">
          <Image src="/logos/akademate-icon-48.png" alt="" width={34} height={34} priority />
          <span className="text-sm font-extrabold tracking-[0.12em] text-[#071633]">AKADEMATE</span>
        </Link>

        <div className="hidden items-center gap-7 lg:flex">
          {publicNavigation.map((item) => {
            const route = item.href.split('#')[0] || '/'
            const active = route !== '/' && pathname.startsWith(route)
            if (item.href === '/solutions') return (
              <details key={item.href} className="group relative">
                <summary className={`flex cursor-pointer list-none items-center gap-1 text-sm font-medium transition hover:text-blue-700 ${active ? 'text-blue-700' : 'text-slate-600'}`}>{item.name}<ChevronDown className="h-4 w-4 transition group-open:rotate-180" aria-hidden="true" /></summary>
                <div className="absolute left-1/2 top-9 w-[620px] -translate-x-1/2 rounded-2xl border border-slate-200 bg-white p-3 shadow-[0_24px_70px_rgba(7,22,51,.16)]">
                  <div className="grid grid-cols-2 gap-1">{verticals.map((vertical) => <Link key={vertical.slug} href={`/solutions/${vertical.slug}`} className="rounded-xl p-3 transition hover:bg-blue-50"><span className="block text-sm font-semibold text-[#071633]">{vertical.title}</span><span className="mt-1 block text-xs leading-5 text-slate-500">{vertical.capabilities.join(' · ')}</span></Link>)}</div>
                  <Link href="/solutions" className="mt-2 flex min-h-11 items-center justify-between rounded-xl bg-[#071633] px-4 text-sm font-semibold text-white">Explore every customer type <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </div>
              </details>
            )
            return <Link key={item.href} href={item.href} className={`text-sm font-medium transition hover:text-blue-700 ${active ? 'text-blue-700' : 'text-slate-600'}`}>{item.name}</Link>
          })}
        </div>

        <div className="hidden items-center gap-3 lg:flex">
          <Link href="/contacto?asunto=demo" className="inline-flex min-h-11 items-center gap-2 rounded-full bg-[#071633] px-5 text-sm font-semibold text-white hover:bg-blue-800">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
        </div>

        <button type="button" className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full text-[#071633] hover:bg-slate-100 lg:hidden" aria-expanded={mobileMenuOpen} aria-controls="mobile-menu" onClick={() => setMobileMenuOpen((open) => !open)}>
          <span className="sr-only">{mobileMenuOpen ? 'Close menu' : 'Open menu'}</span>
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>
      </nav>

      {mobileMenuOpen ? (
        <div id="mobile-menu" className="border-t bg-white px-4 py-5 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {publicNavigation.map((item) => <div key={item.href}><Link href={item.href} className="block rounded-xl px-3 py-3 text-base font-semibold text-slate-700 hover:bg-slate-100" onClick={() => setMobileMenuOpen(false)}>{item.name}</Link>{item.href === '/solutions' ? <div className="grid grid-cols-2 gap-1 px-2 pb-3">{verticals.map((vertical) => <Link key={vertical.slug} href={`/solutions/${vertical.slug}`} className="rounded-lg px-2 py-2 text-xs font-medium text-slate-600 hover:bg-blue-50" onClick={() => setMobileMenuOpen(false)}>{vertical.title}</Link>)}</div> : null}</div>)}
            <div className="mt-4 border-t pt-4">
              <Link href="/contacto?asunto=demo" className="inline-flex min-h-12 items-center justify-center rounded-full bg-[#071633] font-semibold text-white" onClick={() => setMobileMenuOpen(false)}>Book a demo</Link>
            </div>
          </div>
        </div>
      ) : null}
    </header>
  )
}
