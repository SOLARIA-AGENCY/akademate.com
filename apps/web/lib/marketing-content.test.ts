// @vitest-environment node

import { existsSync, readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { blogPosts } from '@/lib/blog-posts'
import { academyTypes, featureGroups, governanceFrameworks, plans } from '@/lib/marketing-content'
import { publicNavigation } from '@/lib/public-navigation'

describe('public marketing architecture', () => {
  it('describes the platform as a comprehensive operational catalogue', () => {
    expect(featureGroups).toHaveLength(13)
    expect(featureGroups.every((group) => group.features.length >= 5)).toBe(true)
    expect(featureGroups.map((group) => group.title)).toEqual(expect.arrayContaining([
      'Admissions and CRM', 'Academic operations', 'Students and enrolments', 'Organisation and campuses', 'Learning delivery', 'Offer and publishing', 'Payments and finance', 'AI-assisted operations', 'Security and governance', 'Integrations and deployment',
    ]))
  })

  it('offers only Business and Enterprise without fabricated prices', () => {
    expect(plans.map((plan) => plan.name)).toEqual(['Business', 'Enterprise'])
    expect(plans[1]?.label).toMatch(/on-premise/i)
    expect(JSON.stringify(plans)).not.toMatch(/[€$£]\s?\d/)
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
    expect(frameworkComponent).not.toMatch(/certified|official seal/i)
  })

  it('does not represent fictional academy names as customers', () => {
    expect(academyTypes.every((name) => /academ|school|institute|training|group/i.test(name))).toBe(true)
    const proof = readFileSync(new URL('../components/marketing/AcademyProof.tsx', import.meta.url), 'utf8')
    expect(proof).toContain('CEP Formación')
    expect(proof).toContain('Built for modern academy models')
  })

  it('keeps primary navigation on real marketing routes', () => {
    expect(publicNavigation.map((item) => item.href)).toEqual(['/features', '/#ai', '/pricing', '/blog', '/sobre-nosotros'])
  })
})
