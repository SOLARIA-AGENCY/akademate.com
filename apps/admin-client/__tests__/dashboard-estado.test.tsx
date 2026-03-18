import { render, screen, waitFor } from '@testing-library/react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import EstadoPage from '@/app/dashboard/estado/page'

// Mock data
const mockServerMetrics = {
  cpu: 23,
  memory: { used: 1500, total: 4096, percent: 37 },
  uptime: { seconds: 864000, display: '10d 0h' },
  platform: 'linux',
  arch: 'x64',
  hostname: 'akademate-prod',
  source: 'hetzner' as const,
  serverInfo: {
    name: 'akademate-prod',
    ip: '46.62.222.138',
    type: 'cax11',
    datacenter: 'fsn1',
    status: 'running',
  },
  hetzner: {
    cpu: 23,
    diskRead: 100,
    diskWrite: 50,
    networkIn: 1000,
    networkOut: 500,
  },
}

const mockServiceHealth = {
  overall: 'operational' as const,
  operationalCount: 4,
  totalServices: 4,
  services: [
    {
      name: 'akademate.com',
      status: 'operational' as const,
      latencyMs: 42,
      message: 'OK — 200',
      uptime: 99.99,
    },
    {
      name: 'app.akademate.com',
      status: 'operational' as const,
      latencyMs: 65,
      message: 'OK — 200',
      uptime: 99.95,
    },
    {
      name: 'admin.akademate.com',
      status: 'operational' as const,
      latencyMs: 38,
      message: 'OK — 200',
      uptime: 100,
    },
    {
      name: 'PostgreSQL',
      status: 'operational' as const,
      latencyMs: 5,
      message: 'Connected',
      uptime: 100,
    },
  ],
  checkedAt: new Date().toISOString(),
}

function setupFetchMock(options?: {
  metricsOk?: boolean
  healthOk?: boolean
  metricsData?: typeof mockServerMetrics | null
  healthData?: typeof mockServiceHealth | null
}) {
  const {
    metricsOk = true,
    healthOk = true,
    metricsData = mockServerMetrics,
    healthData = mockServiceHealth,
  } = options ?? {}

  ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
    if (url.includes('/api/ops/server-metrics')) {
      return Promise.resolve({
        ok: metricsOk,
        json: () => Promise.resolve(metricsData),
      })
    }
    if (url.includes('/api/ops/service-health')) {
      return Promise.resolve({
        ok: healthOk,
        json: () => Promise.resolve(healthData),
      })
    }
    return Promise.resolve({ ok: false, json: () => Promise.resolve(null) })
  })
}

describe('EstadoPage', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    setupFetchMock()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders the page title "Estado del Sistema"', async () => {
    render(<EstadoPage />)
    expect(screen.getByText('Estado del Sistema')).toBeInTheDocument()
  })

  it('renders the page description', async () => {
    render(<EstadoPage />)
    expect(
      screen.getByText('Monitorea el estado de todos los servicios de la plataforma')
    ).toBeInTheDocument()
  })

  it('shows server info card with Hetzner data after loading', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Servidor Hetzner')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('akademate-prod')).toBeInTheDocument()
      expect(screen.getByText('46.62.222.138')).toBeInTheDocument()
      expect(screen.getByText('cax11')).toBeInTheDocument()
      expect(screen.getByText('fsn1')).toBeInTheDocument()
      expect(screen.getByText('Activo')).toBeInTheDocument()
    })
  })

  it('shows Estado de Servicios section with service list', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Estado de Servicios')).toBeInTheDocument()
    })

    await waitFor(() => {
      expect(screen.getByText('akademate.com')).toBeInTheDocument()
      expect(screen.getByText('app.akademate.com')).toBeInTheDocument()
      expect(screen.getByText('admin.akademate.com')).toBeInTheDocument()
      expect(screen.getByText('PostgreSQL')).toBeInTheDocument()
    })
  })

  it('shows CPU metric card with value', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('CPU')).toBeInTheDocument()
      expect(screen.getByText('23')).toBeInTheDocument()
    })
  })

  it('shows RAM metric card with value', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Memoria RAM')).toBeInTheDocument()
      expect(screen.getByText('37')).toBeInTheDocument()
      expect(screen.getByText('1500 / 4096 MB')).toBeInTheDocument()
    })
  })

  it('shows Uptime Kuma iframe section', async () => {
    render(<EstadoPage />)

    expect(screen.getByText(/Uptime Kuma/)).toBeInTheDocument()
    const iframe = screen.getByTitle('Uptime Kuma — Dashboard completo')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', 'https://status.akademate.com/dashboard')
  })

  it('shows Incidentes Recientes section', async () => {
    render(<EstadoPage />)

    expect(screen.getByText('Incidentes Recientes')).toBeInTheDocument()
    expect(screen.getByText('Sin incidentes activos')).toBeInTheDocument()
  })

  it('shows the overall status banner with operational label', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Todos los sistemas operativos')).toBeInTheDocument()
      expect(screen.getByText('4/4 servicios operativos')).toBeInTheDocument()
    })
  })

  it('shows "Cargando..." before data arrives', () => {
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    render(<EstadoPage />)
    expect(screen.getByText('Cargando...')).toBeInTheDocument()
  })

  it('shows Actualizar button', () => {
    render(<EstadoPage />)
    expect(screen.getByText('Actualizar')).toBeInTheDocument()
  })

  it('shows uptime display in the server info card', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      // Appears in server info card and in uptime metric card
      const uptimeElements = screen.getAllByText('10d 0h')
      expect(uptimeElements.length).toBeGreaterThanOrEqual(1)
    })
  })

  it('shows service latency and uptime values', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('42ms')).toBeInTheDocument()
      expect(screen.getByText('99.99%')).toBeInTheDocument()
    })
  })

  it('shows Hetzner API as data source', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Fuente de datos')).toBeInTheDocument()
      expect(screen.getByText('Hetzner API')).toBeInTheDocument()
      expect(screen.getByText('Actualiza cada 30s')).toBeInTheDocument()
    })
  })

  it('shows "Operativo" status badges for operational services', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      const badges = screen.getAllByText('Operativo')
      expect(badges.length).toBe(4)
    })
  })

  it('shows degraded status when overall is degraded', async () => {
    setupFetchMock({
      healthData: {
        ...mockServiceHealth,
        overall: 'degraded',
        operationalCount: 3,
        services: [
          ...mockServiceHealth.services.slice(0, 3),
          {
            name: 'PostgreSQL',
            status: 'degraded' as const,
            latencyMs: 500,
            message: 'Slow queries',
            uptime: 98,
          },
        ],
      },
    })

    render(<EstadoPage />)

    await waitFor(() => {
      expect(screen.getByText('Algunos sistemas degradados')).toBeInTheDocument()
    })
  })

  it('calls fetch for both endpoints on mount', async () => {
    render(<EstadoPage />)

    await waitFor(() => {
      const fetchMock = global.fetch as ReturnType<typeof vi.fn>
      const calls = fetchMock.mock.calls.map((c: [string]) => c[0])
      expect(calls).toContain('/api/ops/server-metrics')
      expect(calls).toContain('/api/ops/service-health')
    })
  })
})
