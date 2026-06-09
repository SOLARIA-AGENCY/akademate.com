import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MetaAdvertisingWizard } from '../../app/(app)/(dashboard)/web/convocatorias/[id]/MetaAdvertisingWizard'

const mockFetch = vi.fn()

function jsonResponse(body: unknown, status = 200) {
  return Promise.resolve(
    new Response(JSON.stringify(body), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

function uploadPayload(id: number, filename: string) {
  return {
    success: true,
    doc: {
      id,
      filename,
      mimeType: 'image/png',
      url: `/uploads/${filename}`,
    },
  }
}

function previewPayload() {
  return {
    success: true,
    draft_id: 77,
    preview: {
      course_name: 'CFGM Farmacia y Parafarmacia',
      campaign_name: 'SOLARIA AGENCY - CFGM Farmacia y Parafarmacia',
      landing_url: 'https://cepformacion.akademate.com/p/convocatorias/SC-2026-002?utm_source=facebook',
      start_time: '2026-06-09T10:00:00.000Z',
      stop_time: '2026-09-15T00:00:00.000Z',
      duration_days: 98,
      daily_budget: 2000,
      estimated_total_budget: 196000,
      status_after_publish: 'PAUSED',
      ad: {
        primary_text: 'Estudia CFGM Farmacia y Parafarmacia en Tenerife.',
        headline: 'CFGM Farmacia y Parafarmacia 2026',
        description: 'Titulación oficial. Plazas limitadas.',
        cta: 'SIGN_UP',
      },
      tracking: {
        utm_campaign: 'SC-2026-002',
        traffic_events: ['page_view', 'form_click', 'form_submit'],
        public_form_connected: true,
        crm_lead_connected: true,
        pixel_after_crm_success: true,
        capi_dedup_event_id: true,
        meta_campaign_id_url_tags: true,
      },
      lifecycle: {
        review_required: true,
        created_in_meta_status: 'PAUSED',
        manual_activation_required: true,
        auto_stop_at: '2026-09-15T00:00:00.000Z',
        stop_source: 'convocatoria.start_date',
      },
      review_checklist: ['Creatividades 1:1 y 9:16 cargadas', 'Formulario publico conectado'],
    },
  }
}

function preflightPayload() {
  return {
    success: true,
    preflight: {
      ok: true,
      checks: {
        meta_health: 'ok',
        ads_management: true,
        ads_read: true,
        ad_account_access: true,
        workflow_tables: true,
        convocatoria_public: true,
        landing_url: 'https://cepformacion.akademate.com/p/convocatorias/SC-2026-002?utm_source=facebook',
        auto_stop_at: '2026-09-15T00:00:00.000Z',
        duration_days: 98,
      },
      diagnostics: {
        ad_account_id: '730494526974837',
        strategy: 'new_campaign',
      },
    },
  }
}

function renderWizard() {
  return render(
    <MetaAdvertisingWizard
      open
      onOpenChange={vi.fn()}
      convocatoria={{
        id: 2,
        codigo: 'SC-2026-002',
        start_date: '2026-09-15T00:00:00.000Z',
        courseName: 'CFGM Farmacia y Parafarmacia',
      }}
    />,
  )
}

describe('MetaAdvertisingWizard launch review flow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockFetch.mockReset()
    vi.stubGlobal('fetch', mockFetch)
  })

  it('requires operator review before creating Meta draft and manual confirmation before activation', async () => {
    mockFetch.mockImplementation((input: RequestInfo | URL) => {
      const url = String(input)
      if (url === '/api/meta/assets/upload') {
        const uploadIndex = mockFetch.mock.calls.filter(([calledUrl]) => String(calledUrl) === '/api/meta/assets/upload').length
        return jsonResponse(uploadPayload(100 + uploadIndex, uploadIndex === 1 ? 'farmacia-1x1.png' : 'farmacia-9x16.png'))
      }
      if (url === '/api/meta/ads/preflight') return jsonResponse(preflightPayload())
      if (url === '/api/meta/ads/preview') return jsonResponse(previewPayload())
      if (url === '/api/meta/ads/publish') {
        return jsonResponse({
          success: true,
          data: {
            status: 'PAUSED',
            metaAds: [
              { ratio: '1:1', meta_ad_id: 'ad_1', meta_creative_id: 'creative_1', status: 'PAUSED' },
              { ratio: '9:16', meta_ad_id: 'ad_2', meta_creative_id: 'creative_2', status: 'PAUSED' },
            ],
            adsManagerUrl: 'https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=730494526974837',
          },
        })
      }
      if (url === '/api/meta/ads/activate') {
        return jsonResponse({
          success: true,
          data: {
            status: 'ACTIVE',
            metaAds: [
              { ratio: '1:1', meta_ad_id: 'ad_1', meta_creative_id: 'creative_1', status: 'ACTIVE' },
              { ratio: '9:16', meta_ad_id: 'ad_2', meta_creative_id: 'creative_2', status: 'ACTIVE' },
            ],
          },
        })
      }
      return jsonResponse({ error: 'not found' }, 404)
    })

    const { container } = renderWizard()

    fireEvent.click(screen.getByText('Verificar configuración'))

    await waitFor(() => expect(screen.getByText('Preflight operativo Meta')).toBeInTheDocument())
    expect(screen.getByText('Listo para preview')).toBeInTheDocument()
    expect(screen.getByText(/730494526974837/)).toBeInTheDocument()

    const preflightCall = mockFetch.mock.calls.find(([url]) => String(url) === '/api/meta/ads/preflight')
    expect(preflightCall).toBeTruthy()
    expect(JSON.parse(String((preflightCall?.[1] as RequestInit).body))).toMatchObject({
      convocatoria_id: 2,
      review_confirmed: false,
      daily_budget: 2000,
      assets: [],
    })

    const fileInputs = Array.from(container.querySelectorAll('input[type="file"]')) as HTMLInputElement[]
    expect(fileInputs).toHaveLength(3)

    fireEvent.change(fileInputs[0], { target: { files: [new File(['1x1'], 'farmacia-1x1.png', { type: 'image/png' })] } })
    fireEvent.change(fileInputs[1], { target: { files: [new File(['9x16'], 'farmacia-9x16.png', { type: 'image/png' })] } })

    await waitFor(() => expect(screen.getByText(/Media ID 101/)).toBeInTheDocument())
    await waitFor(() => expect(screen.getByText(/Media ID 102/)).toBeInTheDocument())

    fireEvent.click(screen.getByText('Generar preview'))

    await waitFor(() => expect(screen.getByText('Preview operativo')).toBeInTheDocument())

    const publishButton = screen.getByText('Crear borrador en Meta').closest('button')
    expect(publishButton).toBeDisabled()

    fireEvent.click(screen.getByText(/Confirmo que he revisado creatividad/).closest('label')!.querySelector('input')!)

    await waitFor(() => expect(publishButton).toBeEnabled())
    fireEvent.click(publishButton!)

    await waitFor(() => expect(screen.getByText(/Borrador creado en Meta/)).toBeInTheDocument())

    const publishCall = mockFetch.mock.calls.find(([url]) => String(url) === '/api/meta/ads/publish')
    expect(publishCall).toBeTruthy()
    expect(JSON.parse(String((publishCall?.[1] as RequestInit).body))).toMatchObject({
      draft_id: 77,
      convocatoria_id: 2,
      review_confirmed: true,
      daily_budget: 2000,
      stop_time: '2026-09-15T00:00:00.000Z',
      assets: [
        { media_id: 101, ratio: '1:1', type: 'image' },
        { media_id: 102, ratio: '9:16', type: 'image' },
      ],
    })

    const activateButton = screen.getByText('Poner en marcha campaña').closest('button')
    expect(activateButton).toBeDisabled()

    fireEvent.click(screen.getByText(/autorizo poner en marcha/).closest('label')!.querySelector('input')!)

    await waitFor(() => expect(activateButton).toBeEnabled())
    fireEvent.click(activateButton!)

    await waitFor(() => expect(screen.getByText('Campaña puesta en marcha en Meta.')).toBeInTheDocument())

    const activateCall = mockFetch.mock.calls.find(([url]) => String(url) === '/api/meta/ads/activate')
    expect(activateCall).toBeTruthy()
    expect(JSON.parse(String((activateCall?.[1] as RequestInit).body))).toEqual({
      draft_id: 77,
      confirmed: true,
    })
  })
})
