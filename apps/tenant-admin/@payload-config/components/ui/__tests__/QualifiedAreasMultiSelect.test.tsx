import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { QualifiedAreasMultiSelect } from '../QualifiedAreasMultiSelect'

const areas = [
  { id: 1, nombre: 'Área Empresa, Administración y Gestión' },
  { id: 2, nombre: 'Área Idiomas y Competencias Lingüísticas' },
  { id: 3, nombre: 'Área Salud, Bienestar y Deporte' },
]

describe('QualifiedAreasMultiSelect', () => {
  it('shows a dropdown trigger and full selected area badges', () => {
    render(
      <QualifiedAreasMultiSelect areas={areas} selectedAreaIds={[1, 2]} onToggleArea={() => {}} />
    )

    expect(screen.getByRole('button', { name: /2 áreas seleccionadas/i })).toBeInTheDocument()
    expect(screen.getByText('Área Empresa, Administración y Gestión')).toBeInTheDocument()
    expect(screen.getByText('Área Idiomas y Competencias Lingüísticas')).toBeInTheDocument()
  })

  it('keeps all active areas available as checkbox dropdown options', async () => {
    const user = userEvent.setup()
    render(
      <QualifiedAreasMultiSelect areas={areas} selectedAreaIds={[2]} onToggleArea={() => {}} />
    )

    await user.click(screen.getByRole('button', { name: /1 áreas seleccionadas/i }))

    const options = screen.getAllByRole('menuitemcheckbox')
    expect(options).toHaveLength(3)
    expect(options[1]).toHaveAttribute('aria-checked', 'true')
    expect(screen.getByText('Área Salud, Bienestar y Deporte')).toBeInTheDocument()
  })

  it('toggles areas from both dropdown options and selected badges', async () => {
    const user = userEvent.setup()
    const onToggleArea = vi.fn()
    render(
      <QualifiedAreasMultiSelect areas={areas} selectedAreaIds={[2]} onToggleArea={onToggleArea} />
    )

    await user.click(
      screen.getByRole('button', { name: 'Quitar Área Idiomas y Competencias Lingüísticas' })
    )
    await user.click(screen.getByRole('button', { name: /1 áreas seleccionadas/i }))
    await user.click(screen.getByText('Área Salud, Bienestar y Deporte'))

    expect(onToggleArea).toHaveBeenNthCalledWith(1, 2)
    expect(onToggleArea).toHaveBeenNthCalledWith(2, 3)
  })
})
