import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConvocatoriaCampaignSummary } from '../../app/(app)/(dashboard)/programacion/[id]/ficha/ConvocatoriaCampaignSummary'

function response(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('ConvocatoriaCampaignSummary', () => {
  beforeEach(() => {
    vi.stubEnv('NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('shows a linked campaign with a bounded 30-day metric set and safe links', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      response({
        success: true,
        linkStatus: 'linked',
        deliveryStatus: 'active',
        campaignName: 'Campaña Gestorvet',
        metaCampaignId: '9001',
        internalDetailUrl: '/campanas/9001',
        adsManagerUrl:
          'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123&campaign_ids=9001',
        metrics: {
          spend: 125.5,
          impressions: 12000,
          clicks: 320,
          ctr: 2.67,
          leads: 18,
          cpl: 6.97,
          conversions: 99,
          roas: 4.2,
        },
      })
    )

    render(<ConvocatoriaCampaignSummary convocatoriaId={41} />)

    expect(await screen.findByText('Campaña vinculada')).toBeInTheDocument()
    expect(screen.getByText('Últimos 30 días')).toBeInTheDocument()
    expect(screen.getAllByRole('term')).toHaveLength(6)
    expect(screen.queryByText('Conversiones')).not.toBeInTheDocument()
    expect(screen.queryByText('ROAS')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver detalle' })).toHaveAttribute(
      'href',
      '/campanas/9001'
    )
    expect(screen.getByRole('link', { name: 'Abrir Meta Ads' })).toHaveAttribute(
      'rel',
      'noopener noreferrer'
    )
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/convocatorias/41/campaign?range=30d',
      expect.objectContaining({ cache: 'no-store' })
    )
  })

  it.each([
    ['not_linked', 'Campaña sin vincular'],
    ['ambiguous', 'Asociación ambigua'],
  ] as const)(
    'renders %s without presenting metrics or write actions',
    async (linkStatus, label) => {
      vi.mocked(global.fetch).mockResolvedValueOnce(
        response({ success: true, linkStatus, candidateCount: 2 })
      )

      render(<ConvocatoriaCampaignSummary convocatoriaId="42" />)

      expect(await screen.findByText(label)).toBeInTheDocument()
      expect(screen.queryByText('Últimos 30 días')).not.toBeInTheDocument()
      expect(screen.queryByRole('button')).not.toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
    }
  )

  it('renders an integration failure as unavailable, never as no campaign', async () => {
    vi.mocked(global.fetch).mockRejectedValueOnce(new Error('network down'))

    render(<ConvocatoriaCampaignSummary convocatoriaId={43} />)

    expect(await screen.findByText('Integración no disponible')).toBeInTheDocument()
    expect(screen.getByText('Este estado no equivale a “Sin campaña”.')).toBeInTheDocument()
    expect(screen.queryByText('Sin campaña')).not.toBeInTheDocument()
  })

  it('rejects links with unexpected hosts or query parameters', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      response({
        success: true,
        linkStatus: 'linked',
        campaignName: 'Campaña segura',
        metaCampaignId: '9001',
        internalDetailUrl: 'https://evil.example/campanas/9001',
        adsManagerUrl:
          'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123&campaign_ids=9001&access_token=secret',
        metrics: {},
      })
    )

    render(<ConvocatoriaCampaignSummary convocatoriaId={44} />)

    expect(await screen.findByText('Campaña vinculada')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
    expect(screen.queryByText(/secret/i)).not.toBeInTheDocument()
  })

  it('rejects internal and Ads Manager links to a different or multiple campaigns', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      response({
        success: true,
        linkStatus: 'linked',
        campaignName: 'Campaña asociada',
        metaCampaignId: '9001',
        internalDetailUrl: '/campanas/9002',
        adsManagerUrl:
          'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=123&campaign_ids=9001%2C9002',
        metrics: {},
      })
    )

    render(<ConvocatoriaCampaignSummary convocatoriaId={46} />)

    expect(await screen.findByText('Campaña vinculada')).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })

  it('labels a dated stale response as a snapshot instead of live state', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      response({
        success: true,
        linkStatus: 'linked',
        campaignName: 'Campaña con snapshot',
        metaCampaignId: '9001',
        metrics: { spend: 10 },
        lastSyncedAt: '2026-07-20T10:00:00.000Z',
        stale: true,
      })
    )

    render(<ConvocatoriaCampaignSummary convocatoriaId={47} />)

    expect(await screen.findByText(/Snapshot desactualizado:/)).toBeInTheDocument()
    expect(screen.queryByText(/^Sincronizada:/)).not.toBeInTheDocument()
  })

  it('fails closed when a linked response has no campaign id', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      response({ success: true, linkStatus: 'linked', campaignName: 'Sin identificador' })
    )

    render(<ConvocatoriaCampaignSummary convocatoriaId={48} />)

    expect(await screen.findByText('Integración no disponible')).toBeInTheDocument()
    expect(screen.queryByText('Campaña vinculada')).not.toBeInTheDocument()
  })

  it('does not fetch or render when the browser flag is disabled', async () => {
    vi.stubEnv('NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED', 'false')

    const { container } = render(<ConvocatoriaCampaignSummary convocatoriaId={45} />)

    await waitFor(() => expect(container).toBeEmptyDOMElement())
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
