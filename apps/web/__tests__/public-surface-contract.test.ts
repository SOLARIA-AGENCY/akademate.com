import { describe, expect, it } from 'vitest'
import {
  NON_CERTIFICATION_NOTICE,
  PUBLIC_LEGAL,
  PUBLIC_LEGAL_LINKS,
  TRUST_NOTICES,
} from '../lib/public-legal'
import {
  hasOptionalTrackers,
  mayLoadTracker,
  OPTIONAL_TRACKERS,
  type OptionalTracker,
} from '../lib/tracking'

describe('public legal contract', () => {
  it('centralizes the operator and explicit unresolved facts', () => {
    expect(PUBLIC_LEGAL.operatorName).toBe('SOLARIA AGENCY OÜ')
    expect(PUBLIC_LEGAL.registeredCountry).toBe('Estonia')
    expect(PUBLIC_LEGAL.correspondenceAddress).toContain('Malmö')
    expect(PUBLIC_LEGAL.registryCode).toContain('PENDIENTE DE VERIFICACIÓN')
    expect(PUBLIC_LEGAL.vatNumber).toContain('PENDIENTE DE VERIFICACIÓN')
  })

  it('provides unique, canonical and complete legal links', () => {
    const hrefs = PUBLIC_LEGAL_LINKS.map((link) => link.href)
    expect(new Set(hrefs).size).toBe(hrefs.length)
    expect(hrefs).toEqual([
      '/privacidad',
      '/terminos',
      '/cookies',
      '/subencargados',
      '/transparencia-ia',
    ])
    expect(hrefs.every((href) => href.startsWith('/') && !href.startsWith('/legal/'))).toBe(true)
  })

  it('labels trust badges as information rather than certification', () => {
    expect(TRUST_NOTICES.map((notice) => notice.label)).toEqual([
      'Privacidad y RGPD',
      'Transparencia IA',
    ])
    expect(NON_CERTIFICATION_NOTICE.toLowerCase()).toContain('no son sellos')
    expect(NON_CERTIFICATION_NOTICE.toLowerCase()).toContain('certificaciones')
  })
})

describe('optional tracking fails closed', () => {
  const tracker: OptionalTracker = {
    id: 'test',
    category: 'analytics',
    provider: 'Test',
    purpose: 'Adversarial test',
  }

  it('does not declare trackers in the public application', () => {
    expect(OPTIONAL_TRACKERS).toEqual([])
    expect(hasOptionalTrackers).toBe(false)
  })

  it.each([null, {}, { analytics: false }, { marketing: true }])(
    'blocks without matching affirmative consent: %j',
    (consent) => {
      expect(mayLoadTracker(tracker, consent)).toBe(false)
    }
  )

  it('allows only the explicitly consented category', () => {
    expect(mayLoadTracker(tracker, { analytics: true, marketing: false })).toBe(true)
  })
})
