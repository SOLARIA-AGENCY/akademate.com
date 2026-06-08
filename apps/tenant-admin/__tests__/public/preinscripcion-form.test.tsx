import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { PreinscripcionForm } from '../../app/(public)/p/convocatorias/[slug]/PreinscripcionForm'

const mockFetch = vi.fn()
const mockFbq = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

function fillRequiredForm() {
  fireEvent.change(screen.getByPlaceholderText('Nombre completo *'), { target: { value: 'Carla Tests' } })
  fireEvent.change(screen.getByPlaceholderText('Email *'), { target: { value: 'carla@example.com' } })
  fireEvent.change(screen.getByPlaceholderText('Telefono *'), { target: { value: '+34 611 000 103' } })
  fireEvent.click(screen.getByTestId('checkbox'))
}

describe('PreinscripcionForm Meta attribution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
    Object.defineProperty(window, 'fbq', {
      value: mockFbq,
      writable: true,
    })
    Object.defineProperty(globalThis.crypto, 'randomUUID', {
      value: vi.fn(() => 'event-123'),
      configurable: true,
    })
    window.history.pushState(
      {},
      '',
      '/p/convocatorias/SC-2026-002?utm_source=facebook&utm_medium=paid&utm_campaign=SA-SC-2026-002&utm_content=9%3A16&meta_campaign_id=6966251962240&fbclid=fbclid-1'
    )
    document.cookie = '_fbc=fbc-test'
    document.cookie = '_fbp=fbp-test'
  })

  it('persists CRM lead before firing Pixel and stores Meta attribution', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/track') return jsonResponse({ success: true })
      if (url === '/api/leads') return jsonResponse({ success: true, id: 99 })
      return jsonResponse({ error: 'not found' }, 404)
    })

    render(
      <PreinscripcionForm
        convocatoriaId="2"
        convocatoriaCodigo="SC-2026-002"
        courseName="CFGM Farmacia y Parafarmacia"
      />
    )

    fillRequiredForm()
    fireEvent.click(screen.getByText('Reserva tu plaza'))

    await waitFor(() => expect(mockFbq).toHaveBeenCalledTimes(1))

    const calls = mockFetch.mock.calls.map(([url, init]) => ({ url: String(url), init: init as RequestInit }))
    expect(calls[0].url).toBe('/api/track')
    expect(JSON.parse(String(calls[0].init.body))).toMatchObject({
      event_type: 'form_click',
      event_id: 'event-123-click',
      meta_campaign_id: '6966251962240',
      utm_campaign: 'SA-SC-2026-002',
    })

    expect(calls[1].url).toBe('/api/leads')
    expect(JSON.parse(String(calls[1].init.body))).toMatchObject({
      email: 'carla@example.com',
      convocatoria_id: '2',
      event_id: 'event-123',
      fbclid: 'fbclid-1',
      utm_source: 'facebook',
      utm_medium: 'paid',
      utm_campaign: 'SA-SC-2026-002',
      utm_content: '9:16',
      meta_campaign_id: '6966251962240',
    })

    expect(calls[2].url).toBe('/api/track')
    expect(JSON.parse(String(calls[2].init.body))).toMatchObject({
      event_type: 'form_submit',
      event_id: 'event-123-submit',
      meta_campaign_id: '6966251962240',
    })

    expect(mockFbq).toHaveBeenCalledWith(
      'track',
      'Lead',
      {
        content_name: 'CFGM Farmacia y Parafarmacia',
        content_category: 'convocatoria',
      },
      { eventID: 'event-123' }
    )
  })

  it('does not fire Pixel when CRM lead creation fails and records form_error', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/track') return jsonResponse({ success: true })
      if (url === '/api/leads') return jsonResponse({ error: 'Lead rejected' }, 400)
      return jsonResponse({ error: 'not found' }, 404)
    })

    render(<PreinscripcionForm convocatoriaId="2" convocatoriaCodigo="SC-2026-002" courseName="CFGM Farmacia" />)

    fillRequiredForm()
    fireEvent.click(screen.getByText('Reserva tu plaza'))

    await waitFor(() => expect(screen.getByText('Lead rejected')).toBeInTheDocument())

    const errorTrackCall = mockFetch.mock.calls.find(([, init]) => {
      const body = JSON.parse(String((init as RequestInit).body || '{}'))
      return body.event_type === 'form_error'
    })
    expect(errorTrackCall).toBeTruthy()
    expect(mockFbq).not.toHaveBeenCalled()
  })
})
