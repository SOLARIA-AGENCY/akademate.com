import type { Metadata } from 'next'
import Image from 'next/image'
import { Mail, Route, UsersRound } from 'lucide-react'
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
    pathname: '/contacto',
    copy: {
      en: {
        title: 'Contact',
        description: 'Book an Akademate demo or discuss your academy operating model.',
      },
      es: {
        title: 'Contacto',
        description: 'Reserva una demo de Akademate o cuéntanos cómo opera tu academia.',
      },
    },
  })
}

export default async function ContactPage() {
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
              <p className="section-kicker mt-10">{dictionary.contact.eyebrow}</p>
              <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
                {dictionary.contact.title}
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                {dictionary.contact.description}
              </p>
              <div className="mt-10 space-y-6 border-y py-8">
                <ContactPoint
                  icon={Route}
                  title={dictionary.contact.goalsTitle}
                  text={dictionary.contact.goalsText}
                />
                <ContactPoint
                  icon={UsersRound}
                  title={dictionary.contact.peopleTitle}
                  text={dictionary.contact.peopleText}
                />
                <ContactPoint
                  icon={Mail}
                  title={dictionary.contact.emailTitle}
                  text={dictionary.contact.emailText}
                  href="mailto:info@akademate.com"
                />
              </div>
            </div>
            <section className="self-start rounded-2xl bg-slate-50 p-6 sm:p-10 lg:sticky lg:top-28">
              <h2 className="text-3xl font-semibold tracking-tight">
                {dictionary.contact.formTitle}
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                {dictionary.contact.formDescription} {dictionary.contact.responseSla}
              </p>
              <noscript>
                <p className="mt-8 rounded-lg border border-slate-200 bg-white p-4 text-sm leading-6 text-slate-600">
                  {dictionary.contact.noscriptFallback}
                </p>
              </noscript>
              <ContactForm />
            </section>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function ContactPoint({
  icon: Icon,
  title,
  text,
  href,
}: {
  icon: typeof Mail
  title: string
  text: string
  href?: string
}) {
  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
        <Icon className="h-5 w-5" aria-hidden="true" />
      </div>
      <div>
        <h2 className="font-semibold">{title}</h2>
        {href ? (
          <a href={href} className="mt-1 inline-block text-sm text-blue-700 hover:underline">
            {text}
          </a>
        ) : (
          <p className="mt-1 text-sm leading-6 text-slate-600">{text}</p>
        )}
      </div>
    </div>
  )
}
