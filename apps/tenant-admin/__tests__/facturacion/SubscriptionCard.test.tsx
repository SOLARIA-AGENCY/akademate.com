import { render, screen, fireEvent } from '@testing-library/react'
import { SubscriptionCard } from '../../app/(dashboard)/facturacion/components/SubscriptionCard'
import type { Subscription } from '../../../packages/types/src/index'

const mockSubscription: Subscription = {
  id: '1',
  tenantId: 'tenant-1',
  plan: 'pro',
  status: 'active',
  stripeSubscriptionId: 'sub_123',
  stripeCustomerId: 'cus_123',
  currentPeriodStart: new Date('2024-12-01'),
  currentPeriodEnd: new Date('2025-01-01'),
  cancelAtPeriodEnd: false,
  canceledAt: null,
  trialStart: null,
  trialEnd: null,
  metadata: {},
  createdAt: new Date('2024-12-01'),
  updatedAt: new Date('2024-12-01'),
}

describe('SubscriptionCard', () => {
  it('renders subscription details correctly', () => {
    render(<SubscriptionCard subscription={mockSubscription} />)

    expect(screen.getByText(/Plan Pro/i)).toBeInTheDocument()
    expect(screen.getByText(/Activa/i)).toBeInTheDocument()
  })

  it('renders no subscription state', () => {
    render(<SubscriptionCard subscription={null} />)

    expect(screen.getByText(/Sin Suscripción Activa/i)).toBeInTheDocument()
    expect(screen.getByText(/Ver Planes Disponibles/i)).toBeInTheDocument()
  })

  it('calls onUpgrade when upgrade button clicked', () => {
    const onUpgrade = jest.fn()
    render(<SubscriptionCard subscription={mockSubscription} onUpgrade={onUpgrade} />)

    const upgradeButton = screen.getByText(/Cambiar Plan/i)
    fireEvent.click(upgradeButton)

    expect(onUpgrade).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel when cancel button clicked', () => {
    const onCancel = jest.fn()
    render(<SubscriptionCard subscription={mockSubscription} onCancel={onCancel} />)

    const cancelButton = screen.getByText(/Cancelar Suscripción/i)
    fireEvent.click(cancelButton)

    expect(onCancel).toHaveBeenCalledTimes(1)
  })

  it('shows resume button when cancelAtPeriodEnd is true', () => {
    const canceledSubscription = {
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    }
    const onResume = jest.fn()

    render(<SubscriptionCard subscription={canceledSubscription} onResume={onResume} />)

    const resumeButton = screen.getByText(/Reanudar Suscripción/i)
    expect(resumeButton).toBeInTheDocument()

    fireEvent.click(resumeButton)
    expect(onResume).toHaveBeenCalledTimes(1)
  })

  it('shows past due alert', () => {
    const pastDueSubscription = {
      ...mockSubscription,
      status: 'past_due' as const,
    }

    render(<SubscriptionCard subscription={pastDueSubscription} />)

    expect(screen.getByText(/Pago Pendiente/i)).toBeInTheDocument()
    expect(screen.getByText(/Actualiza tu método de pago/i)).toBeInTheDocument()
  })

  it('shows cancellation scheduled alert', () => {
    const cancelingSubscription = {
      ...mockSubscription,
      cancelAtPeriodEnd: true,
    }

    render(<SubscriptionCard subscription={cancelingSubscription} />)

    expect(screen.getByText(/Cancelación Programada/i)).toBeInTheDocument()
  })
})
