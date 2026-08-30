import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AppSidebar } from '../../@payload-config/components/layout/AppSidebar'
import { DashboardFooter } from '../../@payload-config/components/layout/DashboardFooter'
import { TenantPlanBadges } from '@/app/(app)/(dashboard)/configuracion/TenantPlanBadges'

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

const PLAN_LABEL = /ENTERPRISE|ON-PREMISE/

describe('layout chrome does not paint ENTERPRISE or ON-PREMISE', () => {
  it('sidebar and footer have zero matches for a default tenant', () => {
    const { container } = render(
      <div>
        <AppSidebar />
        <DashboardFooter />
      </div>,
    )
    expect(container.textContent?.match(PLAN_LABEL)).toBeNull()
    expect(screen.queryByText('ENTERPRISE')).not.toBeInTheDocument()
    expect(screen.queryByText('ON-PREMISE')).not.toBeInTheDocument()
  })

  it('keeps those labels out of the navy sidebar even for an enterprise on-premise tenant', () => {
    const { container } = render(
      <div>
        <AppSidebar />
        <TenantPlanBadges plan="enterprise" deploymentMode="on_premise" />
      </div>,
    )
    const sidebar = container.querySelector('[data-oid="itwxk4a"]')
    expect(sidebar?.textContent?.match(PLAN_LABEL)).toBeNull()
    expect(screen.getByTestId('tenant-plan-badges').textContent).toMatch(/ENTERPRISE/)
    expect(screen.getByTestId('tenant-plan-badges').textContent).toMatch(/ON-PREMISE/)
  })
})
