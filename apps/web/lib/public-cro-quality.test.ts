// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { academyModelCoverage } from './marketing-content'

const read = (path: string) => readFileSync(new URL(path, import.meta.url), 'utf8')

const heroAuthorities = [
  '../app/page.tsx',
  '../app/features/page.tsx',
  '../app/pricing/page.tsx',
  '../app/solutions/page.tsx',
  '../app/contacto/page.tsx',
  '../app/sobre-nosotros/page.tsx',
  '../app/download/page.tsx',
  '../app/cursos/page.tsx',
  '../components/editorial/EditorialIndex.tsx',
  '../components/editorial/EditorialArticle.tsx',
  '../components/legal/LegalPage.tsx',
] as const

describe('public CRO quality boundaries', () => {
  it('gives every public page family a semantic hero heading', () => {
    for (const path of heroAuthorities) {
      const source = read(path)
      expect(source, path).toMatch(/<h1\b/)
      expect(source, path).toMatch(/<(?:section|header)\b/)
    }
  })

  it('does not present fictional academy brands as customer adoption', () => {
    const marquee = read('../components/marketing/ClientMarquee.tsx')
    const marketing = read('../lib/marketing-content.ts')

    expect(marquee).toContain('Built around every academy model')
    expect(marketing).not.toMatch(/LinguaPro|ZenFlow|ProSport|CohortPro|CodeCraft/)
    expect(academyModelCoverage).toEqual(
      expect.arrayContaining([
        'Language academies',
        'Sports academies',
        'Online cohort programmes',
        'Multi-site academy groups',
      ])
    )
  })

  it('blocks unverified ROI and service-level claims from commercial pages', () => {
    const publicCopy = [
      read('../app/page.tsx'),
      read('../app/features/page.tsx'),
      read('../app/pricing/page.tsx'),
      read('../app/solutions/page.tsx'),
      read('../app/contacto/page.tsx'),
      read('../components/marketing/TrustSignals.tsx'),
    ].join('\n')

    expect(publicCopy).not.toMatch(
      /50[,.]?000 learners|95%|migration in 48 hours|support.{0,20}15 minutes/i
    )
    expect(read('../lib/i18n/dictionaries.ts')).toMatch(/24 business hours/)
  })

  it('labels governance frameworks as references and never as certifications', () => {
    const frameworks = read('../components/marketing/GovernanceFrameworks.tsx')
    const badges = read('../components/legal/ComplianceBadges.tsx')
    const legal = read('../app/legal/ia/page.tsx')

    expect(frameworks).toContain('Reference framework')
    expect(frameworks).toContain('Roadmap — not a certification')
    expect(`${frameworks}${badges}`).not.toMatch(/certified|official seal|certification achieved/i)
    expect(legal).toMatch(
      /Evidence for completed certifications or independent audits will be published/i
    )
  })

  it('keeps paid physical-campus extensions outside base-plan inclusion', () => {
    const pricing = read('./pricing-content.ts')

    for (const capability of [
      'QR attendance and mobile check-in',
      'NFC and RFID identities',
      'Physical access readers and sensors',
      'Digital Signage',
    ]) {
      const rowStart = pricing.indexOf(`capability: '${capability}'`)
      expect(rowStart, capability).toBeGreaterThan(-1)
      expect(pricing.slice(rowStart, rowStart + 360), capability).toMatch(
        /launch: 'paid-extension'[\s\S]*business: 'paid-extension'[\s\S]*enterprise: 'paid-extension'/
      )
    }
  })
})
