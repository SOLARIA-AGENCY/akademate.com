import { describe, expect, it } from 'vitest'
import { solutionDetails, verticals } from '@/lib/marketing-content'
import { verticalProductStories } from '@/lib/vertical-product-stories'
import {
  getLocalizedSolutionDetail,
  getLocalizedVertical,
  getLocalizedVerticalProductStory,
  verticalPageChrome,
} from '@/lib/vertical-i18n'
import { localizedAlternates, localizedHref, supportedLocales } from '@/lib/i18n/routing'
import { publicPageMetadata } from '@/lib/i18n/metadata'

describe('localized vertical product stories', () => {
  it('keeps every vertical structurally identical in English and Spanish', () => {
    for (const { slug } of verticals) {
      const english = getLocalizedVerticalProductStory(slug, 'en')
      const spanish = getLocalizedVerticalProductStory(slug, 'es')
      expect(english).toBeDefined()
      expect(spanish).toBeDefined()
      expect(spanish!.moments).toHaveLength(english!.moments.length)
      expect(spanish!.moments.map((moment) => moment.id)).toEqual(english!.moments.map((moment) => moment.id))
      expect(spanish!.moments.map((moment) => moment.connectors ?? [])).toEqual(english!.moments.map((moment) => moment.connectors ?? []))
      for (const [index, moment] of english!.moments.entries()) {
        const localized = spanish!.moments[index]!
        expect(localized.fields).toHaveLength(moment.fields.length)
        expect(localized.activity).toHaveLength(moment.activity.length)
        expect([localized.label, localized.title, localized.text, localized.metricLabel, ...localized.activity].every(Boolean)).toBe(true)
        expect(localized.fields.flatMap((field) => [field.label, ...field.options]).every(Boolean)).toBe(true)
        expect([localized.label, localized.title, localized.text, localized.metricLabel]).not.toEqual(
          [moment.label, moment.title, moment.text, moment.metricLabel]
        )
      }
    }
  })

  it('preserves slugs, product identities, asset URLs, moment IDs, metrics and connector brand IDs', () => {
    for (const vertical of verticals) {
      const spanish = getLocalizedVertical(vertical.slug, 'es')!
      const englishStory = verticalProductStories[vertical.slug]!
      const spanishStory = getLocalizedVerticalProductStory(vertical.slug, 'es')!
      expect(spanish.slug).toBe(vertical.slug)
      expect(spanish.image).toBe(vertical.image)
      expect(spanish.capabilities).toEqual(vertical.capabilities)
      expect(spanishStory.moments.map((moment) => moment.id)).toEqual(englishStory.moments.map((moment) => moment.id))
      expect(spanishStory.moments.map((moment) => moment.metric)).toEqual(englishStory.moments.map((moment) => moment.metric))
      expect(spanishStory.moments.map((moment) => moment.connectors)).toEqual(englishStory.moments.map((moment) => moment.connectors))
      expect(spanishStory).not.toBe(englishStory)
    }
  })

  it('uses complete localized metadata, alternates and internal links for every solution', () => {
    for (const locale of supportedLocales) for (const { slug } of verticals) {
      const detail = getLocalizedSolutionDetail(slug, locale)!
      const path = `/solutions/${slug}`
      expect(detail.headline).toBeTruthy()
      expect(detail.promise).toBeTruthy()
      expect(detail.outcomes).toHaveLength(solutionDetails[slug].outcomes.length)
      expect(localizedHref('/contacto?asunto=demo', locale)).toBe(`/${locale}/contacto?asunto=demo`)
      expect(localizedAlternates(path, locale)).toEqual({ canonical: `/${locale}${path}`, languages: { en: `/en${path}`, es: `/es${path}`, 'x-default': `/en${path}` } })
    }
  })

  it('keeps each locale metadata copy and alternate URL distinct', () => {
    const slug = verticals[0]!.slug
    const english = getLocalizedSolutionDetail(slug, 'en')!
    const spanish = getLocalizedSolutionDetail(slug, 'es')!
    const metadata = publicPageMetadata({
      locale: 'es',
      pathname: `/solutions/${slug}`,
      image: getLocalizedVertical(slug, 'es')!.image,
      copy: {
        en: { title: 'English solution', description: english.promise },
        es: { title: 'Solución en español', description: spanish.promise },
      },
    })

    expect(metadata.title).toBe('Solución en español')
    expect(metadata.description).toBe(spanish.promise)
    expect(metadata.alternates).toEqual(
      localizedAlternates(`/solutions/${slug}`, 'es')
    )
    expect(metadata.openGraph).toMatchObject({
      locale: 'es_ES',
      url: `/es/solutions/${slug}`,
      title: 'Solución en español',
      description: spanish.promise,
    })
  })

  it('does not invent an unknown vertical and keeps all rendered chrome non-empty', () => {
    expect(getLocalizedVerticalProductStory('unknown', 'es')).toBeUndefined()
    for (const locale of supportedLocales) expect(Object.values(verticalPageChrome[locale]).every(Boolean)).toBe(true)
  })
})
