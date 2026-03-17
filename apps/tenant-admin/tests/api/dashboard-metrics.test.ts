import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock NextResponse before importing the route
vi.mock('next/server', () => {
  return {
    NextResponse: {
      json: vi.fn((body: unknown, init?: { status?: number }) => ({
        body,
        status: init?.status ?? 200,
        _type: 'NextResponse',
      })),
    },
  }
})

// Import after mocks are set up
import { GET } from '@/app/api/dashboard/metrics/route'
import { NextResponse } from 'next/server'

function createMockRequest(
  url: string,
  options?: { cookies?: string }
): any {
  const parsedUrl = new URL(url, 'http://localhost:3009')
  return {
    nextUrl: parsedUrl,
    headers: {
      get: vi.fn((name: string) => {
        if (name === 'cookie') return options?.cookies ?? null
        return null
      }),
    },
  }
}

describe('Dashboard Metrics Proxy — GET /api/dashboard/metrics', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    // Default PORT env
    process.env.PORT = '3009'
  })

  it('proxies GET request to /api/dashboard with correct URL', async () => {
    const upstreamPayload = { success: true, data: { students: 42 } }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(upstreamPayload),
      status: 200,
    })

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics')
    await GET(req)

    expect(global.fetch).toHaveBeenCalledTimes(1)
    const fetchedUrl = (global.fetch as any).mock.calls[0][0] as URL
    expect(fetchedUrl.pathname).toBe('/api/dashboard')
    expect(fetchedUrl.origin).toBe('http://localhost:3009')
  })

  it('passes cookies from the original request', async () => {
    const cookieValue = 'payload-token=abc123; other=xyz'
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      status: 200,
    })

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics', {
      cookies: cookieValue,
    })
    await GET(req)

    const fetchOptions = (global.fetch as any).mock.calls[0][1]
    expect(fetchOptions.headers.cookie).toBe(cookieValue)
  })

  it('passes query params (tenantId) to upstream', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      status: 200,
    })

    const req = createMockRequest(
      'http://localhost:3009/api/dashboard/metrics?tenantId=tenant-abc&period=monthly'
    )
    await GET(req)

    const fetchedUrl = (global.fetch as any).mock.calls[0][0] as URL
    expect(fetchedUrl.searchParams.get('tenantId')).toBe('tenant-abc')
    expect(fetchedUrl.searchParams.get('period')).toBe('monthly')
  })

  it('returns upstream response body and status', async () => {
    const upstreamPayload = { success: true, metrics: { revenue: 1000 } }
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve(upstreamPayload),
      status: 201,
    })

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics')
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(upstreamPayload, { status: 201 })
  })

  it('returns 500 with error message on fetch failure', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'))

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics')
    await GET(req)

    expect(NextResponse.json).toHaveBeenCalledWith(
      {
        success: false,
        error: 'No se pudieron cargar las métricas del dashboard',
      },
      { status: 500 }
    )
  })

  it('uses localhost:PORT for internal proxy (not HTTPS)', async () => {
    process.env.PORT = '4000'
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      status: 200,
    })

    const req = createMockRequest('http://localhost:4000/api/dashboard/metrics')
    await GET(req)

    const fetchedUrl = (global.fetch as any).mock.calls[0][0] as URL
    expect(fetchedUrl.protocol).toBe('http:')
    expect(fetchedUrl.hostname).toBe('localhost')
    expect(fetchedUrl.port).toBe('4000')
  })

  it('defaults to port 3009 when PORT env is not set', async () => {
    delete process.env.PORT
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      status: 200,
    })

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics')
    await GET(req)

    const fetchedUrl = (global.fetch as any).mock.calls[0][0] as URL
    expect(fetchedUrl.port).toBe('3009')
  })

  it('sends empty string when no cookies are present', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      json: () => Promise.resolve({}),
      status: 200,
    })

    const req = createMockRequest('http://localhost:3009/api/dashboard/metrics')
    await GET(req)

    const fetchOptions = (global.fetch as any).mock.calls[0][1]
    expect(fetchOptions.headers.cookie).toBe('')
  })
})
