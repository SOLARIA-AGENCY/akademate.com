import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import UsuariosPage from '@/app/(dashboard)/administracion/usuarios/page'

describe('Usuarios Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders users list correctly', () => {
    render(<UsuariosPage />)
    
    expect(screen.getByText('Gestión de Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Crear Usuario')).toBeInTheDocument()
  })

  it('displays user statistics', () => {
    render(<UsuariosPage />)
    
    expect(screen.getByText('Total Usuarios')).toBeInTheDocument()
    expect(screen.getByText('Usuarios Activos')).toBeInTheDocument()
    expect(screen.getByText('Vinculados a Staff')).toBeInTheDocument()
    expect(screen.getByText('Con 2FA Activo')).toBeInTheDocument()
  })

  it('opens create user modal when button clicked', () => {
    render(<UsuariosPage />)
    
    const createButton = screen.getByText('Crear Usuario')
    fireEvent.click(createButton)
    
    expect(screen.getByText('Crear Nuevo Usuario')).toBeInTheDocument()
    expect(screen.getByLabelText(/nombre completo/i)).toBeInTheDocument()
  })

  it('validates password match in create form', () => {
    render(<UsuariosPage />)
    
    fireEvent.click(screen.getByText('Crear Usuario'))
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i)
    const confirmInput = screen.getByLabelText(/confirmar contraseña/i)
    
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.change(confirmInput, { target: { value: 'different' } })
    
    expect(screen.getByText(/las contraseñas no coinciden/i)).toBeInTheDocument()
  })

  it('allows toggling password visibility', () => {
    render(<UsuariosPage />)
    
    fireEvent.click(screen.getByText('Crear Usuario'))
    
    const passwordInput = screen.getByLabelText(/^contraseña$/i) as HTMLInputElement
    expect(passwordInput.type).toBe('password')
    
    // Find and click visibility toggle
    const toggleButtons = screen.getAllByRole('button', { name: '' })
    fireEvent.click(toggleButtons[0])
    
    expect(passwordInput.type).toBe('text')
  })
})
