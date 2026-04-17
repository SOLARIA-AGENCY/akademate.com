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
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('information_schema.columns')) {
        return {
          rows: [
            { column_name: 'source_form' },
            { column_name: 'source_page' },
            { column_name: 'lead_type' },
            { column_name: 'campaign_code' },
            { column_name: 'source_details' },
          ],
        }
      }
      return { rows: [] }
    })

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
          phone: '+34 111 111 111',
          tenant: 2,
          gdpr_consent: true,
          privacy_policy_accepted: true,
          utm_source: 'facebook',
          utm_medium: 'cpc',
          utm_campaign: 'solaria-leads',
        }),
      })
    )

    const executedSql = mockExecute.mock.calls.map(([sql]: [string]) => sql)
    expect(executedSql.some((sql: string) => sql.includes("'lead'"))).toBe(true)
    const updateLeadSql = executedSql.find((sql: string) => sql.includes('UPDATE leads SET'))
    expect(updateLeadSql).toContain("source_form = 'web_form'")
    expect(updateLeadSql).toContain("campaign_code = 'solaria-leads'")
  })

  it('stores custom form events for funnel analytics', async () => {
    const { POST } = await import('@/app/api/track/route')

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        type: 'event',
        event_type: 'form_click',
        event_id: 'evt-form-click-1',
        path: '/p/convocatorias/SC-2026-002',
        utm_source: 'facebook',
        utm_medium: 'cpc',
        utm_campaign: 'solaria-higiene',
      }),
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    const executedSql = mockExecute.mock.calls.map(([sql]: [string]) => sql)
    expect(executedSql.some((sql: string) => sql.includes("'form_click'"))).toBe(true)
  })

  it('short-circuits gracefully when tenant is not available', async () => {
    const { POST } = await import('@/app/api/track/route')
    mockFind.mockResolvedValue({ docs: [] })
    mockExecute.mockResolvedValue({ rows: [] })

    const request = new NextRequest('http://localhost/api/track', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ path: '/landing' }),
    })

    const response = await POST(request)
    const payload = await response.json()
    const executedSql = mockExecute.mock.calls.map(([sql]: [string]) => sql)

    expect(response.status).toBe(200)
    expect(payload).toEqual({ ok: true })
    expect(executedSql.some((sql: string) => sql.includes('INSERT INTO traffic_events'))).toBe(false)
    expect(mockCreate).not.toHaveBeenCalled()
  })
})
