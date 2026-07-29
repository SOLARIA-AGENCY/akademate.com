'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { publicNavigation } from '@/lib/public-navigation'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
      <a
        href="#contenido"
        className="sr-only z-[60] rounded-md bg-background px-4 py-2 focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:ring-2 focus:ring-ring"
      >
        Saltar al contenido
      </a>
      <nav aria-label="Navegación principal" className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
          <Image src="/logos/akademate-icon-48.png" alt="" width={32} height={32} priority />
          <span className="font-bold tracking-tight">AKADEMATE</span>
        </Link>

        <button
          type="button"
          className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-md lg:hidden"
          aria-expanded={mobileMenuOpen}
          aria-controls="menu-movil"
          onClick={() => setMobileMenuOpen((open) => !open)}
        >
          <span className="sr-only">{mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
          {mobileMenuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </button>

        <div className="hidden items-center gap-7 lg:flex">
          {publicNavigation.map((item) => (
            <Link key={item.href} href={item.href} className="text-sm font-medium text-muted-foreground hover:text-foreground">
              {item.name}
            </Link>
          ))}
          <Link href="/login" className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted">
            Acceso clientes
          </Link>
        </div>
      </nav>

      {mobileMenuOpen ? (
        <div id="menu-movil" className="border-t px-4 py-4 lg:hidden">
          <div className="mx-auto grid max-w-7xl gap-1">
            {publicNavigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-3 py-3 text-base font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link href="/login" className="mt-2 rounded-md border px-3 py-3 text-center font-medium">
              Acceso clientes
            </Link>
          </div>
        </div>
      ) : null}
    </header>
  )
}
