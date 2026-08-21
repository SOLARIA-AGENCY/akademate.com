import { describe, expect, it } from 'vitest'
import {
  draftFaqFromTopic,
  editorValuesFromUnknown,
  faqCategoryLabel,
  mergeSeoKeywords,
  slateFromText,
  textFromSlate,
  toFaqPayload,
} from '../faq-content'

describe('faq content persist', () => {
  it('round-trips slate answers that Payload validates as arrays', () => {
    const slate = slateFromText('Primera parte.\n\nSegunda parte.')
    expect(Array.isArray(slate)).toBe(true)
    expect(textFromSlate(slate)).toContain('Primera parte.')
    expect(textFromSlate({ root: { children: slate } })).toContain('Segunda parte.')
  })

  it('maps editor values onto the FAQ collection shape', () => {
    const payload = toFaqPayload({
      question: '¿Cómo me matriculo en un ciclo?',
      answer: 'Solicita plaza con orientación y entrega la documentación.',
      category: 'enrollment',
      language: 'es',
      status: 'published',
      featured: true,
      order: 2,
      keywords: ['matrícula', 'ciclo', ''],
    })
    expect(payload.category).toBe('enrollment')
    expect(payload.keywords).toEqual(['matrícula', 'ciclo'])
    expect(payload.answer[0]?.children[0]?.text).toContain('orientación')
  })

  it('drafts a FAQ from a topic and global SEO keywords', () => {
    const draft = draftFaqFromTopic('matrícula', { keywords: ['FP Tenerife'], concepts: ['empleabilidad'] }, 'enrollment')
    expect(draft.question.length).toBeGreaterThanOrEqual(10)
    expect(draft.answer.length).toBeGreaterThanOrEqual(20)
    expect(draft.keywords).toContain('FP Tenerife')
    expect(faqCategoryLabel(draft.category)).toBe('Inscripción')
  })

  it('reads stored Payload docs back into the editor', () => {
    const values = editorValuesFromUnknown({
      question: '¿Hay prácticas?',
      answer: [{ children: [{ text: 'Sí, en centros colaboradores.' }] }],
      category: 'courses',
      keywords: ['prácticas'],
    })
    expect(values.answer).toBe('Sí, en centros colaboradores.')
    expect(mergeSeoKeywords(values.keywords, ['Tenerife'])).toEqual(['prácticas', 'Tenerife'])
  })
})
