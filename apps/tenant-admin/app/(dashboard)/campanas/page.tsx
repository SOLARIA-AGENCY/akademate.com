'use client'

export const dynamic = 'force-dynamic'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Plus, TrendingUp, Users, MousePointer, DollarSign, Megaphone } from 'lucide-react'
import { traducirEstado } from '@payload-config/lib/estados'

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

  return (
    <div className="space-y-6" data-oid=".ul-to4">
      {isLoading && (
        <div
          className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground"
          data-oid="luhxky7"
        >
          Cargando campañas...
        </div>
      )}

      {errorMessage && (
        <div
          className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg"
          data-oid="mgmix26"
        >
          {errorMessage}
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description="Gestión y seguimiento de campañas publicitarias multicanal"
        icon={TrendingUp}
        actions={
          <Button data-oid="po:w42q">
            <Plus className="mr-2 h-4 w-4" data-oid="5bjz9h7" />
            Nueva Campaña
          </Button>
        }
        data-oid="gvd81c-"
      />

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4" data-oid="xknhish">
        <Card data-oid="j_c9mft">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="a5zl8ya"
          >
            <CardTitle className="text-sm font-medium" data-oid="niy.c96">
              Campañas Activas
            </CardTitle>
            <MousePointer className="h-4 w-4 text-primary/70" data-oid="h66kz4m" />
          </CardHeader>
          <CardContent data-oid="go:u64h">
            <div className="text-2xl font-bold" data-oid="75go61z">
              {stats.activeCount}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="jw73sr0">
              En curso actualmente
            </p>
          </CardContent>
        </Card>

        <Card data-oid="ukc_eon">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="49fb2gq"
          >
            <CardTitle className="text-sm font-medium" data-oid="i4luvw-">
              Leads Generados
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary/70" data-oid=".8l:gwq" />
          </CardHeader>
          <CardContent data-oid="hl3hvu4">
            <div className="text-2xl font-bold" data-oid="kgdhwc0">
              {stats.totalLeads}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="0t61-x_">
              Captados desde campañas
            </p>
          </CardContent>
        </Card>

        <Card data-oid="lk:ar34">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="m7t3fiy"
          >
            <CardTitle className="text-sm font-medium" data-oid="b4wu8aj">
              Conversiones
            </CardTitle>
            <Users className="h-4 w-4 text-primary/70" data-oid="5bgqhit" />
          </CardHeader>
          <CardContent data-oid=".crhe94">
            <div className="text-2xl font-bold" data-oid="52za88j">
              {stats.totalConversions}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="pdr7tra">
              Leads convertidos
            </p>
          </CardContent>
        </Card>

        <Card data-oid="jtlfrs:">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 pb-2"
            data-oid="2x_9hfp"
          >
            <CardTitle className="text-sm font-medium" data-oid="jhv6f:h">
              Presupuesto Total
            </CardTitle>
            <DollarSign className="h-4 w-4 text-primary/70" data-oid="u.6ygga" />
          </CardHeader>
          <CardContent data-oid="x1gax8i">
            <div className="text-2xl font-bold" data-oid="yorncpj">
              {formatCurrency(stats.totalBudget)}
            </div>
            <p className="text-xs text-muted-foreground" data-oid="cdz5.:0">
              Total asignado
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Grid */}
      {!isLoading && campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title="Sin campañas activas"
          description="Crea tu primera campaña para empezar a captar leads."
          data-oid="gnrxayw"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2" data-oid="9_at3ze">
          {campaigns.map((campaign) => (
            <Card
              key={campaign.id}
              className="hover:shadow-md transition-shadow"
              data-oid="fams60j"
            >
              <CardHeader data-oid="_dh1b4q">
                <div className="flex items-start justify-between" data-oid="pr5lza7">
                  <div className="space-y-1" data-oid="7b:bp:0">
                    <CardTitle className="text-lg" data-oid=":jf71:3">
                      {campaign.name}
                    </CardTitle>
                    <div className="flex items-center gap-2" data-oid="81v3-6d">
                      <Badge variant={traducirEstado(campaign.status).variant} data-oid="rqplgwb">
                        {traducirEstado(campaign.status).label}
                      </Badge>
                      <span className="text-sm text-muted-foreground" data-oid="aggb3b0">
                        {campaign.campaign_type ?? 'Sin tipo'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent data-oid="xr6.fej">
                <div className="grid grid-cols-2 gap-4" data-oid="8hzu_ep">
                  <div data-oid="m0l50v0">
                    <p className="text-sm text-muted-foreground" data-oid="dtxh4x-">
                      Leads
                    </p>
                    <p className="text-2xl font-bold" data-oid="r3noh7w">
                      {campaign.total_leads ?? 0}
                    </p>
                  </div>
                  <div data-oid="7273:mx">
                    <p className="text-sm text-muted-foreground" data-oid="015j9l8">
                      Conversiones
                    </p>
                    <p className="text-2xl font-bold" data-oid="8jjb_ud">
                      {campaign.total_conversions ?? 0}
                    </p>
                  </div>
                  <div data-oid="sawwu0-">
                    <p className="text-sm text-muted-foreground" data-oid="uok6j30">
                      Presupuesto
                    </p>
                    <p className="text-lg font-semibold" data-oid="i7x.tvp">
                      {formatCurrency(campaign.budget ?? 0)}
                    </p>
                  </div>
                  <div data-oid=":dbk7-6">
                    <p className="text-sm text-muted-foreground" data-oid="210:8-2">
                      Coste por lead
                    </p>
                    <p className="text-lg font-semibold" data-oid="ud2:bsk">
                      {campaign.cost_per_lead ? formatCurrency(campaign.cost_per_lead) : '—'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer note */}
      <div className="text-sm text-muted-foreground text-center" data-oid="w_hpo1o">
        <p data-oid="j_ni-fg">Vista basada en campañas registradas en el sistema</p>
      </div>
    </div>
  )
}
