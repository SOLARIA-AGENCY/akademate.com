import Image from 'next/image'
import Link from 'next/link'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { legalCompany, legalLinks } from '@/lib/legal-config'
import { publicCompanyLinks } from '@/lib/public-navigation'

const productLinks = [
  { name: 'SaaS y Enterprise', href: '/#modelos' },
  { name: 'Capacidades', href: '/#capacidades' },
  { name: 'Integraciones', href: '/#integraciones' },
  { name: 'Acceso clientes', href: '/login' },
] as const

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <Link href="/" className="flex items-center gap-2">
              <Image src="/logos/akademate-icon-48.png" alt="" width={32} height={32} />
              <span className="font-bold">Akademate</span>
            </Link>
            <p className="mt-4 text-sm leading-6 text-muted-foreground">
              Base SaaS en preparación para apertura multitenant y despliegues Enterprise aislados bajo contrato.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">Prestado por {legalCompany.name}</p>
            <a className="mt-2 inline-block text-sm text-primary hover:underline" href="mailto:hola@akademate.com">
              hola@akademate.com
            </a>
          </div>

          <FooterColumn title="Producto" links={productLinks} />
          <FooterColumn title="Empresa" links={publicCompanyLinks} />
          <FooterColumn title="Legal" links={legalLinks.map(({ title, href }) => ({ name: title, href }))} />
        </div>

        <div className="mt-12 border-t pt-8">
          <ComplianceBadges />
          <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">
            © {new Date().getFullYear()} Akademate. Los textos legales son borradores informativos pendientes de revisión profesional.
          </p>
        </div>
      </div>
    </footer>
  )
}

function FooterColumn({
  title,
  links,
}: {
  title: string
  links: readonly { name: string; href: string }[]
}) {
  return (
    <div>
      <h2 className="text-sm font-semibold">{title}</h2>
      <ul className="mt-4 space-y-3">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="text-sm text-muted-foreground hover:text-foreground hover:underline">
              {link.name}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
