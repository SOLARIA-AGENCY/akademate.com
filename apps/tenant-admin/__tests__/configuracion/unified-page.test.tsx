import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

// Mock useTenantBranding
const mockRefresh = vi.fn().mockResolvedValue(undefined)
vi.mock('@/app/providers/tenant-branding', () => ({
  useTenantBranding: () => ({
    branding: {
      academyName: 'Test Academy',
      tenantId: 'test-tenant-123',
      logos: {
        principal: '/logos/test-logo.svg',
        oscuro: '/logos/test-logo-dark.svg',
        claro: '/logos/test-logo-light.svg',
        favicon: '/logos/test-favicon.svg',
      },
      theme: {
        primary: '#0066CC',
        secondary: '#1a1a2e',
        accent: '#0088FF',
        success: '#22c55e',
        warning: '#f59e0b',
        danger: '#ef4444',
      },
    },
    loading: false,
    refresh: mockRefresh,
  }),
}))

// Mock IntersectionObserver as a proper class
const mockObserve = vi.fn()
const mockDisconnect = vi.fn()
const mockUnobserve = vi.fn()

class MockIntersectionObserver {
  callback: IntersectionObserverCallback
  static instances: MockIntersectionObserver[] = []

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback
    MockIntersectionObserver.instances.push(this)
  }

  observe = mockObserve
  disconnect = mockDisconnect
  unobserve = mockUnobserve
  root = null
  rootMargin = ''
  thresholds = [0]
  takeRecords = () => [] as IntersectionObserverEntry[]
}

window.IntersectionObserver = MockIntersectionObserver as any

// Mock URL.createObjectURL / revokeObjectURL
const mockCreateObjectURL = vi.fn().mockReturnValue('blob:http://localhost/fake-blob-url')
const mockRevokeObjectURL = vi.fn()
Object.defineProperty(URL, 'createObjectURL', { value: mockCreateObjectURL, writable: true })
Object.defineProperty(URL, 'revokeObjectURL', { value: mockRevokeObjectURL, writable: true })

// Mock scrollIntoView
const mockScrollIntoView = vi.fn()
Element.prototype.scrollIntoView = mockScrollIntoView

// Mock window.dispatchEvent
const originalDispatchEvent = window.dispatchEvent
const mockDispatchEvent = vi.fn()

// ---------------------------------------------------------------------------
// Import component under test
// ---------------------------------------------------------------------------

import ConfiguracionUnifiedPage from '@/app/(app)/(dashboard)/configuracion/page'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Default successful API responses for all config endpoints */
function mockFetchSuccess(overrides: Record<string, any> = {}) {
  ;(global.fetch as Mock).mockImplementation((url: string, init?: RequestInit) => {
    const urlStr = typeof url === 'string' ? url : url.toString()

    if (urlStr.includes('section=academia')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              nombre: 'Academia Test',
              razonSocial: 'Test S.L.',
              cif: 'B12345678',
              direccion: 'Calle Test 1',
              codigoPostal: '28001',
              ciudad: 'Madrid',
              provincia: 'Madrid',
              telefono1: '+34 600 000 000',
              telefono2: '',
              email1: 'info@test.com',
              email2: '',
              web: 'https://test.com',
              horario: '9-18',
              ...(overrides.academia ?? {}),
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }

    if (urlStr.includes('section=logos')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              principal: '/logos/test-logo.svg',
              oscuro: '/logos/test-logo-dark.svg',
              claro: '/logos/test-logo-light.svg',
              favicon: '/logos/test-favicon.svg',
              ...(overrides.logos ?? {}),
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }

    if (urlStr.includes('section=personalizacion')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: {
              primary: '#0066cc',
              secondary: '#64748b',
              accent: '#1d4ed8',
              success: '#22c55e',
              warning: '#f59e0b',
              danger: '#ef4444',
              ...(overrides.colors ?? {}),
            },
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }

    if (urlStr.includes('feature-flags')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            flags: overrides.flags ?? [
              { key: 'campus_virtual', type: 'boolean', effectiveValue: true, eligible: true },
              { key: 'whatsapp_bot', type: 'boolean', effectiveValue: false, eligible: false },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }

    if (urlStr.includes('section=domains')) {
      return Promise.resolve(
        new Response(
          JSON.stringify({
            data: overrides.domains ?? ['test.com', 'app.test.com'],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    }

    // PUT requests (save)
    if (init?.method === 'PUT') {
      if (overrides.saveFail) {
        return Promise.resolve(
          new Response(JSON.stringify({ error: 'Server error' }), {
            status: 500,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }
      return Promise.resolve(
        new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    }

    return Promise.resolve(
      new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  })
}

/** Mock fetch that rejects to simulate network error */
function mockFetchError() {
  ;(global.fetch as Mock).mockRejectedValue(new Error('Network error'))
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ConfiguracionUnifiedPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockScrollIntoView.mockClear()
    mockCreateObjectURL.mockClear()
    mockRevokeObjectURL.mockClear()
    mockObserve.mockClear()
    mockDisconnect.mockClear()
    mockRefresh.mockClear()
    mockDispatchEvent.mockClear()
    MockIntersectionObserver.instances = []
    window.dispatchEvent = mockDispatchEvent
  })

  afterEach(() => {
    window.dispatchEvent = originalDispatchEvent
  })

  // -----------------------------------------------------------------------
  // Loading state
  // -----------------------------------------------------------------------

  describe('Loading state', () => {
    it('renders loading spinner and header initially', () => {
      // Make fetch hang to keep loading state
      ;(global.fetch as Mock).mockImplementation(
        () => new Promise(() => {}), // never resolves
      )

      render(<ConfiguracionUnifiedPage />)

      expect(screen.getByText('Configuracion')).toBeInTheDocument()
      expect(screen.getByText('Cargando ajustes del sistema...')).toBeInTheDocument()
    })
  })

  // -----------------------------------------------------------------------
  // Tab navigation
  // -----------------------------------------------------------------------

  describe('Tab navigation', () => {
    it('renders all 7 section tabs after loading', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Todos los ajustes de tu academia en un solo lugar')).toBeInTheDocument()
      })

      const expectedTabs = [
        'General',
        'Personalizacion',
        'Areas',
        'APIs',
        'GDPR',
        'Feature Flags',
        'Dominios',
      ]

      for (const tabLabel of expectedTabs) {
        expect(screen.getByRole('button', { name: new RegExp(tabLabel) })).toBeInTheDocument()
      }
    })

    it('clicking a tab calls scrollIntoView', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Todos los ajustes de tu academia en un solo lugar')).toBeInTheDocument()
      })

      const gdprTab = screen.getByRole('button', { name: /GDPR/ })
      fireEvent.click(gdprTab)

      expect(mockScrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      })
    })

    it('sets up IntersectionObserver after loading', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Todos los ajustes de tu academia en un solo lugar')).toBeInTheDocument()
      })

      // Should have created observer instances and called observe
      expect(MockIntersectionObserver.instances.length).toBeGreaterThan(0)
      expect(mockObserve).toHaveBeenCalled()
    })
  })

  // -----------------------------------------------------------------------
  // General section
  // -----------------------------------------------------------------------

  describe('General section', () => {
    it('displays form fields with loaded data', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Nombre Comercial')).toHaveValue('Academia Test')
      expect(screen.getByLabelText('Razon Social')).toHaveValue('Test S.L.')
      expect(screen.getByLabelText('CIF / NIF')).toHaveValue('B12345678')
      expect(screen.getByLabelText('Sitio Web')).toHaveValue('https://test.com')
    })

    it('displays contact fields', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      expect(screen.getByLabelText('Telefono Principal')).toHaveValue('+34 600 000 000')
      expect(screen.getByLabelText('Email Principal')).toHaveValue('info@test.com')
    })

    it('handles input changes in general fields', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByLabelText('Nombre Comercial')).toBeInTheDocument()
      })

      const nameInput = screen.getByLabelText('Nombre Comercial')
      fireEvent.change(nameInput, { target: { value: 'Nueva Academia' } })

      expect(nameInput).toHaveValue('Nueva Academia')
    })
  })

  // -----------------------------------------------------------------------
  // Personalizacion section
  // -----------------------------------------------------------------------

  describe('Personalizacion section', () => {
    it('displays color pickers for all color fields', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Colores de Marca')).toBeInTheDocument()
      })

      expect(screen.getByText('Primario')).toBeInTheDocument()
      expect(screen.getByText('Secundario')).toBeInTheDocument()
      expect(screen.getByText('Acento')).toBeInTheDocument()
      expect(screen.getByText('Exito')).toBeInTheDocument()
      expect(screen.getByText('Alerta')).toBeInTheDocument()
      expect(screen.getByText('Error')).toBeInTheDocument()
    })

    it('handles color change via text input', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Colores de Marca')).toBeInTheDocument()
      })

      // The color input with id="color-primary" is the native color picker
      const colorInput = document.getElementById('color-primary') as HTMLInputElement
      expect(colorInput).toBeTruthy()

      fireEvent.change(colorInput, { target: { value: '#ff0000' } })

      // The value should update
      expect(colorInput).toHaveValue('#ff0000')
    })

    it('handles logo upload and creates object URL', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Logo de la Academia')).toBeInTheDocument()
      })

      const fileInput = screen.getByLabelText('Subir nuevo logo')
      const file = new File(['logo-content'], 'logo.png', { type: 'image/png' })

      fireEvent.change(fileInput, { target: { files: [file] } })

      expect(mockCreateObjectURL).toHaveBeenCalledWith(file)
    })

    it('displays live color preview strip', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Vista previa:')).toBeInTheDocument()
      })
    })
  })

  // -----------------------------------------------------------------------
  // GDPR section
  // -----------------------------------------------------------------------

  describe('GDPR section', () => {
    it('displays all consent toggles', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Privacidad y GDPR')).toBeInTheDocument()
      })

      const consentLabels = [
        'Emails de marketing',
        'SMS de marketing',
        'Llamadas comerciales',
        'Cookies de analisis',
        'Compartir con terceros',
        'Perfilado de usuarios',
        'Newsletter',
      ]

      for (const label of consentLabels) {
        expect(screen.getByText(label)).toBeInTheDocument()
      }
    })

    it('handles consent toggle', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Privacidad y GDPR')).toBeInTheDocument()
      })

      const switches = screen.getAllByRole('switch')
      // All consent switches start unchecked
      const firstSwitch = switches[0]!
      expect(firstSwitch).not.toBeChecked()

      fireEvent.click(firstSwitch)

      expect(firstSwitch).toBeChecked()
    })
  })

  // -----------------------------------------------------------------------
  // Feature Flags section
  // -----------------------------------------------------------------------

  describe('Feature Flags section', () => {
    it('displays feature flags from API', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('campus_virtual')).toBeInTheDocument()
      })

      expect(screen.getByText('whatsapp_bot')).toBeInTheDocument()
    })

    it('shows empty state when no flags', async () => {
      mockFetchSuccess({ flags: [] })
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('No hay feature flags configurados.')).toBeInTheDocument()
      })
    })

    it('shows "Plan requerido" badge for ineligible flags', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Plan requerido')).toBeInTheDocument()
      })
    })

    it('shows active/inactive badges', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Activo')).toBeInTheDocument()
        expect(screen.getByText('Inactivo')).toBeInTheDocument()
      })
    })
  })

  // -----------------------------------------------------------------------
  // Domains section
  // -----------------------------------------------------------------------

  describe('Domains section', () => {
    it('displays loaded domains', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('test.com')).toBeInTheDocument()
      })

      expect(screen.getByDisplayValue('app.test.com')).toBeInTheDocument()
    })

    it('adds a new empty domain field when clicking add', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Anadir dominio')).toBeInTheDocument()
      })

      const addButton = screen.getByText('Anadir dominio')
      fireEvent.click(addButton)

      // Now there should be 3 domain inputs (2 loaded + 1 new)
      const domainInputs = screen.getAllByPlaceholderText('example.com')
      expect(domainInputs).toHaveLength(3)
    })

    it('removes a domain when clicking trash icon', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('test.com')).toBeInTheDocument()
      })

      // Find all delete buttons (icon buttons within domain rows)
      const deleteButtons = screen.getAllByRole('button').filter((btn) => {
        // The trash buttons are variant="ghost" with destructive class
        return btn.className.includes('destructive') || btn.closest('[class*="destructive"]')
      })

      // Click the first delete button
      if (deleteButtons.length > 0) {
        fireEvent.click(deleteButtons[0]!)
      }

      // After deletion, test.com should be gone
      expect(screen.queryByDisplayValue('test.com')).not.toBeInTheDocument()
    })

    it('updates domain value on input change', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('test.com')).toBeInTheDocument()
      })

      const domainInput = screen.getByDisplayValue('test.com')
      fireEvent.change(domainInput, { target: { value: 'newdomain.com' } })

      expect(screen.getByDisplayValue('newdomain.com')).toBeInTheDocument()
    })

    it('shows empty state when no domains', async () => {
      mockFetchSuccess({ domains: [] })
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('No hay dominios configurados.')).toBeInTheDocument()
      })
    })
  })

  // -----------------------------------------------------------------------
  // Save functionality
  // -----------------------------------------------------------------------

  describe('Save functionality', () => {
    it('save button shows "Guardar" text by default', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      const saveButtons = screen.getAllByText('Guardar')
      expect(saveButtons.length).toBeGreaterThan(0)
    })

    it('saveSection calls fetch with correct payload for academia', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      // Clear fetch mock calls from initial load
      ;(global.fetch as Mock).mockClear()
      mockFetchSuccess()

      // Find the General section's save button - it is the first "Guardar"
      const saveButtons = screen.getAllByText('Guardar')
      fireEvent.click(saveButtons[0]!)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/config',
          expect.objectContaining({
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: expect.stringContaining('"section":"academia"'),
          }),
        )
      })
    })

    it('saveSection calls fetch with correct payload for GDPR', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Privacidad y GDPR')).toBeInTheDocument()
      })

      ;(global.fetch as Mock).mockClear()
      mockFetchSuccess()

      // The GDPR save button — find by looking in the GDPR section
      const gdprSection = document.getElementById('gdpr')!
      const gdprSaveButton = within(gdprSection).getByText('Guardar')
      fireEvent.click(gdprSaveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/config',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"section":"gdpr"'),
          }),
        )
      })
    })

    it('saveSection calls fetch with correct payload for domains', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByDisplayValue('test.com')).toBeInTheDocument()
      })

      ;(global.fetch as Mock).mockClear()
      mockFetchSuccess()

      const dominiosSection = document.getElementById('dominios')!
      const domainsSaveButton = within(dominiosSection).getByText('Guardar')
      fireEvent.click(domainsSaveButton)

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          '/api/config',
          expect.objectContaining({
            method: 'PUT',
            body: expect.stringContaining('"section":"domains"'),
          }),
        )
      })
    })

    it('shows success feedback after save and calls refresh', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      ;(global.fetch as Mock).mockClear()
      mockFetchSuccess()

      const saveButtons = screen.getAllByText('Guardar')
      fireEvent.click(saveButtons[0]!)

      await waitFor(() => {
        expect(screen.getByText('Guardado')).toBeInTheDocument()
      })

      expect(mockRefresh).toHaveBeenCalled()
    })

    it('dispatches config-updated event after successful save', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      ;(global.fetch as Mock).mockClear()
      mockFetchSuccess()

      const saveButtons = screen.getAllByText('Guardar')
      fireEvent.click(saveButtons[0]!)

      await waitFor(() => {
        expect(mockDispatchEvent).toHaveBeenCalled()
      })
    })
  })

  // -----------------------------------------------------------------------
  // Error handling
  // -----------------------------------------------------------------------

  describe('Error handling', () => {
    it('handles network error on initial load gracefully', async () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      mockFetchError()

      render(<ConfiguracionUnifiedPage />)

      // Should eventually exit loading state even with errors
      await waitFor(() => {
        expect(screen.getByText('Todos los ajustes de tu academia en un solo lugar')).toBeInTheDocument()
      })

      expect(consoleSpy).toHaveBeenCalledWith(
        'Error loading configuration:',
        expect.any(Error),
      )

      consoleSpy.mockRestore()
    })

    it('handles save failure gracefully', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      // Make save requests fail
      ;(global.fetch as Mock).mockRejectedValue(new Error('Save failed'))

      const saveButtons = screen.getAllByText('Guardar')
      fireEvent.click(saveButtons[0]!)

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          expect.stringContaining('Error saving'),
          expect.any(Error),
        )
      })

      // Should NOT show "Guardado" after failure
      expect(screen.queryByText('Guardado')).not.toBeInTheDocument()

      consoleSpy.mockRestore()
    })

    it('save button re-enables after failed save', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Informacion General')).toBeInTheDocument()
      })

      vi.spyOn(console, 'error').mockImplementation(() => {})

      ;(global.fetch as Mock).mockRejectedValue(new Error('Save failed'))

      const saveButtons = screen.getAllByText('Guardar')
      fireEvent.click(saveButtons[0]!)

      // After error resolves, button should show "Guardar" again (not disabled)
      await waitFor(() => {
        const generalSection = document.getElementById('general')!
        const btn = within(generalSection).getByText('Guardar')
        expect(btn.closest('button')).not.toBeDisabled()
      })
    })
  })

  // -----------------------------------------------------------------------
  // Areas & APIs sections (link-only sections)
  // -----------------------------------------------------------------------

  describe('Link sections', () => {
    it('renders Areas section with "Gestionar" link', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('Areas de Estudio')).toBeInTheDocument()
      })

      const areasSection = document.getElementById('areas')!
      const gestLink = within(areasSection).getByText('Gestionar')
      expect(gestLink.closest('a')).toHaveAttribute('href', '/configuracion/areas')
    })

    it('renders APIs section with "Gestionar" link', async () => {
      mockFetchSuccess()
      render(<ConfiguracionUnifiedPage />)

      await waitFor(() => {
        expect(screen.getByText('API Keys y Webhooks')).toBeInTheDocument()
      })

      const apisSection = document.getElementById('apis')!
      const gestLink = within(apisSection).getByText('Gestionar')
      expect(gestLink.closest('a')).toHaveAttribute('href', '/configuracion/apis')
    })
  })
})
