import { describe, expect, it } from 'vitest'
import {
  getEditorialArticleSchema,
  getEditorialMetadataAlternates,
  getEditorialUi,
  getLocalizedEditorialPath,
} from '@/lib/editorial-i18n'
import { getEditorialPosts } from '@/lib/blog-posts'
import { supportedLocales } from '@/lib/i18n/routing'

describe('editorial i18n content contract', () => {
  it('ships complete and structurally equivalent English and Spanish copy for every post', () => {
    const englishPosts = getEditorialPosts('en')
    const spanishPosts = getEditorialPosts('es')

    expect(spanishPosts.map((post) => post.slug)).toEqual(englishPosts.map((post) => post.slug))

    for (const englishPost of englishPosts) {
      const spanishPost = spanishPosts.find((post) => post.slug === englishPost.slug)
      expect(spanishPost).toBeDefined()
      expect(spanishPost?.kind).toBe(englishPost.kind)
      expect(spanishPost?.title).not.toBe(englishPost.title)
      expect(spanishPost?.sections).toHaveLength(englishPost.sections.length)

      for (const [index, englishSection] of englishPost.sections.entries()) {
        const spanishSection = spanishPost?.sections[index]
        expect(spanishSection?.title.trim()).not.toHaveLength(0)
        expect(spanishSection?.paragraphs).toHaveLength(englishSection.paragraphs.length)
        expect(spanishSection?.paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(
          true
        )
        expect(spanishSection?.points?.length ?? 0).toBe(englishSection.points?.length ?? 0)
        expect(Boolean(spanishSection?.points)).toBe(Boolean(englishSection.points))
      }
    }
  })

  it('rejects missing editorial fields in either locale', () => {
    const requiredStringFields = [
      'slug',
      'title',
      'seoTitle',
      'excerpt',
      'category',
      'author',
      'date',
      'displayDate',
      'readingTime',
      'image',
      'imageAlt',
      'introduction',
    ] as const

    for (const locale of supportedLocales) {
      for (const post of getEditorialPosts(locale)) {
        for (const field of requiredStringFields) {
          expect(post[field].trim()).not.toHaveLength(0)
        }
        expect(post.keywords.length).toBeGreaterThan(0)
        expect(post.sections.length).toBeGreaterThan(0)
        for (const section of post.sections) {
          expect(section.title.trim()).not.toHaveLength(0)
          expect(section.paragraphs.every((paragraph) => paragraph.trim().length > 0)).toBe(true)
          expect(section.points?.every((point) => point.trim().length > 0) ?? true).toBe(true)
        }
      }
    }
  })

  it('builds localized article links, metadata alternates, and JSON-LD from the requested locale', () => {
    for (const locale of supportedLocales) {
      for (const post of getEditorialPosts(locale)) {
        const path = `${post.kind === 'news' ? '/news' : '/blog'}/${post.slug}`
        const schema = getEditorialArticleSchema(post, locale)
        const alternates = getEditorialMetadataAlternates(path, locale)

        expect(getLocalizedEditorialPath(post, locale)).toBe(`/${locale}${path}`)
        expect(alternates).toEqual({
          canonical: `/${locale}${path}`,
          languages: { en: `/en${path}`, es: `/es${path}`, 'x-default': path },
        })
        expect(schema).toMatchObject({
          '@type': post.kind === 'news' ? 'NewsArticle' : 'Article',
          inLanguage: locale,
          headline: post.title,
          description: post.excerpt,
          mainEntityOfPage: `https://akademate.com/${locale}${path}`,
          keywords: post.keywords.join(', '),
        })
      }
    }
  })

  it('localizes all index and article chrome, including CTA labels', () => {
    for (const locale of supportedLocales) {
      const ui = getEditorialUi(locale)
      expect(Object.values(ui.index.insight).every((value) => value.trim().length > 0)).toBe(true)
      expect(Object.values(ui.index.news).every((value) => value.trim().length > 0)).toBe(true)
      expect(Object.values(ui.article).every((value) => value.trim().length > 0)).toBe(true)
    }
    expect(getEditorialUi('en').article.ctaLabel).not.toBe(getEditorialUi('es').article.ctaLabel)
  })
})
