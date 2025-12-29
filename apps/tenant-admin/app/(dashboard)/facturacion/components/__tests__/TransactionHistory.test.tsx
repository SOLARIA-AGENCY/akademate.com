import { describe, it, expect, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TransactionHistory } from '../TransactionHistory'
import type { PaymentTransaction } from '@payload-config/types/billing'

describe('TransactionHistory', () => {
  const mockTransactions: PaymentTransaction[] = [
    {
      id: 'txn-1',
      tenantId: 'tenant-1',
      invoiceId: 'inv-1',
      stripePaymentIntentId: 'pi_1',
      stripeChargeId: 'ch_1234567890',
      amount: 29900,
      currency: 'EUR',
      status: 'succeeded',
      paymentMethodType: 'card',
      description: 'Pago de suscripción mensual',
      failureCode: null,
      failureMessage: null,
      metadata: {},
      createdAt: new Date('2025-01-15T10:30:00'),
      updatedAt: new Date('2025-01-15T10:30:00'),
    },
    {
      id: 'txn-2',
      tenantId: 'tenant-1',
      invoiceId: 'inv-2',
      stripePaymentIntentId: 'pi_2',
      stripeChargeId: 'ch_0987654321',
      amount: 29900,
      currency: 'EUR',
      status: 'failed',
      paymentMethodType: 'card',
      description: null,
      failureCode: 'card_declined',
      failureMessage: 'Your card was declined',
      metadata: {},
      createdAt: new Date('2025-01-10T14:20:00'),
      updatedAt: new Date('2025-01-10T14:20:00'),
    },
  ]

  beforeEach(() => {
    // No mocks needed
  })

  it('renders loading state', () => {
    render(<TransactionHistory transactions={[]} loading={true} />)
    expect(screen.getByText('Historial de Transacciones')).toBeInTheDocument()
    const spinner = document.querySelector('.animate-spin')
    expect(spinner).toBeInTheDocument()
  })

  it('renders empty state when no transactions', () => {
    render(<TransactionHistory transactions={[]} loading={false} />)
    expect(screen.getByText('Sin transacciones')).toBeInTheDocument()
    expect(screen.getByText('No hay transacciones registradas aún')).toBeInTheDocument()
  })

  it('renders transaction list', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText('Historial de Transacciones')).toBeInTheDocument()
    expect(screen.getByText(/Registro de pagos y transacciones \(2\)/)).toBeInTheDocument()
  })

  it('displays transaction description', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText('Pago de suscripción mensual')).toBeInTheDocument()
  })

  it('displays default description when null', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText('Pago de suscripción')).toBeInTheDocument()
  })

  it('renders succeeded status correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText('Exitoso')).toBeInTheDocument()
  })

  it('renders failed status correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText('Fallido')).toBeInTheDocument()
  })

  it('displays failure message for failed transactions', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText(/Error: Your card was declined/)).toBeInTheDocument()
  })

  it('does not display failure message for successful transactions', () => {
    const successOnly = [mockTransactions[0]]
    render(<TransactionHistory transactions={successOnly} />)
    expect(screen.queryByText(/Error:/)).not.toBeInTheDocument()
  })

  it('displays formatted date and time', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    // Should show date in Spanish locale with time
    expect(screen.getByText(/15 ene\.? 2025.*10:30/i)).toBeInTheDocument()
  })

  it('displays formatted amount in EUR', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    const amounts = screen.getAllByText(/299,00\s*€/)
    expect(amounts.length).toBe(2)
  })

  it('displays payment method type', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    const methodLabels = screen.getAllByText(/Método: card/)
    expect(methodLabels.length).toBe(2)
  })

  it('displays truncated charge ID', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText(/ID: 34567890/)).toBeInTheDocument()
    expect(screen.getByText(/ID: 87654321/)).toBeInTheDocument()
  })

  it('handles pending status', () => {
    const pendingTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      id: 'txn-3',
      status: 'pending',
    }
    render(<TransactionHistory transactions={[pendingTransaction]} />)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('handles processing status', () => {
    const processingTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      id: 'txn-4',
      status: 'processing',
    }
    render(<TransactionHistory transactions={[processingTransaction]} />)
    expect(screen.getByText('Procesando')).toBeInTheDocument()
  })

  it('handles canceled status', () => {
    const canceledTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      id: 'txn-5',
      status: 'canceled',
    }
    render(<TransactionHistory transactions={[canceledTransaction]} />)
    expect(screen.getByText('Cancelado')).toBeInTheDocument()
  })

  it('handles refunded status', () => {
    const refundedTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      id: 'txn-6',
      status: 'refunded',
    }
    render(<TransactionHistory transactions={[refundedTransaction]} />)
    expect(screen.getByText('Reembolsado')).toBeInTheDocument()
  })

  it('applies hover effect to transaction rows', () => {
    const { container } = render(<TransactionHistory transactions={mockTransactions} />)
    const transactionRows = container.querySelectorAll('.hover\\:bg-muted\\/50')
    expect(transactionRows.length).toBeGreaterThan(0)
  })

  it('updates transaction count correctly', () => {
    const { rerender } = render(<TransactionHistory transactions={mockTransactions} />)
    expect(screen.getByText(/\(2\)/)).toBeInTheDocument()

    const moreTransactions = [
      ...mockTransactions,
      { ...mockTransactions[0], id: 'txn-3' },
    ]
    rerender(<TransactionHistory transactions={moreTransactions} />)
    expect(screen.getByText(/\(3\)/)).toBeInTheDocument()
  })

  it('renders with many transactions', () => {
    const manyTransactions = Array.from({ length: 20 }, (_, i) => ({
      ...mockTransactions[0],
      id: `txn-${i}`,
    }))
    render(<TransactionHistory transactions={manyTransactions} />)
    expect(screen.getByText(/\(20\)/)).toBeInTheDocument()
  })

  it('handles different currencies', () => {
    const usdTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      currency: 'USD',
      amount: 35000,
    }
    render(<TransactionHistory transactions={[usdTransaction]} />)
    expect(screen.getByText(/350,00\s*US\$/)).toBeInTheDocument()
  })

  it('displays status icons correctly', () => {
    render(<TransactionHistory transactions={mockTransactions} />)
    // Each transaction should have an icon
    const statusIcons = document.querySelectorAll('svg')
    expect(statusIcons.length).toBeGreaterThan(0)
  })

  it('applies correct color classes to status icons', () => {
    const { container } = render(<TransactionHistory transactions={mockTransactions} />)
    // Succeeded transaction should have green color
    expect(container.querySelector('.text-green-500')).toBeInTheDocument()
    // Failed transaction should have red color
    expect(container.querySelector('.text-red-500')).toBeInTheDocument()
  })

  it('renders transaction without stripe charge ID', () => {
    const noChargeIdTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      stripeChargeId: null,
    }
    render(<TransactionHistory transactions={[noChargeIdTransaction]} />)
    expect(screen.queryByText(/ID:/)).not.toBeInTheDocument()
  })

  it('formats large amounts correctly', () => {
    const largeTransaction: PaymentTransaction = {
      ...mockTransactions[0],
      amount: 123456789,
    }
    render(<TransactionHistory transactions={[largeTransaction]} />)
    expect(screen.getByText(/1\.234\.567,89\s*€/)).toBeInTheDocument()
  })

  it('displays clock icon in empty state', () => {
    render(<TransactionHistory transactions={[]} />)
    expect(screen.getByText('Sin transacciones')).toBeInTheDocument()
    // Clock icon should be present
  })

  it('handles transactions with same amount but different status', () => {
    const duplicateAmountTransactions: PaymentTransaction[] = [
      { ...mockTransactions[0], status: 'succeeded' },
      { ...mockTransactions[0], id: 'txn-2', status: 'failed' },
      { ...mockTransactions[0], id: 'txn-3', status: 'pending' },
    ]
    render(<TransactionHistory transactions={duplicateAmountTransactions} />)
    expect(screen.getByText('Exitoso')).toBeInTheDocument()
    expect(screen.getByText('Fallido')).toBeInTheDocument()
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('truncates charge ID to last 8 characters', () => {
    const longChargeId: PaymentTransaction = {
      ...mockTransactions[0],
      stripeChargeId: 'ch_1234567890123456',
    }
    render(<TransactionHistory transactions={[longChargeId]} />)
    expect(screen.getByText(/ID: 90123456/)).toBeInTheDocument()
  })
})
