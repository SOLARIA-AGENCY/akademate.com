import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const globals = readFileSync(resolve(process.cwd(), 'app/globals.css'), 'utf8')
const sidebar = readFileSync(resolve(process.cwd(), '@payload-config/components/layout/AppSidebar.tsx'), 'utf8')

describe('Akademate dashboard visual contract', () => {
  it('keeps the academy sidebar ink-blue in light and dark dashboard themes', () => {
    expect(globals.match(/--sidebar:\s*222 64% 12%/g)).toHaveLength(2)
    expect(globals).toMatch(/--sidebar-foreground:\s*210 40% 98%/)
    expect(globals).toMatch(/--sidebar-accent:\s*218 47% 20%/)
  })

  it('uses sidebar tokens for the complete navigation surface', () => {
    expect(sidebar).toContain('bg-sidebar text-sidebar-foreground')
    expect(sidebar).not.toContain('bg-card text-sidebar-foreground')
    expect(sidebar).not.toMatch(/text-foreground(?:\/\d+)?/)
  })

  it('preserves visible keyboard focus and token-driven active states', () => {
    expect(sidebar).toMatch(/focus-visible:ring-2 focus-visible:ring-sidebar-ring/)
    expect(sidebar).toContain('bg-sidebar-accent text-sidebar-accent-foreground')
    expect(sidebar).toContain('bg-sidebar-primary')
  })
})
