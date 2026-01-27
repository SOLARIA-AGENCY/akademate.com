import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect } from 'vitest'
import AyudaPage from '@/app/(dashboard)/ayuda/page'

describe('Help Page', () => {
  it('renders help page correctly', () => {
    render(<AyudaPage />)

    expect(screen.getByText('Ayuda y Documentación')).toBeInTheDocument()
    expect(screen.getByText('Centro de recursos y soporte técnico')).toBeInTheDocument()
  })

  it('has search functionality', () => {
    render(<AyudaPage />)

    const searchInput = screen.getByPlaceholderText(/busca guías/i)
    expect(searchInput).toBeInTheDocument()

    fireEvent.change(searchInput, { target: { value: 'curso' } })
    expect(searchInput).toHaveValue('curso')
  })

  it('displays quick access cards', () => {
    render(<AyudaPage />)

    expect(screen.getByText('Chat con Asistente IA')).toBeInTheDocument()
    expect(screen.getByText('Video Tutoriales')).toBeInTheDocument()
    expect(screen.getByText('Documentación PDF')).toBeInTheDocument()
  })

  it('shows guide sections', () => {
    render(<AyudaPage />)

    expect(screen.getByText('Primeros Pasos')).toBeInTheDocument()
    expect(screen.getByText('Gestión de Cursos')).toBeInTheDocument()
    expect(screen.getByText('Gestión de Personal')).toBeInTheDocument()
  })

  it('expands guide sections', async () => {
    render(<AyudaPage />)

    // Find the CardHeader containing "Primeros Pasos" and click it
    const sectionTitle = screen.getByText('Primeros Pasos')
    const cardHeader = sectionTitle.closest('[data-testid="card-header"]')
    fireEvent.click(cardHeader!)

    // Wait for the content to appear after state update
    await waitFor(() => {
      expect(screen.getByText('Introducción al Dashboard')).toBeInTheDocument()
    })
  })

  it('displays FAQ section', () => {
    render(<AyudaPage />)

    expect(screen.getByText(/preguntas frecuentes/i)).toBeInTheDocument()
    expect(screen.getByText(/cómo restablezco mi contraseña/i)).toBeInTheDocument()
  })

  it('has contact support section', () => {
    render(<AyudaPage />)

    expect(screen.getByText(/necesitas más ayuda/i)).toBeInTheDocument()
    expect(screen.getByText('Chat en Vivo')).toBeInTheDocument()
  })
})
