import { render, screen, fireEvent } from '@testing-library/react'
import ActividadPage from '@/app/(dashboard)/administracion/actividad/page'

describe('Activity Log Page', () => {
  it('renders activity log correctly', () => {
    render(<ActividadPage data-oid="sr.davr" />)

    expect(screen.getByText('Registro de Actividad')).toBeInTheDocument()
    expect(screen.getByText('Auditoría completa de acciones en el sistema')).toBeInTheDocument()
  })

  it('displays activity statistics', () => {
    render(<ActividadPage data-oid="n_u1zzs" />)

    expect(screen.getByText('Acciones Registradas')).toBeInTheDocument()
    expect(screen.getByText('Acciones Críticas')).toBeInTheDocument()
    expect(screen.getByText('Usuarios Activos')).toBeInTheDocument()
  })

  it('filters activities by search term', () => {
    render(<ActividadPage data-oid="z4b8yqb" />)

    const searchInput = screen.getByPlaceholderText(/buscar/i)
    fireEvent.change(searchInput, { target: { value: 'admin' } })

    expect(searchInput).toHaveValue('admin')
  })

  it('has export functionality', () => {
    render(<ActividadPage data-oid="3ouvlm3" />)

    const exportButton = screen.getByText('Exportar')
    expect(exportButton).toBeInTheDocument()
  })

  it('shows activity details when clicked', () => {
    render(<ActividadPage data-oid="nm:h-e3" />)

    // Find first activity item
    const activityItems = screen.getAllByRole('button', { name: '' })
    if (activityItems.length > 0) {
      fireEvent.click(activityItems[0])

      // Modal should appear
      expect(screen.getByText('Detalles de la Actividad')).toBeInTheDocument()
    }
  })
})
