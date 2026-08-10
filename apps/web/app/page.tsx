import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Check, Globe2 } from 'lucide-react'
import { AcademyOperationsStory } from '@/components/marketing/AcademyOperationsStory'
import { AppDownloadShowcase } from '@/components/marketing/AppDownloadShowcase'
import { ConnectedExperiences } from '@/components/marketing/ConnectedExperiences'
import { ConnectorLogos } from '@/components/marketing/ConnectorLogos'
import { ClientMarquee } from '@/components/marketing/ClientMarquee'
import { CourseRegistrationPreview } from '@/components/marketing/CourseRegistrationPreview'
import { CustomerVoices } from '@/components/marketing/CustomerVoices'
import { GovernanceFrameworks } from '@/components/marketing/GovernanceFrameworks'
import { FinanceConnectorShowcase } from '@/components/marketing/FinanceConnectorShowcase'
import { HomeMcpConnect } from '@/components/marketing/HomeMcpConnect'
import { PhysicalCampusStory } from '@/components/marketing/PhysicalCampusStory'
import { ProductHeroCarousel } from '@/components/marketing/ProductHeroCarousel'
import { SolutionCarousel } from '@/components/marketing/SolutionCarousel'
import { TrustSignals } from '@/components/marketing/TrustSignals'
import { WebsiteDistributionPreview } from '@/components/marketing/WebsiteDistributionPreview'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { marketingText } from '@/lib/i18n/marketing-copy'
import { publicPageMetadata } from '@/lib/i18n/metadata'
import { localizedHref } from '@/lib/i18n/routing'
import { getRequestLocale } from '@/lib/i18n/server'
import { getInsightPosts, getNewsPosts } from '@/lib/blog-posts'
import { homeIntegrationBrands } from '@/lib/integration-brands'
import { distributionModes, operatingJourney, platformPillars } from '@/lib/marketing-content'
import { getPricingContent } from '@/lib/pricing-i18n'

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getRequestLocale()
  return publicPageMetadata({
    locale,
    pathname: '/',
    copy: {
      en: {
        title: 'The operating system for academies',
        description:
          'Publish, enrol, teach, collect and grow across in-person, online and hybrid academy operations.',
      },
      es: {
        title: 'El sistema operativo para academias',
        description:
          'Publica, matricula, enseña, cobra y crece en academias presenciales, online e híbridas.',
      },
    },
  })
}

export default async function HomePage() {
  const locale = await getRequestLocale()
  const dictionary = getDictionary(locale)
  const href = (path: string) => localizedHref(path, locale)
  const tx = (source: string) => marketingText(locale, source)
  const journey = operatingJourney.map((item) => ({
    ...item,
    title: tx(item.title),
    text: tx(item.text),
  }))
  const distribution = distributionModes.map((mode) => ({
    ...mode,
    title: tx(mode.title),
    text: tx(mode.text),
  }))
  const homePillars = platformPillars.map((pillar) => ({
    ...pillar,
    sourceTitle: pillar.title,
    title: tx(pillar.title),
    text: tx(pillar.text),
    capabilities: pillar.capabilities.map(tx),
  }))
  const homePlans = getPricingContent(locale).page.cards
  const insightPosts = getInsightPosts(locale)
  const newsPosts = getNewsPosts(locale)

  return (
    <div className="marketing-page min-h-screen bg-[#f7f9fc] text-[#071633]">
      <Header />
      <main id="content">
        <section className="product-texture relative overflow-hidden bg-[#06142f] text-white">
          <div className="mx-auto grid min-h-[min(760px,calc(100dvh-73px))] max-w-[1440px] items-center gap-10 px-4 py-8 sm:px-6 lg:grid-cols-[.78fr_1.22fr] lg:px-8 lg:py-10">
            <div className="max-w-[650px]">
              <p className="hero-item text-sm font-semibold text-blue-200">
                {dictionary.home.eyebrow}
              </p>
              <h1 className="hero-item mt-5 text-[2.8rem] font-semibold leading-[.98] tracking-[-0.055em] sm:text-6xl lg:text-[4.15rem]">
                {dictionary.home.title}
              </h1>
              <p className="hero-item mt-6 max-w-xl text-lg leading-8 text-blue-100/80">
                {dictionary.home.description}
              </p>
              <div className="hero-item mt-8 flex flex-wrap gap-3">
                <Link href={href('/contacto?asunto=demo')} className="button-primary-light group">
                  {dictionary.home.primaryCta}{' '}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-1"
                    aria-hidden="true"
                  />
                </Link>
                <Link href={href('/features')} className="button-ghost-light">
                  {dictionary.home.secondaryCta}
                </Link>
              </div>
            </div>
            <ProductHeroCarousel />
          </div>
        </section>

        <ClientMarquee />
        <TrustSignals />

        <AcademyOperationsStory />

        <ConnectedExperiences />

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-blue-700">
                {tx('One connected academy operation')}
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('One connected learner journey.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Bring every academy workflow into one connected learner record.')}
              </p>
            </div>
            <ol className="mt-10 grid border border-blue-200 sm:grid-cols-2 lg:grid-cols-6">
              {journey.map((item) => (
                <li
                  key={item.step}
                  className="journey-step border-b border-blue-200 px-5 py-7 lg:border-b-0 lg:border-r last:lg:border-r-0"
                >
                  <span className="text-sm font-semibold text-blue-700">{item.step}</span>
                  <h3 className="mt-8 text-xl font-semibold tracking-tight">{item.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{item.text}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

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
              {homePillars.map((pillar) => (
                <article
                  key={pillar.sourceTitle}
                  className="group overflow-hidden rounded-2xl border border-blue-200 bg-white shadow-[0_14px_40px_rgba(7,22,51,.06)]"
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
            <Link
              href={href('/features')}
              className="mt-9 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
            >
              {tx('Explore every module')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <PhysicalCampusStory />

        <HomeMcpConnect />

        <section className="paper-texture px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <p className="text-sm font-semibold text-blue-700">
                {tx('Your public academy, connected to operations')}
              </p>
              <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('From discovery to enrolment.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Launch, connect your domain or embed live Akademate modules.')}
              </p>
            </div>
            <div className="scroll-depth mt-10">
              <WebsiteDistributionPreview />
            </div>
            <div className="mt-10 grid border border-blue-200 sm:grid-cols-2 lg:grid-cols-4">
              {distribution.map((mode, index) => (
                <article
                  key={mode.title}
                  className="border-b border-blue-200 px-6 py-8 lg:border-b-0 lg:border-r last:lg:border-r-0"
                >
                  <span className="text-sm font-semibold text-blue-700">0{index + 1}</span>
                  <h3 className="mt-7 text-xl font-semibold">{mode.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{mode.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section id="reservations" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[.72fr_1.28fr] lg:items-end">
              <div>
                <p className="text-sm font-semibold text-blue-700">
                  {tx('Built to convert interest into action')}
                </p>
                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                  {tx('A shareable page for every course.')}
                </h2>
              </div>
              <p className="max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Give every offer one shareable page for discovery and booking.')}
              </p>
            </div>
            <div className="scroll-depth mt-10">
              <CourseRegistrationPreview />
            </div>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-3 text-sm font-semibold text-slate-700">
              {[
                'Shareable URL',
                'Social preview',
                'Login options',
                'Capacity',
                'Waitlist',
                'Payments',
                'Consent',
              ].map((item) => (
                <span key={item} className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-blue-700" aria-hidden="true" />
                  {tx(item)}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section className="border-y border-blue-200 bg-[#eaf1ff] px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[.42fr_.58fr] lg:items-center">
            <div>
              <p className="text-sm font-semibold text-blue-700">
                {tx('A connected academy ecosystem')}
              </p>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.035em] sm:text-4xl">
                {tx('Connect every tool. Keep one flow.')}
              </h2>
              <p className="mt-4 max-w-xl leading-7 text-slate-600">
                {tx('Connect payments, campaigns, delivery, domains and automation.')}
              </p>
            </div>
            <div>
              <ConnectorLogos ids={homeIntegrationBrands} />
              <Link
                href={href('/features')}
                className="mt-6 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-blue-700"
              >
                {tx('Explore integrations by module')}{' '}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </section>

        <FinanceConnectorShowcase locale={locale} imageSrc="/images/marketing/akademate-finance-workspace-v1.png" imageAlt={locale === 'es' ? 'Panel financiero ilustrativo para una academia' : 'Illustrative academy finance workspace'} />

        <CustomerVoices />

        <AppDownloadShowcase compact />

        <section id="solutions" className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('Built around your academy model.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Run every academy model on one connected foundation.')}
              </p>
            </div>
            <SolutionCarousel />
          </div>
        </section>

        <section id="pricing" className="bg-white px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-4xl">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
                {tx('Choose the operating scope you need.')}
              </h2>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {tx('Launch one programme, grow an academy or run a network.')}
              </p>
            </div>
            <div className="mt-10 grid overflow-hidden rounded-2xl border border-slate-200 lg:grid-cols-3">
              {homePlans.map((plan, index) => (
                <article
                  key={plan.name}
                  className={`p-8 sm:p-10 ${index === 1 ? 'bg-[#071633] text-white' : 'bg-white'} ${index < homePlans.length - 1 ? 'border-b border-slate-200 lg:border-b-0 lg:border-r' : ''}`}
                >
                  <p
                    className={`text-sm font-semibold ${index === 1 ? 'text-blue-200' : 'text-blue-700'}`}
                  >
                    {plan.label}
                  </p>
                  <h3 className="mt-4 text-4xl font-semibold tracking-tight">{plan.name}</h3>
                  <p
                    className={`mt-5 leading-7 ${index === 1 ? 'text-blue-100/75' : 'text-slate-600'}`}
                  >
                    {plan.description}
                  </p>
                  <ul className="mt-8 space-y-3">
                    {plan.features.slice(0, 4).map((feature) => (
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
                    href={href(`/contacto?asunto=${plan.subject}`)}
                    className={
                      index === 1 ? 'button-primary-light mt-9' : 'button-primary-dark mt-9'
                    }
                  >
                    {plan.cta} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                  </Link>
                </article>
              ))}
            </div>
            <Link
              href={href('/pricing')}
              className="mt-8 inline-flex min-h-11 items-center gap-2 font-semibold text-blue-700 hover:text-blue-900"
            >
              {tx('Compare plans')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>

        <GovernanceFrameworks />

        <section className="px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
              <h2 className="text-4xl font-semibold tracking-[-0.045em] sm:text-5xl">
                {tx('Insights and product news.')}
              </h2>
              <div className="flex gap-5 text-sm font-semibold text-blue-700">
                <Link href={href('/blog')} className="inline-flex min-h-11 items-center gap-2">
                  {tx('Explore insights')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <Link href={href('/news')} className="inline-flex min-h-11 items-center gap-2">
                  {tx('Read news')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </div>
            </div>
            <div className="mt-10 grid gap-8 lg:grid-cols-2">
              {[
                { label: 'Latest insight', href: '/blog', post: insightPosts[0] },
                { label: 'Latest news', href: '/news', post: newsPosts.at(-1) },
              ].map(({ label, href: basePath, post }) =>
                post ? (
                  <Link
                    key={post.slug}
                    href={href(`${basePath}/${post.slug}`)}
                    className="group block rounded-2xl border border-slate-200 bg-white p-3"
                  >
                    <div className="media-reveal relative aspect-[16/9] overflow-hidden rounded-xl">
                      <Image
                        src={post.image}
                        alt={post.imageAlt}
                        fill
                        sizes="(max-width: 1024px) 100vw, 50vw"
                        className="object-cover"
                      />
                    </div>
                    <div className="p-4 sm:p-5">
                      <p className="text-sm font-semibold text-blue-700">
                        {tx(label)} · {post.readingTime}
                      </p>
                      <h3 className="mt-3 text-2xl font-semibold tracking-tight transition-colors group-hover:text-blue-700 sm:text-3xl">
                        {post.title}
                      </h3>
                      <p className="mt-3 max-w-2xl leading-7 text-slate-600">{post.excerpt}</p>
                    </div>
                  </Link>
                ) : null
              )}
            </div>
          </div>
        </section>

        <section className="px-4 pb-20 sm:px-6 lg:px-8 lg:pb-28">
          <div className="product-texture mx-auto max-w-7xl overflow-hidden rounded-2xl bg-[#071633] px-6 py-16 text-center text-white sm:px-12 lg:py-24">
            <Globe2
              className="mx-auto h-9 w-9 text-blue-300"
              strokeWidth={1.75}
              aria-hidden="true"
            />
            <h2 className="mx-auto mt-6 max-w-4xl text-4xl font-semibold tracking-[-0.045em] sm:text-6xl">
              {tx('Build the academy people want to join.')}
            </h2>
            <p className="mx-auto mt-6 max-w-2xl text-lg leading-8 text-blue-100/75">
              {tx('Connect your public experience, operation and learning journey.')}
            </p>
            <Link href={href('/contacto?asunto=demo')} className="button-primary-light mt-9">
              {tx('Book a demo')} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  )
}
