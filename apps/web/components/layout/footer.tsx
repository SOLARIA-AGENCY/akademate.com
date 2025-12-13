import Link from 'next/link'
import { GraduationCap } from 'lucide-react'

const footerLinks = {
  platform: [
    { name: 'Cursos', href: '/cursos' },
    { name: 'Instructores', href: '/instructores' },
    { name: 'Precios', href: '/precios' },
    { name: 'FAQ', href: '/faq' },
  ],
  company: [
    { name: 'Sobre Nosotros', href: '/sobre-nosotros' },
    { name: 'Blog', href: '/blog' },
    { name: 'Contacto', href: '/contacto' },
    { name: 'Empleo', href: '/empleo' },
  ],
  legal: [
    { name: 'Privacidad', href: '/privacidad' },
    { name: 'Términos', href: '/terminos' },
    { name: 'Cookies', href: '/cookies' },
  ],
}

export function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-4">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <GraduationCap className="h-8 w-8 text-primary" />
              <span className="font-bold text-xl">Akademate</span>
            </Link>
            <p className="mt-4 text-sm text-muted-foreground">
              Plataforma SaaS para academias y centros de formación.
              Gestiona cursos, alumnos y matrículas en un solo lugar.
            </p>
          </div>

          {/* Platform links */}
          <div>
            <h3 className="text-sm font-semibold">Plataforma</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h3 className="text-sm font-semibold">Empresa</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Legal links */}
          <div>
            <h3 className="text-sm font-semibold">Legal</h3>
            <ul className="mt-4 space-y-2">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className="text-sm text-muted-foreground hover:text-foreground"
                  >
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 border-t pt-8">
          <p className="text-center text-sm text-muted-foreground">
            &copy; {currentYear} Akademate. Todos los derechos reservados.
            Desarrollado por{' '}
            <a
              href="https://www.solaria.agency"
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium hover:text-foreground"
            >
              SOLARIA Agency
            </a>
          </p>
        </div>
      </div>
    </footer>
  )
}
