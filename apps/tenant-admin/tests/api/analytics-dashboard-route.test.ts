import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetPayloadHMR,
  mockGetAuthenticatedUserContext,
  mockListCampaigns,
  mockGetCampaignInsights,
  mockExecute,
  mockFind,
  mockPayload,
} = vi.hoisted(() => {
  const mockGetPayloadHMR = vi.fn()
  const mockGetAuthenticatedUserContext = vi.fn()
  const mockListCampaigns = vi.fn()
  const mockGetCampaignInsights = vi.fn()
  const mockExecute = vi.fn()
  const mockFind = vi.fn()

  const mockPayload = {
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
    find: mockFind,
  }

  return {
    mockGetPayloadHMR,
    mockGetAuthenticatedUserContext,
    mockListCampaigns,
    mockGetCampaignInsights,
    mockExecute,
    mockFind,
    mockPayload,
  }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: mockGetAuthenticatedUserContext,
}))

vi.mock('@/src/lib/meta-marketing', () => ({
  listCampaigns: mockListCampaigns,
  getCampaignInsights: mockGetCampaignInsights,
}))

import { GET } from '@/app/api/analytics/dashboard/route'

function mockTrafficSql(sql: string) {
  if (sql.includes('CREATE TABLE IF NOT EXISTS traffic_events')) {
    return { rows: [] }
  }

  if (sql.includes('FROM tenants')) {
    return {
      rows: [
        {
          id: 2,
          name: 'CEP FORMACION',
          integrations_meta_ad_account_id: '730494526974837',
          integrations_meta_marketing_api_token: 'token-meta',
          integrations_ga4_measurement_id: 'G-XXXX',
        },
      ],
    }
  }

  if (sql.includes('GROUP BY DATE(created_at)')) {
    return {
      rows: [{ day: '2026-04-10', total: 12, facebook: 5, google: 2 }],
    }
  }

  if (sql.includes("event_type = 'page_view'")) {
    return {
      rows: [{ path: '/ciclos/farmacia', views: 9 }],
    }
  }

  if (sql.includes('GROUP BY 1, 2')) {
    return {
      rows: [{ source: 'facebook', medium: 'cpc', sessions: 5 }],
    }
  }

  return { rows: [] }
}

describe('Analytics dashboard route - GET /api/analytics/dashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
    delete process.env.GA4_PROPERTY_ID
    delete process.env.GA4_API_BEARER_TOKEN
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('returns 401 when user is unauthenticated', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload).toMatchObject({ error: 'No autenticado' })
  })

  it('builds analytics payload using internal traffic fallback and SOLARIA-only campaign coverage', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => mockTrafficSql(sql))

    mockFind.mockResolvedValue({
      docs: [
        { id: 1, name: 'SOLARIA AGENCY - Linked', meta_campaign_id: '111' },
        { id: 2, name: 'X SOLARIA AGENCY - should-not-link', meta_campaign_id: '222' },
      ],
    })

    mockListCampaigns.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '111',
            name: 'SOLARIA AGENCY - Linked',
            status: 'ACTIVE',
            daily_budget: '3000',
            created_time: '2026-03-01T00:00:00-0700',
          },
          {
            id: '333',
            name: 'SOLARIA AGENCY - New',
            status: 'PAUSED',
            daily_budget: '2000',
            created_time: '2026-04-01T00:00:00-0700',
          },
          {
            id: '444',
            name: 'SOLARIA AGENCY - Legacy 2025',
            status: 'ACTIVE',
            daily_budget: '1500',
            created_time: '2025-12-15T00:00:00-0700',
          },
          {
            id: '222',
            name: 'X SOLARIA AGENCY - should-not-appear',
            status: 'ACTIVE',
            daily_budget: '1000',
            created_time: '2026-03-01T00:00:00-0700',
          },
        ],
      },
    })

    mockGetCampaignInsights.mockResolvedValue({
      data: {
        data: [
          {
            impressions: '1000',
            clicks: '100',
            spend: '50',
            actions: [{ action_type: 'lead', value: '4' }],
            purchase_roas: [{ value: '2.5' }],
          },
        ],
      },
    })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health).toMatchObject({
      traffic: 'internal',
      facebook: 'meta_api',
    })

    expect(payload.facebook.campaigns).toHaveLength(2)
    expect(payload.facebook.campaigns.every((c: any) => c.name.startsWith('SOLARIA AGENCY'))).toBe(
      true
    )
    expect(payload.facebook.campaigns.every((c: any) => !String(c.name).includes('2025'))).toBe(true)
    expect(payload.campaigns).toMatchObject({
      linked: 1,
      detected: 2,
      not_linked: 1,
    })
    expect(payload.facebook.active_campaigns).toBe(1)
    expect(payload.overview.total_conversions).toBe(4)
    expect(payload.facebook.campaigns.find((c: any) => c.id === '111')).toMatchObject({
      linked: true,
      spend: 50,
    })
    expect(payload.source_health.facebook_data_source).toBe('meta_api_live')
    expect(payload.traffic.series[0]).toMatchObject({
      Total: 12,
      'Facebook Ads': 5,
      'Google Ads': 2,
      Organico: 5,
    })
    expect(payload.traffic.series_by_granularity).toBeDefined()
    expect(Array.isArray(payload.traffic.series_by_granularity.day)).toBe(true)
    expect(Array.isArray(payload.traffic.series_by_granularity.week)).toBe(true)
    expect(Array.isArray(payload.traffic.series_by_granularity.month)).toBe(true)
    expect(payload.facebook.traffic_funnel).toMatchObject({
      page_views: expect.any(Number),
      form_clicks: expect.any(Number),
      form_submits: expect.any(Number),
    })
  })

  it('uses fresh snapshot before calling Meta API and returns source metadata', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM meta_analytics_snapshots')) {
        return {
          rows: [
            {
              snapshot_at: new Date().toISOString(),
              campaigns_json: [
                {
                  id: '111',
                  name: 'SOLARIA AGENCY - Snapshot',
                  status: 'active',
                  budget: 10,
                  impressions: 100,
                  clicks: 20,
                  cpc: 0.5,
                  conversions: 4,
                  roas: 2.1,
                },
              ],
            },
          ],
        }
      }
      return mockTrafficSql(sql)
    })

    mockFind.mockResolvedValue({
      docs: [{ id: 1, name: 'SOLARIA AGENCY - Linked', meta_campaign_id: '111' }],
    })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health.facebook).toBe('meta_api')
    expect(payload.source_health.facebook_data_source).toBe('snapshot')
    expect(payload.facebook.campaigns).toHaveLength(1)
    expect(payload.facebook.campaigns[0]).toMatchObject({ id: '111', linked: true })
    expect(mockListCampaigns).not.toHaveBeenCalled()
  })

  it('marks campaign as linked when CRM leads include campaign id in source fields', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM leads l')) {
        return {
          rows: [
            {
              meta_campaign_id: '',
              source_page: 'https://cepformacion.akademate.com/convocatorias/SC-2026-002?utm_id=333',
              source_details: {
                source_form: 'preinscripcion_convocatoria',
                utm_campaign: 'spring-2026',
              },
            },
          ],
        }
      }
      return mockTrafficSql(sql)
    })

    mockFind.mockResolvedValue({
      docs: [{ id: 1, name: 'SOLARIA AGENCY - Local Campaign without Meta ID' }],
    })

    mockListCampaigns.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '333',
            name: 'SOLARIA AGENCY - CRM Linked',
            status: 'ACTIVE',
            daily_budget: '2000',
            created_time: '2026-04-01T00:00:00-0700',
          },
        ],
      },
    })

    mockGetCampaignInsights.mockResolvedValue({
      data: {
        data: [
          {
            impressions: '800',
            clicks: '40',
            spend: '32',
            actions: [{ action_type: 'lead', value: '2' }],
            purchase_roas: [{ value: '1.6' }],
          },
        ],
      },
    })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.campaigns).toMatchObject({
      linked: 1,
      detected: 1,
      not_linked: 0,
    })
    expect(payload.facebook.campaigns[0]).toMatchObject({
      id: '333',
      linked: true,
    })
  })

  it('falls back to live Meta API when snapshot is stale', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM meta_analytics_snapshots')) {
        return {
          rows: [
            {
              snapshot_at: '2026-01-01T00:00:00.000Z',
              campaigns_json: [],
            },
          ],
        }
      }
      return mockTrafficSql(sql)
    })

    mockFind.mockResolvedValue({
      docs: [{ id: 1, name: 'SOLARIA AGENCY - Linked', meta_campaign_id: '111' }],
    })

    mockListCampaigns.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '111',
            name: 'SOLARIA AGENCY - Linked',
            status: 'ACTIVE',
            daily_budget: '3000',
            created_time: '2026-03-01T00:00:00-0700',
          },
        ],
      },
    })

    mockGetCampaignInsights.mockResolvedValue({
      data: {
        data: [
          {
            impressions: '1000',
            clicks: '100',
            spend: '50',
            actions: [{ action_type: 'lead', value: '4' }],
            purchase_roas: [{ value: '2.5' }],
          },
        ],
      },
    })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health.facebook_data_source).toBe('meta_api_live')
    expect(mockListCampaigns).toHaveBeenCalledTimes(1)
  })

  it('marks facebook source as unavailable when tenant has no Meta credentials', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => {
      if (sql.includes('FROM tenants')) {
        return {
          rows: [
            {
              id: 2,
              name: 'CEP FORMACION',
              integrations_meta_ad_account_id: '',
              integrations_meta_marketing_api_token: '',
              integrations_ga4_measurement_id: null,
            },
          ],
        }
      }
      return mockTrafficSql(sql)
    })
    mockFind.mockResolvedValue({ docs: [] })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=7d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health.facebook).toBe('unavailable')
    expect(payload.facebook.campaigns).toEqual([])
    expect(payload.facebook.traffic_funnel).toMatchObject({
      page_views: 0,
      form_clicks: 0,
      form_submits: 0,
    })
    expect(payload.campaigns).toMatchObject({
      linked: 0,
      detected: 0,
      not_linked: 0,
    })
    expect(mockListCampaigns).not.toHaveBeenCalled()
  })

  it('returns explicit GA4 fallback reason when property id format is invalid', async () => {
    process.env.GA4_PROPERTY_ID = 'properties/not-a-number'
    process.env.GA4_API_BEARER_TOKEN = 'token-ga4'

    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)

    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => mockTrafficSql(sql))
    mockFind.mockResolvedValue({ docs: [] })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health).toMatchObject({
      traffic: 'internal',
      traffic_reason_code: 'ga4_invalid_property_id',
      traffic_provider: 'internal_fallback',
    })
    expect(payload.source_health.ga4).toMatchObject({
      status: 'fallback',
      reason_code: 'ga4_invalid_property_id',
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('returns explicit GA4 fallback reason when GA4 API responds 401', async () => {
    process.env.GA4_PROPERTY_ID = 'properties/123456789'
    process.env.GA4_API_BEARER_TOKEN = 'token-ga4'

    const fetchMock = vi.fn(async () => {
      return new Response(JSON.stringify({ error: { message: 'Request had invalid authentication credentials.' } }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      })
    })
    vi.stubGlobal('fetch', fetchMock)

    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => mockTrafficSql(sql))
    mockFind.mockResolvedValue({ docs: [] })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health).toMatchObject({
      traffic: 'internal',
      traffic_reason_code: 'ga4_http_401',
      traffic_provider: 'internal_fallback',
    })
    expect(payload.source_health.ga4).toMatchObject({
      status: 'fallback',
      reason_code: 'ga4_http_401',
      property_id: '123456789',
    })
    expect(String(payload.source_health.traffic_reason || '')).toContain('invalid authentication credentials')
    expect(fetchMock).toHaveBeenCalled()
  })

  it('uses GA4 data when property and token are valid (supports properties/{id} format)', async () => {
    process.env.GA4_PROPERTY_ID = 'properties/123456789'
    process.env.GA4_API_BEARER_TOKEN = 'token-ga4'

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rows: [
              {
                dimensionValues: [{ value: '20260410' }, { value: 'google' }],
                metricValues: [{ value: '10' }],
              },
              {
                dimensionValues: [{ value: '20260410' }, { value: 'facebook' }],
                metricValues: [{ value: '5' }],
              },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rows: [{ dimensionValues: [{ value: '/convocatorias/SC-2026-002' }], metricValues: [{ value: '8' }] }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            rows: [{ dimensionValues: [{ value: 'google / organic' }], metricValues: [{ value: '10' }] }],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      )
    vi.stubGlobal('fetch', fetchMock)

    mockGetAuthenticatedUserContext.mockResolvedValue({ userId: 1, tenantId: 2 })
    mockExecute.mockImplementation(async (sql: string) => mockTrafficSql(sql))
    mockFind.mockResolvedValue({ docs: [] })

    const request = new NextRequest('http://localhost/api/analytics/dashboard?range=30d')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.source_health).toMatchObject({
      traffic: 'ga4',
      traffic_reason_code: 'ga4_connected',
      traffic_provider: 'google_analytics_4',
    })
    expect(payload.source_health.ga4).toMatchObject({
      status: 'connected',
      property_id: '123456789',
      reason: null,
    })
    expect(payload.overview.total_sessions).toBe(15)
    expect(payload.traffic.top_pages[0]).toMatchObject({
      path: '/convocatorias/SC-2026-002',
      views: 8,
    })
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })
})
