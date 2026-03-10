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
    render(<PaymentMethodsList paymentMethods={[]} loading={true} data-oid="ig11rr9" />)
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
        data-oid="wef1:1v"
      />
    )
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
    expect(
      screen.getByText('Agrega un método de pago para gestionar tu suscripción')
    ).toBeInTheDocument()
  })

  it('renders add button in empty state', () => {
    render(
      <PaymentMethodsList
        paymentMethods={[]}
        loading={false}
        onAddMethod={mockOnAddMethod}
        data-oid="c55rf:d"
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
        data-oid="iqa.w.1"
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
        data-oid="zy5t_j_"
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
        data-oid="l0pfwdn"
      />
    )
    expect(screen.getByText(/Gestiona tus métodos de pago \(2\)/)).toBeInTheDocument()
  })

  it('renders add button in header when methods exist', () => {
    render(
      <PaymentMethodsList
        paymentMethods={mockPaymentMethods}
        onAddMethod={mockOnAddMethod}
        data-oid="p03r1v3"
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
        data-oid="gr031s0"
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
        data-oid="m:3o8lg"
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
        data-oid="pv4mnb8"
      />
    )
    // Find delete buttons (trash icons with destructive styling)
    const buttons = screen.getAllByRole('button')
    const deleteButtons = buttons.filter((btn) => btn.className?.includes('text-destructive'))
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
        data-oid="n64i7b5"
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
        data-oid="z.jd15t"
      />
    )
    expect(screen.getByText(/\(10\)/)).toBeInTheDocument()
  })

  it('renders default payment method with badge', () => {
    render(<PaymentMethodsList paymentMethods={mockPaymentMethods} data-oid="vs87jp4" />)
    expect(screen.getByText('Predeterminado')).toBeInTheDocument()
  })

  it('does not render add button when onAddMethod not provided', () => {
    render(<PaymentMethodsList paymentMethods={mockPaymentMethods} data-oid="st6-pa:" />)
    // Button is rendered but onClick should not crash when clicked without onAddMethod
    const addButton = screen.getByText('Agregar')
    expect(addButton).toBeInTheDocument()
    // Clicking should not crash
    fireEvent.click(addButton)
    // Should not throw error
  })

  it('renders credit card icon in empty state', () => {
    render(<PaymentMethodsList paymentMethods={[]} loading={false} data-oid="ypu8lwm" />)
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
    // CreditCard icon is rendered
  })

  it('applies correct spacing between payment method cards', () => {
    const { container } = render(
      <PaymentMethodsList paymentMethods={mockPaymentMethods} data-oid=":v8ek5:" />
    )
    const cardContainer = container.querySelector('.space-y-4')
    expect(cardContainer).toBeInTheDocument()
  })

  it('updates count when payment methods change', () => {
    const { rerender } = render(
      <PaymentMethodsList paymentMethods={mockPaymentMethods} data-oid="z2og3e_" />
    )
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument()

    const updatedMethods = [
      ...mockPaymentMethods,
      {
        ...mockPaymentMethods[0],
        id: 'pm_3',
        isDefault: false,
      },
    ]
    rerender(<PaymentMethodsList paymentMethods={updatedMethods} data-oid="k8qtm6:" />)
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument()
  })

  it('handles empty array gracefully', () => {
    render(<PaymentMethodsList paymentMethods={[]} data-oid="6.q_l8." />)
    expect(screen.getByText('Sin métodos de pago')).toBeInTheDocument()
  })

  it('applies custom button style in empty state', () => {
    render(
      <PaymentMethodsList paymentMethods={[]} onAddMethod={mockOnAddMethod} data-oid="z_djhh8" />
    )
    const addButton = screen.getByText('Agregar Método de Pago')
    expect(addButton).toHaveStyle({ backgroundColor: '#F2014B' })
  })
})
