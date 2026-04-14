import { beforeEach, describe, expect, it, vi } from 'vitest'
import { NextRequest } from 'next/server'

const { mockResolveMetaRequestContext, mockCheckMetaHealth } = vi.hoisted(() => ({
  mockResolveMetaRequestContext: vi.fn(),
  mockCheckMetaHealth: vi.fn(),
}))

vi.mock('@/app/api/meta/_lib/integrations', () => ({
  resolveMetaRequestContext: mockResolveMetaRequestContext,
}))

vi.mock('@/app/api/meta/_lib/meta-graph', () => ({
  checkMetaHealth: mockCheckMetaHealth,
}))

import { GET } from '@/app/api/meta/health/route'

describe('GET /api/meta/health', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('devuelve 401 cuando no hay sesión', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: false,
      tenantId: null,
    })

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/health')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(payload.error.code).toBe('UNAUTHORIZED')
  })

  it('devuelve salud operativa cuando Meta responde OK', async () => {
    mockResolveMetaRequestContext.mockResolvedValueOnce({
      authenticated: true,
      tenantId: '2',
      meta: {
        adAccountIdNormalized: '730494526974837',
        marketingApiToken: 'token',
      },
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

    const request = new NextRequest('https://cepformacion.akademate.com/api/meta/health')
    const response = await GET(request)
    const payload = await response.json()

    expect(response.status).toBe(200)
    expect(payload.success).toBe(true)
    expect(payload.data.status).toBe('ok')
    expect(payload.data.permissions_status).toBe('ok')
  })
})
