import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import APIsPage from '@/app/(dashboard)/configuracion/apis/page'

function mockApiKeysSuccess(keys: unknown[] = []) {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ data: keys }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function mockApiKeysError(status = 500, statusText = 'Internal Server Error') {
  ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
    new Response(JSON.stringify({ error: 'boom' }), {
      status,
      statusText,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

describe('APIs Page', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders header and primary action', async () => {
    mockApiKeysSuccess([])
    render(<APIsPage />)

    expect(screen.getByText('APIs y Webhooks')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Nueva API Key/i })).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('No hay claves de API creadas')).toBeInTheDocument()
    })
  })

  it('displays API keys section', async () => {
    mockApiKeysSuccess([])
    render(<APIsPage />)

    expect(screen.getByText('Claves de API')).toBeInTheDocument()
    await waitFor(() => {
      expect(screen.getByText('No hay claves de API creadas')).toBeInTheDocument()
    })
  })

  it('opens create API key modal', async () => {
    mockApiKeysSuccess([])
    render(<APIsPage />)

    const createButton = screen.getByRole('button', { name: /Nueva API Key/i })
    fireEvent.click(createButton)

    expect(screen.getByText('Permisos')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Generar clave/i })).toBeInTheDocument()
  })

  it('shows fetch error and retry control', async () => {
    mockApiKeysError()
    render(<APIsPage />)

    await waitFor(() => {
      expect(screen.getByText(/Error 500/i)).toBeInTheDocument()
    })
    expect(screen.getByRole('button', { name: /Reintentar/i })).toBeInTheDocument()
  })
})
