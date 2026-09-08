// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { publicJsonLd } from '@/lib/seo-schema'

describe('public structured data', () => {
  it('describes Akademate as academy software without invented prices or maps', () => {
    const graph = publicJsonLd('es')['@graph']
    const organization = graph.find((node) => node['@type'] === 'Organization')
    const software = graph.find((node) => node['@type'] === 'SoftwareApplication')

    expect(organization).toMatchObject({
      name: 'Akademate',
      legalName: 'Brik64 LLC',
      alternateName: 'Brik64 Inc.',
      email: 'info@akademate.com',
    })
    expect(JSON.stringify(organization)).not.toMatch(/sameAs|streetAddress|latitude|longitude|SOLARIA/)
    expect(software).toMatchObject({
      applicationCategory: 'BusinessApplication',
    })
    expect(JSON.stringify(software)).toMatch(/software de gestión de academias/i)
    expect(JSON.stringify(software)).not.toMatch(/"price"\s*:/)
  })

  it('adds breadcrumbs and FAQ without invented prices or SearchAction', () => {
    const home = publicJsonLd('en', '/')
    const pricing = publicJsonLd('es', '/pricing')
    const vertical = publicJsonLd('en', '/solutions/languages')
    const website = home['@graph'].find((node) => node['@type'] === 'WebSite')
    const homeFaq = home['@graph'].find((node) => node['@type'] === 'FAQPage')
    const crumbs = vertical['@graph'].find((node) => node['@type'] === 'BreadcrumbList')

    expect(JSON.stringify(website)).not.toMatch(/SearchAction/)
    expect(JSON.stringify(homeFaq)).toMatch(/academy management software/i)
    expect(JSON.stringify(pricing)).toMatch(/FAQPage/)
    expect(JSON.stringify(pricing)).not.toMatch(/"price"\s*:/)
    expect(JSON.stringify(crumbs)).toMatch(/Language academies/)
    expect(JSON.stringify(vertical)).toMatch(/FAQPage/)
  })
})
