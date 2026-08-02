import type { Metadata } from 'next'
import Link from 'next/link'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { localizedAlternates, localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { getSecondaryPublicContent } from '@/lib/secondary-public-content'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  const { metadata } = getSecondaryPublicContent(locale).courses
  return { ...metadata, alternates: localizedAlternates('/cursos') }
}

export default async function CoursesPage() {
  const locale = await getRequestLocale()
  const content = getSecondaryPublicContent(locale).courses

  return (
    <div className="marketing-page flex min-h-screen flex-col">
      <Header />
      <main id="content" className="flex flex-1 items-center px-4 py-20 sm:px-6">
        <section className="mx-auto max-w-3xl">
          <p className="text-sm font-semibold text-primary">{content.kicker}</p>
          <h1 className="mt-3 text-4xl font-bold tracking-tight">
            {content.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            {content.description}
          </p>
          <div className="mt-8 rounded-2xl border bg-muted/30 p-6 text-sm leading-7 text-muted-foreground">
            {content.detail}
          </div>
          <Link
            href={localizedHref('/contacto?asunto=demo', locale)}
            className="mt-8 inline-flex min-h-11 items-center rounded-md bg-primary px-5 py-3 font-medium text-primary-foreground hover:bg-primary/90"
          >
            {content.cta}
          </Link>
        </section>
      </main>
      <Footer />
    </div>
  )
}
