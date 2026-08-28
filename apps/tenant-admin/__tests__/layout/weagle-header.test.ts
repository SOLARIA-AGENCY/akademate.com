import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DASHBOARD_CANVAS_CLASS, DASHBOARD_RAIL_CLASS } from '@/app/(app)/(dashboard)/dashboard-shell'

const dir = dirname(fileURLToPath(import.meta.url))
const headerSource = readFileSync(
  join(dir, '../../@payload-config/components/ui/PageHeader.tsx'),
  'utf8',
)
const homeSource = readFileSync(
  join(dir, '../../app/(app)/(dashboard)/_components/DashboardHome.tsx'),
  'utf8',
)
const cardSource = readFileSync(join(dir, '../../@payload-config/components/ui/card.tsx'), 'utf8')
const cssSource = readFileSync(join(dir, '../../app/globals.css'), 'utf8')
const layoutSource = readFileSync(join(dir, '../../app/(app)/(dashboard)/layout.tsx'), 'utf8')

describe('Weagle header mold', () => {
  it('renders a flat H1 header with no Card wrapper', () => {
    expect(headerSource).toContain('data-testid="page-header"')
    expect(headerSource).toContain('<h1')
    expect(headerSource).not.toMatch(/<Card[\s>]/)
    expect(headerSource).not.toContain('bg-card')
    expect(headerSource).not.toContain('{description &&')
  })

  it('drops the slop dashboard subtitle', () => {
    expect(homeSource).not.toContain('Vista general de la operativa')
    expect(homeSource).toContain('title="Dashboard"')
    expect(homeSource).toContain('<Card')
  })

  it('keeps content cards white with high radius and a soft shadow', () => {
    expect(cardSource).toContain('rounded-2xl')
    expect(cardSource).toContain('shadow-sm')
    expect(cardSource).toContain('bg-card')
  })

  it('keeps the canvas gray and the rail navy', () => {
    expect(DASHBOARD_CANVAS_CLASS).toContain('bg-background')
    expect(DASHBOARD_RAIL_CLASS).toContain('bg-sidebar')
    expect(cssSource).toMatch(/--background:\s*220 16% 95%/)
    expect(cssSource).toMatch(/--sidebar:\s*222 47% 12%/)
    expect(layoutSource).toContain('DASHBOARD_RAIL_CLASS')
    expect(cssSource).toMatch(/overflow-x:\s*clip/)
  })
})
