import type { Metadata } from 'next'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Notas públicas y actualizaciones verificadas de Akademate.',
  alternates: { canonical: '/blog' },
}

const plannedTopics = [
  ['Operación académica', 'Criterios para ordenar cursos, convocatorias y matrículas sin perder trazabilidad.'],
  ['Gobierno del dato', 'Cómo separar datos maestros, operación por sede y responsabilidades contractuales.'],
  ['Transparencia de producto', 'Cómo comunicar módulos e integraciones sin confundir código, configuración y despliegue.'],
] as const

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="mx-auto max-w-3xl px-4 text-center sm:px-6"><h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog Akademate</h1><p className="mt-4 text-lg text-muted-foreground">Publicaremos contenidos cuando exista una pieza completa y revisada. No enlazamos artículos inexistentes.</p></div>
        </section>
        <section className="py-16"><div className="mx-auto grid max-w-6xl gap-6 px-4 sm:px-6 md:grid-cols-3 lg:px-8">{plannedTopics.map(([title, summary]) => <article key={title} className="rounded-2xl border bg-card p-6 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wide text-primary">En preparación</p><h2 className="mt-3 text-lg font-semibold">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{summary}</p></article>)}</div></section>
      </main>
      <Footer />
    </div>
  )
}
