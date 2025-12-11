import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { KPICard } from '../kpi-card'
import { Users } from 'lucide-react'

describe('KPICard', () => {
  it('renders label and value correctly', () => {
    render(<KPICard label="Total Users" value={150} />)

    expect(screen.getByText('Total Users')).toBeInTheDocument()
    expect(screen.getByText('150')).toBeInTheDocument()
  })

  it('renders with string value', () => {
    render(<KPICard label="Revenue" value="$1,234" />)

    expect(screen.getByText('Revenue')).toBeInTheDocument()
    expect(screen.getByText('$1,234')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <KPICard
        label="Users"
        value={100}
        icon={<Users data-testid="users-icon" className="h-5 w-5" />}
      />
    )

    expect(screen.getByTestId('users-icon')).toBeInTheDocument()
  })

  it('renders trend with up direction', () => {
    render(
      <KPICard
        label="Growth"
        value={100}
        trend={{ value: 12, direction: 'up', label: 'vs last month' }}
      />
    )

    expect(screen.getByText('+12%')).toBeInTheDocument()
    expect(screen.getByText('vs last month')).toBeInTheDocument()
  })

  it('renders trend with down direction', () => {
    render(
      <KPICard
        label="Churn"
        value={5}
        trend={{ value: -8, direction: 'down' }}
      />
    )

    expect(screen.getByText('-8%')).toBeInTheDocument()
  })

  it('renders trend with neutral direction', () => {
    render(
      <KPICard
        label="Stable"
        value={50}
        trend={{ value: 0, direction: 'neutral' }}
      />
    )

    expect(screen.getByText('0%')).toBeInTheDocument()
  })

  it('applies variant classes correctly', () => {
    const { container } = render(
      <KPICard label="Active" value={10} variant="success" />
    )

    expect(container.firstChild).toHaveClass('border-l-success')
  })

  it('renders loading state with skeleton', () => {
    const { container } = render(
      <KPICard label="Loading" value={0} loading />
    )

    expect(container.querySelector('.skeleton-text')).toBeInTheDocument()
    expect(container.querySelector('.skeleton-title')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <KPICard label="Custom" value={1} className="custom-class" />
    )

    expect(container.firstChild).toHaveClass('custom-class')
  })
})
