import { describe, expect, it } from 'vitest'
import { getPublicCourseFaqs, sanitizePublicCourseCopy } from '../public-course-content'

describe('getPublicCourseFaqs', () => {
  it('removes operational FAQs and supplies public online answers', () => {
    const faqs = getPublicCourseFaqs({
      isOnline: true,
      landingFaqs: [
        {
          question: '¿Dónde se guarda la información de esta convocatoria?',
          answer: 'La ficha del curso es la fuente canónica y las convocatorias publicadas reutilizan estos datos.',
        },
      ],
    })

    expect(faqs).toHaveLength(4)
    expect(faqs.map((faq) => faq.q)).toContain('¿Cuándo puedo empezar?')
    expect(faqs.some((faq) => /fuente can[oó]nica/i.test(faq.a))).toBe(false)
  })

  it('keeps valid course FAQs and completes the public set', () => {
    const faqs = getPublicCourseFaqs({
      isOnline: false,
      landingFaqs: [{ question: '¿Incluye material?', answer: 'El equipo te indicará los recursos incluidos.' }],
    })

    expect(faqs[0]).toEqual({ q: '¿Incluye material?', a: 'El equipo te indicará los recursos incluidos.' })
    expect(faqs).toHaveLength(4)
  })
})

describe('sanitizePublicCourseCopy', () => {
  it('removes import diagnostics from labels exposed to learners', () => {
    expect(sanitizePublicCourseCopy('Salidas detectadas: centros deportivos. Duración detectada: 200 h.'))
      .toBe('Salidas profesionales: centros deportivos. Duración: 200 h.')
  })
})
