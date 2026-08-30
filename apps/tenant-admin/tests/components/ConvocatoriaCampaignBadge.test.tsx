import * as React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ConvocatoriaCampaignBadge } from '../../@payload-config/components/ui/ConvocatoriaCampaignBadge'

describe('ConvocatoriaCampaignBadge', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.stubEnv('NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED', 'true')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('renders unavailable instead of a stale active state when Meta is unavailable', async () => {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          linkStatus: 'linked',
          workflowStatus: 'active',
          deliveryStatus: 'active',
          metaCampaignId: 'meta-9001',
          internalDetailUrl: '/campanas/meta-9001',
          source: 'unavailable',
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    )

    render(<ConvocatoriaCampaignBadge convocatoriaId={41} fallbackStatus="active" />)

    await waitFor(() => {
      expect(screen.getByText('Estado no disponible')).toBeInTheDocument()
    })
    expect(screen.queryByText('Campaña activa')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Ver estadísticas/i })).toHaveAttribute(
      'href',
      '/campanas/meta-9001'
    )
  })

  it('keeps the legacy fallback without issuing a request when the browser flag is off', () => {
    vi.stubEnv('NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED', 'false')

    render(<ConvocatoriaCampaignBadge convocatoriaId={41} fallbackStatus="active" />)

    expect(screen.getByText('Campaña activa')).toBeInTheDocument()
    expect(global.fetch).not.toHaveBeenCalled()
  })
})
