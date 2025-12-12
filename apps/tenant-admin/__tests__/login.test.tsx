import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/(auth)/login/page'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}))

describe('Login Page', () => {
  const mockPush = jest.fn()

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks()
    ;(useRouter as jest.Mock).mockReturnValue({ push: mockPush })
    // Clear localStorage
    localStorage.clear()
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)
    
    expect(screen.getByText('CEP Admin')).toBeInTheDocument()
    expect(screen.getByText('Iniciar Sesión')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
  })

  it('shows/hides password when eye icon is clicked', () => {
    render(<LoginPage />)
    
    const passwordInput = screen.getByLabelText(/contraseña/i) as HTMLInputElement
    const toggleButton = screen.getByRole('button', { name: '' })
    
    // Initially password should be hidden
    expect(passwordInput.type).toBe('password')
    
    // Click to show password
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('text')
    
    // Click again to hide
    fireEvent.click(toggleButton)
    expect(passwordInput.type).toBe('password')
  })

  it('validates required fields', async () => {
    render(<LoginPage />)
    
    const submitButton = screen.getByText(/iniciar sesión/i)
    fireEvent.click(submitButton)
    
    // Form should show validation errors (HTML5 validation)
    const emailInput = screen.getByLabelText(/correo electrónico/i) as HTMLInputElement
    expect(emailInput.validity.valid).toBe(false)
  })

  it('handles successful login', async () => {
    render(<LoginPage />)
    
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByText(/iniciar sesión/i)
    
    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'admin@cepcomunicacion.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    
    // Submit form
    fireEvent.click(submitButton)
    
    // Wait for loading state
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument()
    
    // Wait for redirect
    await waitFor(() => {
      expect(localStorage.getItem('cep_auth_token')).toBeTruthy()
      expect(localStorage.getItem('cep_user')).toBeTruthy()
      expect(mockPush).toHaveBeenCalledWith('/')
    }, { timeout: 2000 })
  })

  it('handles remember me checkbox', () => {
    render(<LoginPage />)
    
    const rememberCheckbox = screen.getByLabelText(/recordar mi sesión/i) as HTMLInputElement
    
    expect(rememberCheckbox.checked).toBe(false)
    
    fireEvent.click(rememberCheckbox)
    expect(rememberCheckbox.checked).toBe(true)
  })

  it('has link to forgot password', () => {
    render(<LoginPage />)
    
    const forgotLink = screen.getByText(/olvidaste tu contraseña/i)
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink).toHaveAttribute('href', '/auth/forgot-password')
  })
})
