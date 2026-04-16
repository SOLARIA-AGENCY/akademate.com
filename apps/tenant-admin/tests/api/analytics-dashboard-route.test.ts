import { beforeEach, describe, expect, it, vi } from 'vitest'
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
    expect(payload.traffic.series[0]).toMatchObject({
      Total: 12,
      'Facebook Ads': 5,
      'Google Ads': 2,
      Organico: 5,
    })
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
    expect(payload.campaigns).toMatchObject({
      linked: 0,
      detected: 0,
      not_linked: 0,
    })
    expect(mockListCampaigns).not.toHaveBeenCalled()
  })
})
