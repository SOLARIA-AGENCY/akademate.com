import { render, screen, fireEvent } from '@testing-library/react'
import ConfigGeneralPage from '@/app/(dashboard)/configuracion/general/page'

describe('General Configuration Page', () => {
  it('renders configuration form correctly', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByText('Configuración General')).toBeInTheDocument()
    expect(screen.getByText('Información de la Academia')).toBeInTheDocument()
  })

  it('displays academy information fields', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByLabelText(/nombre comercial/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cif/i)).toBeInTheDocument()
  })

  it('displays contact information fields', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email general/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument()
  })

  it('displays social media fields', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
  })

  it('has logo upload sections', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByText(/logo principal.*modo claro/i)).toBeInTheDocument()
    expect(screen.getByText('Logo Modo Oscuro')).toBeInTheDocument()
  })

  it('has save button', () => {
    render(<ConfigGeneralPage />)
    
    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
  })
})
