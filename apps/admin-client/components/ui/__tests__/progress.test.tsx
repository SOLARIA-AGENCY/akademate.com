import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Progress } from '../progress'

describe('Progress', () => {
  it('renders progress bar with correct percentage', () => {
    const { container } = render(<Progress value={50} />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveStyle({ width: '50%' })
  })

  it('renders with max value other than 100', () => {
    const { container } = render(<Progress value={25} max={50} />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveStyle({ width: '50%' })
  })

  it('clamps value to 0-100 range', () => {
    const { container: container1 } = render(<Progress value={-10} />)
    const fill1 = container1.querySelector('.progress-bar-fill')
    expect(fill1).toHaveStyle({ width: '0%' })

    const { container: container2 } = render(<Progress value={150} />)
    const fill2 = container2.querySelector('.progress-bar-fill')
    expect(fill2).toHaveStyle({ width: '100%' })
  })

  it('shows label when showLabel is true', () => {
    render(<Progress value={75} showLabel />)

    expect(screen.getByText('75%')).toBeInTheDocument()
  })

  it('shows custom label', () => {
    render(<Progress value={50} label="Upload Progress" />)

    expect(screen.getByText('Upload Progress')).toBeInTheDocument()
  })

  it('shows both custom label and percentage', () => {
    render(<Progress value={60} label="Download" showLabel />)

    expect(screen.getByText('Download')).toBeInTheDocument()
    expect(screen.getByText('60%')).toBeInTheDocument()
  })

  it('applies default variant class', () => {
    const { container } = render(<Progress value={50} />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveClass('bg-primary')
  })

  it('applies success variant class', () => {
    const { container } = render(<Progress value={50} variant="success" />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveClass('bg-success')
  })

  it('applies warning variant class', () => {
    const { container } = render(<Progress value={50} variant="warning" />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveClass('bg-warning')
  })

  it('applies danger variant class', () => {
    const { container } = render(<Progress value={50} variant="danger" />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveClass('bg-destructive')
  })

  it('applies gradient variant class', () => {
    const { container } = render(<Progress value={50} variant="gradient" />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveClass('bg-gradient-to-r')
  })

  it('applies small size class', () => {
    const { container } = render(<Progress value={50} size="sm" />)

    const bar = container.querySelector('.progress-bar')
    expect(bar).toHaveClass('h-1.5')
  })

  it('applies medium size class by default', () => {
    const { container } = render(<Progress value={50} />)

    const bar = container.querySelector('.progress-bar')
    expect(bar).toHaveClass('h-2')
  })

  it('applies large size class', () => {
    const { container } = render(<Progress value={50} size="lg" />)

    const bar = container.querySelector('.progress-bar')
    expect(bar).toHaveClass('h-3')
  })

  it('has correct aria attributes', () => {
    const { container } = render(<Progress value={75} max={100} />)

    const fill = container.querySelector('.progress-bar-fill')
    expect(fill).toHaveAttribute('role', 'progressbar')
    expect(fill).toHaveAttribute('aria-valuenow', '75')
    expect(fill).toHaveAttribute('aria-valuemin', '0')
    expect(fill).toHaveAttribute('aria-valuemax', '100')
  })

  it('applies custom className', () => {
    const { container } = render(
      <Progress value={50} className="custom-progress" />
    )

    expect(container.firstChild).toHaveClass('custom-progress')
  })
})
