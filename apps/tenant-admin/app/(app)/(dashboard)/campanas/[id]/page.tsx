'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { AlertTriangle, ArrowLeft, Megaphone, RefreshCw } from 'lucide-react'
import { CampaignDetailContent } from '../_components/CampaignDetailContent'
import type { CampaignDetailResponse } from '../_components/types'

interface Props {
  params: Promise<{ id: string }>
}

type RangeOption = '7d' | '30d' | '90d'

function formatDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-ES')
}

export default function CampaignDetailPage({ params }: Props) {
  const router = useRouter()
  const { id } = React.use(params)

  const [range, setRange] = React.useState<RangeOption>('30d')
  const [detail, setDetail] = React.useState<CampaignDetailResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = new URLSearchParams({ range })
      const response = await fetch(`/api/meta/campaigns/${id}?${query.toString()}`, {
        cache: 'no-cache',
        credentials: 'include',
      })
      const payload = (await response.json()) as CampaignDetailResponse

      if (!response.ok || payload.success === false) {
        setDetail(null)
        setError(payload.error?.message || 'No se pudo cargar el detalle de la campana.')
        return
      }

      setDetail(payload)
    } catch {
      setDetail(null)
      setError('Error de red cargando detalle de campana.')
    } finally {
      setLoading(false)
    }
  }, [id, range])

  React.useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  return (
    <div className="space-y-6">
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <PageHeader
        title={detail?.campaign?.name || `Campana ${id}`}
        description="Detalle operativo Meta Live para campana SOLARIA"
        icon={Megaphone}
        badge={
          detail?.campaign?.meta_status ? <Badge variant="outline">{detail.campaign.meta_status}</Badge> : null
        }
        actions={
          <div className="flex items-center gap-2">
            <Select value={range} onValueChange={(value) => setRange(value as RangeOption)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Ultimos 7 dias</SelectItem>
                <SelectItem value="30d">Ultimos 30 dias</SelectItem>
                <SelectItem value="90d">Ultimos 90 dias</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => void fetchDetail()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Button>

            <Button variant="outline" onClick={() => router.push('/campanas')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Campanas
            </Button>
          </div>
        }
      />

      {detail?.source_health && (
        <Card>
          <CardContent className="pt-6 text-sm space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-medium">Fuente:</span>
              <Badge variant={detail.source_health.status === 'ok' ? 'default' : 'outline'}>
                Meta API {detail.source_health.status === 'ok' ? 'operativa' : 'degradada'}
              </Badge>
              <span className="text-muted-foreground">Ad Account: {detail.source_health.ad_account_id || 'N/D'}</span>
            </div>
            <div className="text-muted-foreground">Ultima verificacion: {formatDate(detail.source_health.checked_at)}</div>
            {detail.generated_at && (
              <div className="text-muted-foreground">Generado: {formatDate(detail.generated_at)}</div>
            )}
          </CardContent>
        </Card>
      )}

      <CampaignDetailContent detail={detail} isLoading={loading} error={error} />
    </div>
  )
}
