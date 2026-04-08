import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const mockQuery = vi.fn()

async function loadRoute() {
  vi.resetModules()
  vi.doMock('@/lib/db', () => ({
    getDb: () => ({
      query: mockQuery,
    }),
  }))
  return import('@/app/api/ops/service-health/route')
}

function configureHealthyDbWithTenant() {
  mockQuery.mockImplementation(async (sql: string) => {
    if (sql.includes('FROM tenants')) {
      return {
        rows: [
          {
            name: 'Tenant Uno',
            slug: 'tenant-uno',
            domain: 'tenant-uno.akademate.com',
            active: true,
          },
        ],
      }
    }
    if (sql.includes('SELECT 1')) {
      return { rows: [{ '?column?': 1 }] }
    }
    return { rows: [] }
  })
}

describe('GET /api/ops/service-health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.OPS_HEALTH_EXTRA_CHECKS
    delete process.env.OPS_WEB_URL
    delete process.env.OPS_APP_URL
    delete process.env.OPS_STATUS_URL
    delete process.env.OPS_TENANT_BASE_DOMAIN
    delete process.env.S3_ENDPOINT

    vi.stubGlobal(
      'setImmediate',
      ((callback: (...args: unknown[]) => void, ...args: unknown[]) => {
        callback(...args)
        return 0
      }) as unknown as typeof setImmediate
    )
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns operational health and deduplicates extra checks', async () => {
    process.env.OPS_WEB_URL = 'akademate.com'
    process.env.OPS_APP_URL = 'app.akademate.com/auth/login'
    process.env.OPS_STATUS_URL = 'status.akademate.com'
    process.env.OPS_HEALTH_EXTRA_CHECKS = JSON.stringify([
      { name: 'Extra monitor', url: 'extra.akademate.com' },
      { name: 'Extra monitor', url: 'extra.akademate.com' },
    ])

    configureHealthyDbWithTenant()
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    const { GET } = await loadRoute()
    const response = await GET(new Request('http://localhost:3010/api/ops/service-health'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.overall).toBe('operational')
    expect(payload.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: 'PostgreSQL', status: 'operational' }),
        expect.objectContaining({ name: 'Payload CMS', status: 'operational' }),
        expect.objectContaining({ name: 'Payload Auth', status: 'operational' }),
        expect.objectContaining({ name: 'Tenant Uno (tenant)', status: 'operational' }),
        expect.objectContaining({ name: 'Tenant Uno /admin', status: 'operational' }),
        expect.objectContaining({ name: 'Ops Dashboard', status: 'operational' }),
      ])
    )

    const extraChecks = payload.services.filter((service: { name: string }) => service.name === 'Extra monitor')
    expect(extraChecks).toHaveLength(1)

    expect(mockQuery).toHaveBeenCalledWith(expect.stringContaining('CREATE TABLE IF NOT EXISTS service_health_history'))
    expect(mockQuery).toHaveBeenCalledWith(
      expect.stringContaining('INSERT INTO service_health_history'),
      expect.any(Array)
    )
  })

  it('returns outage when S3 endpoint is unreachable', async () => {
    process.env.S3_ENDPOINT = 'https://s3.akademate.com'
    process.env.OPS_HEALTH_EXTRA_CHECKS = 'not-a-json'

    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM tenants')) {
        throw new Error('tenant lookup failed')
      }
      if (sql.includes('SELECT 1')) {
        return { rows: [{ '?column?': 1 }] }
      }
      return { rows: [] }
    })

    ;(global.fetch as ReturnType<typeof vi.fn>).mockImplementation((url: string | URL | Request) => {
      const value = typeof url === 'string' ? url : url.toString()
      if (value === 'https://s3.akademate.com') {
        return Promise.reject(new Error('s3 down'))
      }
      return Promise.resolve({ ok: true, status: 200 } as Response)
    })

    const { GET } = await loadRoute()
    const response = await GET(new Request('http://localhost:3010/api/ops/service-health'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.overall).toBe('outage')
    expect(payload.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'S3 / Almacenamiento',
          status: 'outage',
          message: 'No responde',
        }),
      ])
    )
  })

  it('reports PostgreSQL outage when database probe fails', async () => {
    mockQuery.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM tenants')) {
        return { rows: [] }
      }
      if (sql.includes('SELECT 1')) {
        throw new Error('database unavailable')
      }
      return { rows: [] }
    })
    ;(global.fetch as ReturnType<typeof vi.fn>).mockResolvedValue({
      ok: true,
      status: 200,
    } as Response)

    const { GET } = await loadRoute()
    const response = await GET(new Request('http://localhost:3010/api/ops/service-health'))
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.overall).toBe('outage')
    expect(payload.services).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          name: 'PostgreSQL',
          status: 'outage',
          message: 'database unavailable',
        }),
      ])
    )
  })
})
