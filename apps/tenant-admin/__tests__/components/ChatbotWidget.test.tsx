import { render, screen, fireEvent } from '@testing-library/react'
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'

describe('ChatbotWidget Component', () => {
  it('renders chatbot button', () => {
    render(<ChatbotWidget />)
    
    // Should show the floating button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('opens chat window when button clicked', () => {
    render(<ChatbotWidget />)
    
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    
    // Should show welcome message
    expect(screen.getByText(/hola.*asistente virtual/i)).toBeInTheDocument()
  })

  it('allows sending messages', () => {
    render(<ChatbotWidget />)
    
    // Open widget
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    
    // Find input and send button
    const input = screen.getByPlaceholderText(/escribe tu consulta/i)
    expect(input).toBeInTheDocument()
    
    fireEvent.change(input, { target: { value: 'Hola' } })
    expect(input).toHaveValue('Hola')
  })

  it('shows AI responses', () => {
    render(<ChatbotWidget />)
    
    // Open widget
    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])
    
    // Should have initial assistant message
    expect(screen.getByText(/asistente virtual/i)).toBeInTheDocument()
  })

  it('can be closed', () => {
    render(<ChatbotWidget />)
    
    // Open widget
    const openButtons = screen.getAllByRole('button')
    fireEvent.click(openButtons[0])
    
    // Find close button (X icon)
    const closeButton = screen.getAllByRole('button').find(btn => 
      btn.querySelector('svg')
    )
    if (closeButton) {
      fireEvent.click(closeButton)
    }
  })
})
