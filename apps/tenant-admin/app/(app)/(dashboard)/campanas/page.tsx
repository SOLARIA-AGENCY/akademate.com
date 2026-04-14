'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@payload-config/components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@payload-config/components/ui/sheet'
import {
  AlertTriangle,
  Archive,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Circle,
  ExternalLink,
  Eye,
  Megaphone,
  Pause,
  Plus,
  Power,
  RefreshCw,
  Search,
  TrendingUp,
} from 'lucide-react'
import { CampaignDetailContent } from './_components/CampaignDetailContent'
import type {
  CampaignDetailResponse,
  CampaignListItem,
  CampaignStatus,
  CampaignsResponse,
  MetricNumber,
} from './_components/types'

const SOLARIA_PREFIX = 'SOLARIA AGENCY'

type SortField = CampaignsResponse['sort']
type SortOrder = CampaignsResponse['order']

type RangeOption = '7d' | '30d' | '90d'

const STATUS_CONFIG: Record<
  CampaignStatus,
  { label: string; color: string; icon: typeof Circle; dotColor: string }
> = {
  active: { label: 'Activa', color: 'text-green-600', icon: Circle, dotColor: 'bg-green-500 animate-pulse' },
  paused: { label: 'En pausa', color: 'text-yellow-600', icon: Pause, dotColor: 'bg-yellow-500' },
  draft: { label: 'Borrador', color: 'text-muted-foreground', icon: Power, dotColor: 'bg-gray-400' },
  completed: { label: 'Completada', color: 'text-blue-600', icon: CheckCircle2, dotColor: 'bg-blue-500' },
  archived: { label: 'Archivada', color: 'text-muted-foreground', icon: Archive, dotColor: 'bg-gray-300' },
}

interface ConvocatoriaOption {
  id: string
  curso: string
  sede: string
  estado: string
  fechaInicio: string
}

interface ConvocatoriasApiPayload {
  data?: Array<{
    id: string | number
    cursoNombre?: string
    campusNombre?: string
    estado?: string
    fechaInicio?: string
  }>
}

interface MetaCreateResponse {
  success?: boolean
  data?: {
    metaCampaignId?: string
    adsManagerUrl?: string
  }
  error?: string
}

function formatDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleString('es-ES')
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

function metricStateBadge(metric: MetricNumber) {
  if (metric.state === 'loaded') return <Badge variant="outline">OK</Badge>
  if (metric.state === 'zero_real') return <Badge variant="outline">0 real</Badge>
  if (metric.state === 'api_error') return <Badge variant="destructive">Error API</Badge>
  return <Badge variant="secondary">Sin dato</Badge>
}

function metricValue(metric: MetricNumber, formatter: (value: number | null) => string): string {
  if (metric.state === 'api_error') return 'Error API'
  if (metric.state === 'not_available') return 'N/D'
  return formatter(metric.value)
}

function buildCampaignsErrorMessage(payload?: CampaignsResponse | null): string | null {
  if (!payload?.error) return null

  if (payload.error.code === 'UNAUTHORIZED') {
    return 'Sesión expirada. Inicia sesión de nuevo para cargar campañas de Meta.'
  }

  if (payload.error.code === 'TOKEN_EXPIRED') {
    return payload.error.token_expires_at
      ? `Token de Meta caducado (${payload.error.token_expires_at}). Actualízalo en Configuración > Integraciones.`
      : 'Token de Meta caducado. Actualízalo en Configuración > Integraciones.'
  }

  if (payload.error.code === 'MISSING_PERMISSIONS') {
    return 'Permisos insuficientes en Meta API (requerido: ads_read / ads_management).'
  }

  if (payload.error.code === 'AD_ACCOUNT_ACCESS_DENIED') {
    return 'Sin acceso a la cuenta publicitaria configurada para este tenant.'
  }

  if (payload.error.code === 'MISCONFIGURED') {
    return 'Integración Meta incompleta: revisa token y Ad Account ID en Configuración.'
  }

  return payload.error.message || 'No se pudieron recuperar campañas de Meta.'
}

export default function CampanasPage() {
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [sourceHealth, setSourceHealth] = useState<CampaignsResponse['source_health'] | null>(null)
  const [generatedAt, setGeneratedAt] = useState<string | null>(null)
  const [diagnostics, setDiagnostics] = useState<{ warnings: string[]; errors: string[] } | null>(null)
  const [isStale, setIsStale] = useState(false)

  const [range, setRange] = useState<RangeOption>('30d')
  const [statusFilter, setStatusFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState<SortField>('updated_time')
  const [order, setOrder] = useState<SortOrder>('desc')

  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)
  const [detailOpen, setDetailOpen] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailError, setDetailError] = useState<string | null>(null)
  const [detailData, setDetailData] = useState<CampaignDetailResponse | null>(null)

  const [showCreateModal, setShowCreateModal] = useState(false)
  const [convocatorias, setConvocatorias] = useState<ConvocatoriaOption[]>([])
  const [loadingConvs, setLoadingConvs] = useState(false)
  const [selectedConv, setSelectedConv] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [dailyBudget, setDailyBudget] = useState('20')
  const [headline, setHeadline] = useState('')
  const [primaryText, setPrimaryText] = useState('')
  const [description, setDescription] = useState('')
  const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [lastCreatedCampaign, setLastCreatedCampaign] = useState<{
    id: string
    adsManagerUrl?: string
  } | null>(null)

  const fetchCampaigns = useCallback(
    async (options?: { forceRefresh?: boolean }) => {
      try {
        setIsLoading(true)
        setErrorMessage(null)

        const params = new URLSearchParams({
          range,
          sort,
          order,
          limit: '100',
        })

        if (statusFilter !== 'all') params.set('status', statusFilter)
        if (query.trim()) params.set('q', query.trim())
        if (options?.forceRefresh) params.set('force_refresh', '1')

        const response = await fetch(`/api/meta/campaigns?${params.toString()}`, {
          cache: 'no-cache',
          credentials: 'include',
        })

        const payload = (await response.json()) as CampaignsResponse

        if (response.status === 401) {
          setCampaigns([])
          setErrorMessage('Sesión expirada. Inicia sesión para visualizar campañas.')
          return
        }

        setCampaigns(Array.isArray(payload.docs) ? payload.docs : [])
        setTotalDocs(payload.totalDocs ?? 0)
        setSourceHealth(payload.source_health ?? null)
        setDiagnostics(payload.diagnostics ?? null)
        setGeneratedAt(payload.generated_at ?? null)
        setIsStale(Boolean(payload.stale))

        if (!response.ok) {
          setErrorMessage('No se pudo conectar con Meta API en este momento.')
          return
        }

        const operationalMessage = buildCampaignsErrorMessage(payload)
        if (operationalMessage) {
          setErrorMessage(operationalMessage)
        }
      } catch {
        setCampaigns([])
        setErrorMessage('Error de red cargando campañas de Meta.')
      } finally {
        setIsLoading(false)
      }
    },
    [order, query, range, sort, statusFilter]
  )

  useEffect(() => {
    void fetchCampaigns()
  }, [fetchCampaigns])

  const fetchDetail = useCallback(
    async (campaignId: string) => {
      try {
        setDetailLoading(true)
        setDetailError(null)

        const params = new URLSearchParams({
          range,
        })

        const response = await fetch(`/api/meta/campaigns/${campaignId}?${params.toString()}`, {
          cache: 'no-cache',
          credentials: 'include',
        })

        const payload = (await response.json()) as CampaignDetailResponse

        if (!response.ok || payload.success === false) {
          setDetailData(null)
          setDetailError(payload.error?.message || 'No se pudo cargar el detalle de la campaña.')
          return
        }

        setDetailData(payload)
      } catch {
        setDetailData(null)
        setDetailError('Error de red cargando el detalle de campaña.')
      } finally {
        setDetailLoading(false)
      }
    },
    [range]
  )

  useEffect(() => {
    if (!detailOpen || !selectedCampaignId) return
    void fetchDetail(selectedCampaignId)
  }, [detailOpen, fetchDetail, selectedCampaignId])

  const stats = useMemo(() => {
    const activeCount = campaigns.filter((item) => item.campaign.status === 'active').length

    const totalSpend = campaigns.reduce((sum, item) => {
      const metric = item.insights_summary.spend
      if (metric.state === 'loaded' || metric.state === 'zero_real') {
        return sum + (metric.value || 0)
      }
      return sum
    }, 0)

    const totalResults = campaigns.reduce((sum, item) => {
      const metric = item.insights_summary.results
      if (metric.state === 'loaded' || metric.state === 'zero_real') {
        return sum + (metric.value || 0)
      }
      return sum
    }, 0)

    const withErrors = campaigns.filter((item) => item.diagnostics.errors.length > 0).length

    return {
      activeCount,
      totalSpend,
      totalResults,
      withErrors,
    }
  }, [campaigns])

  const handleSort = (field: SortField) => {
    if (sort === field) {
      setOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'))
      return
    }

    setSort(field)
    setOrder('desc')
  }

  const openDetail = (campaignId: string) => {
    setSelectedCampaignId(campaignId)
    setDetailOpen(true)
    setDetailData(null)
    setDetailError(null)
  }

  const openCreateModal = async () => {
    setShowCreateModal(true)
    setCreateError(null)
    setSelectedConv('')
    setCampaignName('')
    setDailyBudget('20')
    setHeadline('')
    setPrimaryText('')
    setDescription('')

    setLoadingConvs(true)
    try {
      const res = await fetch('/api/convocatorias', { cache: 'no-cache' })
      if (res.ok) {
        const data = (await res.json()) as ConvocatoriasApiPayload
        const items = Array.isArray(data.data) ? data.data : []
        setConvocatorias(
          items
            .filter((item) =>
              item.estado === 'enrollment_open' || item.estado === 'in_progress' || item.estado === 'draft'
            )
            .map((item) => ({
              id: String(item.id),
              curso: item.cursoNombre ?? 'Curso',
              sede: item.campusNombre ?? 'Sin sede',
              estado: item.estado ?? 'draft',
              fechaInicio: item.fechaInicio ?? '',
            }))
        )
      } else {
        setConvocatorias([])
      }
    } catch {
      setConvocatorias([])
    } finally {
      setLoadingConvs(false)
    }
  }

  const handleCreateCampaign = async () => {
    const parsedBudget = Number(dailyBudget)
    if (!selectedConv || !campaignName.trim() || !headline.trim() || !primaryText.trim()) {
      setCreateError('Completa todos los campos obligatorios para crear la campaña.')
      return
    }
    if (!Number.isFinite(parsedBudget) || parsedBudget <= 0) {
      setCreateError('El presupuesto diario debe ser mayor que 0.')
      return
    }

    setCreateError(null)
    setIsCreatingCampaign(true)

    try {
      const response = await fetch('/api/meta/ads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          convocatoriaId: Number(selectedConv),
          campaignName: campaignName.trim(),
          dailyBudget: parsedBudget,
          headlines: [headline.trim()],
          primaryTexts: [primaryText.trim()],
          descriptions: description.trim() ? [description.trim()] : [],
        }),
      })

      const payload = (await response.json()) as MetaCreateResponse
      if (!response.ok) {
        setCreateError(payload.error || 'No se pudo crear la campaña en Meta.')
        return
      }

      setShowCreateModal(false)
      setLastCreatedCampaign({
        id: payload.data?.metaCampaignId || 'N/D',
        adsManagerUrl: payload.data?.adsManagerUrl,
      })
      await fetchCampaigns({ forceRefresh: true })
    } catch {
      setCreateError('Error de red creando la campaña en Meta.')
    } finally {
      setIsCreatingCampaign(false)
    }
  }

  return (
    <div className="space-y-6">
      {isLoading && (
        <div className="rounded-lg border border-dashed bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
          Cargando campañas...
        </div>
      )}

      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      {sourceHealth && (
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm space-y-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">Fuente:</span>
            <Badge variant={sourceHealth.status === 'ok' ? 'default' : 'outline'}>
              Meta API {sourceHealth.status === 'ok' ? 'operativa' : 'degradada'}
            </Badge>
            {isStale && <Badge variant="secondary">Datos cacheados</Badge>}
            <span className="text-muted-foreground">Ad Account: {sourceHealth.ad_account_id || 'N/D'}</span>
          </div>
          <div className="text-muted-foreground">Última verificación: {formatDate(sourceHealth.checked_at)}</div>
          {generatedAt && <div className="text-muted-foreground">Generado: {formatDate(generatedAt)}</div>}
        </div>
      )}

      {lastCreatedCampaign && (
        <div className="rounded-lg border border-green-500/30 bg-green-500/10 px-4 py-3 text-sm text-green-800">
          Campaña creada en Meta correctamente (ID: {lastCreatedCampaign.id}).
          {lastCreatedCampaign.adsManagerUrl && (
            <a
              href={lastCreatedCampaign.adsManagerUrl}
              target="_blank"
              rel="noreferrer"
              className="ml-2 inline-flex items-center gap-1 underline"
            >
              Abrir en Ads Manager <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description={`Campañas live de Meta filtradas por "${SOLARIA_PREFIX}"`}
        icon={TrendingUp}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => void fetchCampaigns({ forceRefresh: true })}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sincronizar
            </Button>
            <Button onClick={openCreateModal}>
              <Plus className="mr-2 h-4 w-4" />
              Nueva Campaña
            </Button>
          </div>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
            <p className="text-xs text-muted-foreground">Campañas en ejecución</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto (rango)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.totalSpend)}</div>
            <p className="text-xs text-muted-foreground">Spend Meta consolidado</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatNumber(stats.totalResults)}</div>
            <p className="text-xs text-muted-foreground">Leads/conversiones Meta</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Con incidencias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.withErrors}</div>
            <p className="text-xs text-muted-foreground">Datos parciales o error API</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-4">
            <div className="md:col-span-2">
              <Label>Buscar campaña</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre o ID Meta"
                  className="pl-8"
                />
              </div>
            </div>
            <div>
              <Label>Rango</Label>
              <Select value={range} onValueChange={(value) => setRange(value as RangeOption)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">Últimos 7 días</SelectItem>
                  <SelectItem value="30d">Últimos 30 días</SelectItem>
                  <SelectItem value="90d">Últimos 90 días</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="completed">Completada</SelectItem>
                  <SelectItem value="archived">Archivada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {(diagnostics?.warnings?.length || 0) > 0 && (
            <div className="mt-4 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-800">
              {diagnostics?.warnings.join(' · ')}
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && campaigns.length === 0 ? (
        <EmptyState
          icon={Megaphone}
          title={`Sin campañas ${SOLARIA_PREFIX}`}
          description="No hay campañas de SOLARIA para la Ad Account actual. Crea una nueva campaña en Meta."
        />
      ) : (
        <>
          <div className="hidden md:block rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaña</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>
                    <button
                      className="inline-flex items-center gap-1"
                      onClick={() => handleSort('updated_time')}
                      type="button"
                    >
                      Updated
                      {sort === 'updated_time' && (order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </TableHead>
                  <TableHead>Start</TableHead>
                  <TableHead>Stop</TableHead>
                  <TableHead>Presupuesto</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => handleSort('spend')} type="button">
                      Spend
                      {sort === 'spend' && (order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </TableHead>
                  <TableHead>Reach</TableHead>
                  <TableHead>Clicks</TableHead>
                  <TableHead>CTR</TableHead>
                  <TableHead>
                    <button className="inline-flex items-center gap-1" onClick={() => handleSort('results')} type="button">
                      Resultados
                      {sort === 'results' && (order === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />)}
                    </button>
                  </TableHead>
                  <TableHead>Coste/resultado</TableHead>
                  <TableHead>Último sync</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((item) => {
                  const statusConfig = STATUS_CONFIG[item.campaign.status] || STATUS_CONFIG.draft

                  return (
                    <TableRow key={item.campaign.id} className="cursor-pointer" onClick={() => openDetail(item.campaign.id)}>
                      <TableCell>
                        <div className="font-medium max-w-[260px] truncate">{item.campaign.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {item.campaign.id}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                          <Badge variant="outline" className={statusConfig.color}>
                            {statusConfig.label}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(item.campaign.updated_time)}</TableCell>
                      <TableCell>{formatDate(item.campaign.start_time)}</TableCell>
                      <TableCell>{formatDate(item.campaign.stop_time)}</TableCell>
                      <TableCell>{formatCurrency(item.campaign.budget)}</TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{metricValue(item.insights_summary.spend, formatCurrency)}</div>
                          {metricStateBadge(item.insights_summary.spend)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{metricValue(item.insights_summary.reach, (value) => formatNumber(value, 0))}</div>
                          {metricStateBadge(item.insights_summary.reach)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{metricValue(item.insights_summary.clicks, (value) => formatNumber(value, 0))}</div>
                          {metricStateBadge(item.insights_summary.clicks)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{metricValue(item.insights_summary.ctr, (value) => (value === null ? 'N/D' : `${formatNumber(value, 2)}%`))}</div>
                          {metricStateBadge(item.insights_summary.ctr)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{metricValue(item.insights_summary.results, (value) => formatNumber(value, 0))}</div>
                          {metricStateBadge(item.insights_summary.results)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>
                            {metricValue(
                              {
                                value: item.insights_summary.results.cost_per_result,
                                state: item.insights_summary.results.cost_per_result_state,
                              },
                              formatCurrency
                            )}
                          </div>
                          {metricStateBadge({
                            value: item.insights_summary.results.cost_per_result,
                            state: item.insights_summary.results.cost_per_result_state,
                          })}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(item.sync_status.last_synced_at)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              openDetail(item.campaign.id)
                            }}
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation()
                              window.open(item.campaign.ads_manager_url, '_blank', 'noopener,noreferrer')
                            }}
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>

          <div className="grid gap-3 md:hidden">
            {campaigns.map((item) => {
              const statusConfig = STATUS_CONFIG[item.campaign.status] || STATUS_CONFIG.draft

              return (
                <Card key={item.campaign.id} className="cursor-pointer" onClick={() => openDetail(item.campaign.id)}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">{item.campaign.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusConfig.dotColor}`} />
                      <Badge variant="outline" className={statusConfig.color}>
                        {statusConfig.label}
                      </Badge>
                    </div>
                    <div className="text-muted-foreground">Updated: {formatDate(item.campaign.updated_time)}</div>
                    <div>Spend: {metricValue(item.insights_summary.spend, formatCurrency)}</div>
                    <div>Resultados: {metricValue(item.insights_summary.results, (value) => formatNumber(value, 0))}</div>
                  </CardContent>
                </Card>
              )
            })}
          </div>

          <div className="text-xs text-muted-foreground">Mostrando {campaigns.length} de {totalDocs} campañas.</div>
        </>
      )}

      <Sheet open={detailOpen} onOpenChange={setDetailOpen}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Detalle de Campaña</SheetTitle>
            <SheetDescription>
              Vista operativa Meta Live con métricas reales, creatividades y estructura de anuncios.
            </SheetDescription>
          </SheetHeader>
          <CampaignDetailContent detail={detailData} isLoading={detailLoading} error={detailError} />
        </SheetContent>
      </Sheet>

      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <Card className="w-full max-w-lg mx-4 shadow-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Nueva Campaña en Meta</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => setShowCreateModal(false)}>
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="space-y-2">
                <Label>Convocatoria a promocionar</Label>
                {loadingConvs ? (
                  <div className="text-sm text-muted-foreground py-2">Cargando convocatorias activas...</div>
                ) : convocatorias.length === 0 ? (
                  <div className="text-sm text-muted-foreground py-2 border rounded-lg p-3">
                    No hay convocatorias activas. Crea una convocatoria primero desde Programación.
                  </div>
                ) : (
                  <Select
                    value={selectedConv}
                    onValueChange={(value) => {
                      setSelectedConv(value)
                      const conv = convocatorias.find((item) => item.id === value)
                      if (conv && !campaignName) {
                        setCampaignName(`${SOLARIA_PREFIX} - ${conv.curso}`)
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona convocatoria..." />
                    </SelectTrigger>
                    <SelectContent>
                      {convocatorias.map((conv) => (
                        <SelectItem key={conv.id} value={conv.id}>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{conv.curso}</span>
                            <span className="text-xs text-muted-foreground">— {conv.sede}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>

              <div className="space-y-2">
                <Label>Nombre de campaña</Label>
                <Input
                  value={campaignName}
                  onChange={(event) => setCampaignName(event.target.value)}
                  placeholder={`${SOLARIA_PREFIX} - CFGM Farmacia`}
                />
              </div>

              <div className="space-y-2">
                <Label>Presupuesto diario (EUR)</Label>
                <Input
                  type="number"
                  min={1}
                  value={dailyBudget}
                  onChange={(event) => setDailyBudget(event.target.value)}
                  placeholder="20"
                />
              </div>

              <div className="space-y-2">
                <Label>Headline</Label>
                <Input
                  value={headline}
                  onChange={(event) => setHeadline(event.target.value)}
                  placeholder="Título del anuncio"
                />
              </div>

              <div className="space-y-2">
                <Label>Texto principal</Label>
                <Input
                  value={primaryText}
                  onChange={(event) => setPrimaryText(event.target.value)}
                  placeholder="Mensaje principal del anuncio"
                />
              </div>

              <div className="space-y-2">
                <Label>Descripción (opcional)</Label>
                <Input
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  placeholder="Descripción opcional"
                />
              </div>

              {createError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {createError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => setShowCreateModal(false)}>
                  Cancelar
                </Button>
                <Button className="flex-1" disabled={isCreatingCampaign} onClick={handleCreateCampaign}>
                  {isCreatingCampaign ? 'Creando...' : 'Crear Campaña'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
