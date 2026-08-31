import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  DASHBOARD_CANVAS_CLASS,
  DASHBOARD_GRID_2_CLASS,
  DASHBOARD_GRID_CLASS,
  DASHBOARD_MAIN_CLASS,
  DASHBOARD_RAIL_CLASS,
  DASHBOARD_RAIL_FOOTER_CLASS,
  DASHBOARD_RAIL_NAV_CLASS,
  DASHBOARD_SHELL_CLASS,
  DASHBOARD_VIEWPORT_HEIGHTS,
  DASHBOARD_VIEWPORTS,
  canvasScrollsCards,
  clipsCards,
  railFooterPinned,
} from '@/app/(app)/(dashboard)/dashboard-shell'
import { applyIpadAppFlag, isIpadAppRuntime } from '@/lib/detect-ipad-app'

const dir = dirname(fileURLToPath(import.meta.url))
const layoutSource = readFileSync(join(dir, '../../app/(app)/(dashboard)/layout.tsx'), 'utf8')
const sidebarSource = readFileSync(
  join(dir, '../../@payload-config/components/layout/AppSidebar.tsx'),
  'utf8',
)
const homeSource = readFileSync(
  join(dir, '../../app/(app)/(dashboard)/_components/DashboardHome.tsx'),
  'utf8',
)
const cssSource = readFileSync(join(dir, '../../app/globals.css'), 'utf8')
const headerSource = readFileSync(
  join(dir, '../../@payload-config/components/site-header.tsx'),
  'utf8',
)

describe('dashboard rail and canvas', () => {
  it('pins the rail to svh with scrolling nav and a shrink-0 footer', () => {
    expect(DASHBOARD_SHELL_CLASS.split(/\s+/)).toContain('h-svh')
    expect(DASHBOARD_RAIL_CLASS.split(/\s+/)).toContain('h-full')
    expect(DASHBOARD_RAIL_NAV_CLASS.split(/\s+/)).toContain('min-h-0')
    expect(DASHBOARD_RAIL_NAV_CLASS.split(/\s+/)).toContain('overflow-y-auto')
    expect(DASHBOARD_RAIL_NAV_CLASS.split(/\s+/)).toContain('scrollbar-none')
    expect(railFooterPinned(DASHBOARD_RAIL_FOOTER_CLASS)).toBe(true)
    expect(sidebarSource).toContain('dashboard-rail-nav')
    expect(sidebarSource).toContain('dashboard-rail-footer')
    expect(sidebarSource).toContain('shrink-0')
    expect(sidebarSource).toContain('rail-matriculacion')
    expect(sidebarSource).not.toContain('#f2014b')
  })

  it('scrolls cards in the canvas column, not inside a card', () => {
    expect(canvasScrollsCards(DASHBOARD_MAIN_CLASS)).toBe(true)
    expect(DASHBOARD_CANVAS_CLASS.split(/\s+/)).toContain('h-full')
    expect(headerSource).toContain('sticky')
    expect(layoutSource).toContain('SiteHeader')
    expect(homeSource).not.toContain('DASHBOARD_STICKY_CHROME_CLASS')
    expect(clipsCards('overflow-y-auto max-h-64')).toBe(true)
    expect(homeSource).not.toMatch(/overflow-y-auto/)
    expect(layoutSource).toContain('DASHBOARD_MAIN_CLASS')
  })

  it('keeps Hoy en la academia text uncut and without inner card scroll', () => {
    expect(homeSource).toContain('Hoy en la academia')
    expect(homeSource).toContain('whitespace-normal break-words')
    const hoyBlock = homeSource.slice(
      homeSource.indexOf('hoy-en-la-academia'),
      homeSource.indexOf('Primera línea de KPIs'),
    )
    expect(hoyBlock).not.toMatch(/overflow-y-auto|line-clamp|truncate|max-h-/)
  })

  it('keeps overflow-x at 0 for 1440 / 1280x800 / 1024x768', () => {
    expect(DASHBOARD_VIEWPORTS).toEqual([1440, 1280, 1024])
    expect(DASHBOARD_VIEWPORT_HEIGHTS).toEqual([800, 768])
    expect(DASHBOARD_SHELL_CLASS).toContain('overflow-x-clip')
    expect(DASHBOARD_MAIN_CLASS).toContain('overflow-x-clip')
    expect(cssSource).toMatch(/overflow-x:\s*clip/)
    expect(layoutSource).not.toMatch(/md:overflow-y-auto|sm:h-screen/)
  })

  it('applies brand outline only on real iPad app, never by viewport', () => {
    expect(cssSource).toContain('html[data-ipad-app] .dashboard-shell')
    expect(cssSource).not.toMatch(/@media[^{]+\{[^}]*outline/)
    expect(isIpadAppRuntime({})).toBe(false)
    expect(isIpadAppRuntime({ Capacitor: {} })).toBe(true)
    expect(isIpadAppRuntime({ navigator: { standalone: true } })).toBe(true)
    expect(
      isIpadAppRuntime({ matchMedia: (query: string) => ({ matches: query.includes('standalone') }) }),
    ).toBe(true)
    const attrs: Record<string, string> = {}
    applyIpadAppFlag(
      { documentElement: { setAttribute: (name, value) => { attrs[name] = value } } },
      {},
    )
    expect(attrs['data-ipad-app']).toBeUndefined()
    applyIpadAppFlag(
      { documentElement: { setAttribute: (name, value) => { attrs[name] = value } } },
      { Capacitor: { isNativePlatform: true } },
    )
    expect(attrs['data-ipad-app']).toBe('')
  })

  it('keeps dashboard cards on a min-w-0 grid', () => {
    expect(DASHBOARD_GRID_CLASS).toContain('min-w-0')
    expect(DASHBOARD_GRID_2_CLASS).toContain('min-w-0')
  })
})
