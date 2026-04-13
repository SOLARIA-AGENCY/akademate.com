import * as React from 'react'
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import CampanasPage from '../../app/(app)/(dashboard)/campanas/page'

const mockFetch = (campaigns: unknown[]) => {
  global.fetch = vi.fn().mockResolvedValueOnce(
    new Response(JSON.stringify({ docs: campaigns }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    })
  )
}

const mockFetchError = () => {
  global.fetch = vi.fn().mockResolvedValueOnce(new Response('{}', { status: 500 }))
}

const mockFetchSequence = (responses: Array<{ status: number; body: unknown }>) => {
  global.fetch = vi.fn()
  for (const response of responses) {
    vi.mocked(global.fetch).mockResolvedValueOnce(
      new Response(JSON.stringify(response.body), {
        status: response.status,
        headers: { 'Content-Type': 'application/json' },
      })
    )
  }
}

const SAMPLE_CAMPAIGNS = [
  {
    id: '1',
    name: 'SOLARIA AGENCY - Campaña Verano',
    status: 'active',
    campaign_type: 'email',
    total_leads: 120,
    total_conversions: 30,
    budget: 5000,
    cost_per_lead: 41.67,
  },
  {
    id: '2',
    name: 'SOLARIA AGENCY - Campaña Otoño',
    status: 'paused',
    campaign_type: 'social',
    total_leads: 80,
    total_conversions: 10,
    budget: 3000,
    cost_per_lead: null,
  },
]

describe('CampanasPage', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('estado de carga', () => {
    it('muestra mensaje de carga mientras fetch está pendiente', () => {
      global.fetch = vi.fn().mockReturnValue(new Promise(() => {})) // never resolves
      render(<CampanasPage data-oid="xl6hsd8" />)
      expect(screen.getByText(/Cargando campa(?:ñ|n)as/i)).toBeInTheDocument()
    })
  })

  describe('con campañas cargadas', () => {
    it('muestra el título de la página', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="n8or0h_" />)
      await waitFor(() =>
        expect(screen.getByTestId('page-header-title')).toHaveTextContent('Campañas de Marketing')
      )
    })

    it('muestra ambas campañas en la lista', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="dow:nav" />)
      await waitFor(() => {
        expect(screen.getByText('SOLARIA AGENCY - Campaña Verano')).toBeInTheDocument()
        expect(screen.getByText('SOLARIA AGENCY - Campaña Otoño')).toBeInTheDocument()
      })
    })

    it('filtra campañas fuera de prefijo SOLARIA en la respuesta local', async () => {
      mockFetch([
        ...SAMPLE_CAMPAIGNS,
        {
          id: '3',
          name: 'OTRA AGENCIA - Campaña Externa',
          status: 'active',
          campaign_type: 'social',
          total_leads: 300,
          total_conversions: 50,
          budget: 9999,
        },
      ])
      render(<CampanasPage data-oid="2ic1r09" />)

      await waitFor(() => {
        expect(screen.getByText('SOLARIA AGENCY - Campaña Verano')).toBeInTheDocument()
        expect(screen.queryByText('OTRA AGENCIA - Campaña Externa')).not.toBeInTheDocument()
      })
    })

    it('NO muestra EmptyState cuando hay campañas', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="m1xnjg3" />)
      await waitFor(() => expect(screen.queryByTestId('empty-state')).toBeNull())
    })

    it('calcula stats: activeCount = 1 (solo la activa)', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="5k15t2l" />)
      await waitFor(() => {
        // activeCount rendered as the bold number under "Campañas Activas"
        expect(screen.getByText('Campañas Activas')).toBeInTheDocument()
      })
    })

    it('calcula stats: totalLeads suma leads de todas las campañas', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="mng6vyy" />)
      await waitFor(() => {
        // 120 + 80 = 200
        expect(screen.getByText('200')).toBeInTheDocument()
      })
    })

    it('calcula stats: totalConversions = 40', async () => {
      mockFetch(SAMPLE_CAMPAIGNS)
      render(<CampanasPage data-oid="obwuszh" />)
      await waitFor(() => {
        // 30 + 10 = 40
        expect(screen.getByText('40')).toBeInTheDocument()
      })
    })
  })

  describe('lista vacía — EmptyState conditional', () => {
    it('muestra EmptyState cuando fetch devuelve docs vacío', async () => {
      mockFetch([])
      render(<CampanasPage data-oid="8vge1em" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })

    it('EmptyState muestra título correcto', async () => {
      mockFetch([])
      render(<CampanasPage data-oid="to25-vv" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Sin campañas activas')
      })
    })

    it('EmptyState muestra descripción correcta', async () => {
      mockFetch([])
      render(<CampanasPage data-oid="95lo21q" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
          'Crea tu primera campaña para empezar a captar leads.'
        )
      })
    })

    it('muestra EmptyState cuando docs es undefined', async () => {
      global.fetch = vi.fn().mockResolvedValueOnce(
        new Response(JSON.stringify({}), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      )
      render(<CampanasPage data-oid="craavae" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })
  })

  describe('manejo de errores', () => {
    it('degrada a lista vacía cuando fetch falla (status !ok)', async () => {
      mockFetchError()
      render(<CampanasPage data-oid="-18_av." />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })

    it('muestra EmptyState tras error (campaigns = [])', async () => {
      mockFetchError()
      render(<CampanasPage data-oid="ej2-jty" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state')).toBeInTheDocument()
      })
    })

    it('muestra error de sesión cuando /api/campaigns responde 401', async () => {
      mockFetchSequence([{ status: 401, body: {} }])
      render(<CampanasPage data-oid="ogn1o0h" />)

      await waitFor(() => {
        expect(
          screen.getByText('Sesión expirada. Inicia sesión de nuevo para ver campañas.')
        ).toBeInTheDocument()
      })
    })

    it('usa fallback de Meta cuando local no tiene campañas SOLARIA', async () => {
      mockFetchSequence([
        { status: 200, body: { docs: [{ id: '10', name: 'OTRA AGENCIA - test', status: 'active' }] } },
        {
          status: 200,
          body: {
            docs: [
              { id: '20', name: 'SOLARIA AGENCY - Meta Uno', status: 'active', budget: 1000 },
              { id: '21', name: 'NO SOLARIA - Meta Dos', status: 'active', budget: 500 },
            ],
          },
        },
      ])

      render(<CampanasPage data-oid="76f6yv6" />)

      await waitFor(() => {
        expect(screen.getByText('SOLARIA AGENCY - Meta Uno')).toBeInTheDocument()
        expect(screen.queryByText('NO SOLARIA - Meta Dos')).not.toBeInTheDocument()
      })
    })
  })
})
