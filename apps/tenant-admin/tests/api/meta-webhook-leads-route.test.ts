import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockGetPayloadHMR, mockGetTenantIntegrations, mockCreate, mockExecute } = vi.hoisted(() => {
  const mockCreate = vi.fn()
  const mockExecute = vi.fn()
  const mockGetPayloadHMR = vi.fn()
  const mockGetTenantIntegrations = vi.fn()
  return { mockGetPayloadHMR, mockGetTenantIntegrations, mockCreate, mockExecute }
})

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: mockGetPayloadHMR,
}))

vi.mock('@payload-config', () => ({
  default: {},
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  getTenantIntegrations: mockGetTenantIntegrations,
}))

import { GET, POST } from '@/app/api/webhooks/meta-leads/route'

describe('Meta leads webhook route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    delete process.env.DEFAULT_TENANT_ID
    process.env.META_LEADS_VERIFY_TOKEN = 'verify-token'
    mockCreate.mockResolvedValue({ id: 55 })
    mockExecute.mockResolvedValue({ rows: [] })
    mockGetPayloadHMR.mockResolvedValue({
      create: mockCreate,
      db: { drizzle: { execute: mockExecute } },
    })
  })

  it('returns challenge when verification token is valid', async () => {
    const request = new NextRequest(
      'https://cepformacion.akademate.com/api/webhooks/meta-leads?hub.mode=subscribe&hub.verify_token=verify-token&hub.challenge=abc123'
    )
    const response = await GET(request)
    const text = await response.text()

    expect(response.status).toBe(200)
    expect(text).toBe('abc123')
  })

  it('returns 400 when tenantId is not resolvable', async () => {
    const request = new NextRequest('https://cepformacion.akademate.com/api/webhooks/meta-leads', {
      method: 'POST',
      body: JSON.stringify({ object: 'page', entry: [] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.ok).toBe(false)
  })

  it('creates a lead from leadgen webhook payload', async () => {
    mockGetTenantIntegrations.mockResolvedValue({
      metaMarketingApiToken: 'token',
    })

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            id: 'leadgen-1',
            campaign_id: 'cmp-1',
            ad_id: 'ad-1',
            adset_id: 'adset-1',
            field_data: [
              { name: 'email', values: ['lead@cep.com'] },
              { name: 'full_name', values: ['Mercedes Rosa Gómez Mariño'] },
              { name: 'phone_number', values: ['616997982'] },
            ],
          }),
          { status: 200, headers: { 'Content-Type': 'application/json' } },
        ),
      ),
    )

    const request = new NextRequest('https://cepformacion.akademate.com/api/webhooks/meta-leads?tenantId=2', {
      method: 'POST',
      body: JSON.stringify({
        object: 'page',
        entry: [
          {
            id: 'page-1',
            changes: [
              {
                field: 'leadgen',
                value: {
                  leadgen_id: 'leadgen-1',
                  campaign_id: 'cmp-1',
                  ad_id: 'ad-1',
                  adgroup_id: 'adset-1',
                  form_id: 'form-1',
                },
              },
            ],
          },
        ],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.ok).toBe(true)
    expect(payload.created).toBe(1)
    expect(mockCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'leads',
        data: expect.objectContaining({
          email: 'lead@cep.com',
          first_name: 'Mercedes',
          tenant: 2,
          utm_source: 'facebook',
        }),
      }),
    )
  })
})
