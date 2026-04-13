import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetPayloadHMR,
  mockFind,
  mockCreate,
  mockExecute,
  mockPayload,
} = vi.hoisted(() => {
  const mockGetPayloadHMR = vi.fn()
  const mockFind = vi.fn()
  const mockCreate = vi.fn()
  const mockExecute = vi.fn()

  const mockPayload = {
    find: mockFind,
    create: mockCreate,
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return {
    mockGetPayloadHMR,
    mockFind,
    mockCreate,
    mockExecute,
    mockPayload,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

describe('Track route - POST /api/track', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    mockFind.mockResolvedValue({
      docs: [
        {
          id: 2,
          integrations_meta_pixel_id: '',
          integrations_meta_conversions_api_token: '',
        },
      ],
    })
    mockExecute.mockResolvedValue({ rows: [] })
    mockCreate.mockResolvedValue({ id: 10 })
  })

  it('stores page_view events in traffic_events with idempotent conflict clause', async () => {
    const { POST } = await import('@/app/api/track/route')

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'user-agent': 'Vitest UA' },
      body: JSON.stringify({
        path: '/landing/farmacia',
        referrer: 'https://google.com',
        event_id: 'evt-page-1',
        userAgent: 'Vitest UA',
        utm_source: 'google',
        utm_medium: 'cpc',
        utm_campaign: 'solaria-farmacia',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(mockCreate).not.toHaveBeenCalled()

    const executedSql = mockExecute.mock.calls.map(([sql]: [string]) => sql)
    expect(executedSql.some((sql: string) => sql.includes('CREATE TABLE IF NOT EXISTS traffic_events'))).toBe(true)
    expect(executedSql.some((sql: string) => sql.includes('INSERT INTO traffic_events'))).toBe(true)
    expect(executedSql.some((sql: string) => sql.includes("ON CONFLICT (tenant_id, event_id) DO NOTHING"))).toBe(
      true
    )
    expect(executedSql.some((sql: string) => sql.includes("'page_view'"))).toBe(true)
  })

  it('stores lead event and creates lead with tenant + UTM attribution', async () => {
    const { POST } = await import('@/app/api/track/route')

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'lead',
        first_name: 'Carmen',
        last_name: 'Test',
        email: 'carmen@example.com',
        phone: '+34111111111',
        event_id: 'evt-lead-1',
        path: '/inscripcion',
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'solaria-leads',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        data: expect.objectContaining({
          first_name: 'Carmen',
          last_name: 'Test',
          tenant: 2,
          utm_source: 'facebook',
          utm_medium: 'cpc',
          utm_campaign: 'solaria-leads',
        }),
      })
    )

    const executedSql = mockExecute.mock.calls.map(([sql]: [string]) => sql)
    expect(executedSql.some((sql: string) => sql.includes("'lead'"))).toBe(true)
  })

  it('short-circuits gracefully when tenant is not available', async () => {
    const { POST } = await import('@/app/api/track/route')
    mockFind.mockResolvedValueOnce({ docs: [] })

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/landing' }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(mockExecute).not.toHaveBeenCalled()
    expect(mockCreate).not.toHaveBeenCalled()
  })
})

