import { describe, expect, it } from 'vitest'
import { solutionDetails, verticals } from '@/lib/marketing-content'
import { paidExtensions } from '@/lib/pricing-content'
import {
  getVerticalLandingCopy,
  getVerticalProofQuotes,
  verticalPageChrome,
} from '@/lib/vertical-i18n'
import {
  verticalAddonChips,
  verticalLandingContent,
  verticalProofQuotes,
} from '@/lib/vertical-landing-content'
import {
  spanishVerticalLandingContent,
  spanishVerticalProofQuotes,
} from '@/lib/vertical-landing-content.es'

describe('vertical landing content', () => {
  it('covers every vertical in English and Spanish with 5 FAQs each', () => {
    for (const { slug } of verticals) {
      const english = getVerticalLandingCopy(slug, 'en')
      const spanish = getVerticalLandingCopy(slug, 'es')
      expect(english).toBeDefined()
      expect(spanish).toBeDefined()
      expect(english!.faqs).toHaveLength(5)
      expect(spanish!.faqs).toHaveLength(5)
      for (const faq of english!.faqs) {
        expect(faq.question.length).toBeGreaterThan(0)
        expect(faq.answer.length).toBeGreaterThan(0)
      }
    }
  })

  it('keeps Spanish translations distinct from English copy', () => {
    for (const { slug } of verticals) {
      expect(spanishVerticalLandingContent[slug].seoTitle).not.toBe(
        verticalLandingContent[slug].seoTitle
      )
      expect(spanishVerticalLandingContent[slug].faqHeading).not.toBe(
        verticalLandingContent[slug].faqHeading
      )
      const spanishQuestions = spanishVerticalLandingContent[slug].faqs.map((f) => f.question)
      const englishQuestions = verticalLandingContent[slug].faqs.map((f) => f.question)
      expect(spanishQuestions).not.toEqual(englishQuestions)
    }
  })

  it('keeps SEO titles within 60 characters and meta descriptions within bounds', () => {
    for (const { slug } of verticals) {
      for (const copy of [verticalLandingContent[slug], spanishVerticalLandingContent[slug]]) {
        expect(copy.seoTitle.length).toBeLessThanOrEqual(60)
        expect(copy.metaDescription.length).toBeGreaterThanOrEqual(50)
        expect(copy.metaDescription.length).toBeLessThanOrEqual(165)
      }
    }
  })

  it('keeps the final CTA identical to the hero CTA (one primary action per landing)', () => {
    for (const locale of ['en', 'es'] as const) {
      expect(verticalPageChrome[locale].heroCta).toBe(verticalPageChrome[locale].closingCta)
    }
  })

  it('only publishes proof quotes that exist in both locales', () => {
    for (const { slug } of verticals) {
      const english = getVerticalProofQuotes(slug, 'en')
      const spanish = getVerticalProofQuotes(slug, 'es')
      expect(english.map((q) => q.author)).toEqual(spanish.map((q) => q.author))
    }
    expect(Object.keys(verticalProofQuotes)).toEqual(
      Object.keys(spanishVerticalProofQuotes)
    )
  })

  it('keeps every localized headline present for the 10 landings', () => {
    for (const { slug } of verticals) {
      expect(solutionDetails[slug].headline.length).toBeGreaterThan(0)
    }
  })

  it('keeps add-on chips valid for every vertical', () => {
    const extensionIds = paidExtensions.map((extension) => extension.id) as string[]
    for (const { slug } of verticals) {
      const chips = verticalAddonChips[slug]
      expect(chips).toBeDefined()
      expect(chips.length).toBeGreaterThan(0)
      expect(new Set(chips).size).toBe(chips.length)
      for (const id of chips) {
        expect(extensionIds).toContain(id)
      }
    }
  })
})
