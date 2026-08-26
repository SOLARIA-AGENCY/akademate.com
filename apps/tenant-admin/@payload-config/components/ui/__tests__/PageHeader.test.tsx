import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { PageHeader } from '../PageHeader'

describe('PageHeader', () => {
  it('renders the description that used to be discarded', () => {
    render(
      <PageHeader
        title="Convocatorias"
        description="Consulta convocatorias por sede, tipo y matrícula."
      />
    )
    expect(screen.getByRole('heading', { name: 'Convocatorias' })).toBeInTheDocument()
    expect(
      screen.getByText('Consulta convocatorias por sede, tipo y matrícula.')
    ).toBeInTheDocument()
  })

  it('renders an optional badge next to the title', () => {
    render(<PageHeader title="Finanzas" badge={<span>Modo seguro</span>} />)
    expect(screen.getByText('Modo seguro')).toBeInTheDocument()
  })

  it('keeps header actions on a single row', () => {
    const { container } = render(
      <PageHeader
        title="Profesor"
        actions={
          <>
            <button type="button">Baja temporal</button>
            <button type="button">Dar de baja</button>
          </>
        }
      />,
    )
    const actions = container.querySelector('[data-slot="page-header-actions"]')
    expect(actions?.className).toContain('flex-nowrap')
    expect(actions?.className).not.toContain('flex-wrap')
    expect(actions?.className).not.toContain('max-w-md')
  })
})
