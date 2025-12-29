import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CheckoutDialog } from '../CheckoutDialog'
import type { PlanTier } from '@payload-config/types/billing'

vi.mock('@payload-config/hooks/use-toast')

describe('CheckoutDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnConfirm = vi.fn()

  const defaultProps = {
    open: true,
    onOpenChange: mockOnOpenChange,
    onConfirm: mockOnConfirm,
    planTier: 'pro' as PlanTier,
    planName: 'Pro',
    price: 29900,
    interval: 'month' as const,
    features: [
      'Hasta 500 usuarios',
      '100 GB de almacenamiento',
      '500,000 llamadas API/mes',
      'Soporte prioritario',
      'Acceso a API avanzada',
    ],
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <CheckoutDialog {...defaultProps} open={false} />
    )
    expect(container.querySelector('[data-testid="alert-dialog"]')).not.toBeInTheDocument()
  })

  it('renders dialog when open', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    expect(screen.getByText('Confirmar Cambio de Plan')).toBeInTheDocument()
  })

  it('displays plan name and tier', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()
    expect(screen.getByText('PRO')).toBeInTheDocument()
  })

  it('displays monthly price correctly', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByText('€299.00')).toBeInTheDocument()
    expect(screen.getByText('/mes')).toBeInTheDocument()
    expect(screen.getByText('Facturación mensual')).toBeInTheDocument()
  })

  it('displays yearly price with monthly equivalent', () => {
    render(
      <CheckoutDialog
        {...defaultProps}
        price={299000}
        interval="year"
      />
    )
    expect(screen.getByText('€2990.00')).toBeInTheDocument()
    expect(screen.getByText('/año')).toBeInTheDocument()
    expect(screen.getByText('Facturación anual')).toBeInTheDocument()
    expect(screen.getByText(/€249\.17\/mes facturado anualmente/i)).toBeInTheDocument()
  })

  it('displays up to 4 features', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByText('Hasta 500 usuarios')).toBeInTheDocument()
    expect(screen.getByText('100 GB de almacenamiento')).toBeInTheDocument()
    expect(screen.getByText('500,000 llamadas API/mes')).toBeInTheDocument()
    expect(screen.getByText('Soporte prioritario')).toBeInTheDocument()
  })

  it('does not display more than 4 features', () => {
    render(<CheckoutDialog {...defaultProps} />)
    // The 5th feature should not be displayed
    expect(screen.queryByText('Acceso a API avanzada')).not.toBeInTheDocument()
  })

  it('displays security information message', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByText(/El pago se procesará de forma segura a través de Stripe/i)).toBeInTheDocument()
    expect(screen.getByText(/Puedes cancelar en cualquier momento/i)).toBeInTheDocument()
  })

  it('calls onConfirm when confirm button clicked', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(<CheckoutDialog {...defaultProps} />)

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
    })
  })

  it('shows loading state during confirmation', async () => {
    let resolveConfirm: () => void
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve
    })
    mockOnConfirm.mockReturnValue(confirmPromise)

    render(<CheckoutDialog {...defaultProps} />)

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    expect(confirmButton).toBeDisabled()
    expect(confirmButton).toHaveTextContent('Redirigiendo...')

    const cancelButton = screen.getByTestId('alert-dialog-cancel')
    expect(cancelButton).toBeDisabled()

    resolveConfirm!()
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  it('handles confirmation error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnConfirm.mockRejectedValue(new Error('Payment failed'))

    render(<CheckoutDialog {...defaultProps} />)

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to start checkout:',
        expect.any(Error)
      )
    })

    // Should re-enable button after error
    await waitFor(() => {
      expect(confirmButton).not.toBeDisabled()
    })

    consoleErrorSpy.mockRestore()
  })

  it('does not close dialog on error', async () => {
    mockOnConfirm.mockRejectedValue(new Error('Payment failed'))

    render(<CheckoutDialog {...defaultProps} />)

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })

    // onOpenChange should not be called on error
    expect(mockOnOpenChange).not.toHaveBeenCalled()
  })

  it('renders starter plan correctly', () => {
    render(
      <CheckoutDialog
        {...defaultProps}
        planTier="starter"
        planName="Starter"
        price={19900}
      />
    )
    expect(screen.getByText('Plan Starter')).toBeInTheDocument()
    expect(screen.getByText('STARTER')).toBeInTheDocument()
    expect(screen.getByText('€199.00')).toBeInTheDocument()
  })

  it('renders enterprise plan correctly', () => {
    render(
      <CheckoutDialog
        {...defaultProps}
        planTier="enterprise"
        planName="Enterprise"
        price={59900}
      />
    )
    expect(screen.getByText('Plan Enterprise')).toBeInTheDocument()
    expect(screen.getByText('ENTERPRISE')).toBeInTheDocument()
    expect(screen.getByText('€599.00')).toBeInTheDocument()
  })

  it('applies custom button style', () => {
    render(<CheckoutDialog {...defaultProps} />)
    const confirmButton = screen.getByTestId('alert-dialog-action')
    expect(confirmButton).toHaveStyle({ backgroundColor: '#F2014B' })
  })

  it('has correct button text in normal state', () => {
    render(<CheckoutDialog {...defaultProps} />)
    const confirmButton = screen.getByTestId('alert-dialog-action')
    expect(confirmButton).toHaveTextContent('Continuar al Pago')
  })

  it('has cancel button', () => {
    render(<CheckoutDialog {...defaultProps} />)
    const cancelButton = screen.getByTestId('alert-dialog-cancel')
    expect(cancelButton).toHaveTextContent('Cancelar')
  })

  it('displays redirect information', () => {
    render(<CheckoutDialog {...defaultProps} />)
    expect(screen.getByText(/Serás redirigido a Stripe para completar el pago de forma segura/i)).toBeInTheDocument()
  })

  it('calculates monthly equivalent for yearly plan correctly', () => {
    render(
      <CheckoutDialog
        {...defaultProps}
        price={599000}
        interval="year"
      />
    )
    // 599000 / 12 / 100 = 499.17
    expect(screen.getByText(/€499\.17\/mes facturado anualmente/i)).toBeInTheDocument()
  })

  it('does not show monthly equivalent for monthly plan', () => {
    render(
      <CheckoutDialog
        {...defaultProps}
        price={29900}
        interval="month"
      />
    )
    expect(screen.queryByText(/facturado anualmente/i)).not.toBeInTheDocument()
  })
})
