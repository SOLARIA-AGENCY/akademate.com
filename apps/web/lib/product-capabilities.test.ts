// @vitest-environment node

import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'
import { publicCapabilities } from '@/lib/product-capabilities'
import { publicNavigation } from '@/lib/public-navigation'

describe('claim-safe product architecture', () => {
  it('separates future multitenant SaaS from isolated Enterprise', () => {
    const home = readFileSync(new URL('../app/page.tsx', import.meta.url), 'utf8')
    expect(home).toContain('akademate.com')
    expect(home).toContain('cepformacion.akademate.com')
    expect(home).toMatch(/SaaS multitenant.*preparación/s)
    expect(home).toMatch(/Enterprise.*aislada/s)
  })

  it('marks multi-site scope as validation instead of active authorization', () => {
    const multiSite = publicCapabilities.find((item) => item.title.startsWith('Multi-sede'))
    expect(multiSite?.status).toBe('validation')
    expect(multiSite?.evidenceBoundary).toMatch(/shadow.*no equivale/i)
  })

  it('keeps public navigation on real routes or home anchors', () => {
    const hrefs: readonly string[] = publicNavigation.map((item) => item.href)
    expect(hrefs).not.toContain('/design-system')
    expect(publicNavigation.every((item) => item.href === '/' || item.href.startsWith('/#') || ['/sobre-nosotros', '/contacto'].includes(item.href))).toBe(true)
  })
})
