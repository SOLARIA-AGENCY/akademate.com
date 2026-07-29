import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'Recursos',
  description: 'Estado editorial de los recursos públicos de Akademate.',
  alternates: { canonical: '/blog' },
}

export default function ResourcesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <section className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold text-primary">Recursos</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Biblioteca editorial en preparación</h1>
          <p className="mt-5 leading-7 text-muted-foreground">
            Todavía no hay artículos públicos verificados. Hemos retirado las tarjetas que enlazaban a contenidos inexistentes y publicaremos cada recurso solo cuando tenga una ruta y contenido reales.
          </p>
          <Link href="/" className="mt-8 inline-flex min-h-11 items-center rounded-md border px-5 py-3 font-medium hover:bg-muted">Volver a la portada</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
