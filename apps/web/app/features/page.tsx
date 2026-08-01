import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  CircleDollarSign,
  Code2,
  GraduationCap,
  Library,
  Megaphone,
  Network,
  School,
  UsersRound,
} from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { AcademySetupJourney } from '@/components/marketing/AcademySetupJourney'
import { ConnectedExperiences } from '@/components/marketing/ConnectedExperiences'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import { FeatureModuleExplorer } from '@/components/marketing/FeatureModuleExplorer'
import { ProductMoments } from '@/components/marketing/ProductMoments'
import { WebsiteDistributionPreview } from '@/components/marketing/WebsiteDistributionPreview'
import { integrationPillarBrands } from '@/lib/integration-brands'
import { integrationPillars, platformPillars, roadmapModules } from '@/lib/marketing-content'

export const metadata: Metadata = {
  title: 'Features',
  description:
    'Explore Akademate across public websites, growth, admissions, academic operations, campus, people, finance, accounting, resources and integrations.',
  alternates: { canonical: '/features' },
}

const pillarIcons = [
  Building2,
  Megaphone,
  School,
  UsersRound,
  GraduationCap,
  CircleDollarSign,
  Library,
  Network,
] as const
const roadmapIcons = [
  CircleDollarSign,
  BriefcaseBusiness,
  Library,
  GraduationCap,
  Building2,
  Bot,
] as const

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-200">The complete academy platform</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
                Everything your academy needs to operate and grow.
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100/80">
                Connect the public experience, daily operation, learning and business performance in
                one system.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href="/contacto?asunto=demo" className="button-primary-light">
                  Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href="/pricing" className="button-ghost-light">
                  Compare plans
                </Link>
              </div>
            </div>
            <div className="scroll-depth relative aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_34px_100px_rgba(2,12,34,.46)]">
              <Image
                src="/images/marketing/akademate-product-ecosystem-v2.png"
                alt="Akademate platform across academy operations, public course pages and learner campus"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <nav
          aria-label="Platform categories"
          className="sticky top-[72px] z-30 border-b border-slate-200 bg-white/95 px-4 backdrop-blur-xl sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-4">
            {platformPillars.map((pillar) => (
              <Link
                key={pillar.title}
                href={`#platform-${slugify(pillar.title)}`}
                className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                {pillar.title}
              </Link>
            ))}
          </div>
        </nav>

        <ConnectedExperiences />

        <section className="paper-texture px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                The academy, organised as one system.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Eight connected layers cover how people discover, join, learn, teach, operate, pay
                and make decisions.
              </p>
            </div>
            <div className="mt-14 grid border-y border-blue-200 md:grid-cols-2 lg:grid-cols-4">
              {platformPillars.map((pillar, index) => {
                const Icon = pillarIcons[index] ?? Network
                return (
                  <article
                    id={`platform-${slugify(pillar.title)}`}
                    key={pillar.title}
                    className="scroll-mt-44 border-b border-blue-200 py-8 md:px-6 lg:min-h-[360px] lg:border-r"
                  >
                    <Icon className="h-6 w-6 text-blue-700" strokeWidth={1.75} aria-hidden="true" />
                    <h3 className="mt-10 text-2xl font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{pillar.text}</p>
                    <ul className="mt-7 space-y-2 text-sm font-semibold text-slate-800">
                      {pillar.capabilities.map((capability) => (
                        <li key={capability}>{capability}</li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <AcademySetupJourney />

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                Publish a complete academy experience.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Use a managed website, your own domain or embedded modules while the data remains
                connected to the academy operation.
              </p>
            </div>
            <div className="scroll-depth mt-12">
              <WebsiteDistributionPreview />
            </div>
          </div>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                Explore an example operating flow.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                These sample controls show how configurable journeys can connect reservations, CRM,
                programmes, campus, payments and insight.
              </p>
            </div>
            <div className="mt-12">
              <ProductMoments />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              Interactive product example with illustrative data. Configuration and integrations are
              defined for each operating scope.
            </p>
          </div>
        </section>

        <FeatureModuleExplorer />

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                The roadmap extends beyond the core.
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Akademate is being shaped to replace more disconnected systems across finance,
                people, resources and advanced learning.
              </p>
            </div>
            <div className="mt-14 grid overflow-hidden rounded-2xl border border-slate-200 md:grid-cols-2 lg:grid-cols-3">
              {roadmapModules.map((module, index) => {
                const Icon = roadmapIcons[index] ?? Code2
                return (
                  <article
                    key={module.title}
                    className="border-b border-slate-200 p-7 md:border-r lg:min-h-[280px] lg:p-9"
                  >
                    <Icon className="h-6 w-6 text-blue-700" strokeWidth={1.75} aria-hidden="true" />
                    <p className="mt-8 text-sm font-semibold text-blue-700">{module.phase}</p>
                    <h3 className="mt-3 text-2xl font-semibold tracking-tight">{module.title}</h3>
                    <p className="mt-4 text-sm leading-6 text-slate-600">{module.text}</p>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-[#eaf1ff] px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <h2 className="max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              Connect the ecosystem around your academy.
            </h2>
            <div className="mt-12 grid border-y border-blue-200 sm:grid-cols-2 lg:grid-cols-4">
              {integrationPillars.map((pillar) => (
                <article
                  key={pillar.title}
                  className="border-b border-blue-200 py-8 sm:px-6 lg:border-b-0 lg:border-r first:sm:pl-0 last:lg:border-r-0"
                >
                  <h3 className="text-2xl font-semibold">{pillar.title}</h3>
                  <p className="mt-4 text-sm font-semibold leading-6 text-blue-700">
                    {pillar.providers.join(' · ')}
                  </p>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{pillar.text}</p>
                  <div className="mt-6">
                    <ConnectorLogos ids={integrationPillarBrands[pillar.title] ?? []} compact />
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-6 text-slate-600">
              Provider availability, market coverage and implementation scope are defined during
              onboarding.
            </p>
          </div>
        </section>

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              See how Akademate fits your operation.
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              Map your offers, people, locations, website, payment model and learning experience
              into one connected platform.
            </p>
            <Link href="/contacto?asunto=demo" className="button-primary-dark mt-9">
              Book a demo <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
}
