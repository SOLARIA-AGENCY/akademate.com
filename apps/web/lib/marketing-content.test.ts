// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/lib/blog-posts'
import { academyTypes, featureGroups, governanceFrameworks, integrationPillars, plans, reservationModes, verticals } from '@/lib/marketing-content'
import { publicNavigation } from '@/lib/public-navigation'

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
    expect(home).toMatch(/One operating system for every learning business/)
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
  })

  it('names the required payment, finance and growth integration architecture', () => {
    const content = JSON.stringify(integrationPillars)
    for (const provider of ['Stripe', 'PayPal', 'SEPA', 'Finance APIs', 'Meta Ads', 'CAPI', 'MCP']) expect(content).toContain(provider)

    const features = readFileSync(new URL('../app/features/page.tsx', import.meta.url), 'utf8')
    const pricing = readFileSync(new URL('../app/pricing/page.tsx', import.meta.url), 'utf8')
    expect(`${features}${pricing}`).toMatch(/availability is scoped during onboarding|agreed during onboarding/i)
  })

  it('publishes two complete articles with local generated images', () => {
    expect(blogPosts).toHaveLength(2)
    for (const post of blogPosts) {
      expect(post.sections.length).toBeGreaterThanOrEqual(4)
      expect(existsSync(new URL(`../public${post.image}`, import.meta.url))).toBe(true)
    }
  })

  it('uses governance frameworks as references rather than certifications', () => {
    expect(governanceFrameworks.map((item) => item.short)).toEqual(expect.arrayContaining(['GDPR', 'EU AI Act', 'ISO 27001', 'SOC 2']))
    const frameworkComponent = readFileSync(new URL('../components/marketing/GovernanceFrameworks.tsx', import.meta.url), 'utf8')
    expect(frameworkComponent).toMatch(/No certification or official endorsement is implied/)
    expect(frameworkComponent).not.toMatch(/official seal/i)
  })

  it('does not represent vertical labels or fictional names as customers', () => {
    const proof = readFileSync(new URL('../components/marketing/AcademyProof.tsx', import.meta.url), 'utf8')
    expect(proof).toContain('CEP Formación')
    expect(proof).toContain('Built for modern academy models')
    expect(proof).not.toMatch(/trusted by|customers include/i)
  })

  it('keeps navigation on real routes and replaces AI-first navigation with solutions', () => {
    expect(publicNavigation.map((item) => item.href)).toEqual(['/features', '/#solutions', '/pricing', '/blog', '/sobre-nosotros'])
  })

  it('ships marketing copy without em-dash design flourishes', () => {
    const files = ['../app/page.tsx', '../app/features/page.tsx', '../app/pricing/page.tsx', '../components/layout/footer.tsx']
    for (const file of files) expect(readFileSync(new URL(file, import.meta.url), 'utf8')).not.toContain('—')
  })
})
