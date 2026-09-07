import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { localizedHref } from '@/lib/i18n/routing'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { getRequestLocale } from '@/lib/i18n/server'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/registro',
    copy: {
      en: {
        title: 'Akademate trials open soon',
        description:
          'Self-serve registration is coming soon. Book a demo and we will set your academy up with you.',
      },
      es: {
        title: 'Las pruebas de Akademate abren pronto',
        description:
          'El registro autoservicio llega pronto. Reserva una demo y configuramos tu academia contigo.',
      },
    },
  })
}

export default async function RegistrationPage() {
  const locale = await getRequestLocale()
  const href = (path: string) => localizedHref(path, locale)
  const copy =
    locale === 'es'
      ? {
          eyebrow: 'Prueba gratuita',
          title: 'Los registros abren pronto.',
          description:
            'Estamos incorporando nuestras primeras academias de forma personal. Reserva una demo y configuramos tu academia contigo, con tu modelo y tus programas.',
          pill: 'Próximamente',
          panelTitle: '¿Quieres entrar antes?',
          panelText:
            'Mientras el registro autoservicio no está abierto, la vía rápida es una demo: la preparamos con tus datos y tu preset de academia.',
          demoCta: 'Reservar una demo',
          plansCta: 'Ver planes',
        }
      : {
          eyebrow: 'Free trial',
          title: 'Registration opens soon.',
          description:
            'We are onboarding our first academies personally. Book a demo and we will set your academy up with you, your model and your programmes.',
          pill: 'Coming soon',
          panelTitle: 'Want in early?',
          panelText:
            'While self-serve registration is closed, the fast route is a demo: we prepare it with your data and your academy preset.',
          demoCta: 'Book a demo',
          plansCta: 'Compare plans',
        }

  return (
    <div className="marketing-page min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <span className="inline-flex items-center rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-800">
              {copy.pill}
            </span>
            <p className="section-kicker mt-8">{copy.eyebrow}</p>
            <h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{copy.description}</p>
            <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-6 sm:p-10">
              <h2 className="text-3xl font-semibold tracking-tight">{copy.panelTitle}</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">{copy.panelText}</p>
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link href={href('/contacto?asunto=demo')} className="button-primary-dark">
                  {copy.demoCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link
                  href={href('/pricing')}
                  className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
                >
                  {copy.plansCta}
                </Link>
              </div>
            </div>
            <div className="relative mt-14 aspect-[3/1] overflow-hidden rounded-2xl bg-[#071633] sm:aspect-[4/1]">
              <Image
                src="/images/marketing/akademate-implementation-planner-v2.png"
                alt={
                  locale === 'es'
                    ? 'Planificador de implementación de Akademate'
                    : 'Akademate implementation planner'
                }
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover object-top"
              />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
