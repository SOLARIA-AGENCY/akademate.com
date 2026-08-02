// @vitest-environment node

import { describe, expect, it } from 'vitest'
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
})
