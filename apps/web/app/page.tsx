import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Globe2 } from 'lucide-react'
import { AcademyOperationsStory } from '@/components/marketing/AcademyOperationsStory'
import { ConnectedExperiences } from '@/components/marketing/ConnectedExperiences'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import { ClientMarquee } from '@/components/marketing/ClientMarquee'
import { CourseRegistrationPreview } from '@/components/marketing/CourseRegistrationPreview'
import { ProductHeroCarousel } from '@/components/marketing/ProductHeroCarousel'
import { TrustSignals } from '@/components/marketing/TrustSignals'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { marketingText } from '@/lib/i18n/marketing-copy'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { homeIntegrationBrands } from '@/lib/integration-brands'
import { getPricingContent } from '@/lib/pricing-i18n'
import { getLocalizedVertical } from '@/lib/vertical-i18n'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/',
    copy: {
      en: {
        title: 'The operating system for academies',
        description:
          'Enrolment, teaching, payments and multi-site operations in one academy system.',
      },
      es: {
        title: 'El sistema operativo para academias',
        description: 'Matrículas, docencia, cobros y operación multisede en un solo sistema.',
      },
    },
  })
}

const homeVerticalSlugs = [
  'professional-training',
  'wellness',
  'sports',
  'languages',
  'seasonal',
  'networks',
  'performing-arts',
  'online-cohorts',
] as const

export default async function HomePage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const tx = (source: string) => marketingText(locale, source)
  const homePlans = getPricingContent(locale).page.cards
  const homeVerticals = homeVerticalSlugs.map((slug) => getLocalizedVertical(slug, locale)!)

  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture relative overflow-hidden bg-[#06142f] text-white">
          <div className="mx-auto grid min-h-[min(760px,calc(100dvh-73px))] max-w-[1440px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-10">
            <div className="max-w-[650px]">
              <p className="hero-item text-sm font-semibold text-blue-200">
                {dictionary.home.eyebrow}
              </p>
              <h1 className="hero-item mt-5 text-[2.8rem] font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.15rem]">
                {dictionary.home.title}
              </h1>
              <p className="hero-item mt-6 max-w-xl text-lg leading-8 text-blue-100/80">
                {dictionary.home.description}
              </p>
              <div className="hero-item mt-8 flex flex-wrap gap-3">
                <Link href={href('/contacto?asunto=demo')} className="button-primary-light group">
                  {dictionary.home.primaryCta}{' '}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link href={href('/features')} className="button-ghost-light">
                  {dictionary.home.secondaryCta}
                </Link>
              </div>
            </div>
            <ProductHeroCarousel />
          </div>
        </section>

        <section>
          <ClientMarquee />
          <TrustSignals />
        </section>

        <section id="reservations" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-700">{tx('Fill every course')}</p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {tx('Turn interest into a confirmed place.')}
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Publish an offer, take the booking and collect the payment.')}
              </p>
            </div>
            <div className="scroll-depth mt-10">
              <CourseRegistrationPreview />
            </div>
          </div>
        </section>

        <AcademyOperationsStory />

        <ConnectedExperiences />
        <div className="border-y border-blue-200 bg-[#eaf1ff] px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <ConnectorLogos hideStatus ids={homeIntegrationBrands} />
          </div>
        </div>

        <section id="solutions" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {tx('Built around your academy model.')}
            </h2>
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {homeVerticals.map((vertical) => (
                <Link
                  key={vertical.slug}
                  href={href(`/solutions/${vertical.slug}`)}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_18px_50px_rgba(7,22,51,.06)] transition hover:border-blue-300"
                >
                  <div className="relative aspect-[4/3] overflow-hidden bg-slate-200">
                    <Image
                      src={vertical.image}
                      alt={vertical.imageAlt}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                  </div>
                  <div className="px-4 py-5">
                    <h3 className="text-lg font-semibold tracking-tight text-[#071633]">
                      {vertical.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{vertical.description}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {tx('Choose the operating scope you need.')}
            </h2>
            <div className="mt-10 grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-3">
              {homePlans.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < homePlans.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}
                >
                  <p
                    className={`text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}
                  >
                    {plan.label}
                  </p>
                  <h3 className="mt-4 text-4xl font-semibold tracking-tight">{plan.name}</h3>
                  <p
                    className={`mt-5 leading-7 ${index === 1 ? 'text-blue-100/75' : 'text-slate-600'}`}
                  >
                    {plan.description}
                  </p>
                  <Link
                    href={href(`/contacto?asunto=${plan.subject}`)}
                    className={
                      index === 1 ? 'button-primary-light mt-9' : 'button-primary-dark mt-9'
                    }
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <Link
              href={href('/pricing')}
              className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
            >
              {tx('Compare plans')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="product-texture mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#071633] px-6 py-16 text-center text-white sm:px-12 lg:py-24">
            <Globe2
              className="mx-auto h-9 w-9 text-blue-300"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {tx('See Akademate on your academy.')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">
              {tx('EU-hosted. GDPR ready.')}
            </p>
            <Link href={href('/contacto?asunto=demo')} className="button-primary-light mt-9">
              {tx('Book a demo')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
