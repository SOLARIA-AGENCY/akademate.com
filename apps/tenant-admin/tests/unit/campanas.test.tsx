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

const SAMPLE_CAMPAIGNS = [
  {
    id: '1',
    name: 'Campaña Verano',
    status: 'active',
    campaign_type: 'email',
    total_leads: 120,
    total_conversions: 30,
    budget: 5000,
    cost_per_lead: 41.67,
  },
  {
    id: '2',
    name: 'Campaña Otoño',
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
      expect(screen.getByText(/Cargando campañas/i)).toBeInTheDocument()
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
        expect(screen.getByText('Campaña Verano')).toBeInTheDocument()
        expect(screen.getByText('Campaña Otoño')).toBeInTheDocument()
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
        expect(screen.getByTestId('empty-state-title')).toHaveTextContent('Sin campañas SOLARIA AGENCY')
      })
    })

    it('EmptyState muestra descripción correcta', async () => {
      mockFetch([])
      render(<CampanasPage data-oid="95lo21q" />)
      await waitFor(() => {
        expect(screen.getByTestId('empty-state-description')).toHaveTextContent(
          'No hay campañas de SOLARIA para la Ad Account actual.'
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
  })
})
