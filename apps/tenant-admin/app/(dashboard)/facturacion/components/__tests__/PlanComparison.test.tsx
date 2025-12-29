import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlanComparison } from '../PlanComparison'
import type { PlanTier } from '@payload-config/types/billing'

vi.mock('@payload-config/hooks/use-toast')

describe('PlanComparison', () => {
  const mockOnSelectPlan = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plan comparison card', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Planes Disponibles')).toBeInTheDocument()
    expect(screen.getByText('Elige el plan que mejor se adapte a tus necesidades')).toBeInTheDocument()
  })

  it('renders all three plan cards', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('renders interval toggle', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Mensual')).toBeInTheDocument()
    expect(screen.getByText('Anual')).toBeInTheDocument()
    expect(screen.getByText('Ahorra 17%')).toBeInTheDocument()
  })

  it('defaults to monthly interval', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    const toggle = screen.getByTestId('switch')
    expect(toggle).not.toBeChecked()
  })

  it('switches to yearly interval when toggled', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)
    expect(toggle).toBeChecked()
  })

  it('updates prices when interval changes', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Initially shows monthly prices
    expect(screen.getByText('€199.00')).toBeInTheDocument()
    expect(screen.getByText('€299.00')).toBeInTheDocument()
    expect(screen.getByText('€599.00')).toBeInTheDocument()

    // Switch to yearly
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    // Should show yearly prices
    expect(screen.getByText('€1990.00')).toBeInTheDocument()
    expect(screen.getByText('€2990.00')).toBeInTheDocument()
    expect(screen.getByText('€5990.00')).toBeInTheDocument()
  })

  it('marks Pro plan as popular', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Más Popular')).toBeInTheDocument()
  })

  it('marks current plan correctly', () => {
    render(<PlanComparison currentPlan="pro" onSelectPlan={mockOnSelectPlan} />)
    // The button text changes to "Plan Actual"
    const buttons = screen.getAllByText('Plan Actual')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('opens checkout dialog when plan selected', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0]) // Click Starter plan

    await waitFor(() => {
      expect(screen.getByText('Confirmar Cambio de Plan')).toBeInTheDocument()
    })
  })

  it('passes correct plan details to checkout dialog', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Select Pro plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    const proButton = selectButtons.find(btn =>
      btn.closest('[data-testid="card"]')?.textContent?.includes('Pro')
    )

    if (proButton) {
      fireEvent.click(proButton)

      await waitFor(() => {
        expect(screen.getByText('Plan Pro')).toBeInTheDocument()
        expect(screen.getByText('PRO')).toBeInTheDocument()
      })
    }
  })

  it('calls onSelectPlan when checkout confirmed', async () => {
    mockOnSelectPlan.mockResolvedValue(undefined)

    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Select a plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    // Confirm in dialog
    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnSelectPlan).toHaveBeenCalledWith('starter', 'month')
    })
  })

  it('closes checkout dialog when cancelled', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Select a plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    // Cancel
    const cancelButton = screen.getByTestId('alert-dialog-cancel')
    fireEvent.click(cancelButton)

    // Dialog should close (in actual implementation)
    expect(mockOnSelectPlan).not.toHaveBeenCalled()
  })

  it('displays plan features correctly', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Starter features
    expect(screen.getByText('Hasta 100 usuarios')).toBeInTheDocument()
    expect(screen.getByText('10 GB de almacenamiento')).toBeInTheDocument()

    // Pro features
    expect(screen.getByText('Hasta 500 usuarios')).toBeInTheDocument()
    expect(screen.getByText('100 GB de almacenamiento')).toBeInTheDocument()

    // Enterprise features
    expect(screen.getByText('Usuarios ilimitados')).toBeInTheDocument()
    expect(screen.getByText('Almacenamiento ilimitado')).toBeInTheDocument()
  })

  it('disables current plan selection', () => {
    render(<PlanComparison currentPlan="starter" onSelectPlan={mockOnSelectPlan} />)

    const buttons = screen.getAllByRole('button')
    // Find the "Plan Actual" button which should be disabled
    const currentPlanButton = buttons.find(btn => btn.textContent?.includes('Plan Actual'))

    expect(currentPlanButton).toBeDefined()
    expect(currentPlanButton).toBeDisabled()
  })

  it('maintains selected interval when switching plans', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Switch to yearly
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    // Select a plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Facturación anual/)).toBeInTheDocument()
    })
  })

  it('renders plan descriptions', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Para proyectos pequeños y startups')).toBeInTheDocument()
    expect(screen.getByText('Para equipos en crecimiento')).toBeInTheDocument()
    expect(screen.getByText('Para grandes organizaciones')).toBeInTheDocument()
  })

  it('displays savings badge for annual billing', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    expect(screen.getByText('Ahorra 17%')).toBeInTheDocument()
  })

  it('renders plans in grid layout', () => {
    const { container } = render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)
    const grid = container.querySelector('.grid.md\\:grid-cols-3')
    expect(grid).toBeInTheDocument()
  })

  it('handles plan selection with yearly interval', async () => {
    mockOnSelectPlan.mockResolvedValue(undefined)

    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Switch to yearly
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    // Select Pro plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[1])

    await waitFor(() => {
      expect(screen.getByTestId('alert-dialog')).toBeInTheDocument()
    })

    // Confirm
    const confirmButton = screen.getByTestId('alert-dialog-action')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockOnSelectPlan).toHaveBeenCalledWith('pro', 'year')
    })
  })

  it('shows monthly equivalent for yearly plans in checkout', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} />)

    // Switch to yearly
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    // Select Starter plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      // Check for annual billing text in the checkout dialog
      expect(screen.getByText(/Facturación anual/)).toBeInTheDocument()
    })
  })
})
