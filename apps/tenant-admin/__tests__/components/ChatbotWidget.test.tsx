import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi, type Mock } from 'vitest'
import { ChatbotWidget } from '@payload-config/components/ui/ChatbotWidget'

describe('ChatbotWidget Component', () => {
  beforeEach(() => {
    ;(global.fetch as Mock) = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: true, feedbackId: 'fbk-test-123' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ) as unknown as Mock
  })

  it('renders chatbot button', () => {
    render(<ChatbotWidget />)

    // Should show the floating button
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThan(0)
  })

  it('opens feedback window when button clicked', () => {
    render(<ChatbotWidget />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    expect(screen.getByText(/canal de feedback/i)).toBeInTheDocument()
    expect(screen.getByText(/reporta un problema o sugerencia/i)).toBeInTheDocument()
  })

  it('allows writing feedback details', () => {
    render(<ChatbotWidget />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    const locationInput = screen.getByPlaceholderText('/dashboard/...')
    const promptInput = screen.getByPlaceholderText(
      /describe el problema, pasos para reproducirlo y resultado esperado/i,
    )

    expect(locationInput).toBeInTheDocument()
    expect(promptInput).toBeInTheDocument()

    fireEvent.change(locationInput, { target: { value: '/dashboard/cursos' } })
    fireEvent.change(promptInput, {
      target: { value: 'Al guardar un curso aparece un error 500 en el modal de edición.' },
    })

    expect(locationInput).toHaveValue('/dashboard/cursos')
    expect(promptInput).toHaveValue(
      'Al guardar un curso aparece un error 500 en el modal de edición.',
    )
  })

  it('sends feedback to API and shows confirmation', async () => {
    render(<ChatbotWidget />)

    const buttons = screen.getAllByRole('button')
    fireEvent.click(buttons[0])

    const promptInput = screen.getByPlaceholderText(
      /describe el problema, pasos para reproducirlo y resultado esperado/i,
    )
    fireEvent.change(promptInput, {
      target: { value: 'No puedo cambiar el estado de un lead desde la lista principal.' },
    })

    fireEvent.click(screen.getByRole('button', { name: /enviar feedback/i }))

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/api/feedback/chatbot',
        expect.objectContaining({ method: 'POST' }),
      )
    })

    await waitFor(() => {
      expect(screen.getByText(/feedback enviado correctamente/i)).toBeInTheDocument()
    })
  })

  it('can be closed', () => {
    render(<ChatbotWidget />)

    const openButtons = screen.getAllByRole('button')
    fireEvent.click(openButtons[0])

    const closeButton = screen.getAllByRole('button').find((btn) => btn.querySelector('svg'))
    if (closeButton) {
      fireEvent.click(closeButton)
    }
  })
})
