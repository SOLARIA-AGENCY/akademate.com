'use client'

import * as React from 'react'
import { BarChart3, ExternalLink } from 'lucide-react'
import Link from 'next/link'

import { CampaignBadge, type CampaignState } from './CampaignBadge'

type ReadLinkStatus = 'linked' | 'not_linked' | 'ambiguous' | 'unavailable'
type ReadDeliveryStatus = 'active' | 'paused' | 'completed' | 'draft' | 'unknown'

interface CampaignReadResponse {
  success?: boolean
  linkStatus?: ReadLinkStatus
  workflowStatus?: string | null
  deliveryStatus?: ReadDeliveryStatus
  metaCampaignId?: string | null
  campaignName?: string | null
  internalDetailUrl?: string | null
  adsManagerUrl?: string | null
  lastSyncedAt?: string | null
  source?: string
  stale?: boolean
}

interface ConvocatoriaCampaignBadgeProps {
  convocatoriaId: string | number
  fallbackStatus: CampaignState
  fallbackCampaignId?: string | null
  fallbackCampaignName?: string | null
  className?: string
}

function statusFromRead(value: CampaignReadResponse): CampaignState {
  if (value.source === 'unavailable') return 'unavailable'
  if (value.linkStatus === 'not_linked') return 'not_linked'
  if (value.linkStatus === 'ambiguous') return 'ambiguous'
  if (value.linkStatus === 'unavailable') return 'unavailable'
  if (value.deliveryStatus === 'active') return 'active'
  if (value.deliveryStatus === 'paused') return 'paused'
  if (value.deliveryStatus === 'completed') return 'completed'
  if (value.deliveryStatus === 'draft') return 'draft'
  if (value.workflowStatus === 'ended') return 'completed'
  if (value.workflowStatus === 'error') return 'unavailable'
  return 'unavailable'
}

function formatSyncDate(value: string | null | undefined): string | null {
  if (!value) return null
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return null
  return date.toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' })
}

/**
 * Reads the new per-convocation contract when enabled in staging. A 404 is
 * the intentional disabled-feature response and preserves the existing badge.
 */
export function ConvocatoriaCampaignBadge({
  convocatoriaId,
  fallbackStatus,
  fallbackCampaignId = null,
  fallbackCampaignName = null,
  className = '',
}: ConvocatoriaCampaignBadgeProps) {
  const [read, setRead] = React.useState<CampaignReadResponse | null>(null)

  React.useEffect(() => {
    if (process.env.NEXT_PUBLIC_AKADEMATE_CEP_CONVOCATORIA_CAMPAIGN_READ_ENABLED !== 'true') {
      return
    }

    let mounted = true
    const load = async () => {
      try {
        const response = await fetch(
          `/api/convocatorias/${encodeURIComponent(String(convocatoriaId))}/campaign`,
          { cache: 'no-store' }
        )
        if (response.status === 404) return
        if (!response.ok) {
          if (mounted) setRead({ success: true, linkStatus: 'unavailable' })
          return
        }
        const body = (await response.json()) as CampaignReadResponse
        if (mounted && body.success === true) setRead(body)
      } catch {
        // A disabled endpoint returns 404 above; a transport failure while the
        // flag is enabled must not be rendered as "Sin campaña".
        if (mounted) setRead({ success: true, linkStatus: 'unavailable' })
      }
    }
    void load()
    return () => {
      mounted = false
    }
  }, [convocatoriaId])

  const status = read ? statusFromRead(read) : fallbackStatus
  const campaignId = read?.metaCampaignId ?? fallbackCampaignId
  const campaignName = read?.campaignName ?? fallbackCampaignName
  const syncedAt = formatSyncDate(read?.lastSyncedAt)

  return (
    <div className={`flex flex-col items-start gap-1 ${className}`}>
      <CampaignBadge status={status} campaignId={campaignId} />
      {campaignName && (
        <span className="max-w-full truncate text-[11px] text-muted-foreground">
          {campaignName}
        </span>
      )}
      {read?.internalDetailUrl && (
        <div className="flex flex-wrap items-center gap-2 text-[11px]">
          <Link
            href={read.internalDetailUrl}
            className="inline-flex items-center gap-1 text-primary hover:underline"
            onClick={(event) => event.stopPropagation()}
          >
            <BarChart3 className="h-3 w-3" />
            Ver estadísticas
          </Link>
          {read.adsManagerUrl && (
            <a
              href={read.adsManagerUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-muted-foreground hover:underline"
              onClick={(event) => event.stopPropagation()}
            >
              <ExternalLink className="h-3 w-3" />
              Meta Ads
            </a>
          )}
          {syncedAt && (
            <span className={read.stale ? 'text-amber-700' : 'text-muted-foreground'}>
              {read.stale ? 'Snapshot: ' : 'Sincronizada: '}
              {syncedAt}
            </span>
          )}
        </div>
      )}
    </div>
  )
}
