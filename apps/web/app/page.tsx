import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Bot, CalendarDays, Check, Network, Sparkles, UsersRound } from 'lucide-react'
import { AcademyProof } from '@/components/marketing/AcademyProof'
import { GovernanceFrameworks } from '@/components/marketing/GovernanceFrameworks'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { blogPosts } from '@/lib/blog-posts'
import { operatingJourney, plans } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'The AI-assisted operating system for academies',
  description: 'Run students, courses, schedules, teams, communications and insight from one connected academy operating system.',
  alternates: { canonical: '/' },
}

const aiActions = [
  'Surface the next operational action',
  'Prepare clear summaries and communications',
  'Work inside role and organisation boundaries',
  'Keep people in control of meaningful decisions',
] as const

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white text-[#071633]">
      <Header />
      <main id="content">
        <section className="hero-enter relative flex min-h-[calc(100svh-73px)] items-end overflow-hidden bg-[#071633] text-white">
          <Image
            src="/images/marketing/akademate-hero-operations.jpg"
            alt="Academy director coordinating a teaching day while an adult class takes place"
            fill
            priority
            sizes="100vw"
            className="object-cover object-[62%_center]"
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(3,15,39,.94)_0%,rgba(3,15,39,.78)_38%,rgba(3,15,39,.16)_72%,rgba(3,15,39,.08)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(0deg,rgba(3,15,39,.6),transparent_45%)]" />
          <div className="relative mx-auto w-full max-w-7xl px-4 pb-8 pt-24 sm:px-6 sm:pb-20 sm:pt-32 lg:px-8 lg:pb-24">
            <div className="max-w-3xl">
              <p className="hero-item text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">AI-assisted academy operations</p>
              <h1 className="hero-item mt-4 max-w-3xl text-[2.55rem] font-semibold leading-[.98] tracking-[-0.055em] sm:mt-5 sm:text-6xl lg:text-[5.4rem] lg:leading-[.96]">
                Run your academy from one intelligent operating system.
              </h1>
              <p className="hero-item mt-5 max-w-2xl text-base leading-7 text-white/85 sm:mt-7 sm:text-xl sm:leading-8">
                Bring students, courses, schedules, teams, communications and insight into one connected workspace — built for in-person and online education.
              </p>
              <div className="hero-item mt-6 flex flex-row gap-2 sm:mt-9 sm:gap-3">
                <Link href="/contacto?asunto=demo" className="button-primary-light group px-4 sm:px-6">
                  Book a demo <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                </Link>
                <Link href="/features" className="button-ghost-light px-4 sm:px-6"><span className="sm:hidden">Explore</span><span className="hidden sm:inline">Explore the platform</span></Link>
              </div>
            </div>
          </div>
        </section>

        <AcademyProof />

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-32">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-3xl">
              <p className="section-kicker">One connected operation</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">From first enquiry to lasting learner progress.</h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">Akademate connects the moments that make an academy work, so every team sees the same journey and knows what comes next.</p>
            </div>

            <ol className="mt-16 grid border-y border-slate-200 md:grid-cols-5">
              {operatingJourney.map((item) => (
                <li key={item.step} className="group border-b border-slate-200 py-8 md:border-b-0 md:border-r md:px-6 first:md:pl-0 last:md:border-r-0">
                  <span className="font-mono text-xs text-blue-700">{item.step}</span>
                  <h3 className="mt-10 text-2xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section className="overflow-hidden bg-[#071633] text-white">
          <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
            <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
              <div className="media-reveal relative aspect-[3/2] overflow-hidden rounded-[2rem]">
                <Image src="/images/marketing/akademate-in-person-academy.jpg" alt="Adult vocational academy class working with a teacher" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-200">On campus</p>
                <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">The teaching day, orchestrated.</h2>
                <p className="mt-6 text-lg leading-8 text-blue-100/80">Coordinate cohorts, rooms, teachers, attendance and learner context without rebuilding the day across separate tools.</p>
                <div className="mt-10 grid gap-6 sm:grid-cols-2">
                  <FeatureLine icon={CalendarDays} title="Schedules that connect" text="Programmes, course runs, rooms and people in one planning context." />
                  <FeatureLine icon={UsersRound} title="Every learner visible" text="Enrolment, attendance and progress stay part of the same journey." />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-2 lg:gap-20">
            <div className="order-2 lg:order-1">
              <p className="section-kicker">Online and hybrid</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">One academy, wherever learning happens.</h2>
              <p className="mt-6 text-lg leading-8 text-slate-600">Connect the digital learner experience to the same programmes, teams and operational rhythm that run your physical academy.</p>
              <Link href="/blog/one-operation-in-person-online-academies" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">
                Read the operating model <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
            <div className="media-reveal relative order-1 aspect-[3/2] overflow-hidden rounded-[2rem] lg:order-2">
              <Image src="/images/marketing/akademate-online-academy.jpg" alt="Adult educator delivering a live online lesson from an academy studio" fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover" />
            </div>
          </div>
        </section>

        <section id="ai" className="bg-blue-700 px-4 py-20 text-white sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[.9fr_1.1fr] lg:items-center lg:gap-20">
            <div>
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10"><Sparkles className="h-7 w-7" aria-hidden="true" /></div>
              <p className="mt-8 text-sm font-semibold uppercase tracking-[0.22em] text-blue-100">AI inside the operation</p>
              <h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Assistance that understands the work.</h2>
              <p className="mt-6 text-lg leading-8 text-blue-50/85">Akademate brings AI to the context where academy teams plan, communicate and decide — with permissions and human review built into the workflow.</p>
            </div>
            <div className="rounded-[2rem] bg-[#071633] p-6 shadow-2xl shadow-blue-950/20 sm:p-9">
              <div className="flex items-center gap-3 border-b border-white/10 pb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-500"><Bot className="h-5 w-5" aria-hidden="true" /></div>
                <div><p className="font-semibold">Akademate intelligence</p><p className="text-sm text-blue-200">Contextual · permission-aware · human-led</p></div>
              </div>
              <ul className="mt-7 space-y-5">
                {aiActions.map((action) => (
                  <li key={action} className="flex items-start gap-4 text-blue-50"><span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-500/20"><Check className="h-4 w-4" aria-hidden="true" /></span>{action}</li>
                ))}
              </ul>
              <Link href="/features#ai" className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-white hover:text-blue-200">Explore AI-assisted operations <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
          </div>
        </section>

        <GovernanceFrameworks />

        <section id="pricing" className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div><p className="section-kicker">Plans</p><h2 className="mt-4 max-w-2xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Choose how Akademate runs for you.</h2></div>
              <Link href="/pricing" className="inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900">Compare plans <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
            </div>
            <div className="mt-14 grid overflow-hidden rounded-[2rem] border border-slate-200 lg:grid-cols-2">
              {plans.map((plan, index) => (
                <article key={plan.name} className={`p-8 sm:p-12 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'}`}>
                  <p className={`text-sm font-semibold uppercase tracking-[0.18em] ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}>{plan.label}</p>
                  <h3 className="mt-4 text-4xl font-semibold tracking-tight">{plan.name}</h3>
                  <p className={`mt-5 max-w-xl leading-7 ${index === 1 ? 'text-blue-100/75' : 'text-slate-600'}`}>{plan.description}</p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.slice(0, 4).map((feature) => <li key={feature} className="flex items-center gap-3 text-sm"><Check className={`h-4 w-4 ${index === 1 ? 'text-blue-300' : 'text-blue-700'}`} aria-hidden="true" />{feature}</li>)}
                  </ul>
                  <Link href={`/contacto?asunto=${plan.subject}`} className={index === 1 ? 'button-primary-light mt-9' : 'button-primary-dark mt-9'}>{plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="bg-slate-50 px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="flex items-end justify-between gap-6"><div><p className="section-kicker">Field notes</p><h2 className="mt-4 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">Ideas for running a better academy.</h2></div><Link href="/blog" className="hidden min-h-11 items-center gap-2 font-semibold text-blue-700 sm:inline-flex">View all resources <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></div>
            <div className="mt-12 grid gap-8 lg:grid-cols-2">
              {blogPosts.map((post) => (
                <Link key={post.slug} href={`/blog/${post.slug}`} className="group block">
                  <div className="relative aspect-[16/9] overflow-hidden rounded-3xl"><Image src={post.image} alt={post.imageAlt} fill sizes="(max-width: 1024px) 100vw, 50vw" className="object-cover transition duration-700 group-hover:scale-[1.03]" /></div>
                  <div className="mt-6 flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.16em] text-blue-700"><span>{post.category}</span><span className="h-1 w-1 rounded-full bg-blue-300" /><span>{post.readingTime}</span></div>
                  <h3 className="mt-3 text-2xl font-semibold tracking-tight transition-colors group-hover:text-blue-700 sm:text-3xl">{post.title}</h3>
                  <p className="mt-3 max-w-2xl leading-7 text-slate-600">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-[#071633] px-6 py-16 text-center text-white sm:px-12 lg:py-24">
            <Network className="mx-auto h-9 w-9 text-blue-300" aria-hidden="true" />
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">Your academy already has a rhythm. Give it one operating system.</h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">See how Akademate can connect your programmes, teams and learner journeys.</p>
            <Link href="/contacto?asunto=demo" className="button-primary-light mt-9">Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function FeatureLine({ icon: Icon, title, text }: { icon: typeof CalendarDays; title: string; text: string }) {
  return <div><Icon className="h-6 w-6 text-blue-300" aria-hidden="true" /><h3 className="mt-4 font-semibold">{title}</h3><p className="mt-2 text-sm leading-6 text-blue-100/65">{text}</p></div>
}
