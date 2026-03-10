import { render, screen } from '@testing-library/react'
import ConfigGeneralPage from '@/app/(dashboard)/configuracion/general/page'

describe('General Configuration Page', () => {
  it('renders configuration form correctly', () => {
    render(<ConfigGeneralPage data-oid="qvu.kp-" />)

    expect(screen.getByText('Configuración General')).toBeInTheDocument()
    expect(screen.getByText('Información de la Academia')).toBeInTheDocument()
  })

  it('displays academy information fields', () => {
    render(<ConfigGeneralPage data-oid="qstefnx" />)

    expect(screen.getByLabelText(/nombre comercial/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/razón social/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/cif/i)).toBeInTheDocument()
  })

  it('displays contact information fields', () => {
    render(<ConfigGeneralPage data-oid="9n_ecxw" />)

    expect(screen.getByLabelText(/teléfono principal/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/email general/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/sitio web/i)).toBeInTheDocument()
  })

  it('displays social media fields', () => {
    render(<ConfigGeneralPage data-oid="9_pbw1c" />)

    expect(screen.getByLabelText('Facebook')).toBeInTheDocument()
    expect(screen.getByLabelText(/twitter/i)).toBeInTheDocument()
    expect(screen.getByLabelText('Instagram')).toBeInTheDocument()
    expect(screen.getByLabelText('LinkedIn')).toBeInTheDocument()
    expect(screen.getByLabelText('YouTube')).toBeInTheDocument()
  })

  it('has logo upload sections', () => {
    render(<ConfigGeneralPage data-oid="ai5k4:u" />)

    // Check for logo section title
    expect(screen.getByText('Logos y Marcas')).toBeInTheDocument()

    // Check for logo labels (use getAllByText since there are multiple matches)
    expect(screen.getAllByText(/Logo Principal/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Logo Oscuro/).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/Logo Claro/).length).toBeGreaterThan(0)
  })

  it('has save button', () => {
    render(<ConfigGeneralPage data-oid="-ldiai6" />)

    expect(screen.getByText('Guardar Cambios')).toBeInTheDocument()
  })
})
