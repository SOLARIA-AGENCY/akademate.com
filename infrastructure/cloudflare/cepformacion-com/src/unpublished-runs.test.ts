import { describe, expect, it } from 'vitest'
import { isUnpublishedRunCode, stripUnpublishedRunLinks } from './unpublished-runs'

describe('unpublished runs', () => {
  it('recognizes the seven blocked codes', () => {
    expect(isUnpublishedRunCode('SC-2026-007')).toBe(true)
    expect(isUnpublishedRunCode('nor-2026-008')).toBe(true)
    expect(isUnpublishedRunCode('NOR-2026-009')).toBe(false)
  })

  it('strips anchors that still point at blocked codes', () => {
    const html = `<a href="/convocatorias/SC-2026-007">x</a><a href="/convocatorias/NOR-2026-009">y</a>`
    const next = stripUnpublishedRunLinks(html)
    expect(next).not.toContain('SC-2026-007')
    expect(next).toContain('/convocatorias/NOR-2026-009')
  })
})
