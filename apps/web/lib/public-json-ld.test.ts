import { describe, expect, it } from 'vitest'
import { getPublicJsonLd } from './public-json-ld'

describe('public JSON-LD', () => {
  it('publishes Organization and SoftwareApplication without invented commercial facts', () => {
    const graph = getPublicJsonLd()
    const serialized = JSON.stringify(graph)

    expect(graph['@context']).toBe('https://schema.org')
    expect(graph['@graph']?.map((node) => node['@type'])).toEqual([
      'Organization',
      'SoftwareApplication',
    ])
    expect(serialized).toContain('SOLARIA AGENCY OÜ')
    expect(serialized).toContain('BusinessApplication')
    expect(serialized).not.toMatch(/taxID|vatID|aggregateRating|"offers"/)
    expect(serialized).not.toMatch(/FORMACI[ÓO]N CEP CANARIAS|Plaza José Antonio/i)
  })
})
