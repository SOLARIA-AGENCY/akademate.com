'use client'

import * as React from 'react'
import { AlertTriangle, BarChart3, ExternalLink, Loader2, Megaphone } from 'lucide-react'

import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'

type LinkStatus = 'linked' | 'not_linked' | 'ambiguous' | 'unavailable'

interface CampaignMetrics {
  spend?: number | null
  impressions?: number | null
  clicks?: number | null
  ctr?: number | null
  leads?: number | null
  cpl?: number | null
}

interface CampaignReadResponse {
  success?: boolean
  linkStatus?: LinkStatus
  deliveryStatus?: string | null
  campaignName?: string | null
  metaCampaignId?: string | null
  internalDetailUrl?: string | null
  adsManagerUrl?: string | null
  candidateCount?: number
  metrics?: CampaignMetrics
  source?: string
  lastSyncedAt?: string | null
  stale?: boolean
}

type ViewState =
  | { kind: 'loading' }
  | { kind: 'disabled' }
  | { kind: 'loaded'; data: CampaignReadResponse }

const METRIC_FORMATTERS = {
  spend: (value: number) => formatCurrency(value),
  impressions: (value: number) => formatInteger(value),
  clicks: (value: number) => formatInteger(value),
  ctr: (value: number) => `${value.toLocaleString('es-ES', { maximumFractionDigits: 2 })}%`,
  leads: (value: number) => formatInteger(value),
  cpl: (value: number) => formatCurrency(value),
} satisfies Record<keyof CampaignMetrics, (value: number) => string>

const METRIC_LABELS: Record<keyof CampaignMetrics, string> = {
  spend: 'Gasto',
  impressions: 'Impresiones',
  clicks: 'Clics',
  ctr: 'CTR',
  leads: 'Leads',
  cpl: 'CPL',
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatInteger(value: number): string {
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)
}

function formatSyncDate(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

function formatMetric(key: keyof CampaignMetrics, value: unknown): string {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) return 'No disponible'
  return METRIC_FORMATTERS[key](value)
}

function safeInternalCampaignUrl(value: unknown, expectedCampaignId: unknown): string | null {
  if (
    typeof value !== 'string' ||
    typeof expectedCampaignId !== 'string' ||
    !/^[A-Za-z0-9_-]+$/.test(expectedCampaignId) ||
    value !== `/campanas/${expectedCampaignId}`
  ) {
    return null
  }
  return value
}

function safeAdsManagerUrl(value: unknown, expectedCampaignId: unknown): string | null {
  if (typeof value !== 'string' || typeof expectedCampaignId !== 'string') return null
  try {
    const url = new URL(value)
    if (
      url.protocol !== 'https:' ||
      url.hostname !== 'adsmanager.facebook.com' ||
      url.pathname !== '/adsmanager/manage/campaigns' ||
      url.hash
    ) {
      return null
    }
    const accountIds = url.searchParams.getAll('act')
    const campaignIds = url.searchParams.getAll('campaign_ids')
    const keys = [...url.searchParams.keys()]
    if (
      keys.some((key) => key !== 'act' && key !== 'campaign_ids') ||
      accountIds.length !== 1 ||
      campaignIds.length !== 1 ||
      !/^\d+$/.test(accountIds[0] ?? '') ||
      campaignIds[0] !== expectedCampaignId
    ) {
      return null
    }
    return url.toString()
  } catch {
    return null
  }
}

function normalizedStatus(data: CampaignReadResponse): LinkStatus {
  if (data.source === 'unavailable') return 'unavailable'
  if (
    data.linkStatus === 'linked' &&
    (typeof data.metaCampaignId !== 'string' || data.metaCampaignId.trim() === '')
  ) {
    return 'unavailable'
  }
  if (
    data.linkStatus === 'linked' ||
    data.linkStatus === 'not_linked' ||
    data.linkStatus === 'ambiguous' ||
    data.linkStatus === 'unavailable'
  ) {
    return data.linkStatus
  }
  return 'unavailable'
}

function statusCopy(status: LinkStatus, data: CampaignReadResponse) {
  if (status === 'linked') {
    return {
      label: 'Campaña vinculada',
      description:
        data.campaignName || data.metaCampaignId || 'Asociación confirmada con Meta Ads.',
      variant: 'success' as const,
    }
  }
  if (status === 'not_linked') {
    return {
      label: 'Campaña sin vincular',
      description:
        (data.candidateCount ?? 0) > 0
          ? `${data.candidateCount} candidato(s) pendiente(s) de revisión; ninguno se considera confirmado.`
          : 'No existe una asociación confirmada para esta convocatoria.',
      variant: 'outline' as const,
    }
  }
  if (status === 'ambiguous') {
    return {
      label: 'Asociación ambigua',
      description: 'Hay más de una asociación explícita. No se selecciona ninguna automáticamente.',
      variant: 'outline' as const,
    }
  }
  return {
    label: 'Integración no disponible',
    description: data.metaCampaignId
      ? 'La asociación existe, pero el estado y las métricas de Meta no se pudieron verificar.'
      : 'No se pudo comprobar la asociación con Meta Ads en este momento.',
    variant: 'secondary' as const,
  }
}

export function ConvocatoriaCampaignSummary({
  convocatoriaId,
}: {
  convocatoriaId: string | number
}) {
  const enabled =
    process.env.NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED === 'true'
  const [state, setState] = React.useState<ViewState>(
    enabled ? { kind: 'loading' } : { kind: 'disabled' }
  )

  React.useEffect(() => {
    if (!enabled) return

    const controller = new AbortController()
    const load = async () => {
      try {
        const response = await fetch(
          `/api/convocatorias/${encodeURIComponent(String(convocatoriaId))}/campaign?range=30d`,
          { cache: 'no-store', signal: controller.signal }
        )
        if (response.status === 404) {
          setState({ kind: 'disabled' })
          return
        }
        if (!response.ok) {
          setState({ kind: 'loaded', data: { linkStatus: 'unavailable' } })
          return
        }
        const data = (await response.json()) as CampaignReadResponse
        setState({
          kind: 'loaded',
          data: data.success === true ? data : { linkStatus: 'unavailable' },
        })
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') return
        setState({ kind: 'loaded', data: { linkStatus: 'unavailable' } })
      }
    }

    void load()
    return () => controller.abort()
  }, [convocatoriaId, enabled])

  if (state.kind === 'disabled') return null

  if (state.kind === 'loading') {
    return (
      <Card aria-label="Asociación Meta Ads">
        <CardContent className="flex items-center gap-2 p-6 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Consultando asociación Meta Ads…
        </CardContent>
      </Card>
    )
  }

  const data = state.data
  const status = normalizedStatus(data)
  const copy = statusCopy(status, data)
  const internalUrl = safeInternalCampaignUrl(data.internalDetailUrl, data.metaCampaignId)
  const adsManagerUrl = safeAdsManagerUrl(data.adsManagerUrl, data.metaCampaignId)
  const showMetrics = status === 'linked' && data.metrics
  const syncedAt = formatSyncDate(data.lastSyncedAt)

  return (
    <Card aria-label="Asociación Meta Ads">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Megaphone className="h-5 w-5 text-primary" /> Meta Ads
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <Badge variant={copy.variant}>{copy.label}</Badge>
          <p className="text-muted-foreground">{copy.description}</p>
          {status === 'unavailable' && (
            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              Este estado no equivale a “Sin campaña”.
            </p>
          )}
          {(syncedAt || data.stale) && (
            <p
              className={
                data.stale ? 'text-xs font-medium text-amber-700' : 'text-xs text-muted-foreground'
              }
            >
              {data.stale ? 'Snapshot desactualizado' : 'Sincronizada'}
              {syncedAt ? `: ${syncedAt}` : ': fecha no disponible'}
            </p>
          )}
        </div>

        {showMetrics && (
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Últimos 30 días
            </p>
            <dl className="grid grid-cols-2 gap-2">
              {(Object.keys(METRIC_LABELS) as Array<keyof CampaignMetrics>).map((key) => (
                <div key={key} className="rounded-lg border p-2">
                  <dt className="text-xs text-muted-foreground">{METRIC_LABELS[key]}</dt>
                  <dd className="font-semibold">{formatMetric(key, data.metrics?.[key])}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {(internalUrl || adsManagerUrl) && (
          <div className="flex flex-wrap gap-3 border-t pt-3 text-xs">
            {internalUrl && (
              <a
                href={internalUrl}
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <BarChart3 className="h-3.5 w-3.5" /> Ver detalle
              </a>
            )}
            {adsManagerUrl && (
              <a
                href={adsManagerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Abrir Meta Ads
              </a>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
