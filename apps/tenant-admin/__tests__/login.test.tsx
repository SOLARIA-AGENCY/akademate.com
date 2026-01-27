import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import type { Mock } from 'vitest';
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { useRouter } from 'next/navigation'
import LoginPage from '@/app/auth/login/page'

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}))

describe('Login Page', () => {
  const mockPush = vi.fn()

  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    ;(useRouter as Mock).mockReturnValue({ push: mockPush })
    // localStorage is cleared in global setup
  })

  it('renders login form correctly', () => {
    render(<LoginPage />)

    expect(screen.getByRole('heading', { name: /iniciar sesión/i })).toBeInTheDocument()
    expect(screen.getByLabelText(/correo electrónico/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/contraseña/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /iniciar sesión/i })).toBeInTheDocument()
  })

  it('shows/hides password when eye icon is clicked', () => {
    render(<LoginPage />)

    const passwordInput = screen.getByLabelText(/contraseña/i)
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

    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })
    fireEvent.click(submitButton)

    // Form should show validation errors (HTML5 validation)
    const emailInput = screen.getByLabelText(/correo electrónico/i)
    expect(emailInput.validity.valid).toBe(false)
  })

  // Skip: requires proper API mock setup
  it.skip('handles successful login', async () => {
    render(<LoginPage />)

    const emailInput = screen.getByLabelText(/correo electrónico/i)
    const passwordInput = screen.getByLabelText(/contraseña/i)
    const submitButton = screen.getByRole('button', { name: /iniciar sesión/i })

    // Fill in form
    fireEvent.change(emailInput, { target: { value: 'admin@cepcomunicacion.com' } })
    fireEvent.change(passwordInput, { target: { value: 'password123' } })

    // Submit form
    fireEvent.click(submitButton)

    // Wait for loading state
    expect(screen.getByText(/iniciando sesión/i)).toBeInTheDocument()

    // Wait for redirect
    await waitFor(() => {
      expect(window.localStorage.setItem).toHaveBeenCalled()
      expect(mockPush).toHaveBeenCalledWith('/')
    }, { timeout: 2000 })
  })

  it('handles remember me checkbox', () => {
    render(<LoginPage />)

    const rememberCheckbox = screen.getByLabelText(/recordar mi sesión/i)

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
