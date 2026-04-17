'use client'

import { useEffect, useMemo, useState } from 'react'
import { BarChart3, RefreshCw, TrendingUp, Users, DollarSign, Eye, Target, Zap, Search, Globe } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'

const DATE_RANGES = ['7d', '30d', '90d'] as const

type DateRange = (typeof DATE_RANGES)[number]
type Tab = 'overview' | 'organic' | 'facebook' | 'google'
type TrafficGranularity = 'day' | 'week' | 'month'

type SourceHealth = {
  traffic: 'ga4' | 'internal'
  facebook: 'meta_api' | 'unavailable'
}

type TrafficPoint = {
  date: string
  isoDate: string
  Organico: number
  'Facebook Ads': number
  'Google Ads': number
  Total: number
}

type TrafficSourceMedium = {
  source: string
  sessions: number
  users: number
  bounceRate: number
}

type TopPage = {
  path: string
  views: number
  avgTime: string
}

type FacebookCampaign = {
  id: string
  name: string
  status: 'active' | 'paused'
  budget: number
  impressions: number
  clicks: number
  cpc: number
  conversions: number
  roas: number
  linked: boolean
}

type FacebookTrafficCampaign = {
  campaign: string
  page_views: number
  form_clicks: number
  form_submits: number
}

type AnalyticsPayload = {
  generated_at: string
  range: DateRange
  source_health: SourceHealth
  overview: {
    total_sessions: number
    total_ad_spend: number
    total_conversions: number
    global_roas: number
  }
  traffic: {
    series: TrafficPoint[]
    series_by_granularity: Record<TrafficGranularity, TrafficPoint[]>
    top_pages: TopPage[]
    source_medium: TrafficSourceMedium[]
  }
  facebook: {
    spend: number
    impressions: number
    clicks: number
    ctr: number
    conversions: number
    roas: number
    campaigns: FacebookCampaign[]
    traffic_funnel: {
      page_views: number
      form_clicks: number
      form_submits: number
      by_campaign: FacebookTrafficCampaign[]
    }
    coverage: {
      linked: number
      detected: number
      not_linked: number
    }
  }
  campaigns: {
    linked: number
    detected: number
    not_linked: number
  }
  google: {
    status: string
  }
}

const DATE_LABELS: Record<DateRange, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
}

const TRAFFIC_GRANULARITY_LABELS: Record<TrafficGranularity, string> = {
  day: 'Día',
  week: 'Semana',
  month: 'Mes',
}

const TABS: Array<{ id: Tab; label: string; icon: typeof BarChart3 }> = [
  { id: 'overview', label: 'Visión General', icon: BarChart3 },
  { id: 'organic', label: 'Orgánico', icon: Globe },
  { id: 'facebook', label: 'Facebook Ads', icon: Zap },
  { id: 'google', label: 'Google Ads', icon: Search },
]

const fmtNum = (n: number) => new Intl.NumberFormat('es-ES').format(n)
const fmtCur = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const fmtPct = (n: number) => `${n.toFixed(2)}%`

function TrafficBars({ points }: { points: TrafficPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de tráfico para este rango.</p>
  }

  const maxTotal = points.reduce((max, point) => Math.max(max, point.Total), 0)
  const denominator = maxTotal > 0 ? maxTotal : 1

  return (
    <div className="space-y-2">
      {points.map((point) => (
        <div key={point.isoDate} className="grid grid-cols-[120px_1fr_80px] items-center gap-3 text-xs">
          <span className="text-muted-foreground">{point.date}</span>
          <div className="h-2.5 w-full rounded bg-muted overflow-hidden">
            <div
              className="h-full rounded bg-primary/80"
              style={{ width: `${Math.max((point.Total / denominator) * 100, 2)}%` }}
            />
          </div>
          <span className="text-right font-semibold">{fmtNum(point.Total)}</span>
        </div>
      ))}
    </div>
  )
}

function sourceLabel(health: SourceHealth) {
  const traffic = health.traffic === 'ga4' ? 'GA4' : 'Fallback interno'
  const facebook = health.facebook === 'meta_api' ? 'Meta API' : 'Meta no disponible'
  return { traffic, facebook }
}

function StatusBadge({ status }: { status: 'active' | 'paused' }) {
  if (status === 'active') return <Badge className="bg-green-600 text-white">Activa</Badge>
  return <Badge variant="secondary">Pausada</Badge>
}

function KpiCard({ title, value, icon: Icon }: { title: string; value: string; icon: typeof Eye }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
      </CardContent>
    </Card>
  )
}

export default function AnaliticasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dateRange, setDateRange] = useState<DateRange>('30d')
  const [trafficGranularity, setTrafficGranularity] = useState<TrafficGranularity>('day')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<AnalyticsPayload | null>(null)

  const labels = useMemo(() => {
    if (!data) return null
    return sourceLabel(data.source_health)
  }, [data])

  const loadData = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch(`/api/analytics/dashboard?range=${dateRange}`, {
        method: 'GET',
        cache: 'no-store',
        credentials: 'include',
      })

      if (res.status === 401) {
        setError('Sesión expirada. Inicia sesión de nuevo para ver analíticas.')
        setData(null)
        return
      }

      if (!res.ok) {
        setError('No se pudieron cargar las analíticas en este momento.')
        setData(null)
        return
      }

      const payload = (await res.json()) as AnalyticsPayload
      setData(payload)
    } catch {
      setError('Error de red al cargar analíticas.')
      setData(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void loadData()
  }, [dateRange])

  const trafficSeries = data?.traffic.series ?? []
  const trafficSeriesByGranularity = data?.traffic.series_by_granularity ?? { day: trafficSeries, week: [], month: [] }
  const selectedTrafficSeries = trafficSeriesByGranularity[trafficGranularity] ?? trafficSeries
  const topPages = data?.traffic.top_pages ?? []
  const sourceMedium = data?.traffic.source_medium ?? []
  const fbCampaigns = data?.facebook.campaigns ?? []
  const fbTrafficFunnel = data?.facebook.traffic_funnel ?? { page_views: 0, form_clicks: 0, form_submits: 0, by_campaign: [] }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analíticas y Métricas"
        description="Rendimiento de campañas SOLARIA y tráfico público"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            {labels && (
              <>
                <Badge variant="outline">Tráfico: {labels.traffic}</Badge>
                <Badge variant="outline">Facebook: {labels.facebook}</Badge>
              </>
            )}
            <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
              {DATE_RANGES.map((r) => (
                <button
                  key={r}
                  onClick={() => setDateRange(r)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    dateRange === r
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
            <div className="flex items-center rounded-lg border border-border bg-card overflow-hidden">
              {(Object.keys(TRAFFIC_GRANULARITY_LABELS) as TrafficGranularity[]).map((granularity) => (
                <button
                  key={granularity}
                  onClick={() => setTrafficGranularity(granularity)}
                  className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                    trafficGranularity === granularity
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {TRAFFIC_GRANULARITY_LABELS[granularity]}
                </button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadData()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </div>
        }
      />

      <p className="text-xs text-muted-foreground">{DATE_LABELS[dateRange]}</p>

      <div className="flex items-center gap-1 border-b border-border overflow-x-auto pb-px">
        {TABS.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors border-b-2 -mb-px ${
                isActive
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          )
        })}
      </div>

      {loading && <div className="text-sm text-muted-foreground">Cargando analíticas...</div>}
      {error && <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}

      {!loading && !error && data && activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Sesiones Totales" value={fmtNum(data.overview.total_sessions)} icon={Eye} />
            <KpiCard title="Gasto Ads" value={fmtCur(data.overview.total_ad_spend)} icon={DollarSign} />
            <KpiCard title="Conversiones" value={fmtNum(data.overview.total_conversions)} icon={Target} />
            <KpiCard title="ROAS Global" value={`${data.overview.global_roas.toFixed(2)}x`} icon={TrendingUp} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Resumen de Cobertura SOLARIA</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <div>
                <p className="text-xs text-muted-foreground">Detectadas en Meta</p>
                <p className="text-2xl font-bold">{data.campaigns.detected}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Vinculadas en plataforma</p>
                <p className="text-2xl font-bold">{data.campaigns.linked}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">No vinculadas</p>
                <p className="text-2xl font-bold">{data.campaigns.not_linked}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tráfico ({TRAFFIC_GRANULARITY_LABELS[trafficGranularity]})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-5">
                <TrafficBars points={selectedTrafficSeries.slice(-12)} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Fecha</th>
                      <th className="py-2 text-right">Orgánico</th>
                      <th className="py-2 text-right">Facebook Ads</th>
                      <th className="py-2 text-right">Google Ads</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedTrafficSeries.slice(-14).map((item) => (
                      <tr key={item.isoDate} className="border-b border-border/40">
                        <td className="py-2">{item.date}</td>
                        <td className="py-2 text-right">{fmtNum(item.Organico)}</td>
                        <td className="py-2 text-right">{fmtNum(item['Facebook Ads'])}</td>
                        <td className="py-2 text-right">{fmtNum(item['Google Ads'])}</td>
                        <td className="py-2 text-right font-semibold">{fmtNum(item.Total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !error && data && activeTab === 'organic' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Visitas orgánicas ({TRAFFIC_GRANULARITY_LABELS[trafficGranularity]})</CardTitle>
            </CardHeader>
            <CardContent>
              <TrafficBars
                points={selectedTrafficSeries.map((point) => ({
                  ...point,
                  Total: point.Organico,
                  'Facebook Ads': 0,
                  'Google Ads': 0,
                }))}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Top páginas públicas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Página</th>
                      <th className="py-2 text-right">Visitas</th>
                      <th className="py-2 text-right">Tiempo medio</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topPages.map((page, idx) => (
                      <tr key={`${page.path}-${idx}`} className="border-b border-border/40">
                        <td className="py-2"><code className="text-xs">{page.path}</code></td>
                        <td className="py-2 text-right">{fmtNum(page.views)}</td>
                        <td className="py-2 text-right">{page.avgTime}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Fuente / Medio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Fuente</th>
                      <th className="py-2 text-right">Sesiones</th>
                      <th className="py-2 text-right">Usuarios</th>
                      <th className="py-2 text-right">Rebote</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sourceMedium.map((row, idx) => (
                      <tr key={`${row.source}-${idx}`} className="border-b border-border/40">
                        <td className="py-2">{row.source}</td>
                        <td className="py-2 text-right">{fmtNum(row.sessions)}</td>
                        <td className="py-2 text-right">{fmtNum(row.users)}</td>
                        <td className="py-2 text-right">{row.bounceRate > 0 ? fmtPct(row.bounceRate) : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !error && data && activeTab === 'facebook' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <KpiCard title="Gasto" value={fmtCur(data.facebook.spend)} icon={DollarSign} />
            <KpiCard title="Impresiones" value={fmtNum(data.facebook.impressions)} icon={Eye} />
            <KpiCard title="Clics" value={fmtNum(data.facebook.clicks)} icon={Target} />
            <KpiCard title="CTR" value={fmtPct(data.facebook.ctr)} icon={TrendingUp} />
            <KpiCard title="Conversiones" value={fmtNum(data.facebook.conversions)} icon={Users} />
            <KpiCard title="ROAS" value={`${data.facebook.roas.toFixed(2)}x`} icon={TrendingUp} />
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <KpiCard title="Visitas landing (Meta)" value={fmtNum(fbTrafficFunnel.page_views)} icon={Globe} />
            <KpiCard title="Clicks en formulario" value={fmtNum(fbTrafficFunnel.form_clicks)} icon={Target} />
            <KpiCard title="Formularios enviados" value={fmtNum(fbTrafficFunnel.form_submits)} icon={Users} />
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Funnel por campaña (utm_campaign)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[760px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Campaña (UTM)</th>
                      <th className="py-2 text-right">Visitas landing</th>
                      <th className="py-2 text-right">Clicks formulario</th>
                      <th className="py-2 text-right">Formularios enviados</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fbTrafficFunnel.by_campaign.map((row) => (
                      <tr key={row.campaign} className="border-b border-border/40">
                        <td className="py-2">{row.campaign}</td>
                        <td className="py-2 text-right">{fmtNum(row.page_views)}</td>
                        <td className="py-2 text-right">{fmtNum(row.form_clicks)}</td>
                        <td className="py-2 text-right">{fmtNum(row.form_submits)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campañas Facebook (solo SOLARIA)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-3 flex gap-2 flex-wrap">
                <Badge variant="outline">Vinculadas: {data.facebook.coverage.linked}</Badge>
                <Badge variant="outline">Detectadas: {data.facebook.coverage.detected}</Badge>
                <Badge variant="outline">No vinculadas: {data.facebook.coverage.not_linked}</Badge>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Campaña</th>
                      <th className="py-2 text-left">Estado</th>
                      <th className="py-2 text-left">Vinculada</th>
                      <th className="py-2 text-right">Ppto./día</th>
                      <th className="py-2 text-right">Impresiones</th>
                      <th className="py-2 text-right">Clics</th>
                      <th className="py-2 text-right">CPC</th>
                      <th className="py-2 text-right">Conv.</th>
                      <th className="py-2 text-right">ROAS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {fbCampaigns.map((c) => (
                      <tr key={c.id} className="border-b border-border/40">
                        <td className="py-2 max-w-[360px] truncate" title={c.name}>{c.name}</td>
                        <td className="py-2"><StatusBadge status={c.status} /></td>
                        <td className="py-2">{c.linked ? <Badge className="bg-green-600 text-white">Sí</Badge> : <Badge variant="secondary">No</Badge>}</td>
                        <td className="py-2 text-right">{fmtCur(c.budget)}</td>
                        <td className="py-2 text-right">{fmtNum(c.impressions)}</td>
                        <td className="py-2 text-right">{fmtNum(c.clicks)}</td>
                        <td className="py-2 text-right">{fmtCur(c.cpc)}</td>
                        <td className="py-2 text-right">{fmtNum(c.conversions)}</td>
                        <td className="py-2 text-right">{c.roas > 0 ? `${c.roas.toFixed(2)}x` : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {!loading && !error && data && activeTab === 'google' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Google Ads</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              Integración pendiente. Esta pestaña se activará cuando se configure la conexión de Google Ads API.
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !error && data && (
        <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
          Última actualización: {new Date(data.generated_at).toLocaleString('es-ES')}
        </div>
      )}
    </div>
  )
}
