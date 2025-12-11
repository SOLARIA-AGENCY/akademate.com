'use client'

export const dynamic = 'force-dynamic'

import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Plus, TrendingUp, Users, MousePointer, DollarSign } from 'lucide-react'
import { MockDataIndicator } from '@payload-config/components/ui/MockDataIndicator'

export default function CampanasPage() {
  const campaigns = [
    {
      id: 1,
      name: 'Campaña Cursos Privados Q1 2026',
      status: 'Activa',
      platform: 'Meta Ads',
      clicks: 2847,
      conversions: 156,
      budget: '€1,200',
      spend: '€892',
      color: 'bg-green-500'
    },
    {
      id: 2,
      name: 'Promo Ciclo Superior - Verano',
      status: 'Activa',
      platform: 'Google Ads',
      clicks: 1523,
      conversions: 89,
      budget: '€800',
      spend: '€614',
      color: 'bg-blue-500'
    },
    {
      id: 3,
      name: 'Retargeting Teleformación',
      status: 'Pausada',
      platform: 'Meta Ads',
      clicks: 934,
      conversions: 45,
      budget: '€500',
      spend: '€380',
      color: 'bg-yellow-500'
    },
    {
      id: 4,
      name: 'Black Friday - Descuentos Cursos',
      status: 'Programada',
      platform: 'Multi-canal',
      clicks: 0,
      conversions: 0,
      budget: '€2,000',
      spend: '€0',
      color: 'bg-purple-500'
    }
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Mock Data Banner */}
      <MockDataIndicator
        variant="banner"
        label="Este módulo usa datos de demostración. Pendiente integración con Meta Ads API y Google Ads."
      />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campañas de Marketing</h1>
          <p className="text-muted-foreground mt-1">
            Gestión y seguimiento de campañas publicitarias multicanal
          </p>
        </div>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Nueva Campaña
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clics Totales</CardTitle>
            <MousePointer className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5,304</div>
            <p className="text-xs text-muted-foreground">
              +12% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversiones</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">290</div>
            <p className="text-xs text-muted-foreground">
              +8% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Leads Generados</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">427</div>
            <p className="text-xs text-muted-foreground">
              +15% vs mes anterior
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Presupuesto Total</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">€4,500</div>
            <p className="text-xs text-muted-foreground">
              €1,886 gastados (42%)
            </p>
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
                        campaign.status === 'Activa'
                          ? 'bg-green-500/20 text-green-600 dark:text-green-400'
                          : campaign.status === 'Pausada'
                          ? 'bg-yellow-500/20 text-yellow-600 dark:text-yellow-400'
                          : 'bg-purple-500/20 text-purple-600 dark:text-purple-400'
                      }`}
                    >
                      {campaign.status}
                    </span>
                    <span className="text-sm text-muted-foreground">{campaign.platform}</span>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Clics</p>
                  <p className="text-2xl font-bold">{campaign.clicks.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Conversiones</p>
                  <p className="text-2xl font-bold">{campaign.conversions}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Presupuesto</p>
                  <p className="text-lg font-semibold">{campaign.budget}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gastado</p>
                  <p className="text-lg font-semibold">{campaign.spend}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Footer note */}
      <div className="text-sm text-muted-foreground text-center">
        <p>Vista preliminar • Datos de ejemplo para demostración</p>
      </div>
    </div>
  )
}
