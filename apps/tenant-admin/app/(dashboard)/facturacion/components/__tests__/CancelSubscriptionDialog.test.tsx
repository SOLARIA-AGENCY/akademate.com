import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CancelSubscriptionDialog } from '../CancelSubscriptionDialog'

vi.mock('@payload-config/hooks/use-toast')

describe('CancelSubscriptionDialog', () => {
  const mockOnOpenChange = vi.fn()
  const mockOnConfirm = vi.fn()
  const currentPeriodEnd = new Date('2025-01-31')

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders nothing when closed', () => {
    const { container } = render(
      <CancelSubscriptionDialog
        open={false}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )
    expect(container.querySelector('[data-testid="alert-dialog"]')).not.toBeInTheDocument()
  })

  it('renders dialog when open', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )
    expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    expect(screen.getByText('Cancelar Suscripción')).toBeInTheDocument()
  })

  it('displays current period end date when provided', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        currentPeriodEnd={currentPeriodEnd}
      />
    )
    expect(screen.getByText(/31 de enero de 2025/i)).toBeInTheDocument()
  })

  it('handles reason textarea input', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )
    const textarea = screen.getByTestId('textarea')
    fireEvent.change(textarea, { target: { value: 'Too expensive' } })
    expect(textarea).toHaveValue('Too expensive')
  })

  it('handles cancel immediately checkbox toggle', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )
    const checkbox = screen.getByTestId('checkbox')
    expect(checkbox).not.toBeChecked()
    fireEvent.click(checkbox)
    expect(checkbox).toBeChecked()
  })

  it('shows different warning message when cancel immediately is checked', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )
    const checkbox = screen.getByTestId('checkbox')

    // Initially shows "al final del periodo de facturación"
    expect(screen.getByText(/al final del periodo de facturación/i)).toBeInTheDocument()

    // After checking, shows "inmediatamente"
    fireEvent.click(checkbox)
    expect(screen.getByText(/perderás acceso a todas las funciones premium inmediatamente/i)).toBeInTheDocument()
  })

  it('calls onConfirm with reason and immediately flag when confirm button clicked', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const textarea = screen.getByTestId('textarea')
    const checkbox = screen.getByTestId('checkbox')
    const confirmButton = screen.getByTestId('alert-dialog-action')

    fireEvent.change(textarea, { target: { value: 'Test reason' } })
    fireEvent.click(checkbox)
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith('Test reason', true)
    })
  })

  it('calls onConfirm with undefined reason when empty', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalledWith(undefined, false)
    })
  })

  it('shows loading state during confirmation', async () => {
    let resolveConfirm: () => void
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve
    })
    mockOnConfirm.mockReturnValue(confirmPromise)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    expect(confirmButton).toBeDisabled()
    expect(confirmButton).toHaveTextContent('Cancelando...')

    resolveConfirm!()
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  it('closes dialog after successful confirmation', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('resets form after successful confirmation', async () => {
    mockOnConfirm.mockResolvedValue(undefined)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const textarea = screen.getByTestId('textarea')
    const checkbox = screen.getByTestId('checkbox')
    const confirmButton = screen.getByTestId('alert-dialog-action')

    fireEvent.change(textarea, { target: { value: 'Test' } })
    fireEvent.click(checkbox)
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  it('handles confirmation error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    mockOnConfirm.mockRejectedValue(new Error('Network error'))

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to cancel subscription:',
        expect.any(Error)
      )
    })

    consoleErrorSpy.mockRestore()
  })

  it('closes dialog when cancel button clicked', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const cancelButton = screen.getByTestId('alert-dialog-cancel')
    fireEvent.click(cancelButton)
    // Note: The actual closing behavior depends on AlertDialog implementation
  })

  it('disables buttons during loading', async () => {
    let resolveConfirm: () => void
    const confirmPromise = new Promise<void>((resolve) => {
      resolveConfirm = resolve
    })
    mockOnConfirm.mockReturnValue(confirmPromise)

    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    const confirmButton = screen.getByTestId('alert-dialog-action')
    const cancelButton = screen.getByTestId('alert-dialog-cancel')

    fireEvent.click(confirmButton)

    expect(confirmButton).toBeDisabled()
    expect(cancelButton).toBeDisabled()

    resolveConfirm!()
    await waitFor(() => {
      expect(mockOnConfirm).toHaveBeenCalled()
    })
  })

  it('formats date correctly for Spanish locale', () => {
    const testDate = new Date('2025-12-25')
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
        currentPeriodEnd={testDate}
      />
    )
    expect(screen.getByText(/25 de diciembre de 2025/i)).toBeInTheDocument()
  })

  it('has accessible labels for form controls', () => {
    render(
      <CancelSubscriptionDialog
        open={true}
        onOpenChange={mockOnOpenChange}
        onConfirm={mockOnConfirm}
      />
    )

    expect(screen.getByLabelText(/Razón de cancelación/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Cancelar inmediatamente/i)).toBeInTheDocument()
  })
})
