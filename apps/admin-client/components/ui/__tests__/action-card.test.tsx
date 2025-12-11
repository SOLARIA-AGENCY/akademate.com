import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { ActionCard } from '../action-card'
import { UserPlus } from 'lucide-react'

describe('ActionCard', () => {
  it('renders title and description', () => {
    render(
      <ActionCard
        title="New Feature"
        description="This is a new feature description"
      />
    )

    expect(screen.getByText('New Feature')).toBeInTheDocument()
    expect(screen.getByText('This is a new feature description')).toBeInTheDocument()
  })

  it('renders icon when provided', () => {
    render(
      <ActionCard
        title="Add User"
        description="Create a new user"
        icon={<UserPlus data-testid="user-plus-icon" />}
      />
    )

    expect(screen.getByTestId('user-plus-icon')).toBeInTheDocument()
  })

  it('renders as link when href is provided', () => {
    render(
      <ActionCard
        title="Go to Dashboard"
        description="Navigate to dashboard"
        href="/dashboard"
      />
    )

    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/dashboard')
  })

  it('renders badge when provided', () => {
    render(
      <ActionCard
        title="Notifications"
        description="You have new notifications"
        badge={{ text: '3 new', variant: 'warning' }}
      />
    )

    expect(screen.getByText('3 new')).toBeInTheDocument()
  })

  it('renders action button when provided without href', () => {
    const handleClick = vi.fn()

    render(
      <ActionCard
        title="Action Card"
        description="Click the button"
        action={{ label: 'Click me', onClick: handleClick }}
      />
    )

    const button = screen.getByText('Click me')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalledTimes(1)
  })

  it('applies gradient variant correctly', () => {
    const { container } = render(
      <ActionCard
        title="Gradient Card"
        description="This is a gradient card"
        variant="gradient"
      />
    )

    expect(container.firstChild).toHaveClass('action-card-gradient')
  })

  it('applies warning variant correctly', () => {
    const { container } = render(
      <ActionCard
        title="Warning Card"
        description="This is a warning"
        variant="warning"
      />
    )

    expect(container.firstChild).toHaveClass('action-card-warning')
  })

  it('applies danger variant correctly', () => {
    const { container } = render(
      <ActionCard
        title="Danger Card"
        description="This is dangerous"
        variant="danger"
      />
    )

    expect(container.firstChild).toHaveClass('action-card-danger')
  })

  it('renders loading state with skeleton', () => {
    const { container } = render(
      <ActionCard
        title="Loading"
        description="Loading..."
        loading
      />
    )

    expect(container.querySelector('.skeleton-text')).toBeInTheDocument()
  })

  it('applies custom className', () => {
    const { container } = render(
      <ActionCard
        title="Custom"
        description="Custom class"
        className="my-custom-class"
      />
    )

    expect(container.firstChild).toHaveClass('my-custom-class')
  })
})
