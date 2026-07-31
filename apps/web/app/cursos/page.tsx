import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'

export const metadata: Metadata = {
  title: 'Course discovery and academy catalogues',
  description: 'Discover how Akademate helps each academy publish programmes, dates, places and booking journeys.',
  alternates: { canonical: '/cursos' },
}

export default function CoursesPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="contenido" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-primary">Academy-powered catalogues</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">Turn every programme into a clear path to enrolment.</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Akademate gives each academy its own space to publish courses, cohorts, schedules, availability and booking options. Learners discover the right programme on the academy&apos;s branded experience and move from interest to a confirmed place with less friction.
          </p>
          <div className="mt-8 rounded-2xl border bg-muted/30 p-6 text-sm leading-7 text-muted-foreground">
            Looking for a specific course? Visit the academy that provides it. Planning your own catalogue? We&apos;ll show you how discovery, admissions, payments and learning delivery connect in one operating flow.
          </div>
          <Link href="/contacto?asunto=demo" className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90">See the catalogue experience</Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
