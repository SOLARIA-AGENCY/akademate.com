import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { cms } from '@/lib/cms'
import { formatCurrency } from '@/lib/utils'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const course = await cms.getCourseBySlug(slug).catch(() => null)
  if (!course) return { title: 'Curso no disponible', robots: { index: false, follow: false } }
  return {
    title: course.title,
    description: course.shortDescription ?? course.description,
    alternates: { canonical: `/cursos/${course.slug}` },
  }
}

export default async function CourseDetailPage({ params }: PageProps) {
  const { slug } = await params
  const course = await cms.getCourseBySlug(slug).catch(() => null)
  if (!course) notFound()

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1">
        <section className="border-b bg-gradient-to-b from-primary/5 to-background py-16">
          <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
            <p className="text-sm font-semibold text-primary">{course.category}</p>
            <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-5xl">{course.title}</h1>
            <p className="mt-5 max-w-3xl text-lg leading-8 text-muted-foreground">{course.shortDescription ?? course.description}</p>
          </div>
        </section>
        <section className="py-14">
          <div className="mx-auto grid max-w-4xl gap-8 px-4 sm:px-6 md:grid-cols-[1fr_18rem] lg:px-8">
            <div><h2 className="text-xl font-semibold">Información publicada</h2><p className="mt-4 whitespace-pre-line text-sm leading-7 text-muted-foreground">{course.description}</p></div>
            <aside className="h-fit rounded-2xl border bg-card p-6 shadow-sm" aria-label="Datos del curso">
              <dl className="space-y-4 text-sm"><div><dt className="text-muted-foreground">Duración</dt><dd className="font-medium">{course.duration > 0 ? `${course.duration} h` : 'Por confirmar'}</dd></div><div><dt className="text-muted-foreground">Nivel</dt><dd className="font-medium">{course.level}</dd></div><div><dt className="text-muted-foreground">Precio publicado</dt><dd className="font-medium">{course.price > 0 ? formatCurrency(course.price, course.currency) : 'Consultar'}</dd></div></dl>
              <Link href={`/contacto?curso=${encodeURIComponent(course.slug)}`} className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-md bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90">Consultar disponibilidad</Link>
            </aside>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
