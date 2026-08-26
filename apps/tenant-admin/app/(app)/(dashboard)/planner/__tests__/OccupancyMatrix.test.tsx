import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { OccupancyMatrix, PLANNER_EMPTY_AULAS_COPY } from '../OccupancyMatrix'

const aula = {
  id: 'aula-1',
  name: 'Aula 1',
  campusId: 'sede-1',
  capacity: 20,
}

const card = {
  id: 'run-1',
  curso: 'Curso de ejemplo',
  tipo: 'privado',
  sedeId: 'sede-1',
  horario: 'LUN, MIE · 09:00-13:00',
  dias: ['monday', 'wednesday'],
  horaInicio: '09:00:00',
  horaFin: '13:00:00',
  aulaId: 'aula-1',
  turno: 'morning',
  plazas: 20,
  estado: 'published',
}

describe('OccupancyMatrix', () => {
  it('renders shifts as rows and aulas as columns', () => {
    render(
      <OccupancyMatrix
        aulas={[aula]}
        cards={[card]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />
    )

    expect(screen.getByTestId('planner-occupancy-matrix')).toBeInTheDocument()
    expect(screen.getByRole('table', { name: 'Ocupación por turno y aula' })).toBeInTheDocument()
    expect(screen.getByTestId('planner-shift-row-morning')).toBeInTheDocument()
    expect(screen.getByTestId('planner-shift-row-afternoon')).toBeInTheDocument()
    expect(screen.getByTestId('planner-shift-row-evening_extra')).toBeInTheDocument()
    expect(screen.getByTestId('planner-room-col-aula-1')).toBeInTheDocument()
    expect(screen.queryByTestId('planner-room-row-aula-1')).not.toBeInTheDocument()
    expect(screen.getByText('Mañana')).toBeInTheDocument()
    expect(screen.getByText('Tarde')).toBeInTheDocument()
    expect(screen.getByText('Tercer turno')).toBeInTheDocument()
    expect(screen.getByText('Curso de ejemplo')).toBeInTheDocument()
    expect(screen.queryByText(PLANNER_EMPTY_AULAS_COPY)).not.toBeInTheDocument()
  })

  it('keeps aula name and capacity on one header line', () => {
    render(
      <OccupancyMatrix
        aulas={[aula]}
        cards={[card]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />
    )

    const header = screen.getByTestId('planner-room-col-aula-1')
    expect(header.textContent).toMatch(/Aula 1/)
    expect(header.textContent).toMatch(/20 plazas/)
    expect(header.querySelector('span.flex')?.className).toContain('items-center')
    expect(header.innerHTML).not.toContain('mt-1 text-muted-foreground')
  })

  it('nests the matrix on a contrasting card surface', () => {
    render(
      <OccupancyMatrix
        aulas={[aula]}
        cards={[card]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />
    )

    const table = screen.getByRole('table', { name: 'Ocupación por turno y aula' })
    const headerRow = table.querySelector('[role="row"]')
    expect(table.className).toContain('bg-surface')
    expect(table.className).toContain('border-border')
    expect(table.className).not.toContain('bg-muted/40')
    expect(table.className).not.toContain('bg-muted/20')
    expect(headerRow?.className).toContain('bg-muted')
  })

  it('shows an honest empty state inside the region when the campus has 0 aulas', () => {
    render(
      <OccupancyMatrix aulas={[]} cards={[]} sedeFilter="sede-1" sedeName="Centro" />
    )

    expect(screen.getByTestId('planner-empty-aulas')).toBeInTheDocument()
    expect(screen.getByText(PLANNER_EMPTY_AULAS_COPY)).toBeInTheDocument()
    expect(screen.queryByTestId('planner-occupancy-matrix')).not.toBeInTheDocument()
  })

  it('schedule text is not clipped — occupancy cell has no fixed min-height', () => {
    render(
      <OccupancyMatrix
        aulas={[aula]}
        cards={[{ ...card, curso: 'Técnico en Sistemas Microinformáticos y Redes' }]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />
    )

    const cell = screen.getByTestId('planner-cell-aula-1-morning')
    expect(cell.className).not.toContain('min-h-[84px]')
    const cardButton = cell.querySelector('button[aria-label]')
    expect(cardButton?.className).toContain('h-auto')
    expect(cardButton?.className).not.toContain('min-h-16')
    expect(cardButton?.className).not.toContain('w-1.5')
  })

  it('does not treat aulas from another campus as occupancy for the selected sede', () => {
    render(
      <OccupancyMatrix
        aulas={[{ ...aula, campusId: 'otra' }]}
        cards={[card]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />
    )

    expect(screen.getByText(PLANNER_EMPTY_AULAS_COPY)).toBeInTheDocument()
    expect(screen.queryByText('Aula 1')).not.toBeInTheDocument()
  })

  it('hides a convocatoria on days it does not run instead of fading it', async () => {
    const { default: userEvent } = await import('@testing-library/user-event')
    const user = userEvent.setup()
    render(
      <OccupancyMatrix
        aulas={[aula]}
        cards={[card]}
        sedeFilter="sede-1"
        sedeName="Centro"
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Martes' }))
    expect(screen.queryByText('Curso de ejemplo')).not.toBeInTheDocument()
    expect(screen.getByTestId('planner-cell-aula-1-morning')).toHaveTextContent('Libre')

    await user.click(screen.getByRole('tab', { name: 'Lunes' }))
    expect(screen.getByText('Curso de ejemplo')).toBeInTheDocument()
    const cell = screen.getByTestId('planner-cell-aula-1-morning')
    expect(cell.querySelector('button')?.className).not.toContain('opacity-40')
  })
})
