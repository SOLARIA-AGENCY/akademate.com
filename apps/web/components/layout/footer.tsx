import Link from 'next/link'
import { Info, ShieldCheck } from 'lucide-react'
import { PUBLIC_LEGAL, PUBLIC_LEGAL_LINKS } from '@/lib/public-legal'

export function Footer() {
  return (
    <footer className="border-t bg-muted/30">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="grid gap-8 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Link href="/" className="text-lg font-bold">
              Akademate
            </Link>
            <p className="mt-3 max-w-sm text-sm text-muted-foreground">
              Software en desarrollo para la operación de centros de formación. Las capacidades
              previstas se validan antes de ofrecerse contractualmente.
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              Titular: {PUBLIC_LEGAL.operatorName} · {PUBLIC_LEGAL.registeredCountry}
            </p>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Información</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/sobre-nosotros">Sobre Akademate</Link>
              </li>
              <li>
                <Link href="/contacto">Contacto</Link>
              </li>
              <li>
                <Link href="/accesos">Acceso a la plataforma</Link>
              </li>
            </ul>
          </div>
          <div>
            <h2 className="text-sm font-semibold">Legal</h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {PUBLIC_LEGAL_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.name}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="mt-8 flex flex-col gap-3 border-t pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {PUBLIC_LEGAL.operatorName}. Información sujeta a
            confirmación legal.
          </p>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/privacidad"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border px-3 py-1 text-xs"
            >
              <ShieldCheck className="h-3.5 w-3.5" />
              Privacidad y RGPD <span className="sr-only">Información, no certificación</span>
            </Link>
            <Link
              href="/transparencia-ia"
              className="inline-flex min-h-11 items-center gap-1 rounded-full border px-3 py-1 text-xs"
            >
              <Info className="h-3.5 w-3.5" />
              Transparencia de IA <span className="sr-only">Información, no certificación</span>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
