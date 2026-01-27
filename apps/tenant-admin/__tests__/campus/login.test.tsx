import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import CampusLoginPage from '@/app/campus/login/page'

// Mock SessionProvider
const mockLogin = vi.fn()
const mockSessionValue = {
  student: null,
  enrollments: [],
  isLoading: false,
  isAuthenticated: false,
  error: null,
  login: mockLogin,
  logout: vi.fn(),
  refreshSession: vi.fn(),
}

vi.mock('@/app/campus/providers/SessionProvider', () => ({
  useSession: () => mockSessionValue,
  SessionProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

// Mock router
const mockPush = vi.fn()
vi.mock('next/navigation', async () => {
  return {
    useRouter: () => ({ push: mockPush }),
    useParams: () => ({}),
  }
})

describe('Campus Login Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    mockLogin.mockReset()
    mockSessionValue.error = null
  })

  it('renders campus login form correctly', () => {
    render(<CampusLoginPage />)

    expect(screen.getByText('Campus Virtual')).toBeInTheDocument()
    expect(screen.getByText(/inicia sesion para acceder/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electronico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contrasena/i)).toBeInTheDocument()
  })

  it('validates required fields', async () => {
    render(<CampusLoginPage />)

    const submitButton = screen.getByRole('button', { name: /iniciar sesion/i })
    fireEvent.click(submitButton)

    const emailInput = screen.getByLabelText(/correo electronico/i)
    expect(emailInput.validity.valid).toBe(false)
  })

  it('handles successful login', async () => {
    mockLogin.mockResolvedValue(true)

    render(<CampusLoginPage />)

    const emailInput = screen.getByLabelText(/correo electronico/i)
    const passwordInput = screen.getByLabelText(/contrasena/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesion/i })

    fireEvent.change(emailInput, { target: { value: 'student@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('student@test.com', 'password123')
    })
  })

  it('handles failed login', async () => {
    mockLogin.mockResolvedValue(false)
    mockSessionValue.error = 'Credenciales invalidas'

    render(<CampusLoginPage />)

    const emailInput = screen.getByLabelText(/correo electronico/i)
    const passwordInput = screen.getByLabelText(/contrasena/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesion/i })

    fireEvent.change(emailInput, { target: { value: 'wrong@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } })
    fireEvent.click(submitButton)

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
  })

  it('has link to forgot password', () => {
    render(<CampusLoginPage />)

    const forgotLink = screen.getByText(/olvidaste tu contrasena/i)
    expect(forgotLink).toBeInTheDocument()
    expect(forgotLink).toHaveAttribute('href', '/campus/recuperar')
  })

  it('shows loading state during submission', async () => {
    mockLogin.mockImplementation(() => new Promise(resolve => setTimeout(() => resolve(true), 100)))

    render(<CampusLoginPage />)

    const emailInput = screen.getByLabelText(/correo electronico/i)
    const passwordInput = screen.getByLabelText(/contrasena/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesion/i })

    fireEvent.change(emailInput, { target: { value: 'student@test.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })
    fireEvent.click(submitButton)

    expect(screen.getByText(/iniciando/i)).toBeInTheDocument()
  })
})
