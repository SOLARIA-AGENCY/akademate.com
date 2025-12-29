import { render, screen, fireEvent } from '@testing-library/react'
import { PlanCard } from '../../app/(dashboard)/facturacion/components/PlanCard'

const mockFeatures = [
  'Hasta 500 usuarios',
  '100 GB de almacenamiento',
  'Soporte prioritario',
]

describe('PlanCard', () => {
  it('renders plan details correctly', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText(/Para equipos en crecimiento/i)).toBeInTheDocument()
    expect(screen.getByText(/€299.00/i)).toBeInTheDocument()
    expect(screen.getByText(/\/mes/i)).toBeInTheDocument()
  })

  it('shows yearly pricing correctly', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="year"
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByText(/€2990.00/i)).toBeInTheDocument()
    expect(screen.getByText(/\/año/i)).toBeInTheDocument()
    expect(screen.getByText(/mes facturado anualmente/i)).toBeInTheDocument()
  })

  it('displays all features', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        onSelect={jest.fn()}
      />
    )

    mockFeatures.forEach((feature) => {
      expect(screen.getByText(feature)).toBeInTheDocument()
    })
  })

  it('shows popular badge when isPopular is true', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        isPopular={true}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByText(/Más Popular/i)).toBeInTheDocument()
  })

  it('shows current plan badge when isCurrentPlan is true', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        isCurrentPlan={true}
        onSelect={jest.fn()}
      />
    )

    expect(screen.getByText(/Plan Actual/i)).toBeInTheDocument()
  })

  it('disables button when isCurrentPlan is true', () => {
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        isCurrentPlan={true}
        onSelect={jest.fn()}
      />
    )

    const button = screen.getByRole('button')
    expect(button).toBeDisabled()
  })

  it('calls onSelect with correct parameters when clicked', () => {
    const onSelect = jest.fn()
    render(
      <PlanCard
        tier="pro"
        name="Pro"
        description="Para equipos en crecimiento"
        priceMonthly={29900}
        priceYearly={299000}
        features={mockFeatures}
        interval="month"
        onSelect={onSelect}
      />
    )

    const button = screen.getByText(/Seleccionar Plan/i)
    fireEvent.click(button)

    expect(onSelect).toHaveBeenCalledWith('pro', 'month')
  })
})
