import { describe, it, expect } from 'vitest'
import { DRAFT_MODULE_SLUGS, DRAFT_MODULES } from '../draft-modules'

describe('draft modules catalog', () => {
  it('has a complete record for every slug', () => {
    for (const slug of DRAFT_MODULE_SLUGS) {
      const module = DRAFT_MODULES[slug]
      expect(module.slug).toBe(slug)
      expect(module.title.length).toBeGreaterThan(2)
      expect(module.plannedFeatures.length).toBeGreaterThan(0)
      expect(module.note.length).toBeGreaterThan(10)
    }
  })

  it('keeps SSO marked as unauthorized', () => {
    expect(DRAFT_MODULES.sso.expectedPhase.toLowerCase()).toContain('no autorizado')
  })
})
