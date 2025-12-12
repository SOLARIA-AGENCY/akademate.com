import { render, screen, fireEvent } from '@testing-library/react'
import RolesPage from '@/app/(dashboard)/administracion/roles/page'

describe('Roles Page', () => {
  it('renders all roles correctly', () => {
    render(<RolesPage />)
    
    expect(screen.getByText('Roles y Permisos')).toBeInTheDocument()
    expect(screen.getByText('Admin')).toBeInTheDocument()
    expect(screen.getByText('Gestor')).toBeInTheDocument()
    expect(screen.getByText('Marketing')).toBeInTheDocument()
    expect(screen.getByText('Asesor')).toBeInTheDocument()
    expect(screen.getByText('Lectura')).toBeInTheDocument()
  })

  it('expands role details when clicked', () => {
    render(<RolesPage />)
    
    const adminRole = screen.getByText('Admin').closest('.cursor-pointer')
    fireEvent.click(adminRole!)
    
    // Should show permissions categories
    expect(screen.getByText(/cursos/i)).toBeInTheDocument()
    expect(screen.getByText(/staff/i)).toBeInTheDocument()
  })

  it('shows user count per role', () => {
    render(<RolesPage />)
    
    // Should display user statistics
    expect(screen.getByText(/usuarios/i)).toBeInTheDocument()
  })

  it('opens users modal when view users clicked', () => {
    render(<RolesPage />)
    
    // Expand a role first
    const gestorRole = screen.getByText('Gestor').closest('.cursor-pointer')
    fireEvent.click(gestorRole!)
    
    // Click view users button
    const viewUsersButtons = screen.getAllByText(/usuario/i)
    if (viewUsersButtons.length > 0) {
      fireEvent.click(viewUsersButtons[0])
      
      expect(screen.getByText(/usuarios con rol/i)).toBeInTheDocument()
    }
  })
})
