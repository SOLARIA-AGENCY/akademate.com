// @vitest-environment node

import { describe, expect, it } from 'vitest'
import {
  distributionModes,
  integrationPillars,
  operatingJourney,
  platformPillars,
  roadmapModules,
} from '@/lib/marketing-content'
import { marketingText, spanishMarketingCopy } from './marketing-copy'

describe('marketing copy registry', () => {
  it('returns source English and registered Spanish copy deterministically', () => {
    expect(marketingText('en', 'Book a demo')).toBe('Book a demo')
    expect(marketingText('es', 'Book a demo')).toBe('Reservar una demo')
    expect(() => marketingText('es', 'Unknown future copy')).toThrow(
      'Missing Spanish marketing copy: Unknown future copy'
    )
  })

  it('contains non-empty unique Spanish values', () => {
    const values = Object.values(spanishMarketingCopy)
    expect(values.every((value) => value.trim().length > 0)).toBe(true)
    expect(new Set(values).size).toBe(values.length)
  })

  it('covers every home and features string that is translated at request time', () => {
    const sources = [
      ...operatingJourney.flatMap((item) => [item.title, item.text]),
      ...distributionModes.flatMap((mode) => [mode.title, mode.text]),
      ...platformPillars.flatMap((pillar) => [pillar.title, pillar.text, ...pillar.capabilities]),
      ...roadmapModules.flatMap((module) => [module.title, module.phase, module.text]),
      ...integrationPillars.flatMap((pillar) => [pillar.title, pillar.text]),
    ]

    for (const source of sources) {
      expect(spanishMarketingCopy, source).toHaveProperty(source)
      expect(marketingText('es', source).length).toBeGreaterThan(0)
    }
  })
})
