import { render, screen, fireEvent } from '@testing-library/react'
import APIsPage from '@/app/(dashboard)/configuracion/apis/page'

describe('APIs & Webhooks Page', () => {
  it('renders APIs page correctly', () => {
    render(<APIsPage />)
    
    expect(screen.getByText('APIs y Webhooks')).toBeInTheDocument()
    expect(screen.getByText('Nueva Clave API')).toBeInTheDocument()
  })

  it('displays API keys section', () => {
    render(<APIsPage />)
    
    expect(screen.getByText('Claves de API')).toBeInTheDocument()
  })

  it('displays Facebook Pixel section', () => {
    render(<APIsPage />)
    
    expect(screen.getByText('Facebook Pixel')).toBeInTheDocument()
  })

  it('displays Google Analytics section', () => {
    render(<APIsPage />)
    
    expect(screen.getByText(/google analytics.*tags/i)).toBeInTheDocument()
  })

  it('displays MCP section', () => {
    render(<APIsPage />)
    
    expect(screen.getByText(/mcp.*model context protocol/i)).toBeInTheDocument()
  })

  it('displays webhooks section', () => {
    render(<APIsPage />)
    
    expect(screen.getByText('Webhooks')).toBeInTheDocument()
  })

  it('opens create API key modal', () => {
    render(<APIsPage />)
    
    const createButton = screen.getByText('Nueva Clave API')
    fireEvent.click(createButton)
    
    expect(screen.getByText('Crear Nueva Clave API')).toBeInTheDocument()
  })

  it('has save configuration button', () => {
    render(<APIsPage />)
    
    expect(screen.getByText('Guardar Configuración')).toBeInTheDocument()
  })
})
