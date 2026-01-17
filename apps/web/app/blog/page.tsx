import type { Metadata } from 'next'
import Link from 'next/link'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export const metadata: Metadata = {
  title: 'Blog',
  description: 'Novedades, guias y consejos para academias con Akademate.',
}

const posts = [
  {
    title: 'Como aumentar la retencion de alumnos',
    excerpt: 'Estrategias simples para mejorar el engagement y la permanencia.',
    href: '/blog/retencion-alumnos',
  },
  {
    title: 'Digitaliza tu centro con procesos claros',
    excerpt: 'Un roadmap practico para modernizar tu academia en 90 dias.',
    href: '/blog/digitalizacion-centros',
  },
  {
    title: 'Indicadores clave para escuelas modernas',
    excerpt: 'Los KPIs que necesitas seguir para crecer con estabilidad.',
    href: '/blog/kpis-educacion',
  },
]

export default function BlogPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="bg-gradient-to-b from-primary/5 to-background py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Blog Akademate</h1>
              <p className="mt-4 text-lg text-muted-foreground">
                Ideas y recursos para transformar la experiencia educativa.
              </p>
            </div>
          </div>
        </section>

        <section className="py-12">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
            <div className="grid gap-6 md:grid-cols-3">
              {posts.map((post) => (
                <article key={post.title} className="rounded-2xl border bg-background p-6 shadow-sm">
                  <h2 className="text-lg font-semibold">{post.title}</h2>
                  <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
                  <Link
                    href={post.href}
                    className="mt-4 inline-flex text-sm font-medium text-primary hover:underline"
                  >
                    Leer mas →
                  </Link>
                </article>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
