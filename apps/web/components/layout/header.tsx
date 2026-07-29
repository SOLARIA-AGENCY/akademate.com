'use client'
import Image from 'next/image'
import Link from 'next/link'
import { Menu, X } from 'lucide-react'
import { useState } from 'react'

const navigation = [
  { name: 'Producto', href: '/#producto' },
  { name: 'Transparencia', href: '/#confianza' },
  { name: 'Sobre Akademate', href: '/sobre-nosotros' },
  { name: 'Contacto', href: '/contacto' },
]
export function Header() {
  const [open, setOpen] = useState(false)
  return (
    <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
      <nav
        aria-label="Principal"
        className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6"
      >
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Image src="/logos/akademate-icon-48.png" alt="" width={32} height={32} />
          AKADEMATE
        </Link>
        <div className="hidden items-center gap-7 md:flex">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              {item.name}
            </Link>
          ))}
          <Link href="/accesos" className="rounded-md border px-4 py-2 text-sm font-medium">
            Iniciar sesión
          </Link>
        </div>
        <button
          type="button"
          className="rounded-md p-2 md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          onClick={() => setOpen(!open)}
        >
          <span className="sr-only">{open ? 'Cerrar menú' : 'Abrir menú'}</span>
          {open ? <X /> : <Menu />}
        </button>
      </nav>
      {open && (
        <div id="mobile-menu" className="space-y-1 border-t px-4 py-3 md:hidden">
          {navigation.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block rounded-md px-3 py-2 text-sm"
            >
              {item.name}
            </Link>
          ))}
          <Link href="/accesos" className="block rounded-md px-3 py-2 text-sm font-medium">
            Iniciar sesión
          </Link>
        </div>
      )}
    </header>
  )
}
