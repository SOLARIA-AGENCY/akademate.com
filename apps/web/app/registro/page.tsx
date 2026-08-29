import type { Metadata } from 'next'
import Image from 'next/image'
import { Suspense } from 'react'
import { ContactForm } from '@/components/forms/contact-form'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/registro',
    copy: {
      en: {
        title: 'Start a free Akademate trial',
        description: 'Open a free trial for your academy model.',
      },
      es: {
        title: 'Empieza una prueba gratis de Akademate',
        description: 'Abre una prueba gratis para el modelo de tu academia.',
      },
    },
  })
}

export default async function RegistrationPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)

  return (
    <div className="marketing-page min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl gap-14 lg:grid-cols-2 lg:gap-20">
            <div>
              <div className="scroll-depth relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#071633]">
                <Image
                  src="/images/marketing/akademate-implementation-planner-v2.png"
                  alt={dictionary.contact.imageAlt}
                  fill
                  priority
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  className="object-cover"
                />
              </div>
              <p className="section-kicker mt-10">{dictionary.trial.eyebrow}</p>
              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
                {dictionary.trial.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">{dictionary.trial.description}</p>
            </div>
            <section className="self-start rounded-2xl bg-slate-50 p-6 sm:p-10 lg:sticky lg:top-28">
              <h2 className="text-3xl font-semibold tracking-tight">{dictionary.trial.formTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {dictionary.trial.formDescription}
              </p>
              <Suspense
                fallback={
                  <p className="mt-8 text-sm text-slate-500">{dictionary.contact.loadingForm}</p>
                }
              >
                <ContactForm />
              </Suspense>
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
