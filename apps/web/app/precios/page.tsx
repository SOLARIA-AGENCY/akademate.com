import type { Metadata } from 'next'
import Link from 'next/link'
import { Fragment } from 'react'
import { ArrowRight, Check, CircleHelp, Plus, ShieldCheck, X } from 'lucide-react'

import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import {
  entitlementDescriptions,
  entitlementLabels,
  paidExtensions,
  planComparisonSections,
  planLabels,
  separatelyBilledItems,
  type PlanEntitlement,
  type PlanKey,
} from '@/lib/pricing-content'

export const metadata: Metadata = {
  title: 'Pricing | Akademate',
  description:
    'Compare Akademate plans, included capabilities and paid extensions for connected academies.',
  alternates: { canonical: '/precios' },
}

const planKeys: readonly PlanKey[] = ['starter', 'pro', 'enterprise']

function EntitlementBadge({ value }: { value: PlanEntitlement }) {
  const isIncluded = value === 'included'
  const isNotIncluded = value === 'not-included'
  const Icon = isIncluded
    ? Check
    : isNotIncluded
      ? X
      : value === 'paid-extension'
        ? Plus
        : ShieldCheck

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${
        isIncluded
          ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
          : isNotIncluded
            ? 'border-slate-200 bg-slate-50 text-slate-500'
            : value === 'paid-extension'
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-violet-200 bg-violet-50 text-violet-700'
      }`}
      title={entitlementDescriptions[value]}
    >
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      {entitlementLabels[value]}
    </span>
  )
}

function PlanValue({
  row,
  plan,
}: {
  row: { starter: PlanEntitlement; pro: PlanEntitlement; enterprise: PlanEntitlement }
  plan: PlanKey
}) {
  return <EntitlementBadge value={row[plan]} />
}

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <section className="border-b bg-gradient-to-b from-blue-50/80 to-background px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-5xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Plans built around your academy
            </p>
            <div className="mt-5 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
              <div>
                <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl">
                  Choose the operating scope that fits your academy.
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-8 text-muted-foreground">
                  Start with the core workspace and add connected-campus services when your sites,
                  teams and workflows are ready.
                </p>
              </div>
              <div className="rounded-2xl border bg-background/80 p-5 shadow-sm">
                <div className="flex items-start gap-3">
                  <CircleHelp aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <p className="text-sm leading-6 text-muted-foreground">
                    Plan pricing is tailored to your academy model, locations and delivery mix.
                    Request a proposal for an exact scope.
                  </p>
                </div>
                <Link
                  href="/contacto?asunto=precios"
                  className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
                >
                  Talk through your plan <ArrowRight aria-hidden="true" className="h-4 w-4" />
                </Link>
              </div>
            </div>

            <div className="mt-10 grid gap-3 sm:grid-cols-3">
              {planKeys.map((plan) => (
                <div
                  key={plan}
                  className={`rounded-2xl border bg-background p-5 ${plan === 'pro' ? 'border-primary ring-2 ring-primary/10' : ''}`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <h2 className="text-xl font-semibold">{planLabels[plan]}</h2>
                    {plan === 'pro' ? (
                      <span className="rounded-full bg-primary px-2.5 py-1 text-xs font-semibold text-primary-foreground">
                        Most popular
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {plan === 'starter'
                      ? 'Core tools for a focused academy team.'
                      : plan === 'pro'
                        ? 'More sites, programmes and growth workflows.'
                        : 'A scoped operating model for complex organisations.'}
                  </p>
                  <p className="mt-5 text-sm font-semibold text-foreground">
                    Request a tailored proposal
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-2" aria-label="Pricing status legend">
              {(Object.keys(entitlementLabels) as PlanEntitlement[]).map((entitlement) => (
                <EntitlementBadge key={entitlement} value={entitlement} />
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="pricing-comparison">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 max-w-2xl">
              <p className="text-sm font-semibold text-primary">Compare the operating model</p>
              <h2 className="mt-3 text-3xl font-bold tracking-tight">
                Everything is clearly scoped.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                The same vocabulary appears in every section, so your team can see what is ready in
                the plan and what is scoped separately.
              </p>
            </div>

            <div className="hidden overflow-hidden rounded-2xl border md:block">
              <table className="w-full table-fixed border-collapse text-left text-sm">
                <caption className="sr-only">
                  Akademate capabilities by plan and commercial scope
                </caption>
                <colgroup>
                  <col className="w-[40%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                  <col className="w-[20%]" />
                </colgroup>
                <thead className="bg-slate-950 text-left font-semibold text-white">
                  <tr>
                    <th scope="col" className="p-4">
                      Capability
                    </th>
                    {planKeys.map((plan) => (
                      <th scope="col" className="p-4" key={plan}>
                        {planLabels[plan]}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {planComparisonSections.map((section) => (
                    <Fragment key={section.id}>
                      <tr className="border-y bg-blue-50/60">
                        <th scope="colgroup" colSpan={4} className="px-4 py-4 text-left">
                          <span className="block font-semibold">{section.title}</span>
                          <span className="mt-1 block text-sm font-normal text-muted-foreground">
                            {section.description}
                          </span>
                        </th>
                      </tr>
                      {section.rows.map((row) => (
                        <tr key={row.id} className="border-b last:border-b-0">
                          <th scope="row" className="p-4 text-left align-top font-medium">
                            {row.capability}
                            <span className="mt-1 block text-sm font-normal text-muted-foreground">
                              {row.description}
                            </span>
                          </th>
                          {planKeys.map((plan) => (
                            <td className="p-4 align-top" key={plan}>
                              <PlanValue row={row} plan={plan} />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 md:hidden">
              {planComparisonSections.map((section) => (
                <details
                  key={section.id}
                  className="group overflow-hidden rounded-2xl border bg-background"
                  open={section.id === 'academy-operations'}
                >
                  <summary className="cursor-pointer list-none bg-blue-50/60 p-4 font-semibold [&::-webkit-details-marker]:hidden">
                    {section.title}
                    <span className="float-right text-primary group-open:rotate-45">+</span>
                    <span className="mt-1 block text-sm font-normal text-muted-foreground">
                      {section.description}
                    </span>
                  </summary>
                  <div className="divide-y">
                    {section.rows.map((row) => (
                      <div key={row.id} className="p-4">
                        <p className="font-medium">{row.capability}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{row.description}</p>
                        <div className="mt-3 grid grid-cols-3 gap-2 text-xs">
                          {planKeys.map((plan) => (
                            <div key={plan}>
                              <span className="mb-1 block font-semibold text-muted-foreground">
                                {planLabels[plan]}
                              </span>
                              <PlanValue row={row} plan={plan} />
                            </div>
                          ))}
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
          className="bg-slate-950 px-4 py-16 text-white sm:px-6 lg:px-8"
          data-testid="pricing-paid-extensions"
        >
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold text-blue-300">
              Extend the academy when you are ready
            </p>
            <h2 className="mt-3 max-w-3xl text-3xl font-bold tracking-tight">
              Connected-campus modules are paid extensions.
            </h2>
            <p className="mt-4 max-w-2xl leading-7 text-slate-300">
              Add physical-space workflows to the software scope with a proposal that matches your
              sites, devices, rollout and support model.
            </p>
            <div className="mt-10 grid gap-5 md:grid-cols-2">
              {paidExtensions.map((extension) => (
                <article
                  key={extension.id}
                  className="rounded-2xl border border-white/15 bg-white/5 p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-xl font-semibold">{extension.title}</h3>
                    <span className="rounded-full border border-blue-300/40 bg-blue-300/10 px-2.5 py-1 text-xs font-semibold text-blue-200">
                      Paid extension
                    </span>
                  </div>
                  <p className="mt-4 text-sm leading-6 text-slate-300">
                    <strong className="text-white">Software scope:</strong> {extension.includes}
                  </p>
                  <p className="mt-3 text-sm leading-6 text-slate-400">
                    <strong className="text-slate-200">Quoted separately:</strong>{' '}
                    {extension.separateCosts}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 sm:px-6 lg:px-8" data-testid="pricing-separate-costs">
          <div className="mx-auto grid max-w-7xl gap-10 rounded-2xl border bg-muted/30 p-6 sm:p-8 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <p className="text-sm font-semibold text-primary">Scope with clarity</p>
              <h2 className="mt-3 text-2xl font-bold tracking-tight">
                Third-party and on-site costs stay visible.
              </h2>
              <p className="mt-4 leading-7 text-muted-foreground">
                Your proposal separates Akademate software from equipment, installation, provider
                licences and usage-based charges.
              </p>
            </div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {separatelyBilledItems.map((item) => (
                <li key={item} className="flex gap-3 rounded-xl border bg-background p-4 text-sm">
                  <ShieldCheck aria-hidden="true" className="h-5 w-5 shrink-0 text-primary" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="border-t px-4 py-16 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 rounded-2xl bg-blue-50 p-8 sm:flex-row sm:items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Ready to map your academy?</h2>
              <p className="mt-2 text-muted-foreground">
                We will scope your plan, locations, integrations and extensions together.
              </p>
            </div>
            <Link
              href="/contacto?asunto=precios"
              className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90"
            >
              Request pricing <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
