// @vitest-environment node

import { existsSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { isMarketingRaster, optimizedSrc } from './optimized-image'

const webRoot = new URL('../', import.meta.url).pathname
const marketingDir = join(webRoot, 'public/images/marketing')
const lcpBase = 'akademate-product-ecosystem-v2'
const carouselOriginals = [
  '/images/marketing/akademate-product-ecosystem-v2.png',
  '/images/marketing/akademate-website-distribution-v2.png',
  '/images/marketing/akademate-course-registration-v2.png',
]

describe('marketing image pipeline', () => {
  it('rewrites marketing rasters to webp/avif without touching logos', () => {
    expect(isMarketingRaster('/images/marketing/hero.png')).toBe(true)
    expect(optimizedSrc('/images/marketing/hero.png')).toBe('/images/marketing/hero.webp')
    expect(optimizedSrc('/images/marketing/hero.jpg', 'avif')).toBe('/images/marketing/hero.avif')
    expect(optimizedSrc('/logos/akademate-icon-48.png')).toBe('/logos/akademate-icon-48.png')
    expect(optimizedSrc('/images/avatars/course-attendee-01.jpg')).toBe(
      '/images/avatars/course-attendee-01.jpg'
    )
  })

  it('keeps LCP webp and avif under 250 KB', () => {
    for (const file of [`${lcpBase}.webp`, `${lcpBase}.avif`]) {
      const full = join(marketingDir, file)
      expect(existsSync(full), file).toBe(true)
      expect(statSync(full).size, file).toBeLessThan(250 * 1024)
    }
  })

  it('does not mount all three carousel originals in the initial hero markup', () => {
    const carousel = readFileSync(
      join(webRoot, 'components/marketing/ProductHeroCarousel.tsx'),
      'utf8'
    )
    expect(carousel).toMatch(/if \(index !== 0 && index !== activeIndex\) return null/)
    expect(carousel).toContain("loading={index === 0 ? 'eager' : 'lazy'}")
    expect(carousel).toContain('priority={index === 0}')

    const home = readFileSync(join(webRoot, 'app/page.tsx'), 'utf8')
    const referenced = carouselOriginals.filter((src) => home.includes(src))
    expect(referenced).toHaveLength(0)
  })

  it('ships a 1200x630 JPEG Open Graph share card', () => {
    const full = join(marketingDir, 'akademate-og-share-v1.jpg')
    expect(existsSync(full)).toBe(true)
    expect(statSync(full).size).toBeGreaterThan(20 * 1024)
    expect(statSync(full).size).toBeLessThan(300 * 1024)
  })
})
