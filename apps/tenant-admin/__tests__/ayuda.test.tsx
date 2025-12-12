import { render, screen, fireEvent } from '@testing-library/react'
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

  it('expands guide sections', () => {
    render(<AyudaPage />)
    
    const section = screen.getByText('Primeros Pasos').closest('.cursor-pointer')
    fireEvent.click(section!)
    
    // Should show guides within section
    expect(screen.getByText(/introducción al dashboard/i)).toBeInTheDocument()
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
