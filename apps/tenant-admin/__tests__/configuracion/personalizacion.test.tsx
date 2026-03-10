import { render, screen, fireEvent } from '@testing-library/react'
import PersonalizacionPage from '@/app/(dashboard)/configuracion/personalizacion/page'

describe('Personalization Page', () => {
  it('renders personalization page correctly', () => {
    render(<PersonalizacionPage data-oid="5325pgq" />)

    expect(screen.getByText('Personalización')).toBeInTheDocument()
    expect(screen.getByText('Temas Predefinidos')).toBeInTheDocument()
  })

  it('displays predefined themes', () => {
    render(<PersonalizacionPage data-oid="6agfjl." />)

    expect(screen.getByText('Default Blue')).toBeInTheDocument()
    expect(screen.getByText('Ocean')).toBeInTheDocument()
    expect(screen.getByText('Forest')).toBeInTheDocument()
    expect(screen.getByText('Sunset')).toBeInTheDocument()
  })

  it('allows color customization', () => {
    render(<PersonalizacionPage data-oid="4tn94s5" />)

    const colorInputs = screen.getAllByDisplayValue(/#[0-9a-f]{6}/i)
    expect(colorInputs.length).toBeGreaterThan(0)
  })

  it('shows preview when theme is selected', () => {
    render(<PersonalizacionPage data-oid="_m21ls5" />)

    const oceanTheme = screen.getByText('Ocean').closest('button')
    fireEvent.click(oceanTheme!)

    expect(screen.getByText(/vista previa activa/i)).toBeInTheDocument()
    expect(screen.getByText('Guardar Tema')).toBeInTheDocument()
  })

  it('has export and import functionality', () => {
    render(<PersonalizacionPage data-oid="1a2ej8b" />)

    expect(screen.getByText('Exportar Tema')).toBeInTheDocument()
    expect(screen.getByText('Importar Tema')).toBeInTheDocument()
  })

  it('shows logo upload sections', () => {
    render(<PersonalizacionPage data-oid="d4ez8si" />)

    expect(screen.getByText(/logo principal.*modo claro/i)).toBeInTheDocument()
    expect(screen.getByText('Logo Modo Oscuro')).toBeInTheDocument()
    expect(screen.getByText('Favicon')).toBeInTheDocument()
  })
})
