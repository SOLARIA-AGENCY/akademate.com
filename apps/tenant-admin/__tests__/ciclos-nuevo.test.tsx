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
    // The "Datos Basicos" tab content (CardTitle) should be visible
    expect(screen.getByText('Datos Basicos', { selector: 'button' })).toBeInTheDocument()
    // The name input from the basicos tab should be visible
    expect(screen.getByLabelText(/Nombre del Ciclo/)).toBeInTheDocument()
  })

  it('switching tabs shows corresponding content', () => {
    render(<NuevoCicloPage />)

    // Initially, "Datos Basicos" content is shown
    expect(screen.getByLabelText(/Nombre del Ciclo/)).toBeInTheDocument()

    // Click on "Duracion y Modalidad" tab
    fireEvent.click(screen.getByText('Duracion y Modalidad'))
    expect(screen.getByLabelText(/Horas Totales/)).toBeInTheDocument()
    // "Datos Basicos" content should no longer be visible
    expect(screen.queryByLabelText(/Nombre del Ciclo/)).not.toBeInTheDocument()

    // Click on "Requisitos" tab
    fireEvent.click(screen.getByText('Requisitos'))
    expect(screen.getByText(/No hay requisitos definidos/)).toBeInTheDocument()

    // Click on "Modulos" tab
    fireEvent.click(screen.getByText('Modulos', { selector: 'button' }))
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
    expect(screen.getByLabelText(/Imagen del Ciclo/)).toBeInTheDocument()
    expect(screen.getByText(/Imagen de portada del ciclo/)).toBeInTheDocument()
  })

  it('renders description textarea', () => {
    render(<NuevoCicloPage />)
    expect(screen.getByLabelText(/Descripcion/)).toBeInTheDocument()
    const textarea = screen.getByPlaceholderText(/Descripcion detallada del ciclo/)
    expect(textarea).toBeInTheDocument()
  })
})
