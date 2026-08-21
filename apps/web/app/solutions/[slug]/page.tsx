import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { VerticalProductExperience } from '@/components/marketing/VerticalProductExperience'
import { getRequestLocale } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/routing'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { verticals } from '@/lib/marketing-content'
import { getVerticalExperienceContent } from '@/lib/vertical-experience-content'
import {
  getLocalizedSolutionDetail,
  getLocalizedVertical,
  verticalPageChrome,
} from '@/lib/vertical-i18n'

export function generateStaticParams() {
  return verticals.map(({ slug }) => ({ slug }))
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const locale = await getRequestLocale()
  const vertical = getLocalizedVertical(slug, locale)
  if (!vertical) return {}
  const detail = getLocalizedSolutionDetail(slug, locale)
  if (!detail) return {}
  const englishVertical = getLocalizedVertical(slug, 'en')
  const englishDetail = getLocalizedSolutionDetail(slug, 'en')
  const spanishVertical = getLocalizedVertical(slug, 'es')
  const spanishDetail = getLocalizedSolutionDetail(slug, 'es')
  if (!englishVertical || !englishDetail || !spanishVertical || !spanishDetail) return {}

  return publicPageMetadata({
    locale,
    pathname: `/solutions/${slug}`,
    image: vertical.image,
    copy: {
      en: {
        title: `${englishVertical.title} management software`,
        description: `${englishDetail.promise} Manage ${englishDetail.modules.join(', ').toLowerCase()} with Akademate.`,
      },
      es: {
        title: `Software de gestión para ${spanishVertical.title.toLowerCase()}`,
        description: `${spanishDetail.promise} Gestiona ${spanishDetail.modules.join(', ').toLowerCase()} con Akademate.`,
      },
    },
  })
}

export default async function SolutionPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const locale = await getRequestLocale()
  const vertical = getLocalizedVertical(slug, locale)
  if (!vertical) notFound()
  const detail = getLocalizedSolutionDetail(slug, locale)
  if (!detail) notFound()
  const chrome = verticalPageChrome[locale]
  const experience = getVerticalExperienceContent(slug, locale)
  if (!experience) notFound()
  const mediaFirst = verticals.findIndex((item) => item.slug === slug) % 2 === 0
  const href = (path: string) => localizedHref(path, locale)
  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="relative flex min-h-[calc(100dvh-73px)] items-end overflow-hidden bg-[#071633] text-white">
          <Image
            src={vertical.image}
            alt={vertical.imageAlt}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,39,.95),rgba(3,15,39,.72)_45%,rgba(3,15,39,.12))]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-14 sm:px-6 lg:px-8 lg:pb-20">
            <p className="text-sm font-semibold text-blue-200">
              {chrome.heroPrefix} {vertical.title}
            </p>
            <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
              {detail.headline}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-white/80">{detail.promise}</p>
            <Link href={href('/contacto?asunto=demo')} className="button-primary-light mt-8">
              {chrome.heroCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {chrome.outcomesTitle}
            </h2>
            <div className="mt-12 grid gap-5 md:grid-cols-2">
              {detail.outcomes.map((outcome) => (
                <div key={outcome} className="flex gap-4 rounded-2xl bg-white p-6 shadow-sm">
                  <CheckCircle2 className="h-6 w-6 shrink-0 text-blue-700" aria-hidden="true" />
                  <p className="text-lg font-semibold">{outcome}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="overflow-hidden bg-[#eaf1ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div
            className={`mx-auto grid max-w-7xl items-center gap-10 lg:grid-cols-2 lg:gap-16 ${mediaFirst ? '' : 'lg:[&>*:first-child]:order-2'}`}
          >
            <div className="relative aspect-[3/2] overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_26px_80px_rgba(7,22,51,.13)]">
              <Image
                src={experience.image}
                alt={experience.imageAlt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </div>
            <div>
              <p className="text-sm font-semibold text-blue-700">{experience.eyebrow}</p>
              <h2 className="mt-5 max-w-2xl text-3xl font-semibold tracking-[-0.045em] sm:text-4xl">
                {experience.title}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {experience.description}
              </p>
              <div className="mt-9 grid gap-3">
                {experience.roles.map((role) => (
                  <article
                    key={role.title}
                    className="rounded-2xl border border-blue-200 bg-white p-5"
                  >
                    <h3 className="font-semibold text-[#071633]">{role.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{role.text}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold text-blue-700">{chrome.experienceEyebrow}</p>
            <h2 className="mt-5 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {chrome.experienceTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {chrome.experienceDescription}
            </p>
            <div className="mt-12">
              <VerticalProductExperience slug={vertical.slug} locale={locale} />
            </div>
            <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {detail.workflow.map((step, index) => (
                <div key={step} className="border-t-2 border-blue-600 pt-5">
                  <span className="text-xs text-blue-700">0{index + 1}</span>
                  <h3 className="mt-4 text-xl font-semibold">{step}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">
                    {chrome.poweredBy} {detail.modules[index]}.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl rounded-2xl bg-[#071633] p-8 text-center text-white sm:p-14">
            <h2 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">
              {chrome.closingTitle}
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-lg leading-8 text-blue-100/70">
              {chrome.closingDescription}
            </p>
            <Link href={href('/contacto?asunto=demo')} className="button-primary-light mt-8">
              {experience.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
