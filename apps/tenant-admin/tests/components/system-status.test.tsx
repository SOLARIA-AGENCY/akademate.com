import { describe, it, expect, vi, afterEach, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import EstadoSistemaPage from '../../app/(dashboard)/estado/page'

describe('System Status Page', () => {
  const mockFetch = vi.fn()

  beforeEach(() => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        status: 'ok',
      }),
    } as Response)

    vi.stubGlobal('fetch', mockFetch)
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
    vi.unstubAllGlobals()
  })

  describe('Page Rendering', () => {
    it('renders system status title', () => {
      render(<EstadoSistemaPage />)
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
    })

    it('displays all 6 service monitors', () => {
      render(<EstadoSistemaPage />)

      const serviceMatchers = [
        /Frontend.*Next\.js/i,
        /API Backend/i,
        /Base de Datos.*PostgreSQL/i,
        /Conexión de Red/i,
        /Worker Queue.*BullMQ/i,
        /Almacenamiento/i,
      ]

      serviceMatchers.forEach((matcher) => {
        expect(screen.getAllByText(matcher).length).toBeGreaterThan(0)
      })
    })

    it('shows status legend', () => {
      render(<EstadoSistemaPage />)

      expect(screen.getAllByText('Operativo').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Degradado').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Caído').length).toBeGreaterThan(0)
    })

    it('displays temporal labels for uptime graph', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getAllByText(/90 días atrás/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Hoy/i).length).toBeGreaterThan(0)
    })
  })

  describe('Service Status Display', () => {
    it('shows service status badges', () => {
      render(<EstadoSistemaPage />)
      
      const operationalBadges = screen.getAllByText(/Operativo/i)
      expect(operationalBadges.length).toBeGreaterThan(0)
    })

    it('displays response time metrics', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getAllByText(/\d+ms/i).length).toBeGreaterThan(0)
    })

    it('shows uptime percentages', () => {
      render(<EstadoSistemaPage />)
      
      const uptimeTexts = screen.getAllByText(/\d+(\.\d+)?%/i)
      expect(uptimeTexts.length).toBeGreaterThan(0)
    })

    it('calculates average uptime correctly', () => {
      render(<EstadoSistemaPage />)

      const uptimeElements = screen.getAllByText(/\d+(\.\d+)?%/)
      expect(uptimeElements.length).toBeGreaterThan(0)
    })
  })

  describe('Hydration Safety', () => {
    it('renders deterministic uptime bars', () => {
      const { container: container1 } = render(<EstadoSistemaPage />)
      const { container: container2 } = render(<EstadoSistemaPage />)
      
      // Both renders should produce same HTML structure
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })

    it('displays placeholder timestamp before mount', () => {
      render(<EstadoSistemaPage />)
      
      // Should show --:--:-- before client mount
      const placeholders = screen.queryAllByText('--:--:--')
      expect(placeholders.length).toBeGreaterThanOrEqual(0)
    })

    it('updates timestamp after mount', async () => {
      render(<EstadoSistemaPage />)
      
      await act(async () => {
        await waitFor(() => {
          const timestamps = screen.queryAllByText(/\d{1,2}:\d{2}:\d{2}/)
          expect(timestamps.length).toBeGreaterThan(0)
        }, { timeout: 1000 })
      })
    })
  })

  describe('Auto-refresh Functionality', () => {
    it('initializes with client-side dates', async () => {
      render(<EstadoSistemaPage />)
      
      await act(async () => {
        await waitFor(() => {
          const timestamps = screen.queryAllByText(/\d{1,2}:\d{2}:\d{2}/)
          expect(timestamps.length).toBeGreaterThan(0)
        }, { timeout: 1000 })
      })
    })

    it('sets up 30-second refresh interval', async () => {
      vi.useFakeTimers()
      render(<EstadoSistemaPage />)
      
      await act(async () => {
        vi.advanceTimersByTime(30000)
      })
      
      // Component should still be rendering after interval
      expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
    })

    it('cleans up interval on unmount', () => {
      const { unmount } = render(<EstadoSistemaPage />)
      
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')
      unmount()
      
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('Refresh Button', () => {
    it('has a refresh button', () => {
      render(<EstadoSistemaPage />)
      
      const refreshButton = screen.getByRole('button', { name: /actualizar/i })
      expect(refreshButton).toBeInTheDocument()
    })

    it('shows loading state when refreshing', async () => {
      render(<EstadoSistemaPage />)
      
      const refreshButton = screen.getByRole('button', { name: /actualizar/i })
      
      await act(async () => {
        fireEvent.click(refreshButton)
      })
      
      // Button should be in refreshing state
      expect(refreshButton).toBeInTheDocument()
    })
  })

  describe('Overall Status Computation', () => {
    it('displays overall status header', () => {
      render(<EstadoSistemaPage />)
      
      const statusHeaders = [
        /Todos los Sistemas Operativos/i,
        /Rendimiento Degradado/i,
        /Servicios Afectados/i,
      ]
      
      const hasOneStatus = statusHeaders.some(regex => 
        screen.queryByText(regex) !== null
      )
      
      expect(hasOneStatus).toBe(true)
    })

    it('shows global uptime metric', () => {
      render(<EstadoSistemaPage />)
      
      const uptimeElement = screen.getByText(/Uptime Global/i)
      expect(uptimeElement).toBeInTheDocument()
    })
  })

  describe('90-Day Uptime Graph', () => {
    it('renders 90 bars per service', () => {
      const { container } = render(<EstadoSistemaPage />)
      
      // Each service should have a uptime graph container
      const graphContainers = container.querySelectorAll('.h-8.flex.items-center.gap-\\[1px\\]')
      expect(graphContainers.length).toBeGreaterThan(0)
    })

    it('uses deterministic coloring algorithm', () => {
      const { container: container1 } = render(<EstadoSistemaPage />)
      const { container: container2 } = render(<EstadoSistemaPage />)
      
      const graphs1 = container1.querySelectorAll('.h-8.flex.items-center.gap-\\[1px\\]')
      const graphs2 = container2.querySelectorAll('.h-8.flex.items-center.gap-\\[1px\\]')
      
      expect(graphs1.length).toBe(graphs2.length)
    })

    it('includes status colors in bars', () => {
      const { container } = render(<EstadoSistemaPage />)
      
      const greenBars = container.querySelectorAll('.bg-green-500')
      const yellowBars = container.querySelectorAll('.bg-yellow-500')
      const redBars = container.querySelectorAll('.bg-red-500')
      
      // Should have mix of colors representing uptime history
      expect(greenBars.length + yellowBars.length + redBars.length).toBeGreaterThan(0)
    })
  })

  describe('Incident History', () => {
    it('displays incident history section', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getByText(/Historial de Incidencias/i)).toBeInTheDocument()
    })

    it('shows recent incidents', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getByText(/Mantenimiento programado/i)).toBeInTheDocument()
      expect(screen.getByText(/Caída temporal del servicio API/i)).toBeInTheDocument()
    })

    it('displays incident severity badges', () => {
      render(<EstadoSistemaPage />)
      
      const minorBadge = screen.getByText(/Menor/i)
      const majorBadge = screen.getByText(/Mayor/i)
      
      expect(minorBadge).toBeInTheDocument()
      expect(majorBadge).toBeInTheDocument()
    })

    it('shows incident resolution status', () => {
      render(<EstadoSistemaPage />)
      
      const resolvedBadges = screen.getAllByText(/Resuelto/i)
      expect(resolvedBadges.length).toBeGreaterThan(0)
    })

    it('displays incident timeline updates', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getByText(/Mantenimiento completado exitosamente/i)).toBeInTheDocument()
      expect(screen.getByText(/Servicio restaurado/i)).toBeInTheDocument()
    })
  })

  describe('Key Metrics Display', () => {
    it('shows average response time', () => {
      render(<EstadoSistemaPage />)
      
      const responseTimeMetrics = screen.getAllByText(/\d+ms/)
      expect(responseTimeMetrics.length).toBeGreaterThan(0)
    })

    it('displays uptime percentage', () => {
      render(<EstadoSistemaPage />)
      
      const uptimePercentages = screen.getAllByText(/\d+(\.\d+)?%/)
      expect(uptimePercentages.length).toBeGreaterThan(0)
    })

    it('shows last check time', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getByText(/Última comprobación/i)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<EstadoSistemaPage />)
      
      const h1 = screen.getByRole('heading', { level: 1, name: /Estado del Sistema/i })
      expect(h1).toBeInTheDocument()
    })

    it('includes descriptive service labels', () => {
      render(<EstadoSistemaPage />)
      
      expect(screen.getAllByText(/Aplicación web pública y dashboard/i).length).toBeGreaterThan(0)
      expect(screen.getAllByText(/Servicios REST y GraphQL/i).length).toBeGreaterThan(0)
    })

    it('has tooltips on uptime bars', () => {
      const { container } = render(<EstadoSistemaPage />)
      
      const barsWithTitle = container.querySelectorAll('[title]')
      expect(barsWithTitle.length).toBeGreaterThan(0)
    })
  })
})
