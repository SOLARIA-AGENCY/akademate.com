// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/lib/blog-posts'
import { academyTypes, featureGroups, governanceFrameworks, integrationPillars, plans, reservationModes, solutionDetails, verticals } from '@/lib/marketing-content'
import { publicCompanyLinks, publicNavigation, publicSocialLinks } from '@/lib/public-navigation'

describe('public marketing architecture', () => {
  it('describes the expanded operating platform without making AI the sales moat', () => {
    expect(featureGroups).toHaveLength(15)
    expect(featureGroups.every((group) => group.features.length >= 5)).toBe(true)
    expect(featureGroups.map((group) => group.title)).toEqual(expect.arrayContaining([
      'Growth, Ads and CRM', 'Reservations and admissions', 'Offers, runs and capacity', 'Academic operations', 'Virtual campus and learning', 'Communication and community', 'Payments, billing and finance', 'Sports and seasonal operations', 'Security and governance', 'APIs, webhooks and deployment',
    ]))

    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    const layout = readFileSync(new URL('../app/layout.tsx', import.meta.url), 'utf8')
    expect(`${home}${layout}`).not.toMatch(/AI-assisted operating system/i)
    expect(home).toMatch(/The operating system for modern academies\./)
  })

  it('offers Launch, Business and Enterprise without fabricated prices', () => {
    expect(plans.map((plan) => plan.name)).toEqual(['Launch', 'Business', 'Enterprise'])
    expect(plans[2]?.label).toMatch(/on-premise/i)
    expect(JSON.stringify(plans)).not.toMatch(/[€$£]\s?\d/)
  })

  it('models six reservation modes without collapsing every lead into enrolment', () => {
    expect(reservationModes.map((mode) => mode.title)).toEqual(['Enquiry', 'Application', 'Place hold', 'Instant booking', 'Paid enrolment', 'Waitlist'])
  })

  it('publishes at least eight vertical profiles with project-local imagery', () => {
    expect(verticals.length).toBeGreaterThanOrEqual(8)
    expect(academyTypes.length).toBeGreaterThanOrEqual(8)
    for (const vertical of verticals) {
      expect(existsSync(new URL(`../public${vertical.image}`, import.meta.url))).toBe(true)
      expect(vertical.capabilities.length).toBeGreaterThanOrEqual(3)
    }
    expect(verticals.map((vertical) => vertical.slug)).toEqual(expect.arrayContaining(['wellness', 'sports', 'seasonal', 'performing-arts', 'networks']))
    expect(new Set(verticals.map((vertical) => vertical.image)).size).toBe(verticals.length)
    expect(Object.keys(solutionDetails).sort()).toEqual(verticals.map((vertical) => vertical.slug).sort())
    for (const detail of Object.values(solutionDetails)) {
      expect(detail.outcomes).toHaveLength(4)
      expect(detail.workflow).toHaveLength(4)
      expect(detail.modules).toHaveLength(4)
    }
  })

  it('names the required payment, finance and growth integration architecture', () => {
    const content = JSON.stringify(integrationPillars)
    for (const provider of ['Stripe', 'PayPal', 'SEPA', 'Finance APIs', 'Meta Ads', 'CAPI', 'MCP']) expect(content).toContain(provider)

    const features = readFileSync(new URL('../app/features/page.tsx', import.meta.url), 'utf8')
    const pricing = readFileSync(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
    expect(`${features}${pricing}`).toMatch(/availability is scoped during onboarding|agreed during onboarding/i)
  })

  it('publishes at least four complete articles and product news with local images', () => {
    expect(blogPosts.length).toBeGreaterThanOrEqual(4)
    expect(blogPosts.map((post) => post.slug)).toEqual(expect.arrayContaining([
      'campaign-click-to-confirmed-place',
      'akademate-expands-sport-wellness-seasonal',
    ]))
    for (const post of blogPosts) {
      expect(post.sections.length).toBeGreaterThanOrEqual(4)
      expect(existsSync(new URL(`../public${post.image}`, import.meta.url))).toBe(true)
    }
  })

  it('presents governance as a roadmap without unsupported certification language', () => {
    expect(governanceFrameworks.map((item) => item.short)).toEqual(expect.arrayContaining(['GDPR', 'EU AI Act', 'ISO 27001', 'SOC 2']))
    const frameworkComponent = readFileSync(new URL('../components/marketing/GovernanceFrameworks.tsx', import.meta.url), 'utf8')
    expect(frameworkComponent).toMatch(/privacy, security and responsible AI roadmap/i)
    expect(frameworkComponent).not.toMatch(/certified|official endorsement|official seal|approved by/i)
  })

  it('does not represent vertical labels or fictional names as customers', () => {
    const proof = readFileSync(new URL('../components/marketing/AcademyProof.tsx', import.meta.url), 'utf8')
    expect(proof).toContain('CEP Formación')
    expect(proof).toContain('Built for modern academy models')
    expect(proof).not.toMatch(/trusted by|customers include/i)
  })

  it('keeps navigation on real routes and replaces AI-first navigation with solutions', () => {
    expect(publicNavigation.map((item) => item.href)).toEqual(['/features', '/solutions', '/pricing', '/blog', '/sobre-nosotros'])
    expect(publicNavigation.find((item) => item.href === '/blog')?.name).toBe('Blog')
    expect(publicCompanyLinks.find((item) => item.href === '/blog')?.name).toBe('Blog')
  })

  it('centralizes accessible Instagram, X and Facebook destinations', () => {
    expect(publicSocialLinks.map((link) => link.name)).toEqual(['Instagram', 'X', 'Facebook'])
    expect(publicSocialLinks.map((link) => new URL(link.href).hostname)).toEqual(['www.instagram.com', 'x.com', 'www.facebook.com'])
    const footer = readFileSync(new URL('../components/layout/footer.tsx', import.meta.url), 'utf8')
    expect(footer).toContain('target="_blank"')
    expect(footer).toContain('rel="noreferrer"')
    expect(footer).toContain('aria-label={`${link.name}: find Akademate`}')
  })

  it('ships interactive product examples with accessible tabs and real controls', () => {
    const productMoments = readFileSync(new URL('../components/marketing/ProductMoments.tsx', import.meta.url), 'utf8')
    expect(productMoments).toContain('role="tablist"')
    expect(productMoments).toContain('role="tabpanel"')
    for (const label of ['Reservations', 'Growth & CRM', 'Programmes', 'Campus', 'Payments', 'Insight']) expect(productMoments).toContain(label)
    expect(productMoments).toContain('<select')
    expect(productMoments).toContain('<input')
  })

  it('assigns dedicated imagery to the primary commercial pages', () => {
    const pages = [
      ['../app/features/page.tsx', 'features-operations-team.jpg'],
      ['../app/pricing/page.tsx', 'pricing-growth-planning.jpg'],
      ['../app/sobre-nosotros/page.tsx', 'about-founder-campus.jpg'],
      ['../app/contacto/page.tsx', 'contact-consultation.jpg'],
    ] as const
    for (const [file, image] of pages) expect(readFileSync(new URL(file, import.meta.url), 'utf8')).toContain(image)
  })

  it('ships marketing copy without em-dash design flourishes', () => {
    const files = ['../app/page.tsx', '../app/features/page.tsx', '../app/pricing/page.tsx', '../components/layout/footer.tsx']
    for (const file of files) expect(readFileSync(new URL(file, import.meta.url), 'utf8')).not.toContain('—')
  })
})
