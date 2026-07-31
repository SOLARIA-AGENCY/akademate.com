import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  BookOpenCheck,
  CalendarCheck2,
  ChartNoAxesCombined,
  Check,
  Globe2,
  GraduationCap,
  Megaphone,
  MessageCircleMore,
  School,
  UsersRound,
  WalletCards,
} from 'lucide-react'
import { AcademyProof } from '@/components/marketing/AcademyProof'
import { GovernanceFrameworks } from '@/components/marketing/GovernanceFrameworks'
import { ProductMoments } from '@/components/marketing/ProductMoments'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { blogPosts } from '@/lib/blog-posts'
import { integrationPillars, operatingJourney, plans, verticals } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'The operating system for modern academies',
  description: 'Capture demand, reserve places, run programmes, deliver learning and reconcile revenue across in-person and online operations.',
  alternates: { canonical: '/' },
}

const operatingSurfaces = [
  {
    icon: Megaphone,
    title: 'Growth and admissions',
    text: 'Campaign context, CRM, applications, reservations, capacity and waitlists in one measurable funnel.',
    className: 'bg-[#eaf1ff]',
  },
  {
    icon: School,
    title: 'Programmes and people',
    text: 'Courses, seasons, sessions, locations, teachers, coaches, participants and guardians coordinated together.',
    className: 'bg-white',
  },
  {
    icon: BookOpenCheck,
    title: 'Campus and community',
    text: 'Dedicated learner and teacher workspaces for content, tasks, grades, progress, email and internal chat.',
    className: 'bg-white',
  },
  {
    icon: WalletCards,
    title: 'Payments and finance',
    text: 'Deposits, instalments, memberships, subscriptions, reconciliation and the right receiving entity for every offer.',
    className: 'bg-[#dce9ff]',
  },
] as const

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="hero-enter relative flex min-h-[calc(100dvh-73px)] items-end overflow-hidden bg-[#071633] text-white">
          <Image
            src="/images/marketing/akademate-hero-operations.jpg"
            alt="Academy director coordinating a teaching day while an adult class takes place"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,39,.95)_0%,rgba(3,15,39,.8)_38%,rgba(3,15,39,.2)_74%,rgba(3,15,39,.08)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,15,39,.62),transparent_48%)]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-9 pt-20 sm:px-6 sm:pb-16 lg:px-8 lg:pb-20">
            <div className="max-w-[760px]">
              <p className="hero-item text-sm font-semibold uppercase tracking-[0.2em] text-blue-200">Built for in-person and online academies</p>
              <h1 className="hero-item mt-4 text-[2.75rem] font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.9rem]">
                The operating system for modern academies.
              </h1>
              <p className="hero-item mt-5 max-w-2xl text-base leading-7 text-white/85 sm:text-xl sm:leading-8">
                Run enrolment, operations, learning and revenue in one connected experience built for your team, teachers and learners.
              </p>
              <div className="hero-item mt-7 flex flex-wrap gap-3">
                <Link href="/contacto?asunto=demo" className="button-primary-light group">
                  Book a demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link href="/features" className="button-ghost-light">Explore the platform</Link>
              </div>
            </div>
          </div>
        </section>

        <AcademyProof />

        <section id="reservations" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Turn every click into a confident next step.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Create a booking experience that feels effortless for families and learners, while your team keeps capacity, payments and follow-up under control.</p>
            </div>

            <ol className="mt-14 grid border-y border-blue-200 sm:grid-cols-2 lg:grid-cols-6">
              {operatingJourney.map((item) => (
                <li key={item.step} className="journey-step border-b border-blue-200 py-7 sm:px-5 lg:border-b-0 lg:border-r first:sm:pl-0 last:lg:border-r-0">
                  <span className="font-mono text-xs font-semibold text-blue-700">{item.step}</span>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                </li>
              ))}
            </ol>

            <div className="mt-14 grid gap-8 lg:grid-cols-[.8fr_1.2fr] lg:items-center"><div className="media-reveal relative aspect-[4/3] overflow-hidden rounded-[2rem]"><Image src="/images/marketing/reservation-checkin.jpg" alt="Family completing a programme reservation with an academy coordinator" fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" /></div><ProductMoments compact initial="reservations" /></div>
          </div>
        </section>

        <section id="solutions" className="overflow-hidden bg-[#edf3ff] py-20 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Made for the way your academy works.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Whether you run cohorts, classes, memberships, seasons or multiple locations, Akademate adapts around your rhythm.</p>
            </div>
          </div>

          <div className="mx-auto mt-12 flex max-w-[1536px] snap-x snap-mandatory gap-5 overflow-x-auto px-4 pb-5 sm:px-6 lg:px-8">
            {verticals.map((vertical) => (
              <article key={vertical.slug} className="group w-[84vw] max-w-[430px] shrink-0 snap-start">
                <div className="media-reveal relative aspect-[4/3] overflow-hidden rounded-[2rem] bg-slate-200">
                  <Image src={vertical.image} alt={vertical.imageAlt} fill sizes="(max-width: 640px) 84vw, 430px" className="object-cover" />
                </div>
                <h3 className="mt-6 text-2xl font-semibold tracking-tight">{vertical.title}</h3>
                <p className="mt-3 text-sm leading-6 text-slate-600">{vertical.description}</p>
                <p className="mt-4 text-sm font-semibold text-blue-700">{vertical.capabilities.join(' · ')}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Give every team a workspace that moves them forward.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Admissions, teachers, coaches, finance and leadership see exactly what they need, without losing the bigger picture.</p>
            </div>
            <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-[1.12fr_.88fr]">
              {operatingSurfaces.map(({ icon: Icon, title, text, className }, index) => (
                <article key={title} className={`rounded-[2rem] p-7 sm:p-10 ${className} ${index === 0 || index === 3 ? 'lg:min-h-[320px]' : ''}`}>
                  <Icon className="h-7 w-7 text-blue-700" strokeWidth={1.75} aria-hidden="true" />
                  <h3 className="mt-12 max-w-md text-3xl font-semibold tracking-tight">{title}</h3>
                  <p className="mt-4 max-w-lg leading-7 text-slate-600">{text}</p>
                </article>
              ))}
            </div>
            <Link href="/features" className="mt-9 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
              Explore every module <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.8fr_1.2fr] lg:items-start lg:gap-20">
            <div className="lg:sticky lg:top-28">
              <p className="section-kicker">Fill every programme</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Turn demand into thriving cohorts.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">See which campaigns create real enrolments, follow up at the right moment and keep every opportunity moving.</p>
              <Link href="/features#growth-ads-and-crm" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
                Explore growth operations <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[
                [Megaphone, 'Campaign context', 'Meta Ads, attribution and conversion events stay connected to the participant journey.'],
                [UsersRound, 'CRM and follow-up', 'One intake view for enquiries, applications, reservations and the next team action.'],
                [CalendarCheck2, 'Reservation conversion', 'Capacity, approval, waitlist and expiry rules move demand into confirmed places.'],
                [ChartNoAxesCombined, 'Full-funnel insight', 'Compare source, conversion, participation and revenue without rebuilding the story in spreadsheets.'],
              ].map(([Icon, title, text]) => {
                const GrowthIcon = Icon as typeof Megaphone
                return <article key={title as string} className="rounded-[2rem] border border-slate-200 bg-[#f7f9fc] p-7"><GrowthIcon className="h-6 w-6 text-blue-700" strokeWidth={1.75} aria-hidden="true" /><h3 className="mt-10 text-xl font-semibold">{title as string}</h3><p className="mt-3 text-sm leading-6 text-slate-600">{text as string}</p></article>
              })}
            </div>
          </div>
        </section>

        <section id="payments" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-10 lg:grid-cols-[.85fr_1.15fr] lg:items-end">
              <div>
                <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Make every payment feel effortless.</h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">Offer the payment journey each programme needs, from a simple deposit to instalments, memberships and recurring plans.</p>
            </div>
            <div className="mt-14 grid border-y border-blue-200 md:grid-cols-2 lg:grid-cols-4">
              {integrationPillars.map((pillar) => (
                <article key={pillar.title} className="border-b border-blue-200 py-8 md:px-6 lg:border-b-0 lg:border-r first:md:pl-0 last:lg:border-r-0">
                  <h3 className="text-2xl font-semibold">{pillar.title}</h3>
                  <p className="mt-4 font-mono text-xs font-semibold uppercase tracking-[0.14em] text-blue-700">{pillar.providers.join(' / ')}</p>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{pillar.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="media-reveal relative aspect-[3/2] overflow-hidden rounded-[2rem]">
              <Image src="/images/marketing/akademate-online-academy.jpg" alt="Educator delivering a live online lesson from a professional academy studio" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
            <div>
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">One place to learn. One place to lead.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Give learners a campus they want to return to and teachers a clear view of lessons, tasks, feedback and progress.</p>
              <div className="mt-9 grid gap-6 sm:grid-cols-2">
                <FeatureLine icon={GraduationCap} title="Learner campus" text="Courses, activities, progress, communication and the next action in one place." />
                <FeatureLine icon={MessageCircleMore} title="Teacher and learner chat" text="Keep course conversation inside the right role, cohort and learning context." />
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="section-kicker">Plans</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Choose the next stage of your growth.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Launch a standout programme, bring your whole academy together or build a dedicated platform for your network.</p>
            </div>
            <div className="mt-14 grid overflow-hidden rounded-[2rem] border border-slate-200 lg:grid-cols-3">
              {plans.map((plan, index) => (
                <article key={plan.name} className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < plans.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}>
                  <p className={`text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}>{plan.label}</p>
                  <h3 className="mt-4 text-4xl font-semibold tracking-tight">{plan.name}</h3>
                  <p className={`mt-5 leading-7 ${index === 1 ? 'text-blue-100/75' : 'text-slate-600'}`}>{plan.description}</p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex items-start gap-3 text-sm"><Check className={`mt-0.5 h-4 w-4 shrink-0 ${index === 1 ? 'text-blue-300' : 'text-blue-700'}`} aria-hidden="true" />{feature}</li>)}
                  </ul>
                  <Link href={`/contacto?asunto=${plan.subject}`} className={index === 1 ? 'button-primary-light mt-9' : 'button-primary-dark mt-9'}>{plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
            <Link href="/pricing" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">Compare plans <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>

        <GovernanceFrameworks />

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-6"><div><h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Fresh ideas for ambitious academies.</h2></div><Link href="/blog" className="hidden min-h-11 items-center gap-2 font-semibold text-blue-700 sm:inline-flex">Explore stories and news <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <div className="media-reveal relative aspect-[16/9] overflow-hidden rounded-[2rem]"><Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" /></div>
                  <p className="mt-5 text-sm font-semibold text-blue-700">{post.category} · {post.readingTime}</p>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight transition-colors group-hover:text-blue-700 sm:text-3xl">{post.title}</h3>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-600">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#071633] px-6 py-16 text-center text-white sm:px-12 lg:py-24">
            <Globe2 className="mx-auto h-9 w-9 text-blue-300" strokeWidth={1.75} aria-hidden="true" />
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Your operating model can be unique. The system should still connect.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">Map Akademate to your offers, people, locations, payment model and learning experience.</p>
            <Link href="/contacto?asunto=demo" className="button-primary-light mt-9">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FeatureLine({ icon: Icon, title, text }: { icon: typeof GraduationCap; title: string; text: string }) {
  return <div><Icon className="h-6 w-6 text-blue-700" strokeWidth={1.75} aria-hidden="true" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-slate-600">{text}</p></div>
}
