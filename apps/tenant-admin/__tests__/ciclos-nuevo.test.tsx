import { render, screen, fireEvent } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import NuevoCicloPage from '@/app/(app)/(dashboard)/ciclos/nuevo/page'

describe('NuevoCicloPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders page title "Nuevo Ciclo Formativo"', () => {
    render(<NuevoCicloPage />)
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Nuevo Ciclo Formativo')
  })

  it('renders all 10 tab buttons', () => {
    render(<NuevoCicloPage />)
    const expectedTabs = [
      'Datos Basicos',
      'Duracion y Modalidad',
      'Requisitos',
      'Modulos',
      'Salidas Profesionales',
      'Competencias',
      'Precios',
      'Becas y Subvenciones',
      'Continuidad y Documentos',
      'Caracteristicas',
    ]
    // All tab labels appear as buttons in the tab navigation
    const tabButtons = screen.getAllByRole('button').filter((btn) =>
      expectedTabs.some((label) => btn.textContent?.includes(label)),
    )
    expect(tabButtons.length).toBeGreaterThanOrEqual(10)
  })

  it('default tab is "Datos Basicos"', () => {
    render(<NuevoCicloPage />)
    // Mobile and desktop render duplicated tab navigation in tests.
    expect(screen.getAllByRole('button', { name: /Datos Basicos/i }).length).toBeGreaterThan(0)
    // The name input from the basicos tab should be visible
    expect(screen.getByLabelText(/Nombre del Ciclo/)).toBeInTheDocument()
  })

  it('switching tabs shows corresponding content', () => {
    render(<NuevoCicloPage />)

    // Initially, "Datos Basicos" content is shown
    expect(screen.getByLabelText(/Nombre del Ciclo/)).toBeInTheDocument()

    // Click on "Duracion y Modalidad" tab
    fireEvent.click(screen.getAllByRole('button', { name: /Duracion y Modalidad/i })[0])
    expect(screen.getByLabelText(/Horas Totales/)).toBeInTheDocument()
    // "Datos Basicos" content should no longer be visible
    expect(screen.queryByLabelText(/Nombre del Ciclo/)).not.toBeInTheDocument()

    // Click on "Requisitos" tab
    fireEvent.click(screen.getAllByRole('button', { name: /Requisitos/i })[0])
    expect(screen.getByText(/No hay requisitos definidos/)).toBeInTheDocument()

    // Click on "Modulos" tab
    fireEvent.click(screen.getAllByRole('button', { name: /Modulos/i })[0])
    expect(screen.getByText(/No hay modulos definidos/)).toBeInTheDocument()
  })

  it('name input is required', () => {
    render(<NuevoCicloPage />)
    const nameInput = screen.getByLabelText(/Nombre del Ciclo/)
    expect(nameInput).toHaveAttribute('required')
  })

  it('submit button is disabled when name is empty', () => {
    render(<NuevoCicloPage />)
    const submitButton = screen.getByRole('button', { name: /Crear Ciclo/ })
    expect(submitButton).toBeDisabled()
  })

  it('submit button is enabled when name is filled', () => {
    render(<NuevoCicloPage />)
    const nameInput = screen.getByLabelText(/Nombre del Ciclo/)
    fireEvent.change(nameInput, { target: { value: 'Desarrollo Web' } })
    const submitButton = screen.getByRole('button', { name: /Crear Ciclo/ })
    expect(submitButton).toBeEnabled()
  })

  it('renders image upload section', () => {
    render(<NuevoCicloPage />)
    // Label is visual-only (not linked via htmlFor), so assert text and file input presence.
    expect(screen.getByText(/Imagen del Ciclo/)).toBeInTheDocument()
    expect(document.querySelectorAll('input[type="file"]').length).toBeGreaterThan(0)
    expect(screen.getByText(/Arrastra o haz click para seleccionar/)).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    render(<NuevoCicloPage />)
    expect(screen.getByLabelText(/Descripcion/)).toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(/Descripcion detallada del ciclo/)
    expect(textarea).toBeInTheDocument()
  })
})
