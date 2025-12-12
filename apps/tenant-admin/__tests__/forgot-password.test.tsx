import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ForgotPasswordPage from '@/app/(auth)/forgot-password/page'

describe('Forgot Password Page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders forgot password form correctly', () => {
    render(<ForgotPasswordPage />)
    
    expect(screen.getByText('Recuperar Contraseña')).toBeInTheDocument()
    expect(screen.getByText('Restablecer Contraseña')).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
  })

  it('submits email successfully', async () => {
    render(<ForgotPasswordPage />)
    
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const submitButton = screen.getByText(/enviar enlace de recuperación/i)
    
    fireEvent.change(emailInput, { target: { value: 'user@cepcomunicacion.com' } })
    fireEvent.click(submitButton)
    
    // Should show loading state
    expect(screen.getByText(/enviando/i)).toBeInTheDocument()
    
    // Wait for success state
    await waitFor(() => {
      expect(screen.getByText(/correo enviado/i)).toBeInTheDocument()
      expect(screen.getByText('user@cepcomunicacion.com')).toBeInTheDocument()
    }, { timeout: 2500 })
  })

  it('shows instructions after successful submission', async () => {
    render(<ForgotPasswordPage />)
    
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const submitButton = screen.getByText(/enviar enlace de recuperación/i)
    
    fireEvent.change(emailInput, { target: { value: 'test@test.com' } })
    fireEvent.click(submitButton)
    
    await waitFor(() => {
      expect(screen.getByText(/revisa tu bandeja de entrada/i)).toBeInTheDocument()
      expect(screen.getByText(/el enlace expira en 1 hora/i)).toBeInTheDocument()
      expect(screen.getByText(/volver al login/i)).toBeInTheDocument()
    }, { timeout: 2500 })
  })

  it('has back to login link', () => {
    render(<ForgotPasswordPage />)
    
    const backLink = screen.getByText(/volver al login/i)
    expect(backLink).toBeInTheDocument()
  })
})
