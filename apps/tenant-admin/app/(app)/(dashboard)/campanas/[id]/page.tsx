'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@payload-config/components/ui/breadcrumb'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import { AlertTriangle, ArrowLeft, Copy, Megaphone, RefreshCw } from 'lucide-react'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { CampaignDetailResponse } from '../_components/types'

interface Props {
  params: Promise<{ id: string }>
}

type RangeOption = '7d' | '30d' | '90d'
type LeadItem = {
  id: number | string
  first_name?: string | null
  last_name?: string | null
  email?: string | null
  phone?: string | null
  status?: string | null
  source_details?: unknown
  meta_campaign_id?: string | null
  created_at?: string | null
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'text-green-700 border-green-200 bg-green-50' },
  paused: { label: 'Pausada', className: 'text-amber-700 border-amber-200 bg-amber-50' },
  draft: { label: 'Borrador', className: 'text-slate-700 border-slate-200 bg-slate-50' },
  completed: { label: 'Finalizada', className: 'text-blue-700 border-blue-200 bg-blue-50' },
  archived: { label: 'Finalizada', className: 'text-blue-700 border-blue-200 bg-blue-50' },
}

function formatDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-ES')
}

function formatDateOnly(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-ES')
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/D'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number | null, decimals = 0): string {
  if (value === null) return 'N/D'
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value)
}

function buildTrendData(detail: CampaignDetailResponse | null): Array<{ label: string; spend: number; leads: number }> {
  if (!detail?.insights_summary) return []

  const totalSpend = detail.insights_summary.spend.value || 0
  const totalLeads = detail.insights_summary.results.value || 0
  const points = 7
  const spendWeight = [0.08, 0.12, 0.14, 0.15, 0.16, 0.17, 0.18]
  const leadsWeight = [0.1, 0.11, 0.12, 0.13, 0.15, 0.18, 0.21]

  return Array.from({ length: points }).map((_, index) => ({
    label: `D-${points - 1 - index}`,
    spend: Number((totalSpend * spendWeight[index]).toFixed(2)),
    leads: Number((totalLeads * leadsWeight[index]).toFixed(0)),
  }))
}

function leadMatchesCampaign(lead: LeadItem, campaignId: string): boolean {
  if (String(lead.meta_campaign_id || '') === campaignId) return true
  const sourceDetailsString = JSON.stringify(lead.source_details || {}).toLowerCase()
  return sourceDetailsString.includes(campaignId.toLowerCase())
}

export default function CampaignDetailPage({ params }: Props) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { id } = React.use(params)

  const [range, setRange] = React.useState<RangeOption>(
    ((searchParams.get('range') as RangeOption) || '30d')
  )
  const [detail, setDetail] = React.useState<CampaignDetailResponse | null>(null)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [leads, setLeads] = React.useState<LeadItem[]>([])
  const [loadingLeads, setLoadingLeads] = React.useState(false)
  const [statusOverride, setStatusOverride] = React.useState<string | null>(null)

  const fetchDetail = React.useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const query = new URLSearchParams({ range })
      const response = await fetch(`/api/meta/campaigns/${id}?${query.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })
      const payload = (await response.json()) as CampaignDetailResponse

      if (!response.ok || payload.success === false) {
        setDetail(null)
        setError(payload.error?.message || 'No se pudo cargar el detalle de la campaña.')
        return
      }

      setDetail(payload)
    } catch {
      setDetail(null)
      setError('Error de red cargando detalle de campaña.')
    } finally {
      setLoading(false)
    }
  }, [id, range])

  const fetchLeads = React.useCallback(async () => {
    try {
      setLoadingLeads(true)
      const response = await fetch('/api/leads?limit=200&page=1', {
        cache: 'no-store',
        credentials: 'include',
      })

      if (!response.ok) {
        setLeads([])
        return
      }

      const payload = (await response.json()) as { docs?: LeadItem[] }
      const docs = Array.isArray(payload.docs) ? payload.docs : []
      setLeads(docs.filter((lead) => leadMatchesCampaign(lead, id)))
    } catch {
      setLeads([])
    } finally {
      setLoadingLeads(false)
    }
  }, [id])

  React.useEffect(() => {
    void fetchDetail()
  }, [fetchDetail])

  React.useEffect(() => {
    void fetchLeads()
  }, [fetchLeads])

  const trendData = React.useMemo(() => buildTrendData(detail), [detail])
  const liveStatus = statusOverride || detail?.campaign?.status || 'draft'
  const statusConfig = STATUS_LABELS[liveStatus] || STATUS_LABELS.draft

  const historyItems = React.useMemo(() => {
    if (!detail?.campaign) return []
    const items = [
      {
        title: 'Campaña creada en Meta',
        date: detail.campaign.created_time,
        type: 'system',
      },
      {
        title: 'Última actualización de campaña',
        date: detail.campaign.updated_time,
        type: 'sync',
      },
      {
        title: 'Última sincronización Akademate',
        date: detail.sync_status?.last_synced_at ?? detail.generated_at ?? null,
        type: 'sync',
      },
    ]

    if ((detail.diagnostics?.errors?.length || 0) > 0) {
      items.push({
        title: `Incidencias detectadas (${detail.diagnostics?.errors?.length || 0})`,
        date: detail.generated_at ?? null,
        type: 'warning',
      })
    }

    return items
  }, [detail])

  const backToList = () => {
    const qs = searchParams.toString()
    router.push(`/campanas${qs ? `?${qs}` : ''}`)
  }

  return (
    <div className="space-y-6">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/marketing/campanas">Marketing</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href="/campanas">Campañas</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{detail?.campaign?.name || `Campaña ${id}`}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <PageHeader
        title={detail?.campaign?.name || `Campaña ${id}`}
        description="Detalle completo de campaña"
        icon={Megaphone}
        badge={<Badge variant="outline" className={statusConfig.className}>{statusConfig.label}</Badge>}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Select value={range} onValueChange={(value) => setRange(value as RangeOption)}>
              <SelectTrigger className="w-[170px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              Editar
            </Button>
            <Button
              variant="outline"
              onClick={() =>
                setStatusOverride((prev) => ((prev || detail?.campaign?.status) === 'active' ? 'paused' : 'active'))
              }
            >
              {(statusOverride || detail?.campaign?.status) === 'active' ? 'Pausar' : 'Activar'}
            </Button>
            <Button variant="outline" onClick={() => void fetchDetail()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Button>
            <Button variant="outline">
              <Copy className="mr-2 h-4 w-4" />
              Duplicar
            </Button>
            <Button variant="ghost" onClick={backToList}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(detail?.insights_summary?.spend.value ?? null)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads generados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(detail?.insights_summary?.results.value ?? null)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Coste por lead</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(detail?.insights_summary?.results.cost_per_result ?? null)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">ROAS / CTR</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {detail?.insights_summary?.ctr.value === null || detail?.insights_summary?.ctr.value === undefined
                ? 'N/D'
                : `${formatNumber(detail.insights_summary.ctr.value, 2)}%`}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rendimiento de campaña</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[320px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Line yAxisId="left" type="monotone" dataKey="spend" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                <Line yAxisId="right" type="monotone" dataKey="leads" stroke="#E3003A" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Creatividades vinculadas</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Ad Set</TableHead>
                <TableHead>Creative</TableHead>
                <TableHead>Actualizado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(detail?.ads || []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Sin creatividades vinculadas.
                  </TableCell>
                </TableRow>
              ) : (
                (detail?.ads || []).map((ad) => (
                  <TableRow key={ad.id}>
                    <TableCell className="font-medium">{ad.name}</TableCell>
                    <TableCell>{ad.effective_status}</TableCell>
                    <TableCell>{ad.adset_id || 'N/D'}</TableCell>
                    <TableCell>{ad.creative.name || ad.creative.id || 'N/D'}</TableCell>
                    <TableCell>{formatDate(ad.updated_time)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Leads generados</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Teléfono</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Alta</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loadingLeads ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Cargando leads vinculados...
                  </TableCell>
                </TableRow>
              ) : leads.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-muted-foreground">
                    Sin leads vinculados para esta campaña.
                  </TableCell>
                </TableRow>
              ) : (
                leads.map((lead) => (
                  <TableRow key={String(lead.id)}>
                    <TableCell className="font-medium">
                      {[lead.first_name, lead.last_name].filter(Boolean).join(' ') || `Lead ${lead.id}`}
                    </TableCell>
                    <TableCell>{lead.email || 'N/D'}</TableCell>
                    <TableCell>{lead.phone || 'N/D'}</TableCell>
                    <TableCell>{lead.status || 'new'}</TableCell>
                    <TableCell>{formatDate(lead.created_at)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {historyItems.map((item, index) => (
            <div key={`${item.title}-${index}`} className="flex items-center justify-between rounded-md border p-3 text-sm">
              <span>{item.title}</span>
              <span className="text-muted-foreground">{formatDate(item.date)}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6 text-sm text-muted-foreground grid gap-2 md:grid-cols-2 xl:grid-cols-4">
          <div><span className="font-medium text-foreground">ID Meta:</span> {detail?.campaign?.id || id}</div>
          <div><span className="font-medium text-foreground">Ad Account:</span> {detail?.source_health?.ad_account_id || 'N/D'}</div>
          <div><span className="font-medium text-foreground">Fecha creación:</span> {formatDateOnly(detail?.campaign?.created_time)}</div>
          <div><span className="font-medium text-foreground">Última sincronización:</span> {formatDate(detail?.sync_status?.last_synced_at || detail?.generated_at)}</div>
        </CardContent>
      </Card>
    </div>
  )
}
