import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { PaymentMethodCard } from '../PaymentMethodCard'
import type { PaymentMethod } from '@payload-config/types/billing'

describe('PaymentMethodCard', () => {
  const mockOnSetDefault = vi.fn()
  const mockOnDelete = vi.fn()

  const baseCardPaymentMethod: PaymentMethod = {
    id: 'pm_1',
    tenantId: 'tenant-1',
    stripePaymentMethodId: 'pm_stripe_1',
    type: 'card',
    isDefault: false,
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
  }

  const sepaPaymentMethod: PaymentMethod = {
    id: 'pm_2',
    tenantId: 'tenant-1',
    stripePaymentMethodId: 'pm_stripe_2',
    type: 'sepa_debit',
    isDefault: false,
    sepaDebit: {
      bankCode: 'DEUTDEFF',
      last4: '3000',
      country: 'DE',
    },
    billingDetails: {
      name: 'Jane Smith',
      email: null,
      phone: null,
      address: null,
    },
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders card payment method', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/visa/i)).toBeInTheDocument()
    expect(screen.getByText(/•••• 4242/)).toBeInTheDocument()
  })

  it('renders card expiry date', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/Expira: 12\/25/)).toBeInTheDocument()
  })

  it('shows expired card warning', () => {
    const expiredCard = {
      ...baseCardPaymentMethod,
      card: {
        ...baseCardPaymentMethod.card!,
        expMonth: 1,
        expYear: 2020,
      },
    }
    render(
      <PaymentMethodCard
        paymentMethod={expiredCard}
        isDefault={false}
      />
    )
    expect(screen.getByText(/\(Expirada\)/)).toBeInTheDocument()
  })

  it('renders default badge when isDefault is true', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={true}
      />
    )
    expect(screen.getByText('Predeterminado')).toBeInTheDocument()
  })

  it('does not render default badge when isDefault is false', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.queryByText('Predeterminado')).not.toBeInTheDocument()
  })

  it('renders billing details name', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText('John Doe')).toBeInTheDocument()
  })

  it('does not render name when billingDetails is not provided', () => {
    const noDetailsCard = { ...baseCardPaymentMethod, billingDetails: undefined }
    render(
      <PaymentMethodCard
        paymentMethod={noDetailsCard}
        isDefault={false}
      />
    )
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('renders set default button when not default', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
        onSetDefault={mockOnSetDefault}
      />
    )
    expect(screen.getByText('Establecer Predeterminado')).toBeInTheDocument()
  })

  it('does not render set default button when already default', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={true}
        onSetDefault={mockOnSetDefault}
      />
    )
    expect(screen.queryByText('Establecer Predeterminado')).not.toBeInTheDocument()
  })

  it('calls onSetDefault with payment method id', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
        onSetDefault={mockOnSetDefault}
      />
    )
    const setDefaultButton = screen.getByText('Establecer Predeterminado')
    fireEvent.click(setDefaultButton)
    expect(mockOnSetDefault).toHaveBeenCalledWith('pm_1')
  })

  it('calls onDelete with payment method id', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
        onDelete={mockOnDelete}
      />
    )
    const buttons = screen.getAllByRole('button')
    // Last button should be the delete button (has destructive class)
    const deleteBtn = buttons.find(btn => btn.className?.includes('text-destructive'))
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn!)
    expect(mockOnDelete).toHaveBeenCalledWith('pm_1')
  })

  it('renders SEPA debit payment method', () => {
    render(
      <PaymentMethodCard
        paymentMethod={sepaPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText('SEPA Débito Directo')).toBeInTheDocument()
    expect(screen.getByText(/•••• 3000/)).toBeInTheDocument()
  })

  it('renders SEPA bank code', () => {
    render(
      <PaymentMethodCard
        paymentMethod={sepaPaymentMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/Banco: DEUTDEFF/)).toBeInTheDocument()
  })

  it('renders different card brands correctly', () => {
    const mastercardMethod = {
      ...baseCardPaymentMethod,
      card: { ...baseCardPaymentMethod.card!, brand: 'mastercard' },
    }
    const { rerender } = render(
      <PaymentMethodCard
        paymentMethod={mastercardMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/mastercard/i)).toBeInTheDocument()

    const amexMethod = {
      ...baseCardPaymentMethod,
      card: { ...baseCardPaymentMethod.card!, brand: 'amex' },
    }
    rerender(
      <PaymentMethodCard
        paymentMethod={amexMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/amex/i)).toBeInTheDocument()
  })

  it('handles card without brand gracefully', () => {
    const noBrandCard = {
      ...baseCardPaymentMethod,
      card: { ...baseCardPaymentMethod.card!, brand: 'unknown' },
    }
    render(
      <PaymentMethodCard
        paymentMethod={noBrandCard}
        isDefault={false}
      />
    )
    expect(screen.getByText(/unknown/i)).toBeInTheDocument()
  })

  it('renders payment method without card or sepa details', () => {
    const bankTransferMethod: PaymentMethod = {
      ...baseCardPaymentMethod,
      type: 'bank_transfer',
      card: null,
      sepaDebit: undefined,
    }
    render(
      <PaymentMethodCard
        paymentMethod={bankTransferMethod}
        isDefault={false}
      />
    )
    expect(screen.getByText(/bank_transfer/i)).toBeInTheDocument()
  })

  it('does not crash when onSetDefault is not provided', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    const setDefaultButton = screen.queryByText('Establecer Predeterminado')
    if (setDefaultButton) {
      fireEvent.click(setDefaultButton)
    }
    // Should not throw error
  })

  it('does not crash when onDelete is not provided', () => {
    render(
      <PaymentMethodCard
        paymentMethod={baseCardPaymentMethod}
        isDefault={false}
      />
    )
    // Delete button should still render but not crash when clicked
    const buttons = screen.getAllByRole('button')
    const deleteBtn = buttons.find(btn => btn.className?.includes('text-destructive'))
    expect(deleteBtn).toBeDefined()
    fireEvent.click(deleteBtn!)
    // Should not throw error
  })

  it('formats expiry with leading zero for single digit month', () => {
    const janCard = {
      ...baseCardPaymentMethod,
      card: {
        ...baseCardPaymentMethod.card!,
        expMonth: 1,
        expYear: 2026,
      },
    }
    render(
      <PaymentMethodCard
        paymentMethod={janCard}
        isDefault={false}
      />
    )
    expect(screen.getByText(/Expira: 01\/26/)).toBeInTheDocument()
  })

  it('applies correct text color to expired card', () => {
    const expiredCard = {
      ...baseCardPaymentMethod,
      card: {
        ...baseCardPaymentMethod.card!,
        expMonth: 1,
        expYear: 2020,
      },
    }
    const { container: _container } = render(
      <PaymentMethodCard
        paymentMethod={expiredCard}
        isDefault={false}
      />
    )
    const expiryText = screen.getByText(/Expira:/)
    expect(expiryText).toHaveClass('text-red-500')
  })
})
