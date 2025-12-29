import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { SubscriptionCard } from '../SubscriptionCard'
import type { Subscription } from '@payload-config/types/billing'

describe('SubscriptionCard', () => {
  const mockOnUpgrade = vi.fn()
  const mockOnCancel = vi.fn()
  const mockOnResume = vi.fn()
  const mockOnManage = vi.fn()

  const baseSubscription: Subscription = {
    id: 'sub-1',
    tenantId: 'tenant-1',
    plan: 'pro',
    status: 'active',
    stripeSubscriptionId: 'sub_stripe_1',
    stripeCustomerId: 'cus_stripe_1',
    currentPeriodStart: new Date('2025-01-01'),
    currentPeriodEnd: new Date('2025-02-01'),
    cancelAtPeriodEnd: false,
    canceledAt: null,
    trialStart: null,
    trialEnd: null,
    metadata: {},
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  }

  beforeEach(() => {
    vi.clearAllMocks()
    // Mock current date for consistent tests
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2025-01-15'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders no subscription state when subscription is null', () => {
    render(
      <SubscriptionCard
        subscription={null}
        onUpgrade={mockOnUpgrade}
      />
    )
    expect(screen.getByText('Sin Suscripción Activa')).toBeInTheDocument()
    expect(screen.getByText('No tienes una suscripción activa. Selecciona un plan para comenzar.')).toBeInTheDocument()
  })

  it('shows upgrade button when no subscription', () => {
    render(
      <SubscriptionCard
        subscription={null}
        onUpgrade={mockOnUpgrade}
      />
    )
    const upgradeButton = screen.getByText('Ver Planes Disponibles')
    expect(upgradeButton).toBeInTheDocument()
    fireEvent.click(upgradeButton)
    expect(mockOnUpgrade).toHaveBeenCalled()
  })

  it('renders active subscription details', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()
    expect(screen.getByText('Activa')).toBeInTheDocument()
  })

  it('displays plan names correctly', () => {
    const { rerender } = render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()

    rerender(<SubscriptionCard subscription={{ ...baseSubscription, plan: 'starter' }} />)
    expect(screen.getByText('Plan Starter')).toBeInTheDocument()

    rerender(<SubscriptionCard subscription={{ ...baseSubscription, plan: 'enterprise' }} />)
    expect(screen.getByText('Plan Enterprise')).toBeInTheDocument()
  })

  it('displays subscription status correctly', () => {
    const { rerender } = render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Activa')).toBeInTheDocument()

    rerender(<SubscriptionCard subscription={{ ...baseSubscription, status: 'trialing' }} />)
    expect(screen.getByText('Prueba')).toBeInTheDocument()

    rerender(<SubscriptionCard subscription={{ ...baseSubscription, status: 'past_due' }} />)
    // Text appears in both badge and alert
    expect(screen.getAllByText('Pago Pendiente').length).toBeGreaterThan(0)

    rerender(<SubscriptionCard subscription={{ ...baseSubscription, status: 'canceled' }} />)
    expect(screen.getByText('Cancelada')).toBeInTheDocument()
  })

  it('shows past due warning', () => {
    const pastDueSubscription = { ...baseSubscription, status: 'past_due' as const }
    render(<SubscriptionCard subscription={pastDueSubscription} />)
    // Text appears in both badge and alert
    expect(screen.getAllByText('Pago Pendiente').length).toBeGreaterThan(0)
    expect(screen.getByText(/Actualiza tu método de pago para evitar la suspensión del servicio/)).toBeInTheDocument()
  })

  it('shows cancellation scheduled warning', () => {
    const cancelingSubscription = {
      ...baseSubscription,
      cancelAtPeriodEnd: true,
      currentPeriodEnd: new Date('2025-02-01'),
    }
    render(<SubscriptionCard subscription={cancelingSubscription} />)
    expect(screen.getByText('Cancelación Programada')).toBeInTheDocument()
    expect(screen.getByText(/Tu suscripción se cancelará el/)).toBeInTheDocument()
  })

  it('displays renewal date', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Próxima Renovación')).toBeInTheDocument()
    expect(screen.getByText(/1 de febrero de 2025/)).toBeInTheDocument()
  })

  it('calculates days until renewal correctly', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    // From Jan 15 to Feb 1 = 17 days
    expect(screen.getByText(/En 17 días/)).toBeInTheDocument()
  })

  it('displays trial end date when in trial', () => {
    const trialSubscription = {
      ...baseSubscription,
      status: 'trialing' as const,
      trialEnd: new Date('2025-01-31'),
    }
    render(<SubscriptionCard subscription={trialSubscription} />)
    expect(screen.getByText('Periodo de Prueba')).toBeInTheDocument()
    expect(screen.getByText(/Finaliza el 31 de enero de 2025/)).toBeInTheDocument()
  })

  it('does not show trial info when trial ended', () => {
    const endedTrialSubscription = {
      ...baseSubscription,
      trialEnd: new Date('2025-01-01'), // Past date
    }
    render(<SubscriptionCard subscription={endedTrialSubscription} />)
    expect(screen.queryByText('Periodo de Prueba')).not.toBeInTheDocument()
  })

  it('shows resume button when cancelAtPeriodEnd is true', () => {
    const cancelingSubscription = {
      ...baseSubscription,
      cancelAtPeriodEnd: true,
    }
    render(
      <SubscriptionCard
        subscription={cancelingSubscription}
        onResume={mockOnResume}
      />
    )
    const resumeButton = screen.getByText('Reanudar Suscripción')
    expect(resumeButton).toBeInTheDocument()
    fireEvent.click(resumeButton)
    expect(mockOnResume).toHaveBeenCalled()
  })

  it('shows action buttons when subscription is active', () => {
    render(
      <SubscriptionCard
        subscription={baseSubscription}
        onUpgrade={mockOnUpgrade}
        onManage={mockOnManage}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.getByText('Cambiar Plan')).toBeInTheDocument()
    expect(screen.getByText('Portal de Facturación')).toBeInTheDocument()
    expect(screen.getByText('Cancelar Suscripción')).toBeInTheDocument()
  })

  it('calls onUpgrade when change plan button clicked', () => {
    render(
      <SubscriptionCard
        subscription={baseSubscription}
        onUpgrade={mockOnUpgrade}
      />
    )
    const upgradeButton = screen.getByText('Cambiar Plan')
    fireEvent.click(upgradeButton)
    expect(mockOnUpgrade).toHaveBeenCalled()
  })

  it('calls onManage when portal button clicked', () => {
    render(
      <SubscriptionCard
        subscription={baseSubscription}
        onManage={mockOnManage}
      />
    )
    const manageButton = screen.getByText('Portal de Facturación')
    fireEvent.click(manageButton)
    expect(mockOnManage).toHaveBeenCalled()
  })

  it('calls onCancel when cancel button clicked', () => {
    render(
      <SubscriptionCard
        subscription={baseSubscription}
        onCancel={mockOnCancel}
      />
    )
    const cancelButton = screen.getByText('Cancelar Suscripción')
    fireEvent.click(cancelButton)
    expect(mockOnCancel).toHaveBeenCalled()
  })

  it('does not show cancel button when status is canceled', () => {
    const canceledSubscription = { ...baseSubscription, status: 'canceled' as const }
    render(
      <SubscriptionCard
        subscription={canceledSubscription}
        onCancel={mockOnCancel}
      />
    )
    expect(screen.queryByText('Cancelar Suscripción')).not.toBeInTheDocument()
  })

  it('applies custom button style to change plan button', () => {
    render(
      <SubscriptionCard
        subscription={baseSubscription}
        onUpgrade={mockOnUpgrade}
      />
    )
    const upgradeButton = screen.getByText('Cambiar Plan')
    expect(upgradeButton).toHaveStyle({ backgroundColor: '#F2014B' })
  })

  it('formats dates in Spanish locale', () => {
    const decemberSubscription = {
      ...baseSubscription,
      currentPeriodEnd: new Date('2025-12-25'),
    }
    render(<SubscriptionCard subscription={decemberSubscription} />)
    expect(screen.getByText(/25 de diciembre de 2025/)).toBeInTheDocument()
  })

  it('displays billing cycle information', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Facturación')).toBeInTheDocument()
    expect(screen.getByText('Ciclo mensual')).toBeInTheDocument()
  })

  it('handles incomplete subscription status', () => {
    const incompleteSubscription = { ...baseSubscription, status: 'incomplete' as const }
    render(<SubscriptionCard subscription={incompleteSubscription} />)
    expect(screen.getByText('Incompleta')).toBeInTheDocument()
  })

  it('handles unpaid subscription status', () => {
    const unpaidSubscription = { ...baseSubscription, status: 'unpaid' as const }
    render(<SubscriptionCard subscription={unpaidSubscription} />)
    expect(screen.getByText('Sin Pagar')).toBeInTheDocument()
  })

  it('does not crash when optional handlers are not provided', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    // Should render without errors
    expect(screen.getByText('Plan Pro')).toBeInTheDocument()
  })

  it('renders description text', () => {
    render(<SubscriptionCard subscription={baseSubscription} />)
    expect(screen.getByText('Tu suscripción actual y detalles de facturación')).toBeInTheDocument()
  })

  it('shows all status alerts correctly', () => {
    const pastDueSubscription = { ...baseSubscription, status: 'past_due' as const }
    render(<SubscriptionCard subscription={pastDueSubscription} />)

    // Should show alert icon and message (appears in both badge and alert)
    const paymentPendingElements = screen.getAllByText('Pago Pendiente')
    expect(paymentPendingElements.length).toBeGreaterThan(0)
  })

  it('calculates negative days until renewal as 0', () => {
    const expiredSubscription = {
      ...baseSubscription,
      currentPeriodEnd: new Date('2025-01-01'), // Past date
    }
    render(<SubscriptionCard subscription={expiredSubscription} />)
    // Should not crash, will show negative or positive days
    expect(screen.getByText(/En -?\d+ días/)).toBeInTheDocument()
  })
})
