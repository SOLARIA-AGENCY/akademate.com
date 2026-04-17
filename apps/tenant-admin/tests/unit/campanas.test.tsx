import * as React from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, mockRouter } from '../utils/test-utils'
import CampanasPage from '../../app/(app)/(dashboard)/campanas/page'

function metric(value: number | null, state: 'loaded' | 'zero_real' | 'not_available' | 'api_error') {
  return { value, state }
}

function buildCampaign(id: string, name: string) {
  return {
    campaign: {
      id,
      meta_campaign_id: id,
      name,
      status: 'active',
      meta_status: 'ACTIVE',
      effective_status: 'ACTIVE',
      objective: 'OUTCOME_LEADS',
      campaign_type: 'meta_ads',
      budget: 25,
      created_time: '2026-04-10T08:00:00.000Z',
      updated_time: '2026-04-12T09:00:00.000Z',
      start_time: '2026-04-13T00:00:00.000Z',
      stop_time: null,
      ads_manager_url: `https://adsmanager.facebook.com/?campaign_ids=${id}`,
    },
    insights_summary: {
      range: { input: '30d', since: '2026-03-16', until: '2026-04-14' },
      spend: metric(120, 'loaded'),
      impressions: metric(2000, 'loaded'),
      reach: metric(1300, 'loaded'),
      clicks: metric(45, 'loaded'),
      ctr: metric(2.25, 'loaded'),
      cpc: metric(2.67, 'loaded'),
      cpm: metric(9.2, 'loaded'),
      results: {
        ...metric(7, 'loaded'),
        result_type: 'lead',
        cost_per_result: 17.14,
        cost_per_result_state: 'loaded',
      },
    },
    preview: {
      thumbnail_url: 'https://example.com/thumb.jpg',
      image_url: null,
      preview_state: 'loaded',
    },
    sync_status: {
      last_synced_at: '2026-04-14T10:00:00.000Z',
      stale: false,
      source: 'meta_live',
    },
    diagnostics: {
      warnings: [],
      errors: [],
    },
  }
}

function buildListPayload(docs: unknown[]) {
  return {
    docs,
    totalDocs: docs.length,
    page: 1,
    limit: 100,
    sort: 'updated_time',
    order: 'desc',
    stale: false,
    source_health: {
      status: 'ok',
      token_status: 'valid',
      permissions_status: 'ok',
      ad_account_id: '730494526974837',
      checked_at: '2026-04-14T10:00:00.000Z',
    },
    diagnostics: { warnings: [], errors: [] },
    generated_at: '2026-04-14T10:00:00.000Z',
  }
}

function buildAdAccountsPayload() {
  return {
    docs: [
      {
        id: '730494526974837',
        account_id: '730494526974837',
        name: 'Ad Account 730494526974837',
        active: true,
        account_status: 1,
      },
    ],
    totalDocs: 1,
  }
}

describe('CampanasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubGlobal('open', vi.fn())
  })

  it('mantiene la vista principal mientras espera /api/meta/campaigns', () => {
    global.fetch = vi.fn().mockReturnValue(new Promise(() => {}))

    render(<CampanasPage />)

    expect(screen.getByText('Campañas de Marketing')).toBeInTheDocument()
    expect(screen.queryByText('Sin campañas')).not.toBeInTheDocument()
  })

  it('renderiza campañas live y cabecera operativa', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/meta/ad-accounts')) {
        return new Response(JSON.stringify(buildAdAccountsPayload()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(buildListPayload([buildCampaign('12001', 'SOLARIA AGENCY - CEP - Farmacia')])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    render(<CampanasPage />)

    await waitFor(() => {
      expect(screen.getByText('Campañas de Marketing')).toBeInTheDocument()
      expect(screen.getAllByText('SOLARIA AGENCY - CEP - Farmacia').length).toBeGreaterThan(0)
      expect(screen.getByText('Sincronizar')).toBeInTheDocument()
    })
  })

  it('muestra fallback de métricas cuando Meta no entrega valor', async () => {
    const withStates = buildCampaign('12001', 'SOLARIA AGENCY - CEP - Higiene')
    withStates.insights_summary.spend = metric(null, 'not_available')
    withStates.insights_summary.results = {
      ...withStates.insights_summary.results,
      ...metric(null, 'not_available'),
      cost_per_result: null,
      cost_per_result_state: 'not_available',
    }

    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/meta/ad-accounts')) {
        return new Response(JSON.stringify(buildAdAccountsPayload()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(buildListPayload([withStates])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    render(<CampanasPage />)

    await waitFor(() => {
      expect(screen.getByText('N/D')).toBeInTheDocument()
      expect(screen.getAllByText('0').length).toBeGreaterThan(0)
    })
  })

  it('envía sort por updated_time en la llamada principal', async () => {
    const listPayload = buildListPayload([buildCampaign('12001', 'SOLARIA AGENCY - CEP - Farmacia')])
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/meta/ad-accounts')) {
        return new Response(JSON.stringify(buildAdAccountsPayload()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(listPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    global.fetch = fetchMock

    render(<CampanasPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2))

    const campaignsRequests = fetchMock.mock.calls
      .map((call) => String(call[0]))
      .filter((url) => url.includes('/api/meta/campaigns?'))
    expect(campaignsRequests[campaignsRequests.length - 1]).toContain('sort=updated_time')
    expect(campaignsRequests[campaignsRequests.length - 1]).toContain('order=desc')
  })

  it('abre detalle navegando a /campanas/[id] con filtros activos', async () => {
    const listPayload = buildListPayload([buildCampaign('12001', 'SOLARIA AGENCY - CEP - Farmacia')])
    const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      return new Response(JSON.stringify(listPayload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    global.fetch = fetchMock

    render(<CampanasPage />)

    await waitFor(() => {
      expect(screen.getAllByText('SOLARIA AGENCY - CEP - Farmacia').length).toBeGreaterThan(0)
    })

    fireEvent.click(screen.getByRole('button', { name: 'Ver detalle' }))

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalled()
    })
    expect(String(mockRouter.push.mock.calls[0]?.[0] || '')).toContain('/campanas/12001')
    expect(String(mockRouter.push.mock.calls[0]?.[0] || '')).toContain('range=custom')
  })

  it('muestra empty state cuando no hay campañas', async () => {
    global.fetch = vi.fn(async (input: RequestInfo | URL) => {
      const url = String(input)
      if (url.includes('/api/meta/ad-accounts')) {
        return new Response(JSON.stringify(buildAdAccountsPayload()), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      return new Response(JSON.stringify(buildListPayload([])), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    })

    render(<CampanasPage />)

    await waitFor(() => {
      expect(screen.getByText('Sin campañas')).toBeInTheDocument()
    })
  })
})
