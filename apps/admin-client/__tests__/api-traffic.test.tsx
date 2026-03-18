import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import ApiPage from '@/app/dashboard/api/page'

// ── Mock data ────────────────────────────────────────────────────────────────

const mockTrafficSummary = {
  totalRequests: 8750,
  avgLatencyMs: 92,
  errorRate: 3.1,
  serverErrorRate: 0.5,
  errorCount: 271,
  serverErrorCount: 44,
  uniqueIps: 63,
}

const mockTrafficEndpoints = {
  endpoints: [
    {
      path: '/api/ops/metrics',
      method: 'GET',
      requests: 5200,
      avgLatencyMs: 45,
      errors: 12,
      errorRate: 0.23,
    },
    {
      path: '/api/ops/health',
      method: 'GET',
      requests: 3100,
      avgLatencyMs: 22,
      errors: 0,
      errorRate: 0,
    },
  ],
}

const mockTrafficAlertsWithData = {
  alerts: [
    {
      type: 'rate_abuse' as const,
      severity: 'critical' as const,
      message: 'IP 192.168.1.100 ha superado 1000 requests en 1 hora',
      metadata: { ip: '192.168.1.100', count: 1200 },
    },
    {
      type: 'high_error_rate' as const,
      severity: 'warning' as const,
      message: 'Endpoint /api/upload tiene tasa de error del 35%',
      metadata: { path: '/api/upload', errorRate: 35 },
    },
  ],
}

const mockTrafficAlertsEmpty = { alerts: [] }

const mockApiStats = {
  period: '24h',
  summary: {
    totalRequests: 500,
    avgLatencyMs: 40,
    errorRate: 1.0,
    errorCount: 5,
  },
  topEndpoints: [],
  topIps: [],
  byStatus: [],
}

function setupFetchMock(options?: { alerts?: typeof mockTrafficAlertsWithData }) {
  const alerts = options?.alerts ?? mockTrafficAlertsEmpty

  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
    (url: string) => {
      if (typeof url === 'string') {
        // API stats summary for traffic tab
        if (url.includes('/api/ops/api-stats') && url.includes('type=summary')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrafficSummary),
          })
        }
        // API stats by endpoint for traffic tab
        if (url.includes('/api/ops/api-stats') && url.includes('type=byEndpoint')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockTrafficEndpoints),
          })
        }
        // Alerts endpoint
        if (url.includes('/api/ops/api-stats/alerts')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(alerts),
          })
        }
        // General api-stats (initial load)
        if (url.includes('/api/ops/api-stats')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiStats),
          })
        }
        // API keys (initial load)
        if (url.includes('/api/ops/api-keys')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        // Logs
        if (url.includes('/api/ops/logs')) {
          return Promise.resolve({
            ok: true,
            json: () =>
              Promise.resolve({ docs: [], total: 0, page: 1, totalPages: 0 }),
          })
        }
      }
      return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
    }
  )
}

// ── Tests ────────────────────────────────────────────────────────────────────

describe('ApiPage — Traffic Tab', () => {
  beforeEach(() => {
    setupFetchMock()
  })

  it('renders all 4 tabs including "Traffic"', () => {
    render(<ApiPage />)

    // Many labels appear both in endpoint list and tab buttons, use getAllByText
    const endpointsElements = screen.getAllByText('Endpoints')
    expect(endpointsElements.length).toBeGreaterThanOrEqual(1)
    const apiKeysElements = screen.getAllByText('API Keys')
    expect(apiKeysElements.length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Logs')).toBeInTheDocument()
    expect(screen.getByText('Traffic')).toBeInTheDocument()
  })

  it('traffic tab shows summary cards when selected', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      // Traffic-unique labels
      expect(screen.getByText('IPs unicas')).toBeInTheDocument()
      expect(screen.getByText('Total en las ultimas 24h')).toBeInTheDocument()
      expect(screen.getByText('Promedio por request')).toBeInTheDocument()
      expect(screen.getByText('Clientes distintos')).toBeInTheDocument()
    })

    await waitFor(() => {
      // Traffic-specific values (unique from main stats)
      expect(screen.getByText('8,750')).toBeInTheDocument()
      expect(screen.getByText('63')).toBeInTheDocument()
    })
  })

  it('traffic tab shows "Sin alertas activas" when no abuse detected', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Sin alertas activas')).toBeInTheDocument()
      expect(
        screen.getByText(
          'No se detectan patrones de abuso en este momento.'
        )
      ).toBeInTheDocument()
    })
  })

  it('traffic tab shows top endpoints table', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Top Endpoints (24h)')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('/api/ops/metrics')).toBeInTheDocument()
      expect(screen.getByText('/api/ops/health')).toBeInTheDocument()
      expect(screen.getByText('5,200')).toBeInTheDocument()
      expect(screen.getByText('3,100')).toBeInTheDocument()
    })
  })

  it('traffic tab shows endpoint table column headers', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Tasa error')).toBeInTheDocument()
      // Use getAllByText for shared column names
      const methodHeaders = screen.getAllByText('Errores')
      expect(methodHeaders.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('traffic tab shows critical/warning badges for alerts', async () => {
    setupFetchMock({ alerts: mockTrafficAlertsWithData })

    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Alertas activas')).toBeInTheDocument()
      expect(screen.getByText('CRITICO')).toBeInTheDocument()
      expect(screen.getByText('AVISO')).toBeInTheDocument()
    })
  })

  it('traffic tab shows alert messages', async () => {
    setupFetchMock({ alerts: mockTrafficAlertsWithData })

    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(
        screen.getByText(
          'IP 192.168.1.100 ha superado 1000 requests en 1 hora'
        )
      ).toBeInTheDocument()
      expect(
        screen.getByText(
          'Endpoint /api/upload tiene tasa de error del 35%'
        )
      ).toBeInTheDocument()
    })
  })

  it('traffic tab shows alert type descriptions', async () => {
    setupFetchMock({ alerts: mockTrafficAlertsWithData })

    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Abuso de tasa')).toBeInTheDocument()
      expect(screen.getByText('Alta tasa de error')).toBeInTheDocument()
    })
  })

  it('traffic tab shows loading state initially', async () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      (url: string) => {
        if (typeof url === 'string' && url.includes('/api/ops/api-keys')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve([]),
          })
        }
        if (typeof url === 'string' && url.includes('/api/ops/api-stats') && !url.includes('type=')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve(mockApiStats),
          })
        }
        // Traffic-specific endpoints never resolve
        return new Promise(() => {})
      }
    )

    render(<ApiPage />)
    fireEvent.click(screen.getByText('Traffic'))

    expect(
      screen.getByText('Cargando datos de trafico...')
    ).toBeInTheDocument()
  })

  it('traffic tab shows Actualizar button', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText('Actualizar')).toBeInTheDocument()
    })
  })

  it('traffic tab shows error count in summary', async () => {
    render(<ApiPage />)

    fireEvent.click(screen.getByText('Traffic'))

    await waitFor(() => {
      expect(screen.getByText(/271 errores/)).toBeInTheDocument()
    })
  })

  it('does not show traffic content when on endpoints tab', () => {
    render(<ApiPage />)

    expect(screen.queryByText('IPs unicas')).not.toBeInTheDocument()
    expect(screen.queryByText('Sin alertas activas')).not.toBeInTheDocument()
  })
})
