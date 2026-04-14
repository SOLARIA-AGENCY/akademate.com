import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockResolveMetaRequestContext, mockCheckMetaHealth, mockFetchSolariaCampaigns } = vi.hoisted(
  () => ({
    mockResolveMetaRequestContext: vi.fn(),
    mockCheckMetaHealth: vi.fn(),
    mockFetchSolariaCampaigns: vi.fn(),
  }),
)

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
}))

vi.mock('@/app/api/meta/_lib/meta-graph', () => ({
  checkMetaHealth: mockCheckMetaHealth,
  fetchSolariaCampaigns: mockFetchSolariaCampaigns,
}))

import { GET } from '@/app/api/meta/campaigns/route'

describe('GET /api/meta/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 401 cuando no hay sesión autenticada', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: false,
      tenantId: null,
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.code).toBe('UNAUTHORIZED')
  })

  it('devuelve error tipificado cuando healthcheck está degradado', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730', marketingApiToken: 'token' },
    })
    mockCheckMetaHealth.mockResolvedValueOnce({
      status: 'degraded',
      token_status: 'expired',
      permissions_status: 'unknown',
      permissions: { ads_read: false, ads_management: false },
      ad_account_id: '730',
      ad_account_access: false,
      token_masked: 'toke...oken',
      token_expires_at: 'Monday, April 13, 2026 03:00:00 PDT',
      checked_at: '2026-04-14T10:00:00.000Z',
      error: {
        code: 'TOKEN_EXPIRED',
        message: 'Session has expired',
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.docs).toEqual([])
    expect(payload.totalDocs).toBe(0)
    expect(payload.error.code).toBe('TOKEN_EXPIRED')
  })

  it('mapea campañas Meta a formato UI', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: { adAccountIdNormalized: '730494526974837', marketingApiToken: 'token' },
    })
    mockCheckMetaHealth.mockResolvedValueOnce({
      status: 'ok',
      token_status: 'valid',
      permissions_status: 'ok',
      permissions: { ads_read: true, ads_management: true },
      ad_account_id: '730494526974837',
      ad_account_access: true,
      token_masked: 'toke...oken',
      token_expires_at: null,
      checked_at: '2026-04-14T10:00:00.000Z',
    })
    mockFetchSolariaCampaigns.mockResolvedValueOnce({
      ok: true,
      data: {
        data: [
          {
            id: '12001',
            name: 'SOLARIA AGENCY - CEP - Farmacia',
            status: 'ACTIVE',
            objective: 'OUTCOME_LEADS',
            daily_budget: '2500',
            created_time: '2026-04-14T08:00:00+0000',
          },
        ],
      },
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.totalDocs).toBe(1)
    expect(payload.docs[0]).toEqual(
      expect.objectContaining({
        id: '12001',
        name: 'SOLARIA AGENCY - CEP - Farmacia',
        status: 'active',
        campaign_type: 'meta_ads',
        budget: 25,
      }),
    )
    expect(payload.docs[0].ads_manager_url).toContain('campaign_ids=12001')
  })
})
