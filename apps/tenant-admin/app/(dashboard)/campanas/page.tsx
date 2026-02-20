'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Plus, TrendingUp, Users, MousePointer, DollarSign } from 'lucide-react'

type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived'

interface Campaign {
  id: string
  name: string
  status: CampaignStatus
  campaign_type?: string
  total_leads?: number
  total_conversions?: number
  budget?: number
  cost_per_lead?: number
}

interface CampaignsApiResponse {
  docs?: Campaign[]
}

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    const fetchCampaigns = async () => {
      try {
        setErrorMessage(null)
        const response = await fetch('/api/campaigns?limit=50&sort=-createdAt', {
          cache: 'no-cache',
        })
        if (!response.ok) {
          throw new Error('No se pudieron cargar las campañas')
        }

        const payload = (await response.json()) as CampaignsApiResponse
        setCampaigns(Array.isArray(payload.docs) ? payload.docs : [])
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : 'Error al cargar campañas')
        setCampaigns([])
      } finally {
        setIsLoading(false)
      }
    }

    void fetchCampaigns()
  }, [])

  const stats = useMemo(() => {
    const totalLeads = campaigns.reduce((sum, campaign) => sum + (campaign.total_leads ?? 0), 0)
    const totalConversions = campaigns.reduce(
      (sum, campaign) => sum + (campaign.total_conversions ?? 0),
      0
    )
    const totalBudget = campaigns.reduce((sum, campaign) => sum + (campaign.budget ?? 0), 0)
    const activeCount = campaigns.filter((campaign) => campaign.status === 'active').length

    return {
      totalLeads,
      totalConversions,
      totalBudget,
      activeCount,
    }
  }, [campaigns])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency: 'EUR',
      maximumFractionDigits: 0,
    }).format(value)

  const statusLabel: Record<string, string> = {
    draft: 'Borrador',
    active: 'Activa',
    paused: 'Pausada',
    completed: 'Completada',
    archived: 'Archivada',
  }

  const statusClass: Record<string, string> = {
    active: 'bg-green-500/20 text-green-600 dark:text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400',
    completed: 'bg-blue-500/20 text-blue-600 dark:text-blue-400',
    archived: 'bg-slate-500/20 text-slate-600 dark:text-slate-400',
    draft: 'bg-purple-500/20 text-purple-600 dark:text-purple-400',
  }

  return (
    <div className="p-6 space-y-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando campañas...
        </div>
      )}

      {errorMessage && (
        <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg">
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description="Gestión y seguimiento de campañas publicitarias multicanal"
        icon={TrendingUp}
        actions={(
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Nueva Campaña
          </Button>
        )}
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Campañas Activas</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">En curso actualmente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalLeads}</div>
            <p className="text-xs text-muted-foreground">Captados desde campañas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalConversions}</div>
            <p className="text-xs text-muted-foreground">Leads convertidos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalBudget)}</div>
            <p className="text-xs text-muted-foreground">Total asignado</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg">{campaign.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        statusClass[campaign.status] ?? statusClass.draft
                      }`}
                    >
                      {statusLabel[campaign.status] ?? 'Borrador'}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {campaign.campaign_type ?? 'Sin tipo'}
                    </span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Leads</p>
                  <p className="text-2xl font-bold">{campaign.total_leads ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversiones</p>
                  <p className="text-2xl font-bold">{campaign.total_conversions ?? 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-lg font-semibold">
                    {formatCurrency(campaign.budget ?? 0)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Coste por lead</p>
                  <p className="text-lg font-semibold">
                    {campaign.cost_per_lead ? formatCurrency(campaign.cost_per_lead) : '—'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-sm text-muted-foreground text-center">
        <p>Vista basada en campañas registradas en el sistema</p>
      </div>
    </div>
  )
}
