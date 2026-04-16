'use client'

export const dynamic = 'force-dynamic'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import { Button } from '@payload-config/components/ui/button'
import { Badge } from '@payload-config/components/ui/badge'
import { Input } from '@payload-config/components/ui/input'
import { Label } from '@payload-config/components/ui/label'
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
import { AlertTriangle, CalendarClock, Megaphone, RefreshCw, Search } from 'lucide-react'
import type { CampaignListItem, CampaignStatus, CampaignsResponse } from './_components/types'

type StatusFilter = 'all' | 'active' | 'paused' | 'draft' | 'completed'
type RangeOption = 'today' | '7d' | '30d' | 'month' | 'custom'
type UiStatus = 'active' | 'paused' | 'draft' | 'completed'

interface AccountOption {
  id: string
  name: string
}

const STATUS_BADGES: Record<UiStatus, { label: string; className: string }> = {
  active: { label: 'Activa', className: 'text-green-700 border-green-200 bg-green-50' },
  paused: { label: 'Pausada', className: 'text-amber-700 border-amber-200 bg-amber-50' },
  draft: { label: 'Borrador', className: 'text-slate-700 border-slate-200 bg-slate-50' },
  completed: { label: 'Finalizada', className: 'text-blue-700 border-blue-200 bg-blue-50' },
}

const RANGE_OPTIONS: Array<{ value: RangeOption; label: string }> = [
  { value: 'today', label: 'Hoy' },
  { value: '7d', label: 'Últimos 7 días' },
  { value: '30d', label: 'Últimos 30 días' },
  { value: 'month', label: 'Este mes' },
  { value: 'custom', label: 'Rango personalizado' },
]

const DEFAULT_CAMPAIGNS_YEAR = '2026'
const DEFAULT_CAMPAIGNS_SINCE = `${DEFAULT_CAMPAIGNS_YEAR}-01-01`
const DEFAULT_CAMPAIGNS_UNTIL = `${DEFAULT_CAMPAIGNS_YEAR}-12-31`

function formatDate(value?: string | null): string {
  if (!value) return 'N/D'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return value
  return parsed.toLocaleDateString('es-ES')
}

function formatDateRange(start?: string | null, end?: string | null): string {
  const startDate = formatDate(start)
  const endDate = formatDate(end)
  if (startDate === 'N/D' && endDate === 'N/D') return 'Sin fechas'
  return `${startDate} – ${endDate}`
}

function formatCurrency(value: number | null): string {
  if (value === null) return 'N/D'
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value)
}

function formatInteger(value: number | null): string {
  if (value === null) return '0'
  return new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value)
}

function normalizeCampaignStatus(status: CampaignStatus): UiStatus {
  if (status === 'archived') return 'completed'
  return status
}

function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

function resolveRangeParams(range: RangeOption, since: string, until: string): Record<string, string> {
  const today = new Date()
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1)

  if (range === 'today') {
    const iso = toIsoDate(today)
    return { range: 'custom', since: iso, until: iso }
  }

  if (range === 'month') {
    return { range: 'custom', since: toIsoDate(monthStart), until: toIsoDate(today) }
  }

  if (range === 'custom') {
    return { range: 'custom', since, until }
  }

  return { range }
}

export default function CampanasPage() {
  const router = useRouter()
  const [campaigns, setCampaigns] = useState<CampaignListItem[]>([])
  const [totalDocs, setTotalDocs] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const [accountOptions, setAccountOptions] = useState<AccountOption[]>([
    { id: 'all', name: 'Todas las cuentas' },
  ])
  const [selectedAccount, setSelectedAccount] = useState('all')
  const [range, setRange] = useState<RangeOption>('custom')
  const [customSince, setCustomSince] = useState(DEFAULT_CAMPAIGNS_SINCE)
  const [customUntil, setCustomUntil] = useState(DEFAULT_CAMPAIGNS_UNTIL)
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('paused')
  const [query, setQuery] = useState('')
  const [statusOverrides, setStatusOverrides] = useState<Record<string, UiStatus>>({})

  const selectedAccountName = useMemo(() => {
    const option = accountOptions.find((item) => item.id === selectedAccount)
    return option?.name || 'Todas las cuentas'
  }, [accountOptions, selectedAccount])

  const buildFilterQueryString = useCallback(() => {
    const params = new URLSearchParams()
    params.set('adAccount', selectedAccount)
    params.set('range', range)
    params.set('status', statusFilter)
    if (query.trim()) params.set('q', query.trim())
    if (range === 'custom') {
      if (customSince) params.set('since', customSince)
      if (customUntil) params.set('until', customUntil)
    }
    return params.toString()
  }, [selectedAccount, range, statusFilter, query, customSince, customUntil])

  const fetchCampaigns = useCallback(async () => {
    setIsLoading(true)
    setErrorMessage(null)

    try {
      const params = new URLSearchParams({
        sort: 'updated_time',
        order: 'desc',
        limit: '100',
      })

      const rangeParams = resolveRangeParams(range, customSince, customUntil)
      Object.entries(rangeParams).forEach(([key, value]) => {
        if (value) params.set(key, value)
      })

      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (query.trim()) params.set('q', query.trim())

      const response = await fetch(`/api/meta/campaigns?${params.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      })

      const payload = (await response.json()) as CampaignsResponse

      if (response.status === 401) {
        setCampaigns([])
        setErrorMessage('Sesión expirada. Inicia sesión para visualizar campañas.')
        return
      }

      const docs = Array.isArray(payload.docs) ? payload.docs : []
      setCampaigns(docs)
      setTotalDocs(payload.totalDocs ?? 0)

      const nextAccountOptions: AccountOption[] = [{ id: 'all', name: 'Todas las cuentas' }]
      if (payload.source_health?.ad_account_id) {
        nextAccountOptions.push({
          id: payload.source_health.ad_account_id,
          name: `Ad Account ${payload.source_health.ad_account_id}`,
        })
      }
      setAccountOptions(nextAccountOptions)

      if (!response.ok) {
        setErrorMessage(payload.error?.message || 'No se pudieron recuperar campañas de Meta.')
      }
    } catch {
      setCampaigns([])
      setErrorMessage('Error de red cargando campañas.')
    } finally {
      setIsLoading(false)
    }
  }, [range, customSince, customUntil, statusFilter, query])

  useEffect(() => {
    void fetchCampaigns()
  }, [fetchCampaigns])

  const campaignsScoped = useMemo(() => {
    if (selectedAccount === 'all') return campaigns
    return campaigns
  }, [campaigns, selectedAccount])

  const withUiStatus = useMemo(() => {
    return campaignsScoped.map((item) => {
      const fallback = normalizeCampaignStatus(item.campaign.status)
      const status = statusOverrides[item.campaign.id] ?? fallback
      return {
        ...item,
        uiStatus: status,
      }
    })
  }, [campaignsScoped, statusOverrides])

  const stats = useMemo(() => {
    const activeCount = withUiStatus.filter((item) => item.uiStatus === 'active').length
    const spend = withUiStatus.reduce((acc, item) => {
      if (item.insights_summary.spend.state === 'loaded' || item.insights_summary.spend.state === 'zero_real') {
        return acc + (item.insights_summary.spend.value || 0)
      }
      return acc
    }, 0)
    const leads = withUiStatus.reduce((acc, item) => {
      if (item.insights_summary.results.state === 'loaded' || item.insights_summary.results.state === 'zero_real') {
        return acc + (item.insights_summary.results.value || 0)
      }
      return acc
    }, 0)

    return { activeCount, spend, leads }
  }, [withUiStatus])

  const goToDetail = (campaignId: string) => {
    const qs = buildFilterQueryString()
    router.push(`/campanas/${campaignId}${qs ? `?${qs}` : ''}`)
  }

  const toggleStatus = (campaignId: string, current: UiStatus) => {
    setStatusOverrides((prev) => ({
      ...prev,
      [campaignId]: current === 'active' ? 'paused' : 'active',
    }))
  }

  return (
    <div className="space-y-6">
      {errorMessage && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-destructive">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            <div>{errorMessage}</div>
          </div>
        </div>
      )}

      <PageHeader
        title="Campañas de Marketing"
        description={
          selectedAccount === 'all'
            ? `Campañas pausadas ${DEFAULT_CAMPAIGNS_YEAR} listas para lanzamiento`
            : `Campañas pausadas ${DEFAULT_CAMPAIGNS_YEAR} de ${selectedAccountName}`
        }
        icon={Megaphone}
        actions={
          <Button variant="outline" onClick={() => void fetchCampaigns()}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Sincronizar
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Campañas activas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Gasto total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(stats.spend)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Leads / Resultados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatInteger(stats.leads)}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid gap-3 md:grid-cols-4">
            <div>
              <Label>Ad Account</Label>
              <Select value={selectedAccount} onValueChange={setSelectedAccount}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {accountOptions.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Rango de fechas</Label>
              <Select value={range} onValueChange={(value) => setRange(value as RangeOption)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RANGE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Estado</Label>
              <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as StatusFilter)}>
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Activa</SelectItem>
                  <SelectItem value="paused">Pausada</SelectItem>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="completed">Finalizada</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Búsqueda</Label>
              <div className="relative mt-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  className="pl-8"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Nombre o ID Meta"
                />
              </div>
            </div>
          </div>

          {range === 'custom' && (
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <div>
                <Label>Desde</Label>
                <Input type="date" className="mt-1" value={customSince} onChange={(event) => setCustomSince(event.target.value)} />
              </div>
              <div>
                <Label>Hasta</Label>
                <Input type="date" className="mt-1" value={customUntil} onChange={(event) => setCustomUntil(event.target.value)} />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {!isLoading && withUiStatus.length === 0 ? (
        <EmptyState
          icon={CalendarClock}
          title="Sin campañas"
          description="No hay campañas para los filtros seleccionados."
        />
      ) : (
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nombre de campaña</TableHead>
                    <TableHead>Ad Account vinculada</TableHead>
                    <TableHead>Gasto total</TableHead>
                    <TableHead>Leads / Resultados</TableHead>
                    <TableHead>Fecha inicio – Fecha fin</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withUiStatus.map((item) => {
                    const statusMeta = STATUS_BADGES[item.uiStatus]
                    return (
                      <TableRow
                        key={item.campaign.id}
                        className="cursor-pointer"
                        onClick={() => goToDetail(item.campaign.id)}
                      >
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <span className="font-medium">{item.campaign.name}</span>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className={statusMeta.className}>
                                {statusMeta.label}
                              </Badge>
                              <span className="text-xs text-muted-foreground">ID Meta: {item.campaign.id}</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>{selectedAccountName}</TableCell>
                        <TableCell>{formatCurrency(item.insights_summary.spend.value)}</TableCell>
                        <TableCell>{formatInteger(item.insights_summary.results.value)}</TableCell>
                        <TableCell>{formatDateRange(item.campaign.start_time, item.campaign.stop_time)}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                goToDetail(item.campaign.id)
                              }}
                            >
                              Ver detalle
                            </Button>
                            <Button
                              variant={item.uiStatus === 'active' ? 'secondary' : 'default'}
                              size="sm"
                              onClick={(event) => {
                                event.stopPropagation()
                                toggleStatus(item.campaign.id, item.uiStatus)
                              }}
                            >
                              {item.uiStatus === 'active' ? 'Pausar' : 'Activar'}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">
              Mostrando {withUiStatus.length} de {totalDocs} campañas.
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
