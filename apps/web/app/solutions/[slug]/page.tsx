import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight, CheckCircle2, Quote } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { VerticalProductExperience } from '@/components/marketing/VerticalProductExperience'
import { getRequestLocale } from '@/lib/i18n/server'
import { localizedHref } from '@/lib/i18n/routing'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { integrationPillars, verticals } from '@/lib/marketing-content'
import { getPricingContent } from '@/lib/pricing-i18n'
import { verticalAddonChips, type VerticalSlug } from '@/lib/vertical-landing-content'
import { getVerticalExperienceContent } from '@/lib/vertical-experience-content'
import {
  getLocalizedSolutionDetail,
  getLocalizedVertical,
  getVerticalLandingCopy,
  getVerticalProofQuotes,
  verticalPageChrome,
} from '@/lib/vertical-i18n'

const LIVE_ACADEMY_URL = 'https://cepformacion.akademate.com'

function jsonLdScript(data: object) {
  return { __html: JSON.stringify(data).replace(/</g, '\\u003c') }
}

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
  const englishVertical = getLocalizedVertical(slug, 'en')
  const spanishVertical = getLocalizedVertical(slug, 'es')
  const englishLanding = getVerticalLandingCopy(slug, 'en')
  const spanishLanding = getVerticalLandingCopy(slug, 'es')
  if (!englishVertical || !spanishVertical || !englishLanding || !spanishLanding) return {}

  return publicPageMetadata({
    locale,
    pathname: `/solutions/${slug}`,
    image: vertical.image,
    copy: {
      en: { title: englishLanding.seoTitle, description: englishLanding.metaDescription },
      es: { title: spanishLanding.seoTitle, description: spanishLanding.metaDescription },
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
  const landing = getVerticalLandingCopy(slug, locale)
  if (!landing) notFound()
  const chrome = verticalPageChrome[locale]
  const experience = getVerticalExperienceContent(slug, locale)
  if (!experience) notFound()
  const quotes = getVerticalProofQuotes(slug, locale)
  const pricing = getPricingContent(locale)
  const mediaFirst = verticals.findIndex((item) => item.slug === slug) % 2 === 0
  const siblings = verticals
    .filter((item) => item.slug !== slug)
    .map((item) => getLocalizedVertical(item.slug, locale))
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
  const addonChips = (verticalAddonChips[slug as VerticalSlug] ?? [])
    .map((id) => pricing.extensions.find((extension) => extension.id === id))
    .filter((extension): extension is (typeof pricing.extensions)[number] => Boolean(extension))
  const href = (path: string) => localizedHref(path, locale)
  const demoHref = href(`/contacto?asunto=demo&vertical=${slug}`)

  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: landing.faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: { '@type': 'Answer', text: faq.answer },
    })),
  }
  const appJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: `Akademate ${vertical.title}`,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    description: landing.metaDescription,
    publisher: {
      '@type': 'Organization',
      name: 'Akademate',
      url: 'https://www.akademate.com',
    },
  }

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
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link href={demoHref} className="button-primary-light">
                {chrome.heroCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span
                aria-disabled="true"
                className="inline-flex min-h-12 cursor-not-allowed items-center justify-center rounded-full border border-white/25 px-6 py-3 text-sm font-semibold text-white/60"
              >
                {chrome.heroSecondaryCta}
              </span>
            </div>
            <p className="mt-4 text-sm text-blue-200">{chrome.heroTrust}</p>
          </div>
        </section>
        <section className="border-b border-slate-200 bg-white px-4 py-10 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                {chrome.proofEyebrow}
              </p>
              <p className="text-sm text-slate-600">{chrome.proofTitle}</p>
              <a
                href={LIVE_ACADEMY_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
              >
                {chrome.proofLink} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
            {quotes.length > 0 && (
              <div className="mt-6 grid gap-4 md:grid-cols-3">
                {quotes.map((quote) => (
                  <figure key={quote.author} className="rounded-2xl bg-[#f7f9fc] p-5">
                    <Quote className="h-4 w-4 text-blue-700" aria-hidden="true" />
                    <blockquote className="mt-2 text-sm font-semibold leading-6">
                      “{quote.quote}”
                    </blockquote>
                    <figcaption className="mt-2 text-xs text-slate-500">
                      {quote.author} · {chrome.proofEyebrow}
                    </figcaption>
                  </figure>
                ))}
              </div>
            )}
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
              <h2 className="mt-5 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {experience.title}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {experience.description}
              </p>
              <div className="mt-9 grid gap-3 sm:grid-cols-3">
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
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold text-blue-700">{chrome.integrationsEyebrow}</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {chrome.integrationsTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {chrome.integrationsDescription}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {integrationPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="rounded-2xl border border-slate-200 bg-white p-6"
                >
                  <h3 className="font-semibold text-[#071633]">{pillar.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{pillar.text}</p>
                  <p className="mt-4 flex flex-wrap gap-2">
                    {pillar.providers.map((provider) => (
                      <span
                        key={provider}
                        className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-800"
                      >
                        {provider}
                      </span>
                    ))}
                  </p>
                </article>
              ))}
            </div>
            <p className="mt-6 max-w-2xl text-sm leading-6 text-slate-600">
              {landing.integrationNote}
            </p>
            {addonChips.length > 0 && (
              <div className="mt-6 flex flex-wrap gap-2">
                {addonChips.map((addon) => (
                  <Link
                    key={addon.id}
                    href={href('/pricing#paid-extensions')}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                      addon.status === 'coming-soon'
                        ? 'border-slate-200 text-slate-500 hover:border-slate-300'
                        : 'border-blue-200 bg-blue-50 text-blue-800 hover:border-blue-300'
                    }`}
                  >
                    {addon.title}
                    {addon.status === 'coming-soon' ? ` · ${chrome.comingSoonLabel}` : ''}
                  </Link>
                ))}
              </div>
            )}
            <Link
              href={href('/features')}
              className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-blue-700 underline-offset-4 hover:underline"
            >
              {chrome.exploreModules} <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </section>
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold text-blue-700">{chrome.pricingEyebrow}</p>
            <h2 className="mt-5 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {chrome.pricingTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {chrome.pricingDescription}
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {pricing.page.cards.map((card) => (
                <article
                  key={card.name}
                  className="flex flex-col rounded-2xl border border-slate-200 bg-[#f7f9fc] p-6"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-700">
                    {card.label}
                  </p>
                  <h3 className="mt-3 text-2xl font-semibold">{card.name}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{card.description}</p>
                </article>
              ))}
            </div>
            <div className="mt-8">
              <Link href={href('/pricing')} className="button-primary-dark">
                {chrome.comparePlans} <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(faqJsonLd)}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={jsonLdScript(appJsonLd)}
        />
        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-4xl">
            <p className="text-sm font-semibold text-blue-700">{chrome.faqEyebrow}</p>
            <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {landing.faqHeading}
            </h2>
            <div className="mt-10 divide-y divide-slate-200 border-y border-slate-200">
              {landing.faqs.map((faq) => (
                <details key={faq.question} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold">
                    {faq.question}
                    <ArrowRight
                      className="h-4 w-4 shrink-0 rotate-90 text-blue-700 transition group-open:-rotate-90"
                      aria-hidden="true"
                    />
                  </summary>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {chrome.bridgeTitle}
            </h2>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-slate-600">
              {chrome.bridgeDescription}
            </p>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {siblings.map((sibling) => (
                <Link
                  key={sibling.slug}
                  href={href(`/solutions/${sibling.slug}`)}
                  className="group rounded-2xl border border-slate-200 p-5 transition hover:border-blue-300 hover:bg-[#f7f9fc]"
                >
                  <h3 className="font-semibold text-[#071633]">{sibling.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{sibling.description}</p>
                  <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-blue-700">
                    {chrome.exploreSolution}
                    <ArrowRight
                      className="h-3.5 w-3.5 transition group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </span>
                </Link>
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
            <Link href={demoHref} className="button-primary-light mt-8">
              {chrome.closingCta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
