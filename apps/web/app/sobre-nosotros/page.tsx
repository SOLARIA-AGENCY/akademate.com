import type { Metadata } from 'next'
import { Building2, Layers3, Scale } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { RegulatoryNotice } from '@/components/legal/regulatory-notice'
import { getPublicLegalIdentity } from '@/lib/public-site'

export const metadata: Metadata = {
  title: 'Sobre Akademate',
  description: 'Conoce el producto, su operador y los límites públicos de Akademate.',
  alternates: { canonical: '/sobre-nosotros' },
}

const principles = [
  { title: 'Producto configurable', description: 'Los módulos se habilitan según necesidades, contrato y entorno; no todos están disponibles en toda instalación.', icon: Layers3 },
  { title: 'Operación trazable', description: 'La plataforma busca reunir datos y flujos académicos sin ocultar dependencias o límites del despliegue.', icon: Building2 },
  { title: 'Claims proporcionados', description: 'La web distingue capacidad en código, configuración activa y compromiso contractual.', icon: Scale },
] as const

export default function AboutPage() {
  const identity = getPublicLegalIdentity()
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
            <RegulatoryNotice />
            <h1 className="mt-7 text-3xl font-bold tracking-tight sm:text-5xl">Akademate, gestión académica con límites visibles</h1>
            <p className="mx-auto mt-5 max-w-3xl text-lg text-muted-foreground">Akademate es un producto SaaS operado por {identity.legalName}. Ayuda a centros de formación a organizar cursos, convocatorias, alumnado y operación asociada.</p>
          </div>
        </section>
        <section className="py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {principles.map(({ title, description, icon: Icon }) => <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm"><Icon className="h-6 w-6 text-primary" aria-hidden="true" /><h2 className="mt-5 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{description}</p></article>)}
            </div>
            <div className="mt-14 rounded-2xl border bg-muted/30 p-7">
              <h2 className="text-xl font-semibold">Lo que esta página no afirma</h2>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">No publicamos nombres de equipo, número de clientes, reseñas, certificaciones, dirección, teléfono o condiciones comerciales sin una fuente documental vigente. Los datos registrales pendientes aparecen en el centro legal.</p>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
