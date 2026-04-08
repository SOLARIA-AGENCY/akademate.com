import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCard } from '../PlanCard'
import type { PlanTier } from '@payload-config/types/billing'

describe('PlanCard', () => {
  const mockOnSelect = vi.fn()

  const defaultProps = {
    tier: 'pro' as PlanTier,
    name: 'Pro',
    description: 'Para equipos en crecimiento',
    priceMonthly: 29900,
    priceYearly: 299000,
    features: [
      'Hasta 500 usuarios',
      '100 GB de almacenamiento',
      '500,000 llamadas API/mes',
      'Soporte prioritario',
    ],

    interval: 'month' as const,
    isCurrentPlan: false,
    isPopular: false,
    onSelect: mockOnSelect,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plan name and description', () => {
    render(<PlanCard {...defaultProps} data-oid="mq72z4v" />)
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Para equipos en crecimiento')).toBeInTheDocument()
  })

  it('displays monthly price correctly', () => {
    render(<PlanCard {...defaultProps} data-oid="xwk6oxz" />)
    expect(screen.getByText(/299/)).toBeInTheDocument()
    expect(screen.getByText('/mes')).toBeInTheDocument()
  })

  it('displays yearly price as discounted monthly with annual total', () => {
    render(<PlanCard {...defaultProps} interval="year" data-oid="pjj4ogs" />)
    // Shows discounted monthly price: 29900 * 0.83 = 24817 cents = €248/mes
    expect(screen.getByText(/248/)).toBeInTheDocument()
    expect(screen.getByText('/mes')).toBeInTheDocument()
    // Shows annual total facturado anualmente
    expect(screen.getByText(/Facturado anualmente/)).toBeInTheDocument()
  })

  it('does not show monthly equivalent for monthly interval', () => {
    render(<PlanCard {...defaultProps} interval="month" data-oid=".h4s0t:" />)
    expect(screen.queryByText(/facturado anualmente/)).not.toBeInTheDocument()
  })

  it('renders all features', () => {
    render(<PlanCard {...defaultProps} data-oid="uaaswlz" />)
    expect(screen.getByText('Hasta 500 usuarios')).toBeInTheDocument()
    expect(screen.getByText('100 GB de almacenamiento')).toBeInTheDocument()
    expect(screen.getByText('500,000 llamadas API/mes')).toBeInTheDocument()
    expect(screen.getByText('Soporte prioritario')).toBeInTheDocument()
  })

  it('shows popular badge when isPopular is true', () => {
    render(<PlanCard {...defaultProps} isPopular={true} data-oid="aaiovko" />)
    expect(screen.getByText('Más Popular')).toBeInTheDocument()
  })

  it('does not show popular badge when isPopular is false', () => {
    render(<PlanCard {...defaultProps} isPopular={false} data-oid="vhnb364" />)
    expect(screen.queryByText('Más Popular')).not.toBeInTheDocument()
  })

  it('shows current plan badge when isCurrentPlan is true', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} data-oid="73tdv-e" />)
    // Text appears in both badge and button
    expect(screen.getAllByText('Plan Actual').length).toBeGreaterThan(0)
  })

  it('does not show current plan badge when isCurrentPlan is false', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} data-oid="_ne35wz" />)
    // Should show "Seleccionar Plan" button instead
    expect(screen.getByText('Seleccionar Plan')).toBeInTheDocument()
    expect(screen.queryByText('Plan Actual')).not.toBeInTheDocument()
  })

  it('calls onSelect with tier and interval when button clicked', () => {
    render(<PlanCard {...defaultProps} data-oid="el-sokr" />)
    const selectButton = screen.getByText('Seleccionar Plan')
    fireEvent.click(selectButton)
    expect(mockOnSelect).toHaveBeenCalledWith('pro', 'month')
  })

  it('disables button when isCurrentPlan is true', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} data-oid="vj_1q3v" />)
    const buttons = screen.getAllByRole('button')
    const planButton = buttons.find((btn) => btn.textContent?.includes('Plan Actual'))
    expect(planButton).toBeDisabled()
  })

  it('does not disable button when isCurrentPlan is false', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} data-oid="y2dnty_" />)
    const button = screen.getByText('Seleccionar Plan')
    expect(button).not.toBeDisabled()
  })

  it('shows "Plan Actual" text when current plan', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} data-oid="plbblfw" />)
    // Text appears in both badge and button
    expect(screen.getAllByText('Plan Actual').length).toBeGreaterThan(0)
  })

  it('shows "Seleccionar Plan" text when not current plan', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} data-oid="55o3em0" />)
    expect(screen.getByText('Seleccionar Plan')).toBeInTheDocument()
  })

  it('applies custom border style when popular', () => {
    const { container } = render(<PlanCard {...defaultProps} isPopular={true} data-oid="hjts2s0" />)
    const card = container.querySelector('[data-testid="card"]')
    expect(card).toHaveClass('border-2', 'border-[#F2014B]')
  })

  it('applies custom button style when popular and not current', () => {
    render(<PlanCard {...defaultProps} isPopular={true} isCurrentPlan={false} data-oid=".w5_xkt" />)
    const button = screen.getByText('Seleccionar Plan')
    expect(button).toHaveStyle({ backgroundColor: '#F2014B' })
  })

  it('does not apply custom button style when not popular', () => {
    render(<PlanCard {...defaultProps} isPopular={false} data-oid="kbt1vrs" />)
    const button = screen.getByText('Seleccionar Plan')
    expect(button).not.toHaveStyle({ backgroundColor: '#F2014B' })
  })

  it('renders starter plan correctly', () => {
    render(
      <PlanCard
        {...defaultProps}
        tier="starter"
        name="Starter"
        description="Para proyectos pequeños"
        priceMonthly={19900}
        data-oid="gj8nsge"
      />
    )
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText(/199/)).toBeInTheDocument()
    // Should show trial badge
    expect(screen.getByText('15 días de prueba gratuita')).toBeInTheDocument()
  })

  it('renders enterprise plan with Contáctanos instead of price', () => {
    render(
      <PlanCard
        {...defaultProps}
        tier="enterprise"
        name="Enterprise"
        description="Para grandes organizaciones"
        priceMonthly={59900}
        data-oid="dqjso2."
      />
    )
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
    expect(screen.getByText('Contáctanos')).toBeInTheDocument()
    // Enterprise should show "Contactar Ventas" button
    expect(screen.getByText('Contactar Ventas')).toBeInTheDocument()
    // Enterprise should NOT show trial badge
    expect(screen.queryByText('15 días de prueba gratuita')).not.toBeInTheDocument()
  })

  it('handles many features correctly', () => {
    const manyFeatures = Array.from({ length: 10 }, (_, i) => `Feature ${i + 1}`)
    render(<PlanCard {...defaultProps} features={manyFeatures} data-oid="fb:17g9" />)
    manyFeatures.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('handles empty features array', () => {
    render(<PlanCard {...defaultProps} features={[]} data-oid="ilk0lj-" />)
    // Should still render the card
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })

  it('calls onSelect with correct interval for yearly', () => {
    render(<PlanCard {...defaultProps} interval="year" data-oid="ar9t7pz" />)
    const selectButton = screen.getByText('Seleccionar Plan')
    fireEvent.click(selectButton)
    expect(mockOnSelect).toHaveBeenCalledWith('pro', 'year')
  })

  it('renders check icons for features', () => {
    const { container } = render(<PlanCard {...defaultProps} data-oid="99-:6gs" />)
    // Each feature should have a check icon
    const features = defaultProps.features
    expect(container.querySelectorAll('li').length).toBe(features.length)
  })

  it('calculates price correctly for different amounts', () => {
    const { rerender } = render(
      <PlanCard {...defaultProps} priceMonthly={9999} interval="month" data-oid="6_2gtsr" />
    )
    // 9999 / 100 = 99.99, toFixed(0) = 100
    expect(screen.getByText('€100')).toBeInTheDocument()

    rerender(<PlanCard {...defaultProps} priceMonthly={29900} interval="year" data-oid="x7.xc-z" />)
    // 29900 * 0.83 = 24817 cents = €248/mes
    expect(screen.getByText('€248')).toBeInTheDocument()
  })

  it('positions popular badge correctly', () => {
    const { container: _container } = render(
      <PlanCard {...defaultProps} isPopular={true} data-oid="gkmvpd5" />
    )
    const badge = screen.getByText('Más Popular').parentElement
    expect(badge).toHaveClass('-top-3', 'left-1/2', '-translate-x-1/2')
  })

  it('applies custom badge color for popular plan', () => {
    render(<PlanCard {...defaultProps} isPopular={true} data-oid="v_58bqz" />)
    const badge = screen.getByText('Más Popular')
    expect(badge).toBeInTheDocument()
    // Badge has inline style applied (hex color #F2014B)
    expect(badge).toHaveStyle({ backgroundColor: '#F2014B' })
  })
})
