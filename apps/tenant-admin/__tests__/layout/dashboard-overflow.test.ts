import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_GRID_2_CLASS,
  DASHBOARD_GRID_CLASS,
  DASHBOARD_MAIN_CLASS,
  DASHBOARD_SHELL_CLASS,
  DASHBOARD_VIEWPORTS,
  clipsCards,
  createsInnerVerticalScroll,
  trapsViewport,
} from '@/app/(app)/(dashboard)/dashboard-shell'

const dir = dirname(fileURLToPath(import.meta.url))
const layoutSource = readFileSync(join(dir, '../../app/(app)/(dashboard)/layout.tsx'), 'utf8')
const homeSource = readFileSync(
  join(dir, '../../app/(app)/(dashboard)/_components/DashboardHome.tsx'),
  'utf8',
)
const cssSource = readFileSync(join(dir, '../../app/globals.css'), 'utf8')

describe('dashboard overflow', () => {
  it('does not trap the viewport in an h-screen overflow-hidden shell', () => {
    expect(trapsViewport(DASHBOARD_SHELL_CLASS)).toBe(false)
    expect(createsInnerVerticalScroll(DASHBOARD_SHELL_CLASS)).toBe(false)
    expect(DASHBOARD_SHELL_CLASS).toContain('min-h-screen')
    expect(DASHBOARD_SHELL_CLASS.split(/\s+/)).not.toContain('h-screen')
    expect(DASHBOARD_SHELL_CLASS.split(/\s+/)).not.toContain('overflow-x-hidden')
  })

  it('does not put overflow-y on main', () => {
    expect(clipsCards(DASHBOARD_MAIN_CLASS)).toBe(false)
    expect(createsInnerVerticalScroll(DASHBOARD_MAIN_CLASS)).toBe(false)
    expect(DASHBOARD_MAIN_CLASS).not.toMatch(/overflow-y-auto/)
    expect(DASHBOARD_MAIN_CLASS).not.toMatch(/overflow-x-hidden/)
  })

  it('fails if layout.tsx puts overflow-y-auto back on main', () => {
    expect(layoutSource).toContain('DASHBOARD_MAIN_CLASS')
    expect(layoutSource).toContain('DASHBOARD_SHELL_CLASS')
    expect(layoutSource).not.toMatch(/<main[\s\S]{0,240}overflow-y-auto/)
    expect(layoutSource).not.toMatch(/h-screen overflow-hidden/)
  })

  it('keeps dashboard cards on a min-w-0 grid with no inner card scroll', () => {
    expect(DASHBOARD_GRID_CLASS).toContain('min-w-0')
    expect(DASHBOARD_GRID_2_CLASS).toContain('min-w-0')
    expect(homeSource).toContain('DASHBOARD_GRID_CLASS')
    expect(homeSource).not.toMatch(/overflow-y-auto/)
    expect(homeSource).not.toMatch(/max-h-\[/)
  })

  it('clips horizontal overflow on the document, not on main, at 1440/1024/768', () => {
    expect(DASHBOARD_VIEWPORTS).toEqual([1440, 1024, 768])
    expect(cssSource).toMatch(/overflow-x:\s*clip/)
    expect(cssSource).toMatch(/\.dashboard-shell,\s*\n\.dashboard-shell main \{\s*\n\s*min-width: 0;\s*\n\s*overflow: visible;/)
    expect(layoutSource).not.toMatch(/md:overflow-y-auto|sm:overflow-y-auto|lg:overflow-y-auto/)
    expect(layoutSource).not.toMatch(/md:overflow-hidden|sm:h-screen/)
  })
})
