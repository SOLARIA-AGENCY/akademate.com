import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CalendarDays } from 'lucide-react'
import { SegmentedToggle } from '../SegmentedToggle'
import { ViewToggle } from '../ViewToggle'

describe('SegmentedToggle', () => {
  it('marks the active option with CEP primary state classes', () => {
    render(
      <SegmentedToggle
        value="week"
        ariaLabel="Vista"
        onValueChange={() => undefined}
        options={[
          { value: 'month', label: 'Mes' },
          { value: 'week', label: 'Semana', icon: CalendarDays },
        ]}
      />
    )

    const activeOption = screen.getByRole('radio', { name: 'Semana' })

    expect(activeOption).toHaveAttribute('data-state', 'on')
    expect(activeOption).toHaveClass('data-[state=on]:bg-primary')
    expect(activeOption).toHaveClass('focus-visible:ring-primary')
  })

  it('emits the selected option and ignores empty Radix values', async () => {
    const user = userEvent.setup()
    const onValueChange = vi.fn()

    render(
      <SegmentedToggle
        value="month"
        ariaLabel="Vista"
        onValueChange={onValueChange}
        options={[
          { value: 'month', label: 'Mes' },
          { value: 'week', label: 'Semana' },
        ]}
      />
    )

    await user.click(screen.getByRole('radio', { name: 'Semana' }))

    expect(onValueChange).toHaveBeenCalledWith('week')
  })
})

describe('ViewToggle', () => {
  it('uses the shared segmented toggle for grid and list views', async () => {
    const user = userEvent.setup()
    const onViewChange = vi.fn()

    render(<ViewToggle view="grid" onViewChange={onViewChange} />)

    expect(screen.getByRole('radio', { name: 'Vista en cuadrícula' })).toHaveClass(
      'data-[state=on]:bg-primary'
    )
    expect(screen.queryByText('Vista en cuadrícula')).not.toBeInTheDocument()
    expect(screen.queryByText('Vista de lista')).not.toBeInTheDocument()
    await user.click(screen.getByRole('radio', { name: 'Vista de lista' }))

    expect(onViewChange).toHaveBeenCalledWith('list')
  })
})
