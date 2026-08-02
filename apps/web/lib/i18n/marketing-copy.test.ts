// @vitest-environment node

import { describe, expect, it } from 'vitest'
import { getDictionary } from './dictionaries'
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

  it('localises every newly exposed marketing control without an English fallback', () => {
    const sources = [
      'Academy models',
      'Explore solution',
      'Previous academy model',
      'Next academy model',
      'Public learner review presented by CEP Formación',
      'Explore responsible AI at Akademate',
      'Explore campus operations',
    ] as const

    for (const source of sources) {
      expect(marketingText('es', source)).not.toBe(source)
    }
  })

  it('keeps all contact form fields, subject options and submission states bilingual', () => {
    const english = getDictionary('en').contact
    const spanish = getDictionary('es').contact

    expect(english.subjects).toEqual(
      expect.objectContaining({ demo: expect.any(String), privacy: expect.any(String) })
    )
    expect(spanish.subjects).toEqual(
      expect.objectContaining({ demo: 'Demo de producto', privacy: 'Privacidad' })
    )
    expect(spanish).toMatchObject({
      name: 'Nombre completo',
      subjectPlaceholder: 'Selecciona un tema',
      privacyRequired: 'Acepta la política de privacidad antes de enviar tu solicitud.',
      success: 'Gracias. Hemos recibido tu solicitud.',
      requestFailed: 'No hemos podido enviar tu solicitud.',
      sending: 'Enviando…',
    })
  })
})
