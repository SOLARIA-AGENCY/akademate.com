import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  Calculator,
  Cable,
  Check,
  ChevronDown,
  Cloud,
  Library,
  Megaphone,
  Minus,
  Monitor,
  QrCode,
  Rocket,
  Server,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { FinanceConnectorShowcase } from '@/components/marketing/FinanceConnectorShowcase'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { getPricingContent } from '@/lib/pricing-i18n'
import type { PlanComparisonSection, PlanEntitlement } from '@/lib/pricing-content'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/pricing',
    image: '/images/marketing/akademate-finance-accounting-v2.png',
    copy: {
      en: {
        title: 'Akademate pricing and plans',
        description:
          'Compare Launch, Business and Enterprise operating scopes for programmes, academies and multi-site organisations.',
      },
      es: {
        title: 'Planes y precios de Akademate',
        description:
          'Compara los alcances Launch, Business y Enterprise para programas, academias y organizaciones multisedes.',
      },
    },
  })
}

const planIcons = [Rocket, Cloud, Server] as const
const extensionIcons = [
  QrCode,
  Monitor,
  Megaphone,
  Calculator,
  UsersRound,
  Library,
  Bot,
  Cable,
] as const

export default async function PricingPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const pricing = getPricingContent(locale)
  const { page } = pricing

  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr 1.1fr] lg:gap-20">
            <div>
              <p className="text-sm font-semibold text-blue-200">{dictionary.pricing.eyebrow}</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
                {dictionary.pricing.title}
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-blue-100/75">
                {dictionary.pricing.description}
              </p>
              <Link href={href('/contacto?asunto=demo')} className="button-primary-light mt-9">
                {dictionary.pricing.primaryCta}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="scroll-depth relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#071633]">
              <Image
                src="/images/marketing/akademate-finance-accounting-v2.png"
                alt={page.imageAlt}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-3">
            {page.cards.map((plan, index) => {
              const Icon = planIcons[index] ?? Cloud
              return (
                <article
                  key={plan.name}
                  className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < page.cards.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}
                >
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? 'bg-white/10 text-blue-200' : 'bg-blue-50 text-blue-700'}`}
                  >
                    <Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />
                  </div>
                  <p
                    className={`mt-8 text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}
                  >
                    {plan.label}
                  </p>
                  <h2 className="mt-4 text-5xl font-semibold tracking-tight">{plan.name}</h2>
                  <p
                    className={`mt-6 leading-7 ${index === 1 ? 'text-blue-100/70' : 'text-slate-600'}`}
                  >
                    {plan.description}
                  </p>
                  <p className="mt-8 text-lg font-semibold">{page.proposal}</p>
                  <p
                    className={`mt-7 text-xs font-semibold ${index === 1 ? 'text-blue-200' : 'text-slate-500'}`}
                  >
                    {page.includedHeading}
                  </p>
                  <ul className="mt-4 space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check
                          className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-blue-300' : 'text-blue-700'}`}
                          aria-hidden="true"
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={href(`/contacto?asunto=${plan.subject}`)}
                    className={
                      index === 1 ? 'button-primary-light mt-10' : 'button-primary-dark mt-10'
                    }
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                  <a
                    href="#plan-comparison"
                    className={`mt-4 inline-flex min-h-11 items-center text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}
                  >
                    {page.comparisonLink}
                  </a>
                </article>
              )
            })}
          </div>
          <p className="mx-auto mt-7 max-w-7xl text-sm leading-6 text-slate-600">
            {page.proposalNote}
          </p>
        </section>

        <section
          id="paid-extensions"
          data-testid="pricing-paid-extensions"
          className="bg-[#071633] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.7fr_1.3fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-300">{page.extensionsEyebrow}</p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {page.extensionsTitle}
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-blue-100/70">
                {page.extensionsDescription}
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-4">
              {pricing.extensions.map((extension, index) => {
                const Icon = extensionIcons[index] ?? Cable
                return (
                  <article key={extension.id} className="bg-[#0a1b3b] p-6 sm:p-7">
                    <div className="flex items-center justify-between gap-4">
                      <Icon
                        className="h-6 w-6 text-blue-300"
                        strokeWidth={1.75}
                        aria-hidden="true"
                      />
                      <span className="rounded-full bg-blue-400/15 px-3 py-1 text-xs font-semibold text-blue-200">
                        {page.extensionLabel}
                      </span>
                    </div>
                    <h3 className="mt-7 text-2xl font-semibold tracking-tight">
                      {extension.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-blue-100/65">{extension.summary}</p>
                    <ul className="mt-6 space-y-3 text-sm text-blue-50">
                      {extension.includes.map((item) => (
                        <li key={item} className="flex items-start gap-2">
                          <Check
                            className="mt-0.5 h-4 w-4 shrink-0 text-blue-300"
                            aria-hidden="true"
                          />
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-6 border-t border-white/10 pt-5 text-xs leading-5 text-blue-100/55">
                      {page.extraCosts} {extension.separateCosts}
                    </p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section
          id="plan-comparison"
          data-testid="pricing-comparison"
          className="scroll-mt-24 bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28"
        >
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {page.comparisonTitle}
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {page.comparisonDescription}
            </p>

            <div className="mt-8 flex flex-wrap gap-3" aria-label={page.comparisonLegend}>
              {(['included', 'paid-extension', 'enterprise-scope', 'not-included'] as const).map(
                (value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <PlanValueDisplay value={value} compact labels={pricing.entitlementLabels} />{' '}
                    {pricing.entitlementLabels[value]}
                  </span>
                )
              )}
            </div>

            <div className="mt-12 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">{page.comparisonCaption}</caption>
                <thead className="sticky top-[72px] z-10">
                  <tr className="border-b bg-slate-50">
                    <th className="w-[40%] px-6 py-5 text-sm font-semibold">
                      {page.capabilityHeading}
                    </th>
                    <th className="w-[20%] px-6 py-5 text-center text-sm font-semibold">
                      {page.planNames[0]}
                    </th>
                    <th className="w-[20%] bg-blue-50 px-6 py-5 text-center text-sm font-semibold">
                      {page.planNames[1]}
                    </th>
                    <th className="w-[20%] px-6 py-5 text-center text-sm font-semibold">
                      {page.planNames[2]}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {pricing.sections.map((section) => (
                    <ComparisonRows
                      key={section.title}
                      section={section}
                      labels={pricing.entitlementLabels}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-3 md:hidden">
              {pricing.sections.map((section, index) => (
                <details
                  key={section.title}
                  open={index === 0}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-5 font-semibold marker:hidden">
                    {section.title}
                    <ChevronDown
                      className="h-4 w-4 transition group-open:rotate-180"
                      aria-hidden="true"
                    />
                  </summary>
                  <div className="border-t border-slate-200">
                    {section.rows.map((row) => (
                      <div
                        key={row.capability}
                        className="border-b border-slate-100 p-5 last:border-b-0"
                      >
                        <p className="text-sm font-semibold">{row.capability}</p>
                        {row.note ? (
                          <p className="mt-2 text-xs leading-5 text-slate-500">{row.note}</p>
                        ) : null}
                        <div className="mt-4 grid grid-cols-3 gap-2 text-center text-[11px] font-semibold text-slate-500">
                          <MobilePlanValue
                            label={page.planNames[0]}
                            value={row.launch}
                            labels={pricing.entitlementLabels}
                          />
                          <MobilePlanValue
                            label={page.planNames[1]}
                            value={row.business}
                            featured
                            labels={pricing.entitlementLabels}
                          />
                          <MobilePlanValue
                            label={page.planNames[2]}
                            value={row.enterprise}
                            labels={pricing.entitlementLabels}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section
          data-testid="pricing-separate-costs"
          className="border-y border-slate-200 bg-[#f7f9fc] px-4 py-16 sm:px-6 lg:px-8"
        >
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.75fr_1.25fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-blue-700">{page.scopeEyebrow}</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {page.scopeTitle}
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-slate-600">{page.scopeDescription}</p>
            </div>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {pricing.separatelyBilledItems.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-3 border-b border-slate-200 pb-4 text-sm leading-6 text-slate-700"
                >
                  <WalletCards
                    className="mt-0.5 h-4 w-4 shrink-0 text-blue-700"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <FinanceConnectorShowcase locale={locale} imageSrc="/images/marketing/akademate-finance-workspace-v1.png" imageAlt={locale === 'es' ? 'Vista ilustrativa del espacio financiero de Akademate' : 'Illustrative Akademate finance workspace'} />

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr 1.22fr] lg:items-start lg:gap-20">
            <div>
              <WalletCards
                className="h-8 w-8 text-blue-700"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                {page.financeTitle}
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">{page.financeDescription}</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {page.financeCards.map(({ title, text }) => (
                <article key={title} className="rounded-2xl bg-[#eaf1ff] p-7">
                  <h3 className="text-xl font-semibold">{title}</h3>
                  <p className="mt-4 text-sm leading-6 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
              {page.questionsTitle}
            </h2>
            <div className="mt-12 divide-y border border-blue-200">
              {page.faqs.map(({ question, answer }) => (
                <details key={question} className="group py-6">
                  <summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">
                    {question}
                  </summary>
                  <p className="mt-4 max-w-3xl leading-7 text-slate-600">{answer}</p>
                </details>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function ComparisonRows({
  section,
  labels,
}: {
  section: PlanComparisonSection
  labels: Record<PlanEntitlement, string>
}) {
  return (
    <>
      <tr className="border-y border-slate-200 bg-slate-50/80">
        <th colSpan={4} className="px-6 py-3 text-xs font-semibold text-blue-700">
          {section.title}
        </th>
      </tr>
      {section.rows.map((row) => (
        <tr key={row.capability} className="border-b border-slate-100">
          <th scope="row" className="px-6 py-4 text-sm font-medium text-slate-700">
            {row.capability}
            {row.note ? (
              <span className="mt-1 block text-xs font-normal leading-5 text-slate-500">
                {row.note}
              </span>
            ) : null}
          </th>
          <td className="px-6 py-4 text-center">
            <PlanValueDisplay value={row.launch} labels={labels} />
          </td>
          <td className="bg-blue-50/60 px-6 py-4 text-center">
            <PlanValueDisplay value={row.business} labels={labels} />
          </td>
          <td className="px-6 py-4 text-center">
            <PlanValueDisplay value={row.enterprise} labels={labels} />
          </td>
        </tr>
      ))}
    </>
  )
}

function PlanValueDisplay({
  value,
  compact = false,
  labels,
}: {
  value: PlanEntitlement
  compact?: boolean
  labels: Record<PlanEntitlement, string>
}) {
  if (value === 'included')
    return <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label={labels.included} />
  if (value === 'not-included')
    return <Minus className="mx-auto h-5 w-5 text-slate-300" aria-label={labels['not-included']} />
  if (compact)
    return (
      <span
        className={`h-2.5 w-2.5 rounded-full ${value === 'paid-extension' ? 'bg-amber-500' : 'bg-blue-700'}`}
        aria-hidden="true"
      />
    )
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${value === 'paid-extension' ? 'bg-amber-50 text-amber-800' : 'bg-blue-100 text-blue-800'}`}
    >
      {labels[value]}
    </span>
  )
}

function MobilePlanValue({
  label,
  value,
  featured = false,
  labels,
}: {
  label: string
  value: PlanEntitlement
  featured?: boolean
  labels: Record<PlanEntitlement, string>
}) {
  return (
    <div className={`rounded-xl p-3 ${featured ? 'bg-blue-50' : 'bg-slate-50'}`}>
      <span className="block">{label}</span>
      <span className="mt-2 flex min-h-6 items-center justify-center">
        <PlanValueDisplay value={value} labels={labels} />
      </span>
    </div>
  )
}
