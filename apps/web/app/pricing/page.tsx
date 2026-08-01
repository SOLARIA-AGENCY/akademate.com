import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Cloud, Rocket, Server, WalletCards } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { plans, roadmapModules } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Launch, Business and Enterprise operating models for seasonal programmes, growing academies and multi-site organisations.',
  alternates: { canonical: '/pricing' },
}

const comparison = [
  ['Best fit', 'Camps and temporary programmes', 'Recurring academy operations', 'Groups, networks and franchises'],
  ['Public booking and admissions', 'Included', 'Included', 'Included'],
  ['Academic and participant operations', 'Focused programme scope', 'Full operation', 'Full multi-organisation scope'],
  ['Virtual campus and teaching tools', 'Optional scope', 'Included', 'Included'],
  ['Payments and finance workflows', 'Programme payments', 'Connected operations', 'Multi-entity and integration programme'],
  ['Custom domains', 'One programme domain', 'Available', 'Multi-brand and multi-domain'],
  ['Deployment', 'Managed cloud', 'Managed cloud', 'Dedicated, private cloud or on-premise'],
  ['Onboarding', 'Launch setup', 'Operational onboarding', 'Migration and integration programme'],
] as const

const planIcons = [Rocket, Cloud, Server] as const

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[.9fr 1.1fr] lg:gap-20">
            <div>
              <p className="section-kicker">Plans shaped around your operation</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">A plan for every stage of your ambition.</h1>
              <p className="mt-7 max-w-2xl text-lg leading-8 text-slate-600">Start with one standout programme, transform your whole academy or create a dedicated platform for your network.</p>
              <Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="scroll-depth relative aspect-[4/3] overflow-hidden rounded-2xl bg-[#071633]">
              <Image src="/images/marketing/akademate-finance-accounting-v2.png" alt="Akademate finance and accounting workspace across desktop and tablet" fill priority sizes="(max-width: 1024px) 100vw, 55vw" className="object-cover" />
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto grid max-w-7xl overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-3">
            {plans.map((plan, index) => {
              const Icon = planIcons[index] ?? Cloud
              return (
                <article key={plan.name} className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < plans.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}>
                  <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? 'bg-white/10 text-blue-200' : 'bg-blue-50 text-blue-700'}`}><Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></div>
                  <p className={`mt-8 text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}>{plan.label}</p>
                  <h2 className="mt-4 text-5xl font-semibold tracking-tight">{plan.name}</h2>
                  <p className={`mt-6 leading-7 ${index === 1 ? 'text-blue-100/70' : 'text-slate-600'}`}>{plan.description}</p>
                  <p className="mt-8 text-lg font-semibold">Tailored proposal</p>
                  <ul className="mt-8 space-y-4">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-blue-300' : 'text-blue-700'}`} aria-hidden="true" />{feature}</li>)}</ul>
                  <Link href={`/contacto?asunto=${plan.subject}`} className={index === 1 ? 'button-primary-light mt-10' : 'button-primary-dark mt-10'}>{plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </article>
              )
            })}
          </div>
          <p className="mx-auto mt-7 max-w-7xl text-sm leading-6 text-slate-600">Every proposal is shaped around the scale of your programmes, team, integrations and growth plan. Participant revenue always remains separate from your Akademate subscription.</p>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Add the modules that complete your operating model.</h2>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">The roadmap expands Akademate across finance, accounting, people, resources, learning and mobile experiences.</p>
            <div className="mt-12 grid overflow-hidden rounded-2xl border border-blue-200 bg-white md:grid-cols-2 lg:grid-cols-3">
              {roadmapModules.map((module) => <article key={module.title} className="border-b border-blue-200 p-7 md:border-r lg:min-h-[230px]"><p className="text-sm font-semibold text-blue-700">{module.phase}</p><h3 className="mt-4 text-2xl font-semibold tracking-tight">{module.title}</h3><p className="mt-4 text-sm leading-6 text-slate-600">{module.text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Choose how far you want to go.</h2>
            <div className="mt-12 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
              <table className="w-full min-w-[900px] border-collapse text-left">
                <thead><tr className="border-b bg-slate-50"><th className="px-6 py-5 text-sm font-semibold">Capability</th><th className="px-6 py-5 text-sm font-semibold">Launch</th><th className="px-6 py-5 text-sm font-semibold">Business</th><th className="px-6 py-5 text-sm font-semibold">Enterprise</th></tr></thead>
                <tbody>{comparison.map(([feature, launch, business, enterprise]) => <tr key={feature} className="border-b last:border-b-0"><th scope="row" className="px-6 py-5 text-sm font-medium text-slate-700">{feature}</th><td className="px-6 py-5 text-sm text-slate-600">{launch}</td><td className="px-6 py-5 text-sm text-slate-600">{business}</td><td className="px-6 py-5 text-sm text-slate-600">{enterprise}</td></tr>)}</tbody>
              </table>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.78fr 1.22fr] lg:items-start lg:gap-20">
            <div>
              <WalletCards className="h-8 w-8 text-blue-700" strokeWidth={1.75} aria-hidden="true" />
              <h2 className="mt-6 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Your revenue, your relationships, your control.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Connect booking and finance while each payment reaches the right account for your organisation, location or programme.</p>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                ['Stripe, PayPal and SEPA', 'Provider adapters can support card, wallet and direct-debit based payment journeys.'],
                ['Deposits and instalments', 'Configure what is due at reservation, before a start date or on a recurring schedule.'],
                ['Memberships and session packs', 'Support recurring access, class packs and renewal-oriented models.'],
                ['Finance APIs and reconciliation', 'Prepare payment state for invoicing, accounting, banking or ERP workflows.'],
              ].map(([title, text]) => <article key={title} className="rounded-2xl bg-[#eaf1ff] p-7"><h3 className="text-xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-6 text-slate-600">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-4xl">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Questions</h2>
            <div className="mt-12 divide-y border-y border-blue-200">
              {[
                ['Why are prices not listed?', 'Organisations differ in programmes, users, payment flows, integrations, migration and infrastructure. We prepare a clear scope after understanding the operation.'],
                ['Can Launch support a summer camp?', 'Yes. Launch is designed for a time-bound programme with dates, capacity, booking, deposits, communication and closeout.'],
                ['Can payments use Stripe, PayPal or SEPA?', 'The payment layer is designed around provider adapters. The exact provider, country coverage and commercial responsibility are agreed during onboarding.'],
                ['Can Enterprise run on-premise?', 'Yes. Enterprise covers on-premise or dedicated private-cloud deployment through an agreed implementation and operating model.'],
                ['Does AI define the plan?', 'No. AI assistance is an optional capability. The core value is the connected operating model across growth, delivery, finance and participant experience.'],
              ].map(([question, answer]) => <details key={question} className="group py-6"><summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">{question}</summary><p className="mt-4 max-w-3xl leading-7 text-slate-600">{answer}</p></details>)}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
