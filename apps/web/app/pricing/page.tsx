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
import { plans } from '@/lib/marketing-content'
import {
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  separatelyBilledItems,
  type PlanComparisonSection,
  type PlanEntitlement,
} from '@/lib/pricing-content'

export const metadata: Metadata = {
  title: 'Pricing',
  description:
    'Launch, Business and Enterprise operating models for seasonal programmes, growing academies and multi-site organisations.',
  alternates: { canonical: '/pricing' },
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

export default function PricingPage() {
  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr 1.1fr] lg:gap-20">
            <div>
              <p className="section-kicker">Plans shaped around your operation</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
                A plan for every stage.
              </h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">
                Launch one programme, run an academy or scale a network.
              </p>
              <Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">
                Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="scroll-depth relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#071633]">
              <Image
                src="/images/marketing/akademate-finance-accounting-v2.png"
                alt="Akademate finance and accounting workspace across desktop and tablet"
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
            {plans.map((plan, index) => {
              const Icon = planIcons[index] ?? Cloud
              return (
                <article
                  key={plan.name}
                  className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < plans.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}
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
                  <p className="mt-8 text-lg font-semibold">Tailored proposal</p>
                  <p
                    className={`mt-7 text-xs font-semibold ${index === 1 ? 'text-blue-200' : 'text-slate-500'}`}
                  >
                    WHAT&apos;S INCLUDED
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
                    href={`/contacto?asunto=${plan.subject}`}
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
                    View complete inclusion list
                  </a>
                </article>
              )
            })}
          </div>
          <p className="mx-auto mt-7 max-w-7xl text-sm leading-6 text-slate-600">
            Every proposal reflects your scale, integrations and operating model.
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
                <p className="text-sm font-semibold text-blue-300">Optional paid modules</p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  Add the modules you need.
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-blue-100/70">
                Add specialist modules through a separately scoped commercial extension.
              </p>
            </div>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/15 bg-white/15 md:grid-cols-2 lg:grid-cols-4">
              {paidExtensions.map((extension, index) => {
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
                        Paid extension
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
                      Extra costs: {extension.separateCosts}
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
              Compare every plan.
            </h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Every capability is labelled as included, a paid extension or Enterprise scope.
            </p>

            <div className="mt-8 flex flex-wrap gap-3" aria-label="Plan comparison legend">
              {(['included', 'paid-extension', 'enterprise-scope', 'not-included'] as const).map(
                (value) => (
                  <span
                    key={value}
                    className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700"
                  >
                    <PlanValueDisplay value={value} compact /> {entitlementLabels[value]}
                  </span>
                )
              )}
            </div>

            <div className="mt-12 hidden overflow-hidden rounded-2xl border border-slate-200 bg-white md:block">
              <table className="w-full border-collapse text-left">
                <caption className="sr-only">
                  Detailed comparison of Launch, Business and Enterprise plans
                </caption>
                <thead className="sticky top-[72px] z-10">
                  <tr className="border-b bg-slate-50">
                    <th className="w-[40%] px-6 py-5 text-sm font-semibold">Capability</th>
                    <th className="w-[20%] px-6 py-5 text-center text-sm font-semibold">Launch</th>
                    <th className="w-[20%] bg-blue-50 px-6 py-5 text-center text-sm font-semibold">
                      Business
                    </th>
                    <th className="w-[20%] px-6 py-5 text-center text-sm font-semibold">
                      Enterprise
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {planComparisonSections.map((section) => (
                    <ComparisonRows key={section.title} section={section} />
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-10 space-y-3 md:hidden">
              {planComparisonSections.map((section, index) => (
                <details
                  key={section.title}
                  open={index === 0}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-5 py-5 font-semibold marker:hidden">
                    {section.title}
                    <ChevronDown className="h-4 w-4 transition group-open:rotate-180" />
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
                          <MobilePlanValue label="Launch" value={row.launch} />
                          <MobilePlanValue label="Business" value={row.business} featured />
                          <MobilePlanValue label="Enterprise" value={row.enterprise} />
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
              <p className="text-sm font-semibold text-blue-700">Commercial scope</p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                Costs quoted separately.
              </h2>
              <p className="mt-4 max-w-lg leading-7 text-slate-600">
                Proposals separate platform, implementation and external costs.
              </p>
            </div>
            <ul className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {separatelyBilledItems.map((item) => (
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

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr 1.22fr] lg:items-start lg:gap-20">
            <div>
              <WalletCards
                className="h-8 w-8 text-blue-700"
                strokeWidth={1.75}
                aria-hidden="true"
              />
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                Your revenue. Your control.
              </h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                Route every payment to the right operating account.
              </p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [
                  'Stripe, PayPal and SEPA',
                  'Provider adapters can support card, wallet and direct-debit based payment journeys.',
                ],
                [
                  'Deposits and instalments',
                  'Configure what is due at reservation, before a start date or on a recurring schedule.',
                ],
                [
                  'Memberships and session packs',
                  'Support recurring access, class packs and renewal-oriented models.',
                ],
                [
                  'Finance APIs and reconciliation',
                  'Prepare payment state for invoicing, accounting, banking or ERP workflows.',
                ],
              ].map(([title, text]) => (
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
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Questions</h2>
            <div className="mt-12 divide-y border border-blue-200">
              {[
                [
                  'Why are prices not listed?',
                  'Every academy is scoped around its programmes, users and operating model.',
                ],
                [
                  'Can Launch support a summer camp?',
                  'Yes. Launch supports dates, capacity, booking, deposits and communication.',
                ],
                [
                  'Can payments use Stripe, PayPal or SEPA?',
                  'Provider adapters support Stripe, PayPal and SEPA where available.',
                ],
                [
                  'Can Enterprise run on-premise?',
                  'Yes. Enterprise can run on-premise or in a dedicated private cloud.',
                ],
                [
                  'How does AI fit into a plan?',
                  'AI workspace and MCP are optional paid extensions to the academy operating platform.',
                ],
                [
                  'Are QR, NFC and Digital Signage included?',
                  'Each is a paid extension. Hardware and licences are separate.',
                ],
              ].map(([question, answer]) => (
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

function ComparisonRows({ section }: { section: PlanComparisonSection }) {
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
            <PlanValueDisplay value={row.launch} />
          </td>
          <td className="bg-blue-50/60 px-6 py-4 text-center">
            <PlanValueDisplay value={row.business} />
          </td>
          <td className="px-6 py-4 text-center">
            <PlanValueDisplay value={row.enterprise} />
          </td>
        </tr>
      ))}
    </>
  )
}

function PlanValueDisplay({
  value,
  compact = false,
}: {
  value: PlanEntitlement
  compact?: boolean
}) {
  if (value === 'included')
    return <Check className="mx-auto h-5 w-5 text-emerald-600" aria-label="Included" />
  if (value === 'not-included')
    return <Minus className="mx-auto h-5 w-5 text-slate-300" aria-label="Not included" />
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
      {entitlementLabels[value]}
    </span>
  )
}

function MobilePlanValue({
  label,
  value,
  featured = false,
}: {
  label: string
  value: PlanEntitlement
  featured?: boolean
}) {
  return (
    <div className={`rounded-xl p-3 ${featured ? 'bg-blue-50' : 'bg-slate-50'}`}>
      <span className="block">{label}</span>
      <span className="mt-2 flex min-h-6 items-center justify-center">
        <PlanValueDisplay value={value} />
      </span>
    </div>
  )
}
