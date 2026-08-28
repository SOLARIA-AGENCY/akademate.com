import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '../../@payload-config/components/layout/AppSidebar'
import { DASHBOARD_RAIL_NAV_CLASS } from '@/app/(app)/(dashboard)/dashboard-shell'

vi.mock('@/app/providers/tenant-branding', () => ({
  useTenantBranding: () => ({
    branding: {
      academyName: 'Test Academy',
      tenantId: 'test-tenant',
      logos: {
        principal: '/logos/test.svg',
        oscuro: '/logos/test.svg',
        claro: '/logos/test.svg',
        favicon: '/logos/test.svg',
      },
      theme: {
        primary: '#0066CC',
        secondary: '#1a1a2e',
        accent: '#0088FF',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
    loading: false,
    refresh: vi.fn(),
  }),
}))

const dir = dirname(fileURLToPath(import.meta.url))
const sidebarSource = readFileSync(
  join(dir, '../../@payload-config/components/layout/AppSidebar.tsx'),
  'utf8',
)
const cssSource = readFileSync(join(dir, '../../app/globals.css'), 'utf8')

describe('sidebar submenus are click-only', () => {
  it('does not open submenus from hover handlers', () => {
    expect(sidebarSource).not.toMatch(/onMouseEnter|onMouseOver|onMouseMove/)
    expect(sidebarSource).not.toMatch(/group-hover:max-h|group-hover:block|group-hover:opacity-100[\s\S]{0,80}submenu/)
  })

  it('opens a submenu on click and ignores hover on a closed section', () => {
    render(<AppSidebar />)
    expect(screen.queryByText('Profesores')).not.toBeInTheDocument()
    expect(screen.queryByText('Campañas')).not.toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Personal/i }))
    expect(screen.queryByText('Profesores')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Personal/i }))
    expect(screen.getByText('Profesores')).toBeInTheDocument()

    fireEvent.mouseEnter(screen.getByRole('button', { name: /Marketing/i }))
    expect(screen.queryByText('Campañas')).not.toBeInTheDocument()
  })
})

describe('rail scrollbar is hidden and still scrollable', () => {
  it('keeps overflow-y auto with the scrollbar hidden', () => {
    expect(DASHBOARD_RAIL_NAV_CLASS.split(/\s+/)).toContain('overflow-y-auto')
    expect(DASHBOARD_RAIL_NAV_CLASS.split(/\s+/)).toContain('scrollbar-none')
    expect(cssSource).toContain('.dashboard-rail-nav')
    expect(cssSource).toContain('scrollbar-width: none')
    expect(cssSource).toContain('.dashboard-rail-nav::-webkit-scrollbar')
    expect(cssSource).toContain('display: none')
  })
})
