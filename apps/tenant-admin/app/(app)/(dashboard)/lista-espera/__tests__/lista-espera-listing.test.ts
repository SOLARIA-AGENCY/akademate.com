import { describe, expect, it } from 'vitest'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const source = readFileSync(
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../page.tsx'),
  'utf8',
)

describe('lista de espera listing', () => {
  it('uses listing cards instead of a raw table', () => {
    expect(source).toContain('ListingColumnBoard')
    expect(source).toContain('ListingColumnCard')
    expect(source).toContain('WAITLIST_LIST_COLUMNS')
    expect(source).not.toContain('<Table')
    expect(source).not.toContain('font-mono')
  })
})
