// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/lib/blog-posts'
import { featureModuleDetails } from '@/lib/feature-module-details'
import { integrationBrands } from '@/lib/integration-brands'
import {
  academyExperiences,
  academySetupStages,
  academyTypes,
  distributionModes,
  featureGroups,
  governanceFrameworks,
  integrationPillars,
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
  it('describes the expanded operating platform without making AI the sales moat', () => {
    expect(featureGroups).toHaveLength(19)
    expect(featureGroups.every((group) => group.features.length >= 5)).toBe(true)
    expect(featureGroups.map((group) => group.title)).toEqual(
      expect.arrayContaining([
        'Website, catalogue and embeds',
        'Growth, Ads and CRM',
        'Reservations and admissions',
        'Offers, runs and capacity',
        'Academic operations',
        'Virtual campus and learning',
        'Communication and community',
        'Payments, billing and finance',
        'Finance and accounting',
        'HR and workforce',
        'Library, inventory and facilities',
        'Sports and seasonal operations',
        'Security and governance',
        'APIs, webhooks and deployment',
      ])
    )

    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
    expect(`${home}${layout}`).not.toMatch(/AI-assisted operating system/i)
    expect(home).toMatch(/The operating system for academies\./)
  })

  it('models the complete product journey from website distribution to extensible operations', () => {
    expect(distributionModes.map((mode) => mode.title)).toEqual([
      'Your Akademate website',
      'Your own domain',
      'Embeds for any website',
      'A page for every offer',
    ])
    expect(platformPillars).toHaveLength(8)
    expect(roadmapModules.map((module) => module.title)).toEqual(
      expect.arrayContaining([
        'Finance and accounting',
        'HR and workforce',
        'Library and inventory',
        'Advanced learning',
        'Mobile experience',
        'AI-assisted operations',
      ])
    )
  })

  it('makes connected role experiences and multi-site setup first-class product stories', () => {
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
    expect(academySetupStages.map((stage) => stage.progress)).toEqual([12, 30, 48, 66, 84, 100])
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
    expect(home.indexOf('<ConnectedExperiences')).toBeLessThan(
      home.indexOf('<WebsiteDistributionPreview')
    )
    expect(home.indexOf('One platform. Every part of the academy.')).toBeLessThan(
      home.indexOf('<WebsiteDistributionPreview')
    )
    expect(roleComponent).toContain('role="tablist"')
    expect(roleComponent).toContain('role="tabpanel"')
    expect(setupComponent).toContain('role="tablist"')
    expect(setupComponent).toContain('role="tabpanel"')
    expect(setupComponent).toContain('aria-live="polite"')
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

  it('publishes at least four complete articles and product news with local images', () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(4)
    expect(blogPosts.map((post) => post.slug)).toEqual(
      expect.arrayContaining([
        'campaign-click-to-confirmed-place',
        'akademate-expands-sport-wellness-seasonal',
      ])
    )
    for (const post of blogPosts) {
      expect(post.sections.length).toBeGreaterThanOrEqual(4)
      expect(existsSync(new URL(`../public${post.image}`, import.meta.url))).toBe(true)
    }
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
    expect(frameworkComponent).not.toMatch(
      /certified|official endorsement|official seal|approved by/i
    )
  })

  it('does not represent vertical labels or fictional names as customers', () => {
    const proof = readFileSync(
      new URL('../components/marketing/AcademyProof.tsx', import.meta.url),
      'utf8'
    )
    expect(proof).toContain('CEP Formación')
    expect(proof).toContain('Built for modern academy models')
    expect(proof).not.toMatch(/trusted by|customers include/i)
  })

  it('attributes public learner reviews and never presents them as invented SaaS endorsements', () => {
    const voices = readFileSync(
      new URL('../components/marketing/CustomerVoices.tsx', import.meta.url),
      'utf8'
    )
    expect(voices).toContain('Public learner review presented by CEP Formación')
    expect(voices).toContain('https://cepformacion.akademate.com/')
    expect(voices).toMatch(/Olga Mercedes|Isabel Clemente|Mr\. Avocato/)
    expect(voices).not.toMatch(/fictional|placeholder customer|trusted by/i)
  })

  it('keeps navigation on real routes and replaces AI-first navigation with solutions', () => {
    expect(publicNavigation.map((item) => item.href)).toEqual([
      '/features',
      '/solutions',
      '/pricing',
      '/blog',
      '/sobre-nosotros',
    ])
    expect(publicNavigation.find((item) => item.href === '/blog')?.name).toBe('Blog')
    expect(publicCompanyLinks.find((item) => item.href === '/blog')?.name).toBe('Blog')
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
    expect(footer).toContain('aria-label={`${link.name}: find Akademate`}')
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
