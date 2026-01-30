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
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Para equipos en crecimiento')).toBeInTheDocument()
  })

  it('displays monthly price correctly', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('€299.00')).toBeInTheDocument()
    expect(screen.getByText('/mes')).toBeInTheDocument()
  })

  it('displays yearly price with monthly equivalent', () => {
    render(<PlanCard {...defaultProps} interval="year" />)
    expect(screen.getByText('€2990.00')).toBeInTheDocument()
    expect(screen.getByText('/año')).toBeInTheDocument()
    // 299000 / 12 / 100 = 249.17
    expect(screen.getByText(/€249\.17\/mes facturado anualmente/)).toBeInTheDocument()
  })

  it('does not show monthly equivalent for monthly interval', () => {
    render(<PlanCard {...defaultProps} interval="month" />)
    expect(screen.queryByText(/facturado anualmente/)).not.toBeInTheDocument()
  })

  it('renders all features', () => {
    render(<PlanCard {...defaultProps} />)
    expect(screen.getByText('Hasta 500 usuarios')).toBeInTheDocument()
    expect(screen.getByText('100 GB de almacenamiento')).toBeInTheDocument()
    expect(screen.getByText('500,000 llamadas API/mes')).toBeInTheDocument()
    expect(screen.getByText('Soporte prioritario')).toBeInTheDocument()
  })

  it('shows popular badge when isPopular is true', () => {
    render(<PlanCard {...defaultProps} isPopular={true} />)
    expect(screen.getByText('Más Popular')).toBeInTheDocument()
  })

  it('does not show popular badge when isPopular is false', () => {
    render(<PlanCard {...defaultProps} isPopular={false} />)
    expect(screen.queryByText('Más Popular')).not.toBeInTheDocument()
  })

  it('shows current plan badge when isCurrentPlan is true', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} />)
    // Text appears in both badge and button
    expect(screen.getAllByText('Plan Actual').length).toBeGreaterThan(0)
  })

  it('does not show current plan badge when isCurrentPlan is false', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} />)
    // Should show "Seleccionar Plan" button instead
    expect(screen.getByText('Seleccionar Plan')).toBeInTheDocument()
    expect(screen.queryByText('Plan Actual')).not.toBeInTheDocument()
  })

  it('calls onSelect with tier and interval when button clicked', () => {
    render(<PlanCard {...defaultProps} />)
    const selectButton = screen.getByText('Seleccionar Plan')
    fireEvent.click(selectButton)
    expect(mockOnSelect).toHaveBeenCalledWith('pro', 'month')
  })

  it('disables button when isCurrentPlan is true', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} />)
    const buttons = screen.getAllByRole('button')
    const planButton = buttons.find(btn => btn.textContent?.includes('Plan Actual'))
    expect(planButton).toBeDisabled()
  })

  it('does not disable button when isCurrentPlan is false', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} />)
    const button = screen.getByText('Seleccionar Plan')
    expect(button).not.toBeDisabled()
  })

  it('shows "Plan Actual" text when current plan', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={true} />)
    // Text appears in both badge and button
    expect(screen.getAllByText('Plan Actual').length).toBeGreaterThan(0)
  })

  it('shows "Seleccionar Plan" text when not current plan', () => {
    render(<PlanCard {...defaultProps} isCurrentPlan={false} />)
    expect(screen.getByText('Seleccionar Plan')).toBeInTheDocument()
  })

  it('applies custom border style when popular', () => {
    const { container } = render(<PlanCard {...defaultProps} isPopular={true} />)
    const card = container.querySelector('[data-testid="card"]')
    expect(card).toHaveClass('border-2', 'border-[#F2014B]')
  })

  it('applies custom button style when popular and not current', () => {
    render(<PlanCard {...defaultProps} isPopular={true} isCurrentPlan={false} />)
    const button = screen.getByText('Seleccionar Plan')
    expect(button).toHaveStyle({ backgroundColor: '#F2014B' })
  })

  it('does not apply custom button style when not popular', () => {
    render(<PlanCard {...defaultProps} isPopular={false} />)
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
      />
    )
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('€199.00')).toBeInTheDocument()
  })

  it('renders enterprise plan correctly', () => {
    render(
      <PlanCard
        {...defaultProps}
        tier="enterprise"
        name="Enterprise"
        description="Para grandes organizaciones"
        priceMonthly={59900}
      />
    )
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
    expect(screen.getByText('€599.00')).toBeInTheDocument()
  })

  it('handles many features correctly', () => {
    const manyFeatures = Array.from({ length: 10 }, (_, i) => `Feature ${i + 1}`)
    render(<PlanCard {...defaultProps} features={manyFeatures} />)
    manyFeatures.forEach(feature => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('handles empty features array', () => {
    render(<PlanCard {...defaultProps} features={[]} />)
    // Should still render the card
    expect(screen.getByText('Pro')).toBeInTheDocument()
  })

  it('calls onSelect with correct interval for yearly', () => {
    render(<PlanCard {...defaultProps} interval="year" />)
    const selectButton = screen.getByText('Seleccionar Plan')
    fireEvent.click(selectButton)
    expect(mockOnSelect).toHaveBeenCalledWith('pro', 'year')
  })

  it('renders check icons for features', () => {
    const { container } = render(<PlanCard {...defaultProps} />)
    // Each feature should have a check icon
    const features = defaultProps.features
    expect(container.querySelectorAll('li').length).toBe(features.length)
  })

  it('calculates price correctly for different amounts', () => {
    const { rerender } = render(
      <PlanCard {...defaultProps} priceMonthly={9999} interval="month" />
    )
    expect(screen.getByText('€99.99')).toBeInTheDocument()

    rerender(
      <PlanCard {...defaultProps} priceYearly={99999} interval="year" />
    )
    expect(screen.getByText('€999.99')).toBeInTheDocument()
  })

  it('positions popular badge correctly', () => {
    const { container: _container } = render(<PlanCard {...defaultProps} isPopular={true} />)
    const badge = screen.getByText('Más Popular').parentElement
    expect(badge).toHaveClass('-top-3', 'left-1/2', '-translate-x-1/2')
  })

  it('applies custom badge color for popular plan', () => {
    render(<PlanCard {...defaultProps} isPopular={true} />)
    const badge = screen.getByText('Más Popular')
    expect(badge).toBeInTheDocument()
    // Badge has inline style applied (hex color #F2014B)
    expect(badge).toHaveStyle({ backgroundColor: '#F2014B' })
  })
})
