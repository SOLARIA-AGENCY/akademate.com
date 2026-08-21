import { readFileSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

describe('WebsiteRenderer kinds', () => {
  it('handles the new catalog kinds and uses a never default', () => {
    const source = readFileSync(path.resolve(__dirname, '../WebsiteRenderer.tsx'), 'utf8')
    expect(source).toContain("case 'faqList'")
    expect(source).toContain("case 'testimonialList'")
    expect(source).toContain("case 'formEmbed'")
    expect(source).toContain("case 'blogList'")
    expect(source).toContain("case 'richText'")
    expect(source).toMatch(/default:\s*\{\s*const exhaustive: never = section/)
    expect(source).not.toMatch(/default:\s*return null/)
  })
})
