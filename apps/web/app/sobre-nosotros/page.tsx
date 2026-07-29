import type { Metadata } from 'next'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { PUBLIC_LEGAL } from '@/lib/public-legal'

export const metadata: Metadata = {
  title: 'Sobre Akademate',
  description: 'Producto y entidad responsable de Akademate.',
}

export default function AboutPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="mx-auto max-w-4xl px-4 py-16 sm:px-6 sm:py-24">
          <p className="text-sm font-semibold text-primary">Sobre Akademate</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            Tecnología para operar formación con menos fricción y más trazabilidad.
          </h1>
          <div className="mt-10 grid gap-10 text-muted-foreground md:grid-cols-2">
            <div><h2 className="font-semibold text-foreground">El producto</h2><p className="mt-3 leading-7">Akademate es un SaaS en desarrollo para centros de formación. Distingue las funciones implementadas, configuradas y previstas.</p></div>
            <div><h2 className="font-semibold text-foreground">La organización</h2><p className="mt-3 leading-7">El producto es operado por {PUBLIC_LEGAL.operatorName}, entidad constituida en {PUBLIC_LEGAL.registeredCountry}. Registro e IVA permanecen pendientes de confirmación para esta publicación.</p></div>
            <div><h2 className="font-semibold text-foreground">Lo que no afirmamos</h2><p className="mt-3 leading-7">No publicamos cifras de clientes, integrantes de equipo, certificaciones, disponibilidad 24/7 ni integraciones activas sin una fuente verificable y vigente.</p></div>
            <div><h2 className="font-semibold text-foreground">Responsabilidad</h2><p className="mt-3 leading-7">Las páginas informativas explican el enfoque de privacidad y automatización, pero no sustituyen contratos, evaluaciones ni asesoramiento legal.</p></div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
