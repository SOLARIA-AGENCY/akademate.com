import type { Metadata } from 'next'
import { Building2, Scale, Wrench } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { legalCompany } from '@/lib/legal-config'

export const metadata: Metadata = {
  title: 'Sobre Akademate',
  description: 'Producto SaaS de SOLARIA AGENCY OÜ para la operación de centros de formación.',
  alternates: { canonical: '/sobre-nosotros' },
}

const principles = [
  { icon: Building2, title: 'Producto para organizaciones reales', text: 'El alcance se define por procesos, sedes, datos y responsabilidades de cada centro.' },
  { icon: Wrench, title: 'Configuración antes que ficción', text: 'Una capacidad técnica no se presenta como activa hasta que integración, permisos y operación estén validados.' },
  { icon: Scale, title: 'Claims defendibles', text: 'Privacidad, IA y seguridad se explican como prácticas y límites; no como certificaciones inexistentes.' },
] as const

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex-1">
        <section className="border-b bg-muted/30 px-4 py-16 sm:px-6 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-primary">Sobre Akademate</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight sm:text-5xl">Software académico construido con límites explícitos</h1>
            <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">
              Akademate es un producto SaaS prestado por {legalCompany.name}. akademate.com prepara la futura oferta multitenant; los clientes Enterprise reciben instancias aisladas bajo contrato, como el despliegue específico de CEP Formación.
            </p>
          </div>
        </section>
        <section className="px-4 py-16 sm:px-6">
          <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, text }) => (
              <article key={title} className="rounded-2xl border bg-card p-6">
                <Icon className="h-7 w-7 text-primary" aria-hidden="true" />
                <h2 className="mt-5 text-lg font-semibold">{title}</h2>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
              </article>
            ))}
          </div>
          <div className="mx-auto mt-12 max-w-3xl rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm leading-7 text-amber-950">
            Los datos registrales, fiscales y domicilios del prestador permanecen marcados como pendientes de validación en las páginas legales. No publicamos nombres de equipo, cifras de clientes ni perfiles sociales sin una fuente validada.
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
