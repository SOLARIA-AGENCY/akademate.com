import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'Catálogos de formación',
  description: 'Cómo se publican los catálogos de cada organización en Akademate.',
  alternates: { canonical: '/cursos' },
}

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-primary">Catálogos por organización</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Akademate no vende un catálogo formativo propio</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Cada academia publica sus cursos y convocatorias en su superficie configurada y bajo su propia responsabilidad. Esta web corporativa explica el producto, pero no inventa cursos, precios, plazas, valoraciones o matrículas.
          </p>
          <div className="mt-8 rounded-2xl border bg-muted/30 p-6 text-sm leading-7 text-muted-foreground">
            La capacidad técnica de catálogo existe en el producto. Para consultar una oferta concreta debe utilizarse la web pública del centro correspondiente.
          </div>
          <Link href="/contacto" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">Consultar una implantación</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
