import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TenantPlanBadges } from '@/app/(app)/(dashboard)/configuracion/TenantPlanBadges'

describe('TenantPlanBadges', () => {
  it('renders nothing for a default starter managed tenant', () => {
    const { container } = render(<TenantPlanBadges plan="starter" deploymentMode="managed_cloud" />)
    expect(container).toBeEmptyDOMElement()
    expect(screen.queryByText('ENTERPRISE')).not.toBeInTheDocument()
    expect(screen.queryByText('ON-PREMISE')).not.toBeInTheDocument()
  })

  it('shows ENTERPRISE and ON-PREMISE in Configuración when that tenant has them', () => {
    render(<TenantPlanBadges plan="enterprise" deploymentMode="on_premise" />)
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument()
    expect(screen.getByText('ON-PREMISE')).toBeInTheDocument()
  })
})
