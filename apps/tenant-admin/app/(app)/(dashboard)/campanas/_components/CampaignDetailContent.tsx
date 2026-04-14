'use client'

import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import type { CampaignDetailResponse, MetricNumber } from './types'

interface CampaignDetailContentProps {
  detail: CampaignDetailResponse | null
  isLoading: boolean
  error: string | null
}

function formatDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-ES')
}

function formatNumber(value: number | null, decimals = 0): string {
  if (value === null) return 'N/D'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/D'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function metricBadge(metric: MetricNumber) {
  if (metric.state === 'loaded') return <Badge variant="outline">OK</Badge>
  if (metric.state === 'zero_real') return <Badge variant="outline">0 real</Badge>
  if (metric.state === 'api_error') return <Badge variant="destructive">Error API</Badge>
  return <Badge variant="secondary">Sin dato</Badge>
}

export function CampaignDetailContent({ detail, isLoading, error }: CampaignDetailContentProps) {
  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Cargando detalle de campaña...</div>
  }

  if (error) {
    return <div className="text-sm text-destructive">{error}</div>
  }

  if (!detail?.campaign || !detail.insights_summary) {
    return <div className="text-sm text-muted-foreground">No hay detalle disponible para esta campaña.</div>
  }

  const { campaign, insights_summary } = detail

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Resumen</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Estado</span>
            <Badge variant="outline">{campaign.meta_status}</Badge>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Creada</span>
            <span>{formatDate(campaign.created_time)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Actualizada</span>
            <span>{formatDate(campaign.updated_time)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Inicio</span>
            <span>{formatDate(campaign.start_time)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Fin</span>
            <span>{formatDate(campaign.stop_time)}</span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span className="text-muted-foreground">Presupuesto</span>
            <span>{formatCurrency(campaign.budget)}</span>
          </div>
          <div className="pt-2">
            <a
              href={campaign.ads_manager_url}
              target="_blank"
              rel="noreferrer"
              className="text-sm text-primary underline"
            >
              Abrir en Ads Manager
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Rendimiento ({insights_summary.range.input})</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>Spend</span>{metricBadge(insights_summary.spend)}</div>
            <div className="font-medium">{formatCurrency(insights_summary.spend.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>Impresiones</span>{metricBadge(insights_summary.impressions)}</div>
            <div className="font-medium">{formatNumber(insights_summary.impressions.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>Reach</span>{metricBadge(insights_summary.reach)}</div>
            <div className="font-medium">{formatNumber(insights_summary.reach.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>Clicks</span>{metricBadge(insights_summary.clicks)}</div>
            <div className="font-medium">{formatNumber(insights_summary.clicks.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>CTR</span>{metricBadge(insights_summary.ctr)}</div>
            <div className="font-medium">{insights_summary.ctr.value === null ? 'N/D' : `${formatNumber(insights_summary.ctr.value, 2)}%`}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>CPC</span>{metricBadge(insights_summary.cpc)}</div>
            <div className="font-medium">{formatCurrency(insights_summary.cpc.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>CPM</span>{metricBadge(insights_summary.cpm)}</div>
            <div className="font-medium">{formatCurrency(insights_summary.cpm.value)}</div>
          </div>
          <div className="space-y-1">
            <div className="flex items-center justify-between"><span>Resultados</span>{metricBadge(insights_summary.results)}</div>
            <div className="font-medium">{formatNumber(insights_summary.results.value)}</div>
            <div className="text-xs text-muted-foreground">
              Coste/resultado: {formatCurrency(insights_summary.results.cost_per_result)}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Creatividades</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(detail.creatives ?? []).length === 0 ? (
            <div className="text-sm text-muted-foreground">Sin preview disponible para esta campaña.</div>
          ) : (
            (detail.creatives ?? []).map((creative) => (
              <div key={creative.id || `creative-${Math.random()}`} className="rounded-md border p-3">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="font-medium text-sm">{creative.name || creative.id || 'Creative'}</div>
                  <Badge variant={creative.preview_state === 'loaded' ? 'outline' : 'secondary'}>
                    {creative.preview_state === 'loaded' ? 'Preview' : 'Sin preview'}
                  </Badge>
                </div>
                {creative.thumbnail_url || creative.image_url ? (
                  <img
                    src={creative.thumbnail_url || creative.image_url || ''}
                    alt={creative.name || 'Creative'}
                    className="h-36 w-full rounded-md object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="rounded-md bg-muted px-3 py-8 text-center text-xs text-muted-foreground">
                    No hay imagen/video recuperable para esta creatividad.
                  </div>
                )}
              </div>
            ))
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Estructura de campaña</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <div>
            <div className="font-medium">Ad Sets ({detail.adsets?.length || 0})</div>
            <div className="text-muted-foreground">
              {(detail.adsets ?? []).map((adset) => adset.name).join(', ') || 'Sin ad sets'}
            </div>
          </div>
          <div>
            <div className="font-medium">Ads ({detail.ads?.length || 0})</div>
            <div className="text-muted-foreground">
              {(detail.ads ?? []).map((ad) => ad.name).join(', ') || 'Sin anuncios'}
            </div>
          </div>
        </CardContent>
      </Card>

      {(detail.diagnostics?.errors?.length || 0) > 0 && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {detail.diagnostics?.errors?.join(' · ')}
        </div>
      )}
    </div>
  )
}
