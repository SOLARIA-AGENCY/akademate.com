import Link from 'next/link'
import { GraduationCap } from 'lucide-react'
import { RegulatoryNotice } from '@/components/legal/regulatory-notice'
import { getPublicLegalIdentity, publicLegalRoutes } from '@/lib/public-site'

const productLinks = [
  { name: 'Capacidades', href: '/#capacidades' },
  { name: 'Cursos', href: '/cursos' },
  { name: 'Accesos', href: '/accesos' },
] as const

const companyLinks = [
  { name: 'Sobre Akademate', href: '/sobre-nosotros' },
  { name: 'Blog', href: '/blog' },
  { name: 'Contacto', href: '/contacto' },
] as const

function LinkList({ links }: { links: readonly { name: string; href: string }[] }) {
  return (
    <ul className="mt-4 space-y-2">
      {links.map((link) => (
        <li key={link.href}>
          <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground">
            {link.name}
          </Link>
        </li>
      ))}
    </ul>
  )
}

export function Footer() {
  const identity = getPublicLegalIdentity()

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" aria-hidden="true" />
              <span className="footer-company-name text-xl font-bold">Akademate</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Plataforma SaaS para la gestión académica y operativa de centros de formación.
            </p>
            <p className="mt-4 text-xs text-muted-foreground">Operada por {identity.legalName}</p>
          </div>
          <div><h2 className="text-sm font-semibold">Producto</h2><LinkList links={productLinks} /></div>
          <div><h2 className="text-sm font-semibold">Empresa</h2><LinkList links={companyLinks} /></div>
          <div><h2 className="text-sm font-semibold">Legal</h2><LinkList links={publicLegalRoutes} /></div>
        </div>
        <div className="mt-10 flex flex-col gap-4 border-t pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} Akademate · {identity.legalName}</p>
          <RegulatoryNotice />
        </div>
      </div>
    </footer>
  )
}
