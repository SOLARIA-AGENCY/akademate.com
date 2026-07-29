import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Boxes, Building2, CheckCircle2, CircleDashed, ServerCog, Settings2 } from 'lucide-react'
import { ComplianceBadges } from '@/components/legal/ComplianceBadges'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { aiCapability, publicCapabilities } from '@/lib/product-capabilities'

export const metadata: Metadata = {
  title: 'Akademate | Gestión académica para centros de formación',
  description:
    'Base SaaS de gestión académica en preparación para apertura multitenant y despliegues Enterprise aislados bajo contrato.',
  alternates: { canonical: '/' },
}

const statusStyle = {
  available: { icon: CheckCircle2, className: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  configured: { icon: Settings2, className: 'text-blue-700 bg-blue-50 border-blue-200' },
  validation: { icon: CircleDashed, className: 'text-amber-800 bg-amber-50 border-amber-200' },
} as const

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main id="contenido" className="flex-1">
        <section className="relative overflow-hidden border-b px-4 py-20 sm:px-6 sm:py-28">
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,hsl(var(--primary)/0.12),transparent_42%)]" />
          <div className="mx-auto grid max-w-7xl items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
            <div>
              <p className="inline-flex rounded-full border bg-background px-3 py-1 text-sm font-medium text-primary">
                SaaS multitenant en preparación · Enterprise bajo contrato
              </p>
              <h1 className="mt-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-6xl">
                Una base de producto, dos modelos de servicio claramente separados
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground">
                akademate.com presenta el futuro SaaS multitenant, todavía no abierto al alta pública. Los clientes Enterprise reciben una instancia aislada, configurada y operada bajo su propio contrato.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/contacto" className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
                  Hablar sobre tu centro <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-md border bg-background px-5 py-3 font-medium hover:bg-muted">
                  Acceso clientes
                </Link>
              </div>
              <div className="mt-8 max-w-xl">
                <ComplianceBadges />
              </div>
            </div>

            <aside className="rounded-3xl border bg-card p-7 shadow-sm" aria-label="Límite de la promesa de producto">
              <Building2 className="h-9 w-9 text-primary" aria-hidden="true" />
              <h2 className="mt-5 text-xl font-semibold">Separación de producto y despliegue</h2>
              <p className="mt-3 text-sm leading-7 text-muted-foreground">
                Las capacidades visibles describen la base general de Akademate. CEP Formación opera en su despliegue Enterprise aislado; su configuración no define automáticamente el futuro SaaS multitenant.
              </p>
              <ul className="mt-6 space-y-3 text-sm">
                <li className="rounded-lg bg-muted/60 p-3">akademate.com: superficie del SaaS general en preparación.</li>
                <li className="rounded-lg bg-muted/60 p-3">Enterprise: instancia aislada por cliente y alcance contractual.</li>
                <li className="rounded-lg bg-muted/60 p-3">CEP: cliente Enterprise de referencia, no plantilla legal pública.</li>
              </ul>
            </aside>
          </div>
        </section>

        <section id="modelos" className="border-b px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Modelos de servicio</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Dos sistemas paralelos, responsabilidades distintas</h2>
              <p className="mt-4 leading-7 text-muted-foreground">Comparten una base de producto, pero no comparten automáticamente despliegue, datos, configuración, identidad legal del cliente ni contrato.</p>
            </div>
            <div className="mt-10 grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border bg-card p-7">
                <Boxes className="h-8 w-8 text-primary" aria-hidden="true" />
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">akademate.com</p>
                <h3 className="mt-2 text-2xl font-semibold">Akademate SaaS multitenant</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Superficie corporativa y futura oferta SaaS compartida. Se abrirá más adelante cuando alta, planes, aislamiento, permisos y operación superen sus gates. Hoy no se presenta como autoservicio disponible.</p>
                <p className="mt-5 rounded-xl bg-muted/60 p-4 text-sm font-medium">Estado: producto y apertura multitenant en preparación.</p>
              </article>
              <article className="rounded-3xl border bg-card p-7">
                <ServerCog className="h-8 w-8 text-primary" aria-hidden="true" />
                <p className="mt-5 text-xs font-semibold uppercase tracking-wider text-primary">Plan Enterprise</p>
                <h3 className="mt-2 text-2xl font-semibold">Instancia aislada por cliente</h3>
                <p className="mt-4 leading-7 text-muted-foreground">Despliegue dedicado, configuración y alcance definidos bajo contrato. cepformacion.akademate.com es la instancia Enterprise aislada de CEP Formación. El patrón podrá aplicarse a otros clientes sin reutilizar su identidad, datos o acuerdos.</p>
                <p className="mt-5 rounded-xl bg-muted/60 p-4 text-sm font-medium">Estado: disponible únicamente mediante implantación y contrato específicos.</p>
              </article>
            </div>
          </div>
        </section>

        <section id="capacidades" className="scroll-mt-24 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-primary">Capacidades y estado</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">Qué existe y bajo qué límite</h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Cada tarjeta separa capacidad técnica de disponibilidad comercial u operativa.
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {publicCapabilities.map((capability) => {
                const style = statusStyle[capability.status]
                const Icon = style.icon
                return (
                  <article key={capability.title} className="rounded-2xl border bg-card p-6">
                    <div className={`inline-flex items-center gap-2 rounded-full border px-2.5 py-1 text-xs font-semibold ${style.className}`}>
                      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {capability.statusLabel}
                    </div>
                    <h3 className="mt-5 text-lg font-semibold">{capability.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">{capability.description}</p>
                    <p className="mt-4 border-t pt-4 text-xs leading-5 text-muted-foreground">
                      Límite: {capability.evidenceBoundary}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="integraciones" className="scroll-mt-24 border-y bg-muted/30 px-4 py-20 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl border bg-background p-7 sm:p-10">
            <p className="text-sm font-semibold text-primary">IA y MCP</p>
            <div className="mt-3 grid gap-8 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">{aiCapability.title}</h2>
                <p className="mt-4 leading-7 text-muted-foreground">{aiCapability.description}</p>
                <p className="mt-5 inline-flex rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-900">
                  {aiCapability.statusLabel}
                </p>
              </div>
              <ul className="space-y-3">
                {aiCapability.limitations.map((limitation) => (
                  <li key={limitation} className="rounded-xl border bg-muted/30 p-4 text-sm leading-6 text-muted-foreground">
                    {limitation}
                  </li>
                ))}
              </ul>
            </div>
            <Link href="/legal/ia" className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
              Leer transparencia de IA <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="px-4 py-20 text-center sm:px-6">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-3xl font-bold tracking-tight">Validemos el encaje antes de prometer un alcance</h2>
            <p className="mt-4 leading-7 text-muted-foreground">Cuéntanos tus procesos, sedes e integraciones. La respuesta comercial debe distinguir lo disponible, lo configurable y lo que requiere desarrollo.</p>
            <Link href="/contacto" className="mt-8 inline-flex min-h-11 items-center justify-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">
              Contactar
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
