// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import {
  agenticControls,
  agenticProviders,
  campaignFunnel,
  campaignMetrics,
} from '@/lib/agentic-growth-content'
import { appDownloadOptions } from '@/lib/app-download-content'
import { getSecondaryPublicContent } from '@/lib/secondary-public-content'
import { blogPosts, insightPosts, newsPosts } from '@/lib/blog-posts'
import { featureModuleDetails } from '@/lib/feature-module-details'
import { integrationBrands, integrationPillarBrands } from '@/lib/integration-brands'
import {
  academyExperiences,
  academySetupStages,
  academyTypes,
  academyModelCoverage,
  distributionModes,
  featureGroups,
  governanceFrameworks,
  integrationPillars,
  operatingJourney,
  plans,
  platformPillars,
  reservationModes,
  roadmapModules,
  solutionDetails,
  verticals,
} from '@/lib/marketing-content'
import { publicCompanyLinks, publicNavigation, publicSocialLinks } from '@/lib/public-navigation'
import { verticalProductStories } from '@/lib/vertical-product-stories'

describe('public marketing architecture', () => {
  it('keeps repeated commercial surfaces compact and structurally symmetric', () => {
    const words = (value: string) => value.trim().split(/\s+/).length

    expect(platformPillars.every((pillar) => pillar.capabilities.length === 5)).toBe(true)
    expect(platformPillars.every((pillar) => words(pillar.text) <= 10)).toBe(true)
    expect(operatingJourney.every((step) => words(step.text) <= 10)).toBe(true)
    expect(academySetupStages.every((stage) => words(stage.description) <= 10)).toBe(true)
    expect(verticals.every((vertical) => words(vertical.description) <= 10)).toBe(true)
    expect(featureGroups.every((group) => words(group.description) <= 12)).toBe(true)
    expect(plans.every((plan) => words(plan.description) <= 12)).toBe(true)

    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    expect(home).toContain('<ul className="compact-feature-list">')
    expect(home).not.toContain("pillar.capabilities.join(' · ')")
  })

  it('presents academy-model coverage without fabricating customer adoption', () => {
    expect(academyModelCoverage.length).toBeGreaterThanOrEqual(12)
    expect(new Set(academyModelCoverage).size).toBe(academyModelCoverage.length)
    const marquee = readFileSync(
      new URL('../components/marketing/ClientMarquee.tsx', import.meta.url),
      'utf8'
    )
    expect(marquee).toContain('Built around every academy model')
    expect(marquee).toContain('client-marquee-track-reverse')
    expect(marquee).toContain('aria-hidden="true"')
    expect(marquee).toContain('text-center')

    const styles = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
    expect(styles).toMatch(/client-marquee 132s linear infinite/)
    expect(styles).toMatch(/animation-duration: 148s/)
    expect(styles).toMatch(/\.client-marquee-name:hover[\s\S]*color: #155dfc/)
    expect(styles).toMatch(/\.client-marquee-name:hover[\s\S]*transform: scale\(1\.045\)/)
    expect(styles).not.toMatch(/client-marquee-track:hover[\s\S]*animation-play-state:\s*paused/)
  })

  it('describes the expanded operating platform without making AI the sales moat', () => {
    expect(featureGroups).toHaveLength(23)
    expect(featureGroups.every((group) => group.features.length >= 5)).toBe(true)
    expect(featureGroups.map((group) => group.title)).toEqual(
      expect.arrayContaining([
        'Website, catalogue and embeds',
        'Growth, Ads and CRM',
        'Campaign intelligence',
        'Reservations and admissions',
        'Offers, runs and capacity',
        'Academic operations',
        'Attendance and physical access',
        'Virtual campus and learning',
        'Communication and community',
        'Digital signage',
        'Payments, billing and finance',
        'Finance and accounting',
        'HR and workforce',
        'Library, inventory and facilities',
        'Sports and seasonal operations',
        'AI workspace and MCP',
        'Security and governance',
        'APIs, webhooks and deployment',
      ])
    )

    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
    const dictionaries = readFileSync(new URL('./i18n/dictionaries.ts', import.meta.url), 'utf8')
    expect(`${home}${layout}`).not.toMatch(/AI-assisted operating system/i)
    expect(home).toContain('{dictionary.home.title}')
    expect(dictionaries).toMatch(/Run your academy\. Grow\./)
  })

  it('models the complete product journey from website distribution to extensible operations', () => {
    expect(distributionModes.map((mode) => mode.title)).toEqual([
      'Your Akademate website',
      'Your own domain',
      'Embeds for any website',
      'A page for every offer',
    ])
    expect(platformPillars).toHaveLength(8)
    expect(new Set(platformPillars.map((pillar) => pillar.image)).size).toBe(8)
    for (const pillar of platformPillars) {
      expect(existsSync(new URL(`../public${pillar.image}`, import.meta.url))).toBe(true)
      expect(pillar.imageAlt.length).toBeGreaterThan(20)
    }
    expect(roadmapModules.map((module) => module.title)).toEqual(
      expect.arrayContaining([
        'Finance and accounting',
        'HR and workforce',
        'Library and inventory',
        'Advanced learning',
        'Mobile experience',
        'AI-assisted operations',
        'Attendance and physical access',
        'Digital signage',
      ])
    )
  })

  it('keeps agentic and campaign expansion claim-safe and structurally explicit', () => {
    expect(agenticProviders).toHaveLength(4)
    expect(agenticProviders.map((provider) => provider.label)).toEqual([
      'ChatGPT',
      'Claude',
      'Grok',
      'Gemini',
    ])
    expect(agenticProviders.every((provider) => provider.status === 'Planned connector')).toBe(true)
    expect(agenticControls).toHaveLength(3)
    expect(agenticControls.map((control) => control.action)).toEqual([
      'No approval needed',
      'Review before send',
      'Approval required',
    ])
    expect(campaignMetrics.map((metric) => metric.label)).toEqual(
      expect.arrayContaining([
        'Impressions',
        'Reach',
        'CTR',
        'Spend',
        'Leads',
        'Attributed enrolments',
      ])
    )
    expect(campaignMetrics.find((metric) => metric.label === 'Reach')?.value).toBe('N/D')
    expect(campaignFunnel.map((step) => step.label)).toEqual([
      'Campaign',
      'Landing',
      'Lead',
      'Application',
      'Enrolment',
    ])

    const showcase = readFileSync(
      new URL('../components/marketing/AgenticGrowthShowcase.tsx', import.meta.url),
      'utf8'
    )
    expect(showcase).toContain('tenant-scoped')
    expect(agenticControls.some((control) => control.action === 'Approval required')).toBe(true)
    expect(showcase).toContain('Illustrative example')
    expect(showcase).not.toMatch(/autonomous|guaranteed ROI|real-time|all agents supported/i)
  })

  it('publishes only honest Coming soon application previews', () => {
    expect(appDownloadOptions.map((option) => option.label)).toEqual(['Mac', 'iPhone', 'iPad'])
    expect(appDownloadOptions.every((option) => option.status === 'Coming soon')).toBe(true)
    for (const option of appDownloadOptions) {
      expect(existsSync(new URL(`../public${option.image}`, import.meta.url))).toBe(true)
    }
    expect(
      existsSync(
        new URL('../public/images/download/akademate-apps-device-family-v1.jpg', import.meta.url)
      )
    ).toBe(true)

    for (const locale of ['en', 'es'] as const) {
      const apps = getSecondaryPublicContent(locale).apps
      expect(apps.options.map((option) => option.id)).toEqual(['mac', 'iphone', 'ipad'])
      expect(apps.previewOnly).toMatch(/coming soon|próximamente/i)
      expect(apps.options.every((option) => /coming soon|próximamente/i.test(option.status))).toBe(
        true
      )
    }

    expect(JSON.stringify(getSecondaryPublicContent('en').apps)).not.toMatch(
      /App Store|Download now|Install now/
    )
  })

  it('makes connected role experiences and the operating dashboard first-class Home stories', () => {
    expect(academyExperiences.map((experience) => experience.id)).toEqual([
      'operations',
      'teachers',
      'learners',
    ])
    expect(academyExperiences.every((experience) => experience.capabilities.length >= 5)).toBe(true)
    expect(JSON.stringify(academyExperiences)).toMatch(/private chat/i)
    expect(JSON.stringify(academyExperiences)).toMatch(/grades/i)
    expect(JSON.stringify(academyExperiences)).toMatch(/in-person/i)
    expect(JSON.stringify(academyExperiences)).toMatch(/live online/i)

    expect(academySetupStages).toHaveLength(6)
    expect(new Set(academySetupStages.map((stage) => stage.image)).size).toBe(6)
    expect(academySetupStages.map((stage) => stage.image)).toEqual([
      '/images/academy-setup/academy-stage-01-blueprint.jpg',
      '/images/academy-setup/academy-stage-02-structure.jpg',
      '/images/academy-setup/academy-stage-03-envelope.jpg',
      '/images/academy-setup/academy-stage-04-spaces.jpg',
      '/images/academy-setup/academy-stage-05-identity.jpg',
      '/images/academy-setup/academy-stage-06-live.jpg',
    ])
    for (const stage of academySetupStages) {
      expect(existsSync(new URL(`../public${stage.image}`, import.meta.url))).toBe(true)
      expect(stage.imageAlt).toMatch(/same|academy/i)
    }
    expect(academySetupStages[1]?.title).toBe('Campuses and spaces')
    expect(academySetupStages[1]?.capabilities).toEqual(
      expect.arrayContaining(['Multiple campuses', 'Rooms and facilities', 'Online campus'])
    )
    expect(academySetupStages.at(-1)?.title).toBe('Academy live')

    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    const roleComponent = readFileSync(
      new URL('../components/marketing/ConnectedExperiences.tsx', import.meta.url),
      'utf8'
    )
    const setupComponent = readFileSync(
      new URL('../components/marketing/AcademySetupJourney.tsx', import.meta.url),
      'utf8'
    )
    const operationsComponent = readFileSync(
      new URL('../components/marketing/AcademyOperationsStory.tsx', import.meta.url),
      'utf8'
    )
    expect(home.indexOf('<ConnectedExperiences')).toBeLessThan(
      home.indexOf('<WebsiteDistributionPreview')
    )
    expect(home.indexOf('One platform. Every part of the academy.')).toBeLessThan(
      home.indexOf('<WebsiteDistributionPreview')
    )
    expect(home).toContain('<AcademyOperationsStory')
    expect(home).not.toContain('<AcademySetupJourney')
    expect(operationsComponent).toMatch(/Academy overview/)
    expect(operationsComponent).toMatch(/Active learners/)
    expect(roleComponent).toContain('role="tablist"')
    expect(roleComponent).toContain('role="tabpanel"')
    expect(setupComponent).toContain('role="tablist"')
    expect(setupComponent).toContain('role="tabpanel"')
    expect(setupComponent).toContain('aria-live="polite"')
    expect(setupComponent).toContain('src={active.image}')
    expect(setupComponent).not.toContain('% complete')
    expect(setupComponent).not.toContain('active.progress')
  })

  it('adds connected-campus operations and keeps Home commercial language affirmative', () => {
    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    const campus = readFileSync(
      new URL('../components/marketing/PhysicalCampusStory.tsx', import.meta.url),
      'utf8'
    )
    const mcp = readFileSync(
      new URL('../components/marketing/HomeMcpConnect.tsx', import.meta.url),
      'utf8'
    )

    expect(JSON.stringify(featureGroups)).toMatch(/QR check-in/i)
    expect(JSON.stringify(featureGroups)).toMatch(/NFC and RFID/i)
    expect(JSON.stringify(featureGroups)).toMatch(/Digital signage/i)
    expect(JSON.stringify(featureGroups)).toMatch(/Display status/i)
    expect(campus).toContain('/images/marketing/home-modules/attendance-access.jpg')
    expect(campus).toContain('/images/marketing/home-modules/digital-signage.jpg')
    expect(mcp).toContain('Connect your AI agent to Akademate.')
    expect(mcp).toContain('agenticProviders.map')
    expect(`${home}${campus}${mcp}`).not.toMatch(
      /(?:^|[\s>])(?:No|Replace|Fragmented|Disconnected|Without)\b/
    )
  })

  it('uses an accessible slow infinite carousel for every academy model', () => {
    const carousel = readFileSync(
      new URL('../components/marketing/SolutionCarousel.tsx', import.meta.url),
      'utf8'
    )
    expect(carousel).toContain('aria-roledescription="carousel"')
    expect(carousel).toContain('overflow-x-auto')
    expect(carousel).toContain('requestAnimationFrame')
    expect(carousel).toContain('* 0.006')
    expect(carousel).toContain('Previous academy model')
    expect(carousel).toContain('Next academy model')
    expect(carousel).toContain('prefers-reduced-motion: reduce')
  })

  it('offers Launch, Business and Enterprise without fabricated prices', () => {
    expect(plans.map((plan) => plan.name)).toEqual(['Launch', 'Business', 'Enterprise'])
    expect(plans[2]?.label).toMatch(/on-premise/i)
    expect(JSON.stringify(plans)).not.toMatch(/[€$£]\s?\d/)
  })

  it('models six reservation modes without collapsing every lead into enrolment', () => {
    expect(reservationModes.map((mode) => mode.title)).toEqual([
      'Enquiry',
      'Application',
      'Place hold',
      'Instant booking',
      'Paid enrolment',
      'Waitlist',
    ])
  })

  it('publishes at least eight vertical profiles with project-local imagery', () => {
    expect(verticals.length).toBeGreaterThanOrEqual(8)
    expect(academyTypes.length).toBeGreaterThanOrEqual(8)
    for (const vertical of verticals) {
      expect(existsSync(new URL(`../public${vertical.image}`, import.meta.url))).toBe(true)
      expect(vertical.capabilities.length).toBeGreaterThanOrEqual(3)
    }
    expect(verticals.map((vertical) => vertical.slug)).toEqual(
      expect.arrayContaining(['wellness', 'sports', 'seasonal', 'performing-arts', 'networks'])
    )
    expect(new Set(verticals.map((vertical) => vertical.image)).size).toBe(verticals.length)
    expect(Object.keys(solutionDetails).sort()).toEqual(
      verticals.map((vertical) => vertical.slug).sort()
    )
    for (const detail of Object.values(solutionDetails)) {
      expect(detail.outcomes).toHaveLength(4)
      expect(detail.workflow).toHaveLength(4)
      expect(detail.modules).toHaveLength(4)
    }
  })

  it('gives every vertical its own four-part product experience', () => {
    expect(Object.keys(verticalProductStories).sort()).toEqual(
      verticals.map((vertical) => vertical.slug).sort()
    )
    for (const story of Object.values(verticalProductStories)) {
      expect(story.moments).toHaveLength(4)
      expect(new Set(story.moments.map((moment) => moment.title)).size).toBe(4)
      for (const moment of story.moments) {
        expect(moment.fields).toHaveLength(3)
        expect(moment.activity).toHaveLength(3)
      }
    }
    expect(JSON.stringify(verticalProductStories.wellness)).toMatch(/Vinyasa Flow|Reformer Pilates/)
    expect(JSON.stringify(verticalProductStories.sports)).toMatch(/guardian|team|season/i)
    expect(JSON.stringify(verticalProductStories.languages)).toMatch(/CEFR|placement/i)
    expect(JSON.stringify(verticalProductStories.networks)).toMatch(/campus|consolidated/i)
  })

  it('names the required payment, finance and growth integration architecture', () => {
    const content = JSON.stringify(integrationPillars)
    for (const provider of ['Stripe', 'PayPal', 'SEPA', 'Finance APIs', 'Meta Ads', 'CAPI', 'MCP'])
      expect(content).toContain(provider)

    const features = readFileSync(new URL('../app/features/page.tsx', import.meta.url), 'utf8')
    const pricing = readFileSync(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
    expect(`${features}${pricing}`).toMatch(
      /availability is scoped during onboarding|agreed during onboarding/i
    )
  })

  it('maps every feature module to a visual example and only known connector brands', () => {
    expect(featureModuleDetails).toHaveLength(featureGroups.length)
    expect(featureModuleDetails.map((detail) => detail.title)).toEqual(
      featureGroups.map((group) => group.title)
    )
    for (const detail of featureModuleDetails) {
      expect(detail.audiences.length).toBeGreaterThan(0)
      expect(detail.previewRows).toHaveLength(3)
      for (const connector of detail.connectors) expect(integrationBrands).toHaveProperty(connector)
    }
    expect(
      featureModuleDetails.find((detail) => detail.title === 'Payments, billing and finance')
        ?.connectors
    ).toEqual(
      expect.arrayContaining([
        'stripe',
        'paypal',
        'sepa',
        'visa',
        'mastercard',
        'applepay',
        'googlepay',
      ])
    )
    expect(
      featureModuleDetails.find((detail) => detail.title === 'Growth, Ads and CRM')?.connectors
    ).toEqual(expect.arrayContaining(['meta', 'googleads']))
  })

  it('stores every referenced brand locally and distinguishes providers from payment methods', () => {
    for (const brand of Object.values(integrationBrands))
      expect(existsSync(new URL(`../public${brand.asset}`, import.meta.url))).toBe(true)
    expect(integrationBrands.visa.status).toBe('Payment method')
    expect(integrationBrands.mastercard.status).toBe('Payment method')
    expect(integrationBrands.paypal.status).not.toBe('Available')
    expect(integrationBrands.sepa.status).not.toBe('Available')
  })

  it('shows at least eight researched ecosystem marks in every connector pillar', () => {
    for (const ids of Object.values(integrationPillarBrands)) {
      expect(ids.length).toBeGreaterThanOrEqual(8)
      expect(new Set(ids).size).toBe(ids.length)
      for (const id of ids) expect(integrationBrands).toHaveProperty(id)
    }
  })

  it('separates substantial SEO insights from product news with local images', () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(5)
    expect(insightPosts.length).toBeGreaterThanOrEqual(3)
    expect(newsPosts.length).toBeGreaterThanOrEqual(2)
    expect(blogPosts.map((post) => post.slug)).toEqual(
      expect.arrayContaining([
        'campaign-click-to-confirmed-place',
        'akademate-expands-sport-wellness-seasonal',
      ])
    )
    for (const post of blogPosts) {
      expect(post.sections.length).toBeGreaterThanOrEqual(6)
      const editorialWords = [
        post.introduction,
        ...post.sections.flatMap((section) => [
          section.title,
          ...section.paragraphs,
          ...(section.points ?? []),
        ]),
      ]
        .join(' ')
        .trim()
        .split(/\s+/)
      expect(editorialWords.length).toBeGreaterThanOrEqual(500)
      expect(post.seoTitle.length).toBeGreaterThan(30)
      expect(post.keywords.length).toBeGreaterThanOrEqual(3)
      expect(existsSync(new URL(`../public${post.image}`, import.meta.url))).toBe(true)
    }

    const blogIndex = readFileSync(new URL('../app/blog/page.tsx', import.meta.url), 'utf8')
    const newsIndex = readFileSync(new URL('../app/news/page.tsx', import.meta.url), 'utf8')
    expect(blogIndex).toContain('kind="insight"')
    expect(newsIndex).toContain('kind="news"')
  })

  it('presents governance as a roadmap without unsupported certification language', () => {
    expect(governanceFrameworks.map((item) => item.short)).toEqual(
      expect.arrayContaining(['GDPR', 'EU AI Act', 'ISO 27001', 'SOC 2'])
    )
    const frameworkComponent = readFileSync(
      new URL('../components/marketing/GovernanceFrameworks.tsx', import.meta.url),
      'utf8'
    )
    expect(frameworkComponent).toMatch(/privacy, security and responsible AI roadmap/i)
    expect(frameworkComponent).toContain('framework mark')
    expect(frameworkComponent).toMatch(/ShieldCheck|BrainCircuit|ClipboardCheck|BadgeCheck|CodeXml/)
    expect(frameworkComponent).not.toMatch(
      /certified|official endorsement|official seal|approved by/i
    )
  })

  it('does not clip commercial copy or leave card-grid side borders open', () => {
    const styles = readFileSync(new URL('../app/globals.css', import.meta.url), 'utf8')
    expect(styles).not.toMatch(/-webkit-line-clamp:\s*2/)

    for (const path of [
      '../app/page.tsx',
      '../app/features/page.tsx',
      '../app/pricing/page.tsx',
      '../app/sobre-nosotros/page.tsx',
      '../components/marketing/GovernanceFrameworks.tsx',
    ]) {
      const source = readFileSync(new URL(path, import.meta.url), 'utf8')
      expect(source).not.toMatch(/grid border-y border-/)
      expect(source).not.toMatch(/divide-y border-y border-/)
    }
  })

  it('keeps the owner-provided academy list separate from testimonials and invented logos', () => {
    const marquee = readFileSync(
      new URL('../components/marketing/ClientMarquee.tsx', import.meta.url),
      'utf8'
    )
    expect(marquee).not.toMatch(/testimonial|review|logo/i)
    expect(marquee).not.toMatch(/trusted by/i)
  })

  it('uses source-linked trust signals without fabricating an external review platform', () => {
    const trustSignals = readFileSync(
      new URL('../components/marketing/TrustSignals.tsx', import.meta.url),
      'utf8'
    )
    expect(trustSignals).toContain('Learner-rated experience')
    expect(trustSignals).toContain('Consent-aware enquiries')
    expect(trustSignals).toContain('https://cepformacion.akademate.com/')
    expect(trustSignals).not.toMatch(/trustpilot|g2 crowd|capterra/i)
  })

  it('attributes public learner reviews and never presents them as invented SaaS endorsements', () => {
    const voices = readFileSync(
      new URL('../components/marketing/CustomerVoices.tsx', import.meta.url),
      'utf8'
    )
    expect(voices).toContain('Public learner review presented by CEP Formación')
    expect(voices).toContain('https://cepformacion.akademate.com/')
    expect(voices).toMatch(/Olga Mercedes|Isabel Clemente|Mr\. Avocato/)
    expect(voices).toMatch(
      /The service is excellent|I recommend it 100%|best academy on the island/i
    )
    expect(voices).not.toMatch(/Atienden|Lo recomiendo|Mejor academia/i)
    expect(voices).not.toMatch(/fictional|placeholder customer|trusted by/i)
  })

  it('gives each web distribution mode a distinct visual and ships shareable course assets', () => {
    const distribution = readFileSync(
      new URL('../components/marketing/WebsiteDistributionPreview.tsx', import.meta.url),
      'utf8'
    )
    for (const visual of ['AcademyWebsite', 'DomainConnection', 'EmbedBuilder', 'OfferShare'])
      expect(distribution).toContain(`function ${visual}`)

    const course = readFileSync(
      new URL('../components/marketing/CourseRegistrationPreview.tsx', import.meta.url),
      'utf8'
    )
    expect(course).toContain('academy.akademate.com/creative-leadership')
    expect(course).toContain('8 places available')
    expect(course).toContain('16 of 24 confirmed')
    expect(course).toContain('ShareSheet')
    expect(
      existsSync(
        new URL('../public/images/marketing/course-creative-leadership-v1.jpg', import.meta.url)
      )
    ).toBe(true)
    for (let index = 1; index <= 4; index += 1)
      expect(
        existsSync(
          new URL(`../public/images/avatars/course-attendee-0${index}.jpg`, import.meta.url)
        )
      ).toBe(true)
  })

  it('keeps navigation on real routes and replaces AI-first navigation with solutions', () => {
    expect(publicNavigation.map((item) => item.href)).toEqual([
      '/features',
      '/solutions',
      '/pricing',
      '/blog',
      '/news',
      '/download',
      '/sobre-nosotros',
    ])
    expect(publicNavigation.find((item) => item.href === '/blog')?.name).toBe('Blog')
    expect(publicNavigation.find((item) => item.href === '/news')?.name).toBe('News')
    expect(publicNavigation.find((item) => item.href === '/download')?.name).toBe('Download')
    expect(publicCompanyLinks.find((item) => item.href === '/blog')?.name).toBe('Blog')
    expect(publicCompanyLinks.find((item) => item.href === '/news')?.name).toBe('News')
  })

  it('centralizes accessible Instagram, X and Facebook destinations', () => {
    expect(publicSocialLinks.map((link) => link.name)).toEqual(['Instagram', 'X', 'Facebook'])
    expect(publicSocialLinks.map((link) => new URL(link.href).hostname)).toEqual([
      'www.instagram.com',
      'x.com',
      'www.facebook.com',
    ])
    const footer = readFileSync(new URL('../components/layout/footer.tsx', import.meta.url), 'utf8')
    expect(footer).toContain('target="_blank"')
    expect(footer).toContain('rel="noreferrer"')
    expect(footer).toContain('aria-label={`${link.name}: ${dictionary.footer.socialLabel}`}')
  })

  it('ships interactive product examples with accessible tabs and real controls', () => {
    const productMoments = readFileSync(
      new URL('../components/marketing/ProductMoments.tsx', import.meta.url),
      'utf8'
    )
    expect(productMoments).toContain('role="tablist"')
    expect(productMoments).toContain('role="tabpanel"')
    for (const label of [
      'Reservations',
      'Growth & CRM',
      'Programmes',
      'Campus',
      'Payments',
      'Insight',
    ])
      expect(productMoments).toContain(label)
    expect(productMoments).toContain('<select')
    expect(productMoments).toContain('<input')
  })

  it('assigns dedicated imagery to the primary commercial pages', () => {
    const pages = [
      ['../app/features/page.tsx', 'akademate-product-ecosystem-v2.png'],
      ['../app/pricing/page.tsx', 'akademate-finance-accounting-v2.png'],
      ['../app/sobre-nosotros/page.tsx', 'akademate-company-blueprint-v2.png'],
      ['../app/contacto/page.tsx', 'akademate-implementation-planner-v2.png'],
    ] as const
    for (const [file, image] of pages) {
      expect(readFileSync(new URL(file, import.meta.url), 'utf8')).toContain(image)
      expect(existsSync(new URL(`../public/images/marketing/${image}`, import.meta.url))).toBe(true)
    }
    expect(new Set(pages.map(([, image]) => image)).size).toBe(pages.length)
  })

  it('ships dedicated visual assets for every role and the academy setup journey', () => {
    for (const experience of academyExperiences)
      expect(existsSync(new URL(`../public${experience.image}`, import.meta.url))).toBe(true)
    expect(
      existsSync(
        new URL('../public/images/marketing/akademate-academy-setup-3d-v1.jpg', import.meta.url)
      )
    ).toBe(true)
    expect(new Set(academyExperiences.map((experience) => experience.image)).size).toBe(
      academyExperiences.length
    )
  })

  it('keeps the core public surface on one typography and radius system', () => {
    const files = [
      '../app/page.tsx',
      '../app/features/page.tsx',
      '../app/pricing/page.tsx',
      '../app/solutions/page.tsx',
      '../app/blog/page.tsx',
      '../app/news/page.tsx',
      '../app/sobre-nosotros/page.tsx',
      '../app/contacto/page.tsx',
    ]
    for (const file of files) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8')
      expect(source).not.toContain('font-mono')
      expect(source).not.toContain('rounded-[2rem]')
      expect(source).not.toMatch(/uppercase\s+tracking-/)
    }
  })

  it('ships marketing copy without em-dash design flourishes', () => {
    const files = [
      '../app/page.tsx',
      '../app/features/page.tsx',
      '../app/pricing/page.tsx',
      '../components/layout/footer.tsx',
    ]
    for (const file of files)
      expect(readFileSync(new URL(file, import.meta.url), 'utf8')).not.toContain('—')
  })
})
