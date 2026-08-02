// @vitest-environment node

import { describe, expect, it } from 'vitest'
import sitemap from './sitemap'

describe('localized public sitemap', () => {
  it('publishes an English and Spanish URL for every indexable public route', () => {
    const entries = sitemap()
    const urls = entries.map((entry) => new URL(entry.url).pathname)

    expect(urls.length).toBeGreaterThan(20)
    expect(urls.length % 2).toBe(0)
    expect(urls).toContain('/en')
    expect(urls).toContain('/es')
    expect(urls).toContain('/en/features')
    expect(urls).toContain('/es/features')
    expect(urls).toContain('/en/cursos')
    expect(urls).toContain('/es/cursos')
    expect(urls).toContain('/en/download')
    expect(urls).toContain('/es/download')
    expect(urls).not.toContain('/')

    for (const url of urls.filter((pathname) => pathname.startsWith('/en'))) {
      expect(urls).toContain(url.replace(/^\/en/, '/es'))
    }
    expect(new Set(urls).size).toBe(urls.length)
  })

  it('publishes reciprocal language alternates on every entry', () => {
    for (const entry of sitemap()) {
      expect(entry.alternates?.languages).toMatchObject({
        en: expect.stringMatching(/^https?:\/\/[^/]+\/en(?:\/|$)/),
        es: expect.stringMatching(/^https?:\/\/[^/]+\/es(?:\/|$)/),
      })
    }
  })
})
