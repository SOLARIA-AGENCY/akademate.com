import * as React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import CampanasPage from '../../app/(app)/(dashboard)/campanas/page'

function emptyPayload() {
  return {
    docs: [],
    totalDocs: 0,
    page: 1,
    limit: 100,
    sort: 'updated_time',
    order: 'desc',
    stale: false,
    diagnostics: { warnings: [], errors: [] },
    generated_at: '2026-04-16T00:00:00.000Z',
  }
}

function buildCampaign(id: string, name: string, status: 'active' | 'paused' | 'draft', start: string) {
  return {
    campaign: {
      id,
      meta_campaign_id: id,
      name,
      status,
      meta_status: status.toUpperCase(),
      effective_status: status.toUpperCase(),
      objective: 'OUTCOME_LEADS',
      campaign_type: 'meta_ads',
      budget: 100,
      created_time: start,
      updated_time: start,
      start_time: start,
      stop_time: null,
      ads_manager_url: `https://adsmanager.facebook.com/?campaign_ids=${id}`,
    },
    insights_summary: {
      range: { input: 'custom', since: '2026-01-01', until: '2026-12-31' },
      spend: { value: 0, state: 'zero_real' },
      impressions: { value: 0, state: 'zero_real' },
      reach: { value: 0, state: 'zero_real' },
      clicks: { value: 0, state: 'zero_real' },
      ctr: { value: 0, state: 'zero_real' },
      cpc: { value: 0, state: 'zero_real' },
      cpm: { value: 0, state: 'zero_real' },
      results: {
        value: 0,
        state: 'zero_real',
        result_type: 'lead',
        cost_per_result: 0,
        cost_per_result_state: 'zero_real',
      },
    },
    preview: {
      thumbnail_url: null,
      image_url: null,
      preview_state: 'not_available',
    },
    sync_status: {
      last_synced_at: '2026-04-16T00:00:00.000Z',
      stale: false,
      source: 'meta_live',
    },
    diagnostics: {
      warnings: [],
      errors: [],
    },
  }
}

describe('CampanasPage 2026 paused defaults', () => {
  it('requests full year 2026 range by default', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(emptyPayload()), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    global.fetch = fetchMock

    render(<CampanasPage />)

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())

    const requestUrl = String(fetchMock.mock.calls[0]?.[0] ?? '')
    expect(requestUrl).toContain('range=custom')
    expect(requestUrl).toContain('since=2026-01-01')
    expect(requestUrl).toContain('until=2026-12-31')
    expect(requestUrl).not.toContain('status=paused')
  })

  it('renders only paused campaigns from 2026', async () => {
    const payload = emptyPayload()
    payload.docs = [
      buildCampaign('1', 'Campaña 2026 Pausada', 'paused', '2026-02-01T00:00:00.000Z'),
      buildCampaign('2', 'Campaña 2026 Activa', 'active', '2026-03-01T00:00:00.000Z'),
      buildCampaign('3', 'Campaña 2025 Pausada', 'paused', '2025-11-01T00:00:00.000Z'),
    ]
    payload.totalDocs = payload.docs.length

    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(payload), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    )

    global.fetch = fetchMock

    render(<CampanasPage />)

    await waitFor(() => {
      expect(screen.getByText('Campaña 2026 Pausada')).toBeInTheDocument()
    })

    expect(screen.queryByText('Campaña 2026 Activa')).not.toBeInTheDocument()
    expect(screen.queryByText('Campaña 2025 Pausada')).not.toBeInTheDocument()
  })
})
