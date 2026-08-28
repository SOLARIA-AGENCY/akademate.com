import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_MAIN_CLASS,
  DASHBOARD_SHELL_CLASS,
  clipsCards,
  trapsViewport,
} from '@/app/(app)/(dashboard)/dashboard-shell'

const layoutSource = readFileSync(
  join(dirname(fileURLToPath(import.meta.url)), '../../app/(app)/(dashboard)/layout.tsx'),
  'utf8',
)

describe('dashboard overflow', () => {
  it('does not trap the viewport in an h-screen overflow-hidden shell', () => {
    expect(trapsViewport(DASHBOARD_SHELL_CLASS)).toBe(false)
    expect(DASHBOARD_SHELL_CLASS).toContain('min-h-screen')
    expect(DASHBOARD_SHELL_CLASS).toContain('overflow-x-hidden')
    expect(DASHBOARD_SHELL_CLASS.split(/\s+/)).not.toContain('h-screen')
  })

  it('does not clip cards with an inner vertical scroller on main', () => {
    expect(clipsCards(DASHBOARD_MAIN_CLASS)).toBe(false)
    expect(DASHBOARD_MAIN_CLASS).not.toMatch(/overflow-y-auto/)
    expect(DASHBOARD_MAIN_CLASS).not.toMatch(/overflow-x-hidden/)
  })

  it('fails if layout.tsx puts overflow-y-auto back on main', () => {
    expect(layoutSource).toContain('DASHBOARD_MAIN_CLASS')
    expect(layoutSource).toContain('DASHBOARD_SHELL_CLASS')
    expect(layoutSource).not.toMatch(/<main[\s\S]{0,240}overflow-y-auto/)
    expect(layoutSource).not.toMatch(/h-screen overflow-hidden/)
  })
})
