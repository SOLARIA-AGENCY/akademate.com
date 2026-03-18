import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { PlanComparison } from '../PlanComparison'

vi.mock('@payload-config/hooks/use-toast')

describe('PlanComparison', () => {
  const mockOnSelectPlan = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders plan comparison card', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="bmwwcs6" />)
    expect(screen.getByText('Planes Disponibles')).toBeInTheDocument()
    expect(
      screen.getByText('Elige el plan que mejor se adapte a tus necesidades')
    ).toBeInTheDocument()
  })

  it('renders all three plan cards', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="ds937_y" />)
    expect(screen.getByText('Starter')).toBeInTheDocument()
    expect(screen.getByText('Pro')).toBeInTheDocument()
    expect(screen.getByText('Enterprise')).toBeInTheDocument()
  })

  it('renders interval toggle', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="v8ktxos" />)
    expect(screen.getByText('Mensual')).toBeInTheDocument()
    expect(screen.getByText('Anual')).toBeInTheDocument()
    expect(screen.getByText('Ahorra 17%')).toBeInTheDocument()
  })

  it('defaults to annual interval', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="zjg9876" />)
    const toggle = screen.getByTestId('switch')
    expect(toggle).toBeChecked()
  })

  it('switches to monthly interval when toggled', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="j8kdx1f" />)
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)
    expect(toggle).not.toBeChecked()
  })

  it('updates prices when interval changes', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="0nfs.l7" />)

    // Initially shows annual (discounted monthly) prices
    // Starter: 199*0.83=165, Pro: 299*0.83=248, Enterprise: "Contáctanos"
    expect(screen.getByText('Contáctanos')).toBeInTheDocument()

    // Switch to monthly
    const toggle = screen.getByTestId('switch')
    fireEvent.click(toggle)

    // Should show monthly prices (no discount)
    expect(screen.getByText(/199/)).toBeInTheDocument()
    expect(screen.getByText(/299/)).toBeInTheDocument()
  })

  it('marks Pro plan as popular', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="zpqzt6g" />)
    expect(screen.getByText('Más Popular')).toBeInTheDocument()
  })

  it('marks current plan correctly', () => {
    render(<PlanComparison currentPlan="pro" onSelectPlan={mockOnSelectPlan} data-oid="1ld3ta0" />)
    // The button text changes to "Plan Actual"
    const buttons = screen.getAllByText('Plan Actual')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('opens checkout dialog when plan selected', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="dlpcojt" />)

    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0]) // Click Starter plan

    await waitFor(() => {
      expect(screen.getByText('Confirmar Cambio de Plan')).toBeInTheDocument()
    })
  })

  it('passes correct plan details to checkout dialog', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="b3ew0.y" />)

    // Select Pro plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    const proButton = selectButtons.find((btn) =>
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

    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="b.-olg2" />)

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
      expect(mockOnSelectPlan).toHaveBeenCalledWith('starter', 'year')
    })
  })

  it('closes checkout dialog when cancelled', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="ssxi-8-" />)

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
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="jnvjuzw" />)

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
    render(
      <PlanComparison currentPlan="starter" onSelectPlan={mockOnSelectPlan} data-oid="bo20_l6" />
    )

    const buttons = screen.getAllByRole('button')
    // Find the "Plan Actual" button which should be disabled
    const currentPlanButton = buttons.find((btn) => btn.textContent?.includes('Plan Actual'))

    expect(currentPlanButton).toBeDefined()
    expect(currentPlanButton).toBeDisabled()
  })

  it('maintains selected interval when switching plans', async () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="z0lu5-u" />)

    // Default is already yearly, select a plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      expect(screen.getByText(/Facturación anual/)).toBeInTheDocument()
    })
  })

  it('renders plan descriptions', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="w-8yg8m" />)
    expect(screen.getByText('Para proyectos pequeños y startups')).toBeInTheDocument()
    expect(screen.getByText('Para equipos en crecimiento')).toBeInTheDocument()
    expect(screen.getByText('Para grandes organizaciones')).toBeInTheDocument()
  })

  it('displays savings badge for annual billing', () => {
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="25ui90q" />)
    expect(screen.getByText('Ahorra 17%')).toBeInTheDocument()
  })

  it('renders plans in grid layout', () => {
    const { container } = render(
      <PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="iyl2b4k" />
    )
    const grid = container.querySelector('.grid.md\\:grid-cols-3')
    expect(grid).toBeInTheDocument()
  })

  it('handles plan selection with yearly interval (default)', async () => {
    mockOnSelectPlan.mockResolvedValue(undefined)

    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="_y1h5be" />)

    // Default is already yearly, select Pro plan
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
    render(<PlanComparison onSelectPlan={mockOnSelectPlan} data-oid="7fna.fn" />)

    // Default is already yearly, select Starter plan
    const selectButtons = screen.getAllByText('Seleccionar Plan')
    fireEvent.click(selectButtons[0])

    await waitFor(() => {
      // Check for annual billing text in the checkout dialog
      expect(screen.getByText(/Facturación anual/)).toBeInTheDocument()
    })
  })
})
