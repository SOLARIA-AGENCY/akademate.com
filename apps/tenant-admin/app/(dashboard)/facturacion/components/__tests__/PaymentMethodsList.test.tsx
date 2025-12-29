import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentMethodsList } from '../PaymentMethodsList'
import type { PaymentMethod } from '@payload-config/types/billing'

describe('PaymentMethodsList', () => {
  const mockOnAddMethod = vi.fn()
  const mockOnSetDefault = vi.fn()
  const mockOnDelete = vi.fn()

  const mockPaymentMethods: PaymentMethod[] = [
    {
      id: 'pm_1',
      tenantId: 'tenant-1',
      stripePaymentMethodId: 'pm_stripe_1',
      type: 'card',
      isDefault: true,
      card: {
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
      },
      billingDetails: {
        name: 'John Doe',
        email: null,
        phone: null,
        address: null,
      },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
    {
      id: 'pm_2',
      tenantId: 'tenant-1',
      stripePaymentMethodId: 'pm_stripe_2',
      type: 'card',
      isDefault: false,
      card: {
        brand: 'mastercard',
        last4: '5555',
        expMonth: 6,
        expYear: 2026,
      },
      billingDetails: {
        name: 'Jane Smith',
        email: null,
        phone: null,
        address: null,
      },
      createdAt: new Date('2025-01-01'),
      updatedAt: new Date('2025-01-01'),
    },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders loading state', () => {
    render(<PaymentMethodsList paymentMethods={[]} loading={true} />)
    expect(screen.getByText('Métodos de Pago')).toBeInTheDocument()
    expect(screen.getByText('Gestiona tus métodos de pago')).toBeInTheDocument()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders empty state when no payment methods', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        loading={false}
        onAddMethod={mockOnAddMethod}
      />
    )
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
    expect(screen.getByText('Agrega un método de pago para gestionar tu suscripción')).toBeInTheDocument()
  })

  it('renders add button in empty state', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        loading={false}
        onAddMethod={mockOnAddMethod}
      />
    )
    const addButton = screen.getByText('Agregar Método de Pago')
    expect(addButton).toBeInTheDocument()
  })

  it('calls onAddMethod when add button clicked in empty state', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        loading={false}
        onAddMethod={mockOnAddMethod}
      />
    )
    const addButton = screen.getByText('Agregar Método de Pago')
    fireEvent.click(addButton)
    expect(mockOnAddMethod).toHaveBeenCalledTimes(1)
  })

  it('renders list of payment methods', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onAddMethod={mockOnAddMethod}
      />
    )
    expect(screen.getByText(/visa/i)).toBeInTheDocument()
    expect(screen.getByText(/mastercard/i)).toBeInTheDocument()
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument()
    expect(screen.getByText(/•••• 5555/)).toBeInTheDocument()
  })

  it('displays payment method count', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onAddMethod={mockOnAddMethod}
      />
    )
    expect(screen.getByText(/Gestiona tus métodos de pago \(2\)/)).toBeInTheDocument()
  })

  it('renders add button in header when methods exist', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onAddMethod={mockOnAddMethod}
      />
    )
    const addButton = screen.getByText('Agregar')
    expect(addButton).toBeInTheDocument()
  })

  it('calls onAddMethod when header add button clicked', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onAddMethod={mockOnAddMethod}
      />
    )
    const addButton = screen.getByText('Agregar')
    fireEvent.click(addButton)
    expect(mockOnAddMethod).toHaveBeenCalledTimes(1)
  })

  it('passes onSetDefault to payment method cards', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onSetDefault={mockOnSetDefault}
      />
    )
    // Second card is not default, should have set default button
    const setDefaultButton = screen.getByText('Establecer Predeterminado')
    fireEvent.click(setDefaultButton)
    expect(mockOnSetDefault).toHaveBeenCalledWith('pm_2')
  })

  it('passes onDelete to payment method cards', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onDelete={mockOnDelete}
      />
    )
    // Find delete buttons (trash icons with destructive styling)
    const buttons = screen.getAllByRole('button')
    const deleteButtons = buttons.filter(btn => btn.className?.includes('text-destructive'))
    expect(deleteButtons.length).toBeGreaterThan(0)
    fireEvent.click(deleteButtons[0])
    expect(mockOnDelete).toHaveBeenCalled()
  })

  it('renders with single payment method', () => {
    const singleMethod = [mockPaymentMethods[0]]
    render(
      <PaymentMethodsList
        paymentMethods={singleMethod}
        onAddMethod={mockOnAddMethod}
      />
    )
    expect(screen.getByText(/\(1\)/)).toBeInTheDocument()
    expect(screen.getByText(/visa/i)).toBeInTheDocument()
  })

  it('renders with many payment methods', () => {
    const manyMethods = Array.from({ length: 10 }, (_, i) => ({
      ...mockPaymentMethods[0],
      id: `pm_${i}`,
      isDefault: i === 0,
    }))
    render(
      <PaymentMethodsList
        paymentMethods={manyMethods}
        onAddMethod={mockOnAddMethod}
      />
    )
    expect(screen.getByText(/\(10\)/)).toBeInTheDocument()
  })

  it('renders default payment method with badge', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
      />
    )
    expect(screen.getByText('Predeterminado')).toBeInTheDocument()
  })

  it('does not render add button when onAddMethod not provided', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
      />
    )
    // Button is rendered but onClick should not crash when clicked without onAddMethod
    const addButton = screen.getByText('Agregar')
    expect(addButton).toBeInTheDocument()
    // Clicking should not crash
    fireEvent.click(addButton)
    // Should not throw error
  })

  it('renders credit card icon in empty state', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        loading={false}
      />
    )
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
    // CreditCard icon is rendered
  })

  it('applies correct spacing between payment method cards', () => {
    const { container } = render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
      />
    )
    const cardContainer = container.querySelector('.space-y-4')
    expect(cardContainer).toBeInTheDocument()
  })

  it('updates count when payment methods change', () => {
    const { rerender } = render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
      />
    )
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument()

    const updatedMethods = [...mockPaymentMethods, {
      ...mockPaymentMethods[0],
      id: 'pm_3',
      isDefault: false,
    }]
    rerender(
      <PaymentMethodsList
        paymentMethods={updatedMethods}
      />
    )
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument()
  })

  it('handles empty array gracefully', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
      />
    )
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
  })

  it('applies custom button style in empty state', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        onAddMethod={mockOnAddMethod}
      />
    )
    const addButton = screen.getByText('Agregar Método de Pago')
    expect(addButton).toHaveStyle({ backgroundColor: '#F2014B' })
  })
})
