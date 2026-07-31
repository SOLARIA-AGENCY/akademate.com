import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CalendarRange,
  ChartNoAxesCombined,
  CreditCard,
  Dumbbell,
  GraduationCap,
  LockKeyhole,
  Megaphone,
  MessageCircleMore,
  PlugZap,
  School,
  ShieldCheck,
  UsersRound,
  Waypoints,
} from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { featureGroups, integrationPillars, verticals } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'Features',
  description: 'Explore Akademate across growth, reservations, academics, campus, communication, payments, finance, reporting and integrations.',
  alternates: { canonical: '/features' },
}

const icons = [Megaphone, CalendarRange, Waypoints, School, UsersRound, Building2, BriefcaseBusiness, GraduationCap, MessageCircleMore, CreditCard, Dumbbell, ChartNoAxesCombined, Bot, ShieldCheck, LockKeyhole, PlugZap] as const

const layers = [
  ['Offer', 'Course, class, membership, event, facility or programme'],
  ['Run', 'Cohort, schedule, season, camp week or recurring timetable'],
  ['Access', 'Enquiry, application, assessment, booking or invitation'],
  ['Participation', 'Student, member, athlete, learner, player or attendee'],
] as const

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="relative flex min-h-[620px] items-end overflow-hidden bg-[#071633] px-4 py-16 text-white sm:px-6 lg:min-h-[700px] lg:px-8 lg:py-20">
          <Image src="/images/marketing/akademate-multisite-network.jpg" alt="Education operators coordinating a connected multi-location academy" fill priority sizes="100vw" className="object-cover object-center" />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,39,.96)_0%,rgba(3,15,39,.78)_46%,rgba(3,15,39,.18)_100%)]" />
          <div className="relative mx-auto w-full max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">The complete operating platform</p>
              <h1 className="mt-5 max-w-4xl text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">Every operational layer, connected.</h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-blue-100/80">Shape how people discover, book, pay, participate and progress across every location and delivery model.</p>
              <div className="mt-9 flex flex-wrap gap-3"><Link href="/contacto?asunto=demo" className="button-primary-light">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link><Link href="/pricing" className="button-ghost-light">Compare plans</Link></div>
            </div>
          </div>
        </section>

        <nav aria-label="Feature categories" className="sticky top-[72px] z-30 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-4">
            {featureGroups.map((group) => <Link key={group.title} href={`#${slugify(group.title)}`} className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700">{group.title}</Link>)}
          </div>
        </nav>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">One configurable core.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Different industries use different language, but the same operational structure keeps the platform coherent.</p>
            </div>
            <div className="mt-12 grid border-y border-blue-200 sm:grid-cols-2 lg:grid-cols-4">
              {layers.map(([title, text]) => <article key={title} className="border-b border-blue-200 py-8 sm:px-6 lg:border-b-0 lg:border-r first:sm:pl-0 last:lg:border-r-0"><h3 className="text-2xl font-semibold">{title}</h3><p className="mt-4 text-sm leading-6 text-slate-600">{text}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">The modules behind the operation.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Each module shares organisational context, role boundaries and the same participant journey.</p>
            </div>
            <div className="mt-14 grid gap-x-12 gap-y-16 lg:grid-cols-2">
              {featureGroups.map((group, index) => {
                const Icon = icons[index] ?? ShieldCheck
                return (
                  <article id={slugify(group.title)} key={group.title} className="scroll-mt-44 border-t border-slate-300 pt-8">
                    <div className="flex items-start gap-5">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700"><Icon className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" /></div>
                      <div><h3 className="text-3xl font-semibold tracking-[-0.035em]">{group.title}</h3><p className="mt-4 max-w-xl leading-7 text-slate-600">{group.description}</p></div>
                    </div>
                    <div className="mt-8 grid gap-x-5 gap-y-3 sm:grid-cols-2">
                      {group.features.map((feature) => <p key={feature} className="border-l-2 border-blue-200 pl-4 text-sm font-semibold leading-6 text-slate-800">{feature}</p>)}
                    </div>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section id="verticals" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl"><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Configured by capability, adapted by vertical.</h2><p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Start with a proven profile, then choose the booking, teaching, payment and governance capabilities that match the organisation.</p></div>
            <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {verticals.slice(0, 4).map((vertical) => <article key={vertical.slug} className="group"><div className="media-reveal relative aspect-[4/3] overflow-hidden rounded-[2rem]"><Image src={vertical.image} alt={vertical.imageAlt} fill sizes="(max-width: 768px) 100vw, 25vw" className="object-cover" /></div><h3 className="mt-5 text-xl font-semibold">{vertical.title}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{vertical.description}</p></article>)}
            </div>
          </div>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <p className="section-kicker">Integration architecture</p>
            <h2 className="mt-4 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Connect the providers around the operation.</h2>
            <div className="mt-12 grid border-y border-blue-200 sm:grid-cols-2 lg:grid-cols-4">
              {integrationPillars.map((pillar) => <article key={pillar.title} className="border-b border-blue-200 py-8 sm:px-6 lg:border-b-0 lg:border-r first:sm:pl-0 last:lg:border-r-0"><h3 className="text-2xl font-semibold">{pillar.title}</h3><p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{pillar.providers.join(' / ')}</p><p className="mt-5 text-sm leading-6 text-slate-600">{pillar.text}</p></article>)}
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-6 text-slate-600">Provider and connector availability is scoped during onboarding around the operating model, country, contract and receiving entity.</p>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28"><div className="mx-auto max-w-5xl text-center"><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Map the platform to your operation.</h2><p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">We will shape the modules, integrations, terminology and deployment model around how your organisation works.</p><Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div></section>
      </main>
      <Footer />
    </div>
  )
}

function slugify(value: string) { return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') }
