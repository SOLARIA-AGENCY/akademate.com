import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DASHBOARD_RAIL_CLASS } from '@/app/(app)/(dashboard)/dashboard-shell'

const dir = dirname(fileURLToPath(import.meta.url))
const root = join(dir, '../..')

function read(rel: string): string {
  return readFileSync(join(root, rel), 'utf8')
}

describe('sidebar-16 sticky site header', () => {
  const headerSource = read('@payload-config/components/site-header.tsx')
  const layoutSource = read('app/(app)/(dashboard)/layout.tsx')
  const cssSource = read('app/globals.css')
  const homeSource = read('app/(app)/(dashboard)/_components/DashboardHome.tsx')

  it('keeps the catalog site-header sticky', () => {
    expect(existsSync(join(root, '@payload-config/components/site-header.tsx'))).toBe(true)
    expect(headerSource).toContain('sticky')
    expect(headerSource).toContain('top-0')
    expect(headerSource).toContain('SiteHeader')
    expect(headerSource).toContain('useSidebar')
  })

  it('uses SiteHeader as chrome and drops the local layout header', () => {
    expect(layoutSource).toContain('SiteHeader')
    expect(layoutSource).toMatch(/from ['"]@payload-config\/components\/site-header['"]/)
    expect(layoutSource).toContain('SidebarProvider')
    expect(layoutSource).not.toContain('PageHeader')
    expect(layoutSource).not.toMatch(/placeholder="Buscar sección/)
    expect(layoutSource).not.toMatch(/from ['"]@payload-config\/components\/app-sidebar['"]/)
    expect(layoutSource).toMatch(/from ['"]@payload-config\/components\/layout\/AppSidebar['"]/)
    expect(layoutSource).not.toMatch(/ENTERPRISE|Enterprise/)
  })

  it('does not keep a local PageHeader as chrome', () => {
    expect(homeSource).not.toContain('PageHeader')
    expect(homeSource).not.toContain('DASHBOARD_STICKY_CHROME_CLASS')
    expect(homeSource).not.toContain('dashboard-sticky-chrome')
    expect(headerSource).not.toContain('PageHeader')
  })

  it('keeps the rail navy and the canvas gray', () => {
    expect(DASHBOARD_RAIL_CLASS).toContain('bg-sidebar')
    expect(cssSource).toMatch(/--sidebar:\s*222 47% 12%/)
    expect(cssSource).toMatch(/--background:\s*220 16% 95%/)
    expect(cssSource).not.toMatch(/--sidebar:\s*hsl\(0 0% 98%\)/)
    expect(cssSource).not.toContain('hsl(0 0% 98%)')
  })

  it('does not install a pages-router collision for the demo block page', () => {
    expect(existsSync(join(root, 'src/pages/dashboard.tsx'))).toBe(false)
    expect(existsSync(join(root, '@payload-config/blocks/sidebar-16/page.tsx'))).toBe(true)
  })
})
