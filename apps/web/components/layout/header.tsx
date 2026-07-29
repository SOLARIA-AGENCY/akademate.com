'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { publicNavigation } from '@/lib/public-site'

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <a href="#main-content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-md focus:bg-background focus:px-4 focus:py-2 focus:shadow-lg">Saltar al contenido</a>
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex lg:flex-1">
          <Link href="/" className="-m-1.5 p-1.5 flex items-center gap-2.5">
            <img
              src="/logos/akademate-icon-48.png"
              alt="Akademate"
              className="h-8 w-8 flex-shrink-0"
            />
            <span className="font-bold text-xl tracking-tight">AKADEMATE</span>
          </Link>
        </div>

        {/* Mobile menu button */}
        <div className="flex lg:hidden">
          <button
            type="button"
            className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-foreground"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-expanded={mobileMenuOpen}
            aria-controls="mobile-navigation"
          >
            <span className="sr-only">{mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}</span>
            {mobileMenuOpen ? (
              <X className="h-6 w-6" aria-hidden="true" />
            ) : (
              <Menu className="h-6 w-6" aria-hidden="true" />
            )}
          </button>
        </div>

        {/* Desktop navigation */}
        <div className="hidden lg:flex lg:gap-x-8">
          {publicNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden lg:flex lg:flex-1 lg:justify-end lg:gap-x-4">
          <Link
            href="/accesos"
            className="text-sm font-medium text-muted-foreground hover:text-foreground"
          >
            Acceder
          </Link>
          <Link
            href="/registro"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm hover:bg-primary/90"
          >
            Solicitar acceso
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      <div
        id="mobile-navigation"
        className={cn(
          'lg:hidden',
          mobileMenuOpen ? 'block' : 'hidden'
        )}
      >
        <div className="space-y-1 px-4 pb-4">
          {publicNavigation.map((item) => (
            <Link
              key={item.name}
              href={item.href}
              className="block rounded-md px-3 py-2 text-base font-medium text-muted-foreground hover:bg-accent hover:text-foreground"
              onClick={() => { setMobileMenuOpen(false) }}
            >
              {item.name}
            </Link>
          ))}
          <div className="mt-4 space-y-2">
            <Link
              href="/accesos"
              className="block w-full rounded-md border px-4 py-2 text-center text-sm font-medium"
              onClick={() => { setMobileMenuOpen(false) }}
            >
              Acceder
            </Link>
            <Link
              href="/registro"
              className="block w-full rounded-md bg-primary px-4 py-2 text-center text-sm font-medium text-primary-foreground"
              onClick={() => { setMobileMenuOpen(false) }}
            >
              Solicitar acceso
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
