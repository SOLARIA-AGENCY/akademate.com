import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Check, Cloud, Server } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { plans } from '@/lib/marketing-content'

export const metadata: Metadata = { title: 'Pricing', description: 'Business and Enterprise plans for academies running in the cloud, private cloud or on-premise.', alternates: { canonical: '/pricing' } }

const comparison = [
  ['Academic, student and teaching operations', 'Included', 'Included'],
  ['Admissions and communication workflows', 'Included', 'Included'],
  ['Learner campus and online delivery', 'Included', 'Included'],
  ['AI-assisted operational workflows', 'Included', 'Included'],
  ['Managed cloud service', 'Included', 'Optional'],
  ['Dedicated private-cloud deployment', '—', 'Available'],
  ['On-premise deployment', '—', 'Available'],
  ['Custom migration and integration programme', 'Scoped onboarding', 'Enterprise programme'],
  ['Support model', 'Business support', 'Contracted enterprise support'],
] as const

export default function PricingPage() {
  return <div className="min-h-screen bg-white text-[#071633]"><Header /><main id="content">
    <section className="px-4 py-20 text-center sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-4xl"><p className="section-kicker">Plans</p><h1 className="mt-5 text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Choose the operating model that fits your academy.</h1><p className="mx-auto mt-7 max-w-2xl text-lg leading-8 text-slate-600">Start with a guided conversation. We shape the commercial scope around your programmes, users, delivery model and deployment requirements.</p></div></section>
    <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28"><div className="mx-auto grid max-w-7xl overflow-hidden rounded-[2rem] border border-slate-200 lg:grid-cols-2">
      {plans.map((plan, index) => { const Icon = index === 0 ? Cloud : Server; return <article key={plan.name} className={`p-8 sm:p-12 ${index === 1 ? 'bg-[#071633] text-white' : ''}`}><div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${index === 1 ? 'bg-white/10 text-blue-200' : 'bg-blue-50 text-blue-700'}`}><Icon className="h-6 w-6" aria-hidden="true" /></div><p className={`mt-8 text-sm font-semibold uppercase tracking-[0.18em] ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}>{plan.label}</p><h2 className="mt-4 text-5xl font-semibold tracking-tight">{plan.name}</h2><p className={`mt-6 max-w-xl leading-7 ${index === 1 ? 'text-blue-100/70' : 'text-slate-600'}`}>{plan.description}</p><p className="mt-8 text-lg font-semibold">Talk to us for a tailored proposal</p><ul className="mt-8 space-y-4">{plan.features.map((feature) => <li key={feature} className="flex items-start gap-3 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-blue-300' : 'text-blue-700'}`} aria-hidden="true" />{feature}</li>)}</ul><Link href={`/contacto?asunto=${plan.subject}`} className={index === 1 ? 'button-primary-light mt-10' : 'button-primary-dark mt-10'}>{plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></article> })}
    </div></section>
    <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-7xl"><p className="section-kicker">Plan comparison</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">The same operating system. A different deployment relationship.</h2><div className="mt-12 overflow-x-auto rounded-2xl border border-slate-200 bg-white"><table className="w-full min-w-[720px] border-collapse text-left"><thead><tr className="border-b bg-slate-50"><th className="px-6 py-5 text-sm font-semibold">Capability</th><th className="px-6 py-5 text-sm font-semibold">Business</th><th className="px-6 py-5 text-sm font-semibold">Enterprise</th></tr></thead><tbody>{comparison.map(([feature, business, enterprise]) => <tr key={feature} className="border-b last:border-b-0"><th scope="row" className="px-6 py-5 text-sm font-medium text-slate-700">{feature}</th><td className="px-6 py-5 text-sm text-slate-600">{business}</td><td className="px-6 py-5 text-sm text-slate-600">{enterprise}</td></tr>)}</tbody></table></div></div></section>
    <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-4xl"><p className="section-kicker">Questions</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">A commercial model built around the operation.</h2><div className="mt-12 divide-y border-y">{[['Why are prices not listed?', 'Academies differ in users, programmes, delivery, migration, integrations and infrastructure. We prepare a clear scope after understanding the operation.'], ['Can Enterprise run on-premise?', 'Yes. Enterprise is the plan for on-premise or dedicated private-cloud deployment, supported by an agreed implementation and operating model.'], ['Can we support both classroom and online delivery?', 'Yes. Akademate is designed to connect physical, online and hybrid learner journeys inside the same academy operation.'], ['Does Business include AI assistance?', 'Business includes AI-assisted operational workflows. The exact tools and usage model are shaped during onboarding around roles, data and governance needs.']].map(([question, answer]) => <details key={question} className="group py-6"><summary className="cursor-pointer list-none text-lg font-semibold marker:hidden">{question}</summary><p className="mt-4 max-w-3xl leading-7 text-slate-600">{answer}</p></details>)}</div></div></section>
  </main><Footer /></div>
}
