import type { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Bot, BriefcaseBusiness, Building2, ChartNoAxesCombined, CreditCard, GraduationCap, LockKeyhole, Megaphone, PlugZap, School, ShieldCheck, UsersRound, Waypoints } from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { featureGroups } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore the complete Akademate platform across admissions, academic operations, students, learning, finance, reporting and AI.',
  alternates: { canonical: '/features' },
}

const icons = [Megaphone, School, UsersRound, Building2, BriefcaseBusiness, GraduationCap, Waypoints, CreditCard, Bot, ChartNoAxesCombined, ShieldCheck, LockKeyhole, PlugZap] as const

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="overflow-hidden bg-[#071633] px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">The complete platform</p>
            <h1 className="mt-5 max-w-5xl text-5xl font-semibold tracking-[-0.055em] sm:text-7xl">Every part of your academy, working as one system.</h1>
            <p className="mt-7 max-w-3xl text-lg leading-8 text-blue-100/75 sm:text-xl">Akademate connects the commercial, academic and learning workflows behind modern education — with AI assistance inside the operation, not bolted on beside it.</p>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row"><Link href="/contacto?asunto=demo" className="button-primary-light">Book a platform tour <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/pricing" className="button-ghost-light">View plans</Link></div>
          </div>
        </section>

        <nav aria-label="Feature categories" className="border-b bg-white px-4 sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-5">
            {featureGroups.map((group) => <Link key={group.title} href={`#${slugify(group.title)}`} className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">{group.title}</Link>)}
          </div>
        </nav>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-x-12 gap-y-20 lg:grid-cols-2">
              {featureGroups.map((group, index) => {
                const Icon = icons[index] ?? ShieldCheck
                return (
                  <article id={slugify(group.title)} key={group.title} className={`scroll-mt-28 border-t pt-8 ${index === featureGroups.length - 1 ? 'lg:col-span-2 lg:grid lg:grid-cols-2 lg:gap-20' : ''}`}>
                    <div>
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-6 w-6" aria-hidden="true" /></div>
                      <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-blue-700">{group.eyebrow}</p>
                      <h2 className="mt-3 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">{group.title}</h2>
                      <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">{group.description}</p>
                    </div>
                    <ul className={`mt-8 divide-y divide-slate-200 border-y border-slate-200 ${index === featureGroups.length - 1 ? 'lg:mt-0' : ''}`}>
                      {group.features.map((feature) => <li key={feature} className="flex min-h-14 items-center justify-between gap-4 py-3 text-sm font-semibold text-slate-800"><span>{feature}</span><ArrowRight className="h-4 w-4 shrink-0 text-blue-500" aria-hidden="true" /></li>)}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#eff5ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-7xl">
            <p className="section-kicker">The platform underneath</p>
            <h2 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Built for operational depth, not disconnected modules.</h2>
            <div className="mt-12 grid border-y border-blue-200 md:grid-cols-4">
              {[['Organisation boundaries', 'Keep people, data and responsibility scoped to the right academy context.'], ['Role-based access', 'Shape each working surface around what a person is responsible for.'], ['Cloud or dedicated deployment', 'Run Akademate as a managed service, private cloud or on-premise Enterprise deployment.'], ['API and integration layer', 'Connect operational data and external services through governed interfaces.']].map(([title, text]) => <div key={title} className="border-b border-blue-200 py-7 md:border-b-0 md:border-r md:px-6 first:md:pl-0 last:md:border-r-0"><h3 className="font-semibold">{title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-5xl text-center"><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">See how the complete operation fits your academy.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">We will map Akademate to your programmes, delivery model, teams and deployment needs.</p><Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      </main>
      <Footer />
    </div>
  )
}

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
