import { act, renderHook, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useSystemStatus } from '../../hooks/useSystemStatus'

const mockUseSocketContextOptional = vi.fn()

vi.mock('@akademate/realtime/context', () => ({
  useSocketContextOptional: () => mockUseSocketContextOptional(),
}))

function createSocketHarness() {
  const handlers = new Map<string, (payload: any) => void>()
  const socket = {
    emit: vi.fn(),
    on: vi.fn((event: string, handler: (payload: any) => void) => {
      handlers.set(event, handler)
    }),
    off: vi.fn((event: string) => {
      handlers.delete(event)
    }),
  }

  return { socket, handlers }
}

describe('useSystemStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('maps API data and computes aggregate metrics', async () => {
    mockUseSocketContextOptional.mockReturnValue({ socket: null, isConnected: false })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/ops/service-health')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            overall: 'operational',
            services: [
              { name: 'Payload CMS', status: 'operational', latencyMs: 100, uptime: 99.9, message: 'HTTP 200' },
              { name: 'PostgreSQL', status: 'degraded', latencyMs: 300, uptime: 97.5, message: 'Slow queries' },
            ],
            checkedAt: '2026-04-08T10:00:00.000Z',
          }),
        } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          cpu: 74,
          memory: { percent: 81 },
          uptime: { seconds: 7200 },
        }),
      } as Response)
    })

    const { result } = renderHook(() => useSystemStatus({ enableRealtime: false }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data.dataSource).toBe('real')
    expect(result.current.data.overallStatus).toBe('operational')
    expect(result.current.data.avgResponseTime).toBe(200)
    expect(result.current.data.avgUptime).toBe(98.7)
    expect(result.current.data.metrics).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'CPU', value: 74, status: 'warning' }),
        expect.objectContaining({ name: 'Memoria', value: 81, status: 'warning' }),
        expect.objectContaining({ name: 'Uptime', value: 2, unit: 'h' }),
      ])
    )
  })

  it('falls back to degraded source when health endpoint fails', async () => {
    mockUseSocketContextOptional.mockReturnValue({ socket: null, isConnected: false })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string) => {
      if (url.includes('/api/ops/service-health')) {
        return Promise.resolve({ ok: false } as Response)
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({
          cpu: 20,
          memory: { percent: 30 },
          uptime: { seconds: 3600 },
        }),
      } as Response)
    })

    const { result } = renderHook(() => useSystemStatus({ enableRealtime: false }))

    await waitFor(() => expect(result.current.loading).toBe(false))

    expect(result.current.data.dataSource).toBe('degraded')
    expect(result.current.data.overallStatus).toBe('degraded')
    expect(result.current.data.services[0]?.name).toBe('Monitoreo de servicios')
    expect(result.current.data.avgResponseTime).toBeNull()
  })

  it('subscribes to realtime updates and applies incoming payloads', async () => {
    const { socket, handlers } = createSocketHarness()
    mockUseSocketContextOptional.mockReturnValue({ socket, isConnected: true })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      json: async () => ({
        overall: 'operational',
        services: [
          { name: 'Payload CMS', status: 'operational', latencyMs: 100, uptime: 99, message: 'OK' },
        ],
        checkedAt: '2026-04-08T10:05:00.000Z',
      }),
    } as Response)

    const { result, unmount } = renderHook(() => useSystemStatus())

    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(socket.emit).toHaveBeenCalledWith('subscribe:room', 'system:status')

    const realtimeHandler = handlers.get('system:status')
    expect(realtimeHandler).toBeDefined()

    act(() => {
      realtimeHandler?.({
        overallStatus: 'down',
        services: [
          {
            name: 'Payload CMS',
            status: 'down',
            latency: 550,
            uptime: 95,
            lastChecked: '2026-04-08T10:06:00.000Z',
            details: 'HTTP 500',
          },
        ],
      })
    })

    expect(result.current.data.overallStatus).toBe('outage')
    expect(result.current.data.dataSource).toBe('real')
    expect(result.current.data.services[0]?.status).toBe('outage')
    expect(result.current.data.avgResponseTime).toBe(550)

    unmount()

    expect(socket.emit).toHaveBeenCalledWith('unsubscribe:room', 'system:status')
    expect(socket.off).toHaveBeenCalledWith('system:status', expect.any(Function))
  })
})
