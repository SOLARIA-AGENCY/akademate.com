import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const {
  mockGetPayloadHMR,
  mockGetAuthenticatedUserContext,
  mockListCampaigns,
  mockExecute,
  mockPayload,
} = vi.hoisted(() => {
  const mockGetPayloadHMR = vi.fn()
  const mockGetAuthenticatedUserContext = vi.fn()
  const mockListCampaigns = vi.fn()
  const mockExecute = vi.fn()

  const mockPayload = {
    db: {
      drizzle: {
        execute: mockExecute,
      },
    },
  }

  return {
    mockGetPayloadHMR,
    mockGetAuthenticatedUserContext,
    mockListCampaigns,
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

vi.mock('@/app/api/leads/_lib/auth', () => ({
  getAuthenticatedUserContext: mockGetAuthenticatedUserContext,
}))

vi.mock('@/src/lib/meta-marketing', () => ({
  listCampaigns: mockListCampaigns,
}))

import { GET } from '@/app/api/meta/campaigns/route'

describe('Meta campaigns route - GET /api/meta/campaigns', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetPayloadHMR.mockResolvedValue(mockPayload)
  })

  it('returns 401 when user is not authenticated', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue(null)

    const request = new NextRequest('http://localhost/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload).toMatchObject({
      error: 'Authentication required',
      code: 'AUTH_REQUIRED',
    })
  })

  it('returns configured=false when token or ad account is missing', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ tenantId: 2 })
    mockExecute.mockResolvedValue({
      rows: [
        {
          id: 2,
          integrations_meta_ad_account_id: '',
          integrations_meta_marketing_api_token: '',
        },
      ],
    })

    const request = new NextRequest('http://localhost/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.configured).toBe(false)
    expect(payload.docs).toEqual([])
    expect(mockListCampaigns).not.toHaveBeenCalled()
  })

  it('filters campaigns to SOLARIA prefix and maps Meta fields', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ tenantId: 2 })
    mockExecute.mockResolvedValue({
      rows: [
        {
          id: 2,
          integrations_meta_ad_account_id: '730494526974837',
          integrations_meta_marketing_api_token: 'token',
        },
      ],
    })
    mockListCampaigns.mockResolvedValue({
      success: true,
      data: {
        data: [
          {
            id: '111',
            name: 'SOLARIA AGENCY - Primavera',
            status: 'ACTIVE',
            daily_budget: '2500',
          },
          {
            id: '222',
            name: 'OTRA AGENCIA - Excluir',
            status: 'PAUSED',
            daily_budget: '1000',
          },
        ],
      },
    })

    const request = new NextRequest('http://localhost/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.configured).toBe(true)
    expect(payload.docs).toHaveLength(1)
    expect(payload.docs[0]).toMatchObject({
      id: '111',
      name: 'SOLARIA AGENCY - Primavera',
      status: 'active',
      campaign_type: 'meta_ads',
      budget: 25,
    })
  })

  it('returns 502 when Meta API call fails', async () => {
    mockGetAuthenticatedUserContext.mockResolvedValue({ tenantId: 2 })
    mockExecute.mockResolvedValue({
      rows: [
        {
          id: 2,
          integrations_meta_ad_account_id: '730494526974837',
          integrations_meta_marketing_api_token: 'token',
        },
      ],
    })
    mockListCampaigns.mockResolvedValue({
      success: false,
      error: 'Meta API error',
    })

    const request = new NextRequest('http://localhost/api/meta/campaigns')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(502)
    expect(payload).toMatchObject({
      configured: true,
      docs: [],
      error: 'Meta API error',
    })
  })
})

