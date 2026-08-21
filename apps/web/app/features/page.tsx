import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowRight,
  Bot,
  BriefcaseBusiness,
  Building2,
  Check,
  CircleDollarSign,
  Code2,
  GraduationCap,
  Library,
} from 'lucide-react'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { marketingText } from '@/lib/i18n/marketing-copy'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { AcademySetupJourney } from '@/components/marketing/AcademySetupJourney'
import { AgenticGrowthShowcase } from '@/components/marketing/AgenticGrowthShowcase'
import { AppDownloadShowcase } from '@/components/marketing/AppDownloadShowcase'
import { ConnectedExperiences } from '@/components/marketing/ConnectedExperiences'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import { FeatureModuleExplorer } from '@/components/marketing/FeatureModuleExplorer'
import { FinanceConnectorShowcase } from '@/components/marketing/FinanceConnectorShowcase'
import { HomeMcpConnect } from '@/components/marketing/HomeMcpConnect'
import { PhysicalCampusStory } from '@/components/marketing/PhysicalCampusStory'
import { ProductMoments } from '@/components/marketing/ProductMoments'
import { WebsiteDistributionPreview } from '@/components/marketing/WebsiteDistributionPreview'
import { integrationPillarBrands } from '@/lib/integration-brands'
import { integrationPillars, platformPillars, roadmapModules } from '@/lib/marketing-content'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/features',
    image: '/images/marketing/akademate-product-ecosystem-v2.png',
    copy: {
      en: {
        title: 'Academy management features',
        description:
          'Explore websites, growth, admissions, academic operations, campus, people, finance, resources and integrations.',
      },
      es: {
        title: 'Funciones para gestionar academias',
        description:
          'Explora web, captación, admisiones, operación académica, campus, personas, finanzas, recursos e integraciones.',
      },
    },
  })
}

const roadmapIcons = [
  CircleDollarSign,
  BriefcaseBusiness,
  Library,
  GraduationCap,
  Building2,
  Bot,
] as const

export default async function FeaturesPage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const tx = (source: string) => marketingText(locale, source)
  const pillars = platformPillars.map((pillar) => ({
    ...pillar,
    sourceTitle: pillar.title,
    title: tx(pillar.title),
    text: tx(pillar.text),
    capabilities: pillar.capabilities.map(tx),
  }))
  const roadmap = roadmapModules.map((module) => ({
    ...module,
    title: tx(module.title),
    phase: tx(module.phase),
    text: tx(module.text),
  }))
  const integrations = integrationPillars.map((pillar) => ({
    ...pillar,
    sourceTitle: pillar.title,
    title: tx(pillar.title),
    text: tx(pillar.text),
  }))

  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture overflow-hidden bg-[#06142f] px-4 py-14 text-white sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid min-h-[620px] max-w-7xl items-center gap-12 lg:grid-cols-[.82fr_1.18fr] lg:gap-16">
            <div className="max-w-2xl">
              <p className="text-sm font-semibold text-blue-200">{dictionary.features.eyebrow}</p>
              <h1 className="mt-5 text-5xl font-semibold leading-[.98] tracking-[-0.055em] sm:text-7xl">
                {dictionary.features.title}
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-blue-100/80">
                {dictionary.features.description}
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Link href={href('/contacto?asunto=demo')} className="button-primary-light">
                  {dictionary.features.primaryCta}{' '}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href={href('/pricing')} className="button-ghost-light">
                  {dictionary.features.secondaryCta}
                </Link>
              </div>
            </div>
            <div className="scroll-depth relative aspect-[16/10] overflow-hidden rounded-2xl shadow-[0_34px_100px_rgba(2,12,34,.46)]">
              <Image
                src="/images/marketing/akademate-product-ecosystem-v2.png"
                alt={tx(
                  'Akademate platform across academy operations, public course pages and learner campus'
                )}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            </div>
          </div>
        </section>

        <nav
          aria-label={tx('Platform categories')}
          className="border-b border-slate-200 bg-white px-4 sm:px-6 lg:px-8"
        >
          <div className="mx-auto flex max-w-7xl gap-2 overflow-x-auto py-4">
            {pillars.map((pillar) => (
              <Link
                key={pillar.title}
                href={`#platform-${slugify(pillar.sourceTitle)}`}
                className="shrink-0 rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:border-blue-300 hover:text-blue-700"
              >
                {pillar.title}
              </Link>
            ))}
          </div>
        </nav>

        <ConnectedExperiences />

        <section
          data-testid="visual-platform-pillars"
          className="bg-[#eaf1ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20"
        >
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('One platform. Every part of the academy.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Choose the modules your academy needs. Keep every role connected.')}
              </p>
            </div>
            <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
              {pillars.map((pillar) => (
                <article
                  id={`platform-${slugify(pillar.sourceTitle)}`}
                  key={pillar.sourceTitle}
                  className="group scroll-mt-44 overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_14px_40px_rgba(7,22,51,.06)]"
                >
                  <div className="relative aspect-[3/2] overflow-hidden">
                    <Image
                      src={pillar.image}
                      alt={tx(pillar.imageAlt)}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-700 group-hover:scale-[1.025]"
                    />
                  </div>
                  <div className="p-6">
                    <h3 className="text-2xl font-semibold tracking-tight">{pillar.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{pillar.text}</p>
                    <ul className="compact-feature-list">
                      {pillar.capabilities.map((capability) => (
                        <li key={capability}>
                          <Check
                            className="mt-1 h-3.5 w-3.5 shrink-0 text-blue-700"
                            aria-hidden="true"
                          />
                          <span>{capability}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <PhysicalCampusStory />
        <HomeMcpConnect />

        <AcademySetupJourney />

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('Publish a complete academy experience.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Publish through your website, domain or embedded modules.')}
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
                {tx('Explore an example operating flow.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('See reservations, CRM, campus and payments working together.')}
              </p>
            </div>
            <div className="mt-12">
              <ProductMoments />
            </div>
            <p className="mt-5 text-sm leading-6 text-slate-500">
              {tx('Illustrative product flow; configuration depends on each academy.')}
            </p>
          </div>
        </section>

        <AgenticGrowthShowcase />

        <AppDownloadShowcase compact />

        <FeatureModuleExplorer />

        <section className="bg-white px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('The roadmap extends beyond the core.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('The roadmap connects finance, people, resources and learning.')}
              </p>
            </div>
            <div className="mt-14 grid overflow-hidden rounded-2xl border border-slate-200 md:grid-cols-2 lg:grid-cols-3">
              {roadmap.map((module, index) => {
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
              {tx('Connect your academy ecosystem.')}
            </h2>
            <div className="mt-12 grid border border-blue-200 sm:grid-cols-2 lg:grid-cols-4">
              {integrations.map((pillar) => (
                <article
                  key={pillar.title}
                  className="border-b border-blue-200 px-6 py-8 lg:border-b-0 lg:border-r last:lg:border-r-0"
                >
                  <h3 className="text-2xl font-semibold">{pillar.title}</h3>
                  <p className="mt-4 text-sm font-semibold leading-6 text-blue-700">
                    {pillar.providers.join(' · ')}
                  </p>
                  <p className="mt-5 text-sm leading-6 text-slate-600">{pillar.text}</p>
                  <div className="mt-6">
                    <ConnectorLogos
                      ids={integrationPillarBrands[pillar.sourceTitle] ?? []}
                      compact
                    />
                  </div>
                </article>
              ))}
            </div>
            <p className="mt-7 max-w-3xl text-sm leading-6 text-slate-600">
              {tx('Provider availability and scope are agreed during onboarding.')}
            </p>
          </div>
        </section>

        <FinanceConnectorShowcase
          locale={locale}
          imageSrc="/images/marketing/akademate-finance-connection-flow-v1.png"
          imageAlt={
            locale === 'es'
              ? 'Flujo ilustrativo para conectar un proveedor financiero'
              : 'Illustrative finance provider connection flow'
          }
        />

        <section className="px-4 py-20 sm:px-6 lg:px-8 lg:py-28">
          <div className="mx-auto max-w-5xl text-center">
            <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {tx('See how Akademate fits your operation.')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {tx('Map your academy into one connected operating model.')}
            </p>
            <Link href={href('/contacto?asunto=demo')} className="button-primary-dark mt-9">
              {tx('Book a demo')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
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
