'use client'

import {
  Component,
  type ErrorInfo,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useRouter } from 'next/navigation'
import {
  BarChart3,
  RefreshCw,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  Target,
  Zap,
  Search,
  Globe,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { EmptyState } from '@payload-config/components/ui/EmptyState'
import {
  Bar,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

const DATE_RANGES = ['7d', '30d', '90d'] as const

type DateRange = (typeof DATE_RANGES)[number]
type Tab = 'overview' | 'organic' | 'facebook' | 'google'
type TrafficGranularity = 'hour' | 'day' | 'week' | 'month'
type Ga4FallbackReasonCode =
  | 'ga4_connected'
  | 'ga4_missing_measurement_id'
  | 'ga4_missing_property_id'
  | 'ga4_invalid_property_id'
  | 'ga4_missing_bearer_token'
  | 'ga4_http_400'
  | 'ga4_http_401'
  | 'ga4_http_403'
  | 'ga4_http_404'
  | 'ga4_http_429'
  | 'ga4_http_500'
  | 'ga4_http_503'
  | 'ga4_http_error'
  | 'ga4_runtime_error'

type SourceHealth = {
  traffic: 'ga4' | 'internal'
  traffic_provider?: 'google_analytics_4' | 'internal_fallback'
  traffic_reason_code?: Ga4FallbackReasonCode
  traffic_reason?: string | null
  traffic_events_count?: number
  ga4?: {
    provider: 'ga4' | 'internal'
    status: 'connected' | 'fallback'
    reason_code: Ga4FallbackReasonCode
    reason: string | null
    property_id: string | null
    measurement_id: string | null
    checked_at: string
  }
  facebook: 'meta_api' | 'unavailable'
  facebook_data_source?: 'snapshot' | 'meta_api_live' | 'unavailable'
}

type IntegrationStatus = {
  status: 'connected' | 'error' | 'pending_connection'
  provider?: string
  reason_code?: string | null
  reason?: string | null
  checked_at?: string
}

type IntegrationsStatus = {
  ga4?: IntegrationStatus
  meta_ads?: IntegrationStatus
  google_ads?: IntegrationStatus
}

type TrafficPoint = {
  date: string
  isoDate: string
  Organico: number
  'Facebook Ads': number
  'Google Ads': number
  Total: number
}

type TrafficComparisonPoint = TrafficPoint & {
  Paid: number
}

type DataQualityAlert = {
  id: string
  severity: 'critical' | 'warning' | 'info'
  title: string
  detail: string
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
    series_by_granularity: Partial<Record<TrafficGranularity, TrafficPoint[]>>
    top_pages: TopPage[]
    source_medium: TrafficSourceMedium[]
    empty_reason?: string | null
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
  integrations_status?: IntegrationsStatus
}

const DATE_LABELS: Record<DateRange, string> = {
  '7d': 'Últimos 7 días',
  '30d': 'Últimos 30 días',
  '90d': 'Últimos 90 días',
}

const TRAFFIC_GRANULARITY_LABELS: Record<TrafficGranularity, string> = {
  hour: 'Hora',
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
const TRAFFIC_REASON_MESSAGES: Record<Ga4FallbackReasonCode, string> = {
  ga4_connected: 'Google Analytics 4 conectado.',
  ga4_missing_measurement_id: 'Falta GA4 Measurement ID en configuración del tenant.',
  ga4_missing_property_id: 'Falta GA4_PROPERTY_ID en entorno.',
  ga4_invalid_property_id: 'GA4_PROPERTY_ID inválido (usa ID numérico o properties/{ID}).',
  ga4_missing_bearer_token: 'Falta GA4_API_BEARER_TOKEN en entorno.',
  ga4_http_400: 'GA4 rechazó la consulta (400).',
  ga4_http_401: 'GA4 devolvió 401 (token inválido o expirado).',
  ga4_http_403: 'GA4 devolvió 403 (permisos insuficientes en la propiedad).',
  ga4_http_404: 'GA4 devolvió 404 (propiedad no encontrada o mal configurada).',
  ga4_http_429: 'GA4 devolvió 429 (rate limit).',
  ga4_http_500: 'GA4 devolvió 500 (error temporal de servicio).',
  ga4_http_503: 'GA4 devolvió 503 (servicio no disponible).',
  ga4_http_error: 'GA4 devolvió un error HTTP no esperado.',
  ga4_runtime_error: 'Error interno al consultar GA4.',
}

function buildTrafficComparison(points: TrafficPoint[]): TrafficComparisonPoint[] {
  return points.map((point) => ({
    ...point,
    Paid: point['Facebook Ads'] + point['Google Ads'],
  }))
}

const CHART_COLORS = {
  organic: '#16a34a',
  facebook: '#2563eb',
  google: '#f97316',
  total: '#0f766e',
  spend: '#d97706',
} as const

type ChartVisibility = {
  organic: boolean
  facebook: boolean
  google: boolean
  total: boolean
}

function movingAverage(values: number[], windowSize = 3): Array<number | null> {
  if (windowSize <= 1) return values
  return values.map((_, index) => {
    const start = index - (windowSize - 1)
    if (start < 0) return null
    const slice = values.slice(start, index + 1)
    const sum = slice.reduce((acc, current) => acc + current, 0)
    return sum / slice.length
  })
}

function formatTooltipValue(value: unknown): number {
  if (typeof value === 'number') return value
  if (typeof value === 'string') {
    const parsed = Number.parseFloat(value)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function parseHourFromPoint(point: TrafficPoint): number | null {
  const isoMatch = point.isoDate.match(/T(\d{2})/)
  if (isoMatch) {
    const hour = Number.parseInt(isoMatch[1], 10)
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null
  }

  const dateMatch = point.date.match(/\b(\d{1,2})\s*(?:h|:00)\b/i)
  if (dateMatch) {
    const hour = Number.parseInt(dateMatch[1], 10)
    return Number.isInteger(hour) && hour >= 0 && hour <= 23 ? hour : null
  }

  return null
}

function buildHourlyDistribution(points: TrafficPoint[]): Array<{ hourLabel: string; sessions: number }> {
  if (points.length === 0) return []

  const bucket = new Map<number, { sum: number; count: number }>()
  for (const point of points) {
    const hour = parseHourFromPoint(point)
    if (hour === null) continue
    const current = bucket.get(hour) ?? { sum: 0, count: 0 }
    current.sum += point.Total
    current.count += 1
    bucket.set(hour, current)
  }

  if (bucket.size === 0) return []

  return Array.from({ length: 24 }, (_, hour) => {
    const current = bucket.get(hour)
    const sessions = current && current.count > 0 ? Math.round(current.sum / current.count) : 0
    return { hourLabel: `${hour}h`, sessions }
  })
}

class ChartErrorBoundary extends Component<
  { children: ReactNode; title: string },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; title: string }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): { hasError: boolean } {
    return { hasError: true }
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[analiticas/charts] render error:', { error, info })
  }

  override render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          {this.props.title}
        </div>
      )
    }
    return this.props.children
  }
}

type GraficaVisitantesTiempoProps = {
  data: TrafficPoint[]
  granularidad: TrafficGranularity
  showFallbackBanner: boolean
  mode?: 'all' | 'total' | 'organic'
}

function GraficaVisitantesTiempo({
  data,
  granularidad,
  showFallbackBanner,
  mode = 'all',
}: GraficaVisitantesTiempoProps) {
  const [visible, setVisible] = useState<ChartVisibility>({
    organic: true,
    facebook: true,
    google: true,
    total: mode !== 'organic',
  })

  const allGoogleZero = data.every((point) => point['Google Ads'] === 0)
  const organicTrend = useMemo(
    () => movingAverage(data.map((point) => point.Organico)),
    [data],
  )

  if (data.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de tráfico para este rango.</p>
  }

  const chartRows = data.map((point, index) => ({
    ...point,
    organicTrend: organicTrend[index],
  }))

  return (
    <ChartErrorBoundary title="No se pudo renderizar la gráfica de adquisición.">
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(mode === 'all' || mode === 'organic') && (
            <button
              type="button"
              onClick={() => setVisible((prev) => ({ ...prev, organic: !prev.organic }))}
              className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
                visible.organic ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-border text-muted-foreground'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.organic }} />
              Orgánico
            </button>
          )}
          {mode === 'all' && (
            <>
              <button
                type="button"
                onClick={() => setVisible((prev) => ({ ...prev, facebook: !prev.facebook }))}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
                  visible.facebook ? 'border-blue-300 bg-blue-50 text-blue-800' : 'border-border text-muted-foreground'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.facebook }} />
                Facebook Ads
              </button>
              <button
                type="button"
                onClick={() => setVisible((prev) => ({ ...prev, google: !prev.google }))}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
                  visible.google ? 'border-orange-300 bg-orange-50 text-orange-800' : 'border-border text-muted-foreground'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.google }} />
                Google Ads
              </button>
              <button
                type="button"
                onClick={() => setVisible((prev) => ({ ...prev, total: !prev.total }))}
                className={`inline-flex items-center gap-1 rounded border px-2 py-1 ${
                  visible.total ? 'border-teal-300 bg-teal-50 text-teal-800' : 'border-border text-muted-foreground'
                }`}
              >
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CHART_COLORS.total }} />
                Total
              </button>
            </>
          )}
        </div>

        <div className="rounded-lg border border-border/60 bg-card p-3">
          {showFallbackBanner && (
            <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              ⚠ Datos de sesiones basados en Meta API + estimación interna. Conecta GA4 para datos precisos.
            </div>
          )}

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartRows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="date" />
                <YAxis allowDecimals={false} />
                <Tooltip
                  formatter={(value: unknown, name: string | number) => {
                    const numericValue = formatTooltipValue(value)
                    const normalizedName = String(name)
                    if (normalizedName === 'Google Ads' && allGoogleZero) {
                      return [`${fmtNum(numericValue)} (sin datos de integración)`, normalizedName]
                    }
                    return [fmtNum(numericValue), normalizedName]
                  }}
                  labelFormatter={(label) => `${label} · ${TRAFFIC_GRANULARITY_LABELS[granularidad]}`}
                />
                <Legend />

                {(mode === 'all' || mode === 'organic') && (
                  <Line
                    type="monotone"
                    dataKey="Organico"
                    name="Orgánico"
                    stroke={CHART_COLORS.organic}
                    strokeWidth={2.2}
                    dot={false}
                    hide={!visible.organic}
                  />
                )}
                {mode === 'organic' && (
                  <Line
                    type="monotone"
                    dataKey="organicTrend"
                    name="Tendencia MA(3)"
                    stroke="#14532d"
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    dot={false}
                    connectNulls
                    hide={!visible.organic}
                  />
                )}

                {mode === 'all' && (
                  <>
                    <Line
                      type="monotone"
                      dataKey="Facebook Ads"
                      name="Facebook Ads"
                      stroke={CHART_COLORS.facebook}
                      strokeWidth={2}
                      dot={false}
                      hide={!visible.facebook}
                    />
                    <Line
                      type="monotone"
                      dataKey="Google Ads"
                      name="Google Ads"
                      stroke={CHART_COLORS.google}
                      strokeDasharray={allGoogleZero ? '6 4' : undefined}
                      strokeWidth={2}
                      dot={false}
                      hide={!visible.google}
                    />
                    <Line
                      type="monotone"
                      dataKey="Total"
                      name="Total"
                      stroke={CHART_COLORS.total}
                      strokeWidth={3}
                      dot={false}
                      hide={!visible.total}
                    />
                  </>
                )}

                {mode === 'total' && (
                  <Line
                    type="monotone"
                    dataKey="Total"
                    name="Total"
                    stroke={CHART_COLORS.total}
                    strokeWidth={3}
                    dot={false}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </ChartErrorBoundary>
  )
}

function PaidChannelStackedChart({ points }: { points: TrafficPoint[] }) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin desglose de pago para este rango.</p>
  }

  return (
    <ChartErrorBoundary title="No se pudo renderizar el mix diario de pago.">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="date" />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value: unknown, name: string | number) => [
                fmtNum(formatTooltipValue(value)),
                String(name),
              ]}
            />
            <Legend />
            <Bar dataKey="Facebook Ads" stackId="paid" fill={CHART_COLORS.facebook} name="Facebook Ads" radius={[4, 4, 0, 0]} />
            <Bar dataKey="Google Ads" stackId="paid" fill={CHART_COLORS.google} name="Google Ads" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartErrorBoundary>
  )
}

function FacebookSessionsSpendChart({
  points,
  totalSpend,
}: {
  points: TrafficPoint[]
  totalSpend: number
}) {
  if (points.length === 0) {
    return <p className="text-sm text-muted-foreground">Sin datos de Facebook Ads para este rango.</p>
  }

  const totalFacebookSessions = points.reduce((acc, point) => acc + point['Facebook Ads'], 0)
  const rows = points.map((point) => {
    const estimatedSpend =
      totalFacebookSessions > 0
        ? (point['Facebook Ads'] / totalFacebookSessions) * totalSpend
        : 0
    return {
      date: point.date,
      sessions: point['Facebook Ads'],
      estimatedSpend,
    }
  })

  return (
    <ChartErrorBoundary title="No se pudo renderizar la gráfica de Facebook Ads.">
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground">
          El gasto diario se muestra como estimación proporcional al tráfico por día (no hay serie de spend diario en la fuente actual).
        </p>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={rows} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
              <XAxis dataKey="date" />
              <YAxis yAxisId="left" allowDecimals={false} />
              <YAxis yAxisId="right" orientation="right" allowDecimals={false} />
              <Tooltip
                formatter={(value: unknown, name: string | number) => {
                  const numericValue = formatTooltipValue(value)
                  const normalizedName = String(name)
                  if (normalizedName === 'Gasto estimado (€)') return [fmtCur(numericValue), normalizedName]
                  return [fmtNum(numericValue), normalizedName]
                }}
              />
              <Legend />
              <Bar
                yAxisId="right"
                dataKey="estimatedSpend"
                name="Gasto estimado (€)"
                fill={CHART_COLORS.spend}
                radius={[4, 4, 0, 0]}
              />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="sessions"
                name="Sesiones Facebook Ads"
                stroke={CHART_COLORS.facebook}
                strokeWidth={2.5}
                dot={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </ChartErrorBoundary>
  )
}

function HourlyDistributionChart({ points }: { points: Array<{ hourLabel: string; sessions: number }> }) {
  if (points.length === 0) return null

  return (
    <ChartErrorBoundary title="No se pudo renderizar la distribución horaria.">
      <div className="h-[240px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={points} margin={{ top: 8, right: 12, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
            <XAxis dataKey="hourLabel" interval={1} tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} />
            <Tooltip
              formatter={(value: unknown) => [
                fmtNum(formatTooltipValue(value)),
                'Sesiones promedio',
              ]}
            />
            <Bar dataKey="sessions" name="Sesiones promedio" fill="url(#hourGradient)" radius={[4, 4, 0, 0]} />
            <defs>
              <linearGradient id="hourGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#0f766e" stopOpacity={0.95} />
                <stop offset="100%" stopColor="#99f6e4" stopOpacity={0.95} />
              </linearGradient>
            </defs>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </ChartErrorBoundary>
  )
}

function alertBadgeClass(severity: DataQualityAlert['severity']): string {
  if (severity === 'critical') return 'bg-red-600 text-white'
  if (severity === 'warning') return 'bg-amber-500 text-black'
  return 'bg-blue-600 text-white'
}

function alertLabel(severity: DataQualityAlert['severity']): string {
  if (severity === 'critical') return 'P0 crítico'
  if (severity === 'warning') return 'P1 alto'
  return 'P2 informativo'
}

function sourceLabel(health: SourceHealth) {
  const traffic =
    health.traffic === 'ga4'
      ? 'Google Analytics 4'
      : `Fallback interno${
          health.traffic_reason_code ? ` · ${health.traffic_reason_code.replace('ga4_', '')}` : ''
        }`
  const facebook = health.facebook === 'meta_api' ? 'Meta API' : 'Meta no disponible'
  const trafficReason =
    health.traffic_reason ||
    (health.traffic_reason_code ? TRAFFIC_REASON_MESSAGES[health.traffic_reason_code] : null) ||
    null
  return { traffic, facebook, trafficReason }
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
  const router = useRouter()
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
  const trafficSeriesByGranularity = data?.traffic.series_by_granularity ?? {
    hour: [],
    day: trafficSeries,
    week: [],
    month: [],
  }
  const hasHourlyData = (trafficSeriesByGranularity.hour?.length ?? 0) > 0
  const canUseHourGranularity = dateRange === '7d' && hasHourlyData
  const effectiveTrafficGranularity: TrafficGranularity =
    trafficGranularity === 'hour' && !canUseHourGranularity ? 'day' : trafficGranularity
  const selectedTrafficSeries =
    trafficSeriesByGranularity[effectiveTrafficGranularity] ?? trafficSeries
  const topPages = data?.traffic.top_pages ?? []
  const sourceMedium = data?.traffic.source_medium ?? []
  const fbCampaigns = data?.facebook.campaigns ?? []
  const fbTrafficFunnel = data?.facebook.traffic_funnel ?? { page_views: 0, form_clicks: 0, form_submits: 0, by_campaign: [] }
  const integrationsStatus = data?.integrations_status
  const trafficFallbackReason = data?.source_health.traffic === 'internal' ? labels?.trafficReason ?? null : null
  const acquisitionSeries = useMemo(() => selectedTrafficSeries.slice(-14), [selectedTrafficSeries])
  const hourlyDistribution = useMemo(
    () => buildHourlyDistribution(trafficSeriesByGranularity.hour ?? []),
    [trafficSeriesByGranularity.hour],
  )
  const acquisitionTotals = useMemo(
    () =>
      acquisitionSeries.reduce(
        (acc, point) => {
          acc.organic += point.Organico
          acc.facebook += point['Facebook Ads']
          acc.google += point['Google Ads']
          acc.paid += point['Facebook Ads'] + point['Google Ads']
          acc.total += point.Total
          return acc
        },
        { organic: 0, paid: 0, facebook: 0, google: 0, total: 0 },
      ),
    [acquisitionSeries],
  )
  const paidShare = acquisitionTotals.total > 0 ? (acquisitionTotals.paid / acquisitionTotals.total) * 100 : 0
  const organicShare = acquisitionTotals.total > 0 ? (acquisitionTotals.organic / acquisitionTotals.total) * 100 : 0
  const avgSessionsPerPoint = acquisitionSeries.length > 0 ? acquisitionTotals.total / acquisitionSeries.length : 0
  const cpl =
    data && data.overview.total_conversions > 0
      ? data.overview.total_ad_spend / data.overview.total_conversions
      : null
  const sessionToConversionRate =
    data && data.overview.total_sessions > 0
      ? (data.overview.total_conversions / data.overview.total_sessions) * 100
      : 0
  const formSubmitRate =
    data && data.overview.total_sessions > 0
      ? (fbTrafficFunnel.form_submits / data.overview.total_sessions) * 100
      : 0

  useEffect(() => {
    if (trafficGranularity === 'hour' && !canUseHourGranularity) {
      setTrafficGranularity('day')
    }
  }, [canUseHourGranularity, trafficGranularity])

  const dataQualityAlerts = useMemo<DataQualityAlert[]>(() => {
    if (!data) return []

    const alerts: DataQualityAlert[] = []

    if (data.source_health.traffic === 'internal') {
      alerts.push({
        id: 'ga4-fallback',
        severity: 'warning',
        title: 'Tráfico en fallback interno',
        detail: 'GA4 no está siendo la fuente principal para sesiones. Revisar integración de Analytics.',
      })
    }

    if (data.campaigns.not_linked > 0) {
      alerts.push({
        id: 'campaign-coverage',
        severity: 'warning',
        title: 'Campañas detectadas sin vincular',
        detail: `${data.campaigns.not_linked} campañas Meta detectadas sin relación directa con campañas de plataforma.`,
      })
    }

    if (data.overview.total_ad_spend > 0 && data.overview.global_roas === 0) {
      alerts.push({
        id: 'roas-attribution',
        severity: 'critical',
        title: 'ROAS en cero con gasto activo',
        detail:
          'Hay gasto de Ads sin ingresos atribuidos. Falta mapeo económico de conversiones o señal de revenue.',
      })
    }

    if (data.google.status === 'pending_connection') {
      alerts.push({
        id: 'google-ads-pending',
        severity: 'info',
        title: 'Google Ads pendiente de conexión',
        detail: 'El canal de pago de Google no está conectado; las comparativas de pago están parcialmente incompletas.',
      })
    }

    if (acquisitionTotals.total > 0 && acquisitionTotals.paid > acquisitionTotals.organic) {
      alerts.push({
        id: 'paid-dependency',
        severity: 'info',
        title: 'Dependencia de tráfico de pago',
        detail:
          'En el rango visible domina el tráfico de Ads sobre orgánico. Recomendable reforzar contenido SEO y captación directa.',
      })
    }

    return alerts
  }, [acquisitionTotals.organic, acquisitionTotals.paid, acquisitionTotals.total, data])

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
                <Badge variant={data?.source_health.traffic === 'ga4' ? 'success' : 'warning'}>
                  Tráfico: {labels.traffic}
                </Badge>
                <Badge variant={data?.source_health.facebook === 'meta_api' ? 'success' : 'warning'}>
                  Facebook: {labels.facebook}
                </Badge>
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
              {(Object.keys(TRAFFIC_GRANULARITY_LABELS) as TrafficGranularity[]).map((granularity) => {
                  const isHourOption = granularity === 'hour'
                  const isDisabled = isHourOption && !canUseHourGranularity
                  const isSelected =
                    effectiveTrafficGranularity === granularity &&
                    (trafficGranularity !== 'hour' || canUseHourGranularity)

                  return (
                    <button
                      key={granularity}
                      type="button"
                      disabled={isDisabled}
                      title={
                        isDisabled
                          ? hasHourlyData
                            ? 'La granularidad por hora solo está disponible en rango 7d.'
                            : 'Datos horarios no disponibles con la fuente actual.'
                          : undefined
                      }
                      onClick={() => {
                        if (!isDisabled) setTrafficGranularity(granularity)
                      }}
                      className={`px-3 py-1.5 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:text-foreground'
                      } ${isDisabled ? 'cursor-not-allowed opacity-60 hover:text-muted-foreground' : ''}`}
                    >
                      {TRAFFIC_GRANULARITY_LABELS[granularity]}
                    </button>
                  )
                })}
            </div>
            <Button variant="outline" size="sm" className="gap-1.5" onClick={() => void loadData()}>
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </div>
        }
      />

      <div className="space-y-1">
        <p className="text-xs text-muted-foreground">{DATE_LABELS[dateRange]}</p>
        <p className="text-xs text-muted-foreground">
          Granularidad activa: {TRAFFIC_GRANULARITY_LABELS[effectiveTrafficGranularity]}
          {!canUseHourGranularity && ' · Hora disponible solo en 7d con datos horarios.'}
        </p>
      </div>

      {!loading && !error && data && trafficFallbackReason && (
        <div className="rounded-lg border border-amber-400/50 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <p className="font-semibold">GA4 en fallback interno</p>
          <p>{trafficFallbackReason}</p>
        </div>
      )}

      {!loading && !error && data && integrationsStatus && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estado de integraciones</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Google Analytics 4</p>
              <p className="mt-1 text-sm font-semibold">
                {integrationsStatus.ga4?.status === 'connected' ? 'Conectado' : 'Error / Fallback'}
              </p>
              {integrationsStatus.ga4?.reason && (
                <p className="mt-1 text-xs text-muted-foreground">{integrationsStatus.ga4.reason}</p>
              )}
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Meta Ads</p>
              <p className="mt-1 text-sm font-semibold">
                {integrationsStatus.meta_ads?.status === 'connected' ? 'Conectado' : 'No disponible'}
              </p>
              {integrationsStatus.meta_ads?.provider && (
                <p className="mt-1 text-xs text-muted-foreground">Fuente: {integrationsStatus.meta_ads.provider}</p>
              )}
            </div>
            <div className="rounded-lg border border-border/60 p-3">
              <p className="text-xs text-muted-foreground">Google Ads</p>
              <p className="mt-1 text-sm font-semibold">
                {integrationsStatus.google_ads?.status === 'pending_connection'
                  ? 'Pendiente de conexión'
                  : integrationsStatus.google_ads?.status === 'connected'
                    ? 'Conectado'
                    : 'No disponible'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

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
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <KpiCard title="Sesiones Totales" value={fmtNum(data.overview.total_sessions)} icon={Eye} />
            <KpiCard title="Gasto Ads" value={fmtCur(data.overview.total_ad_spend)} icon={DollarSign} />
            <KpiCard title="Conversiones" value={fmtNum(data.overview.total_conversions)} icon={Target} />
            <KpiCard title="ROAS Global" value={`${data.overview.global_roas.toFixed(2)}x`} icon={TrendingUp} />
            <KpiCard title="CPL (estimado)" value={cpl !== null ? fmtCur(cpl) : '—'} icon={DollarSign} />
            <KpiCard title="CVR sesión→conv." value={fmtPct(sessionToConversionRate)} icon={TrendingUp} />
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
              <CardTitle className="text-base">
                Visión general: sesiones totales vs tiempo ({TRAFFIC_GRANULARITY_LABELS[effectiveTrafficGranularity]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GraficaVisitantesTiempo
                data={selectedTrafficSeries}
                granularidad={effectiveTrafficGranularity}
                showFallbackBanner={Boolean(trafficFallbackReason)}
                mode="total"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Adquisición diaria: Orgánico vs Pago ({TRAFFIC_GRANULARITY_LABELS[effectiveTrafficGranularity]})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Orgánico (rango visible)</p>
                  <p className="mt-1 text-xl font-semibold">{fmtNum(acquisitionTotals.organic)}</p>
                  <p className="text-xs text-muted-foreground">{fmtPct(organicShare)} del total</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Pago (Facebook + Google)</p>
                  <p className="mt-1 text-xl font-semibold">{fmtNum(acquisitionTotals.paid)}</p>
                  <p className="text-xs text-muted-foreground">{fmtPct(paidShare)} del total</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Facebook Ads</p>
                  <p className="mt-1 text-xl font-semibold">{fmtNum(acquisitionTotals.facebook)}</p>
                </div>
                <div className="rounded-lg border border-border/60 p-3">
                  <p className="text-xs text-muted-foreground">Google Ads</p>
                  <p className="mt-1 text-xl font-semibold">{fmtNum(acquisitionTotals.google)}</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Visitantes vs tiempo</p>
                  <GraficaVisitantesTiempo
                    data={acquisitionSeries}
                    granularidad={effectiveTrafficGranularity}
                    showFallbackBanner={Boolean(trafficFallbackReason)}
                    mode="all"
                  />
                </div>
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Mix diario del tráfico de pago</p>
                  <PaidChannelStackedChart points={acquisitionSeries} />
                </div>
              </div>

              {effectiveTrafficGranularity === 'day' && hourlyDistribution.length > 0 && (
                <div className="space-y-3">
                  <p className="text-sm font-semibold">Distribución de visitas por hora del día</p>
                  <HourlyDistributionChart points={hourlyDistribution} />
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead className="border-b">
                    <tr>
                      <th className="py-2 text-left">Fecha</th>
                      <th className="py-2 text-right">Orgánico</th>
                      <th className="py-2 text-right">Pago</th>
                      <th className="py-2 text-right">Facebook Ads</th>
                      <th className="py-2 text-right">Google Ads</th>
                      <th className="py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {acquisitionSeries.length === 0 ? (
                      <tr>
                        <td className="py-4 text-sm text-muted-foreground" colSpan={6}>
                          {data.traffic.empty_reason || 'Sin datos de tráfico para este rango.'}
                        </td>
                      </tr>
                    ) : (
                      buildTrafficComparison(acquisitionSeries).map((item) => (
                        <tr key={item.isoDate} className="border-b border-border/40">
                          <td className="py-2">{item.date}</td>
                          <td className="py-2 text-right">{fmtNum(item.Organico)}</td>
                          <td className="py-2 text-right">{fmtNum(item.Paid)}</td>
                          <td className="py-2 text-right">{fmtNum(item['Facebook Ads'])}</td>
                          <td className="py-2 text-right">{fmtNum(item['Google Ads'])}</td>
                          <td className="py-2 text-right font-semibold">{fmtNum(item.Total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Conversión y eficiencia</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Sesiones / periodo</p>
                    <p className="mt-1 text-lg font-semibold">{avgSessionsPerPoint > 0 ? fmtNum(Math.round(avgSessionsPerPoint)) : '0'}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Form submit rate</p>
                    <p className="mt-1 text-lg font-semibold">{fmtPct(formSubmitRate)}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">Sesión → Conversión</p>
                    <p className="mt-1 text-lg font-semibold">{fmtPct(sessionToConversionRate)}</p>
                  </div>
                  <div className="rounded-lg border border-border/60 p-3">
                    <p className="text-xs text-muted-foreground">ROAS</p>
                    <p className="mt-1 text-lg font-semibold">{data.overview.global_roas.toFixed(2)}x</p>
                  </div>
                </div>

                {(() => {
                  const stages = [
                    { label: 'Sesiones totales', value: data.overview.total_sessions },
                    { label: 'Visitas landing Meta', value: fbTrafficFunnel.page_views },
                    { label: 'Formularios enviados', value: fbTrafficFunnel.form_submits },
                    { label: 'Conversiones', value: data.overview.total_conversions },
                  ]
                  const maxStage = stages.reduce((max, stage) => Math.max(max, stage.value), 0) || 1

                  return (
                    <div className="space-y-2">
                      {stages.map((stage) => (
                        <div key={stage.label} className="grid grid-cols-[150px_1fr_90px] items-center gap-3 text-xs">
                          <span className="text-muted-foreground">{stage.label}</span>
                          <div className="h-2.5 rounded bg-muted overflow-hidden">
                            <div
                              className="h-full rounded bg-primary/80"
                              style={{ width: `${Math.max((stage.value / maxStage) * 100, stage.value > 0 ? 4 : 1)}%` }}
                            />
                          </div>
                          <span className="text-right font-semibold">{fmtNum(stage.value)}</span>
                        </div>
                      ))}
                    </div>
                  )
                })()}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Calidad del dato y alertas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataQualityAlerts.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg border border-green-500/30 bg-green-500/10 px-3 py-2 text-sm">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>Sin alertas relevantes en el rango actual.</span>
                  </div>
                ) : (
                  dataQualityAlerts.map((alert) => (
                    <div key={alert.id} className="rounded-lg border border-border/60 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <p className="text-sm font-semibold">{alert.title}</p>
                        <Badge className={alertBadgeClass(alert.severity)}>{alertLabel(alert.severity)}</Badge>
                      </div>
                      <div className="mt-1 flex items-start gap-2 text-xs text-muted-foreground">
                        <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                        <p>{alert.detail}</p>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {!loading && !error && data && activeTab === 'organic' && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                Visitas orgánicas vs tiempo ({TRAFFIC_GRANULARITY_LABELS[effectiveTrafficGranularity]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <GraficaVisitantesTiempo
                data={selectedTrafficSeries}
                granularidad={effectiveTrafficGranularity}
                showFallbackBanner={Boolean(trafficFallbackReason)}
                mode="organic"
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
                    {topPages.length === 0 ? (
                      <tr>
                        <td className="py-4 text-sm text-muted-foreground" colSpan={3}>
                          {data.traffic.empty_reason || 'Sin páginas con tráfico en este rango.'}
                        </td>
                      </tr>
                    ) : (
                      topPages.map((page, idx) => (
                        <tr key={`${page.path}-${idx}`} className="border-b border-border/40">
                          <td className="py-2"><code className="text-xs">{page.path}</code></td>
                          <td className="py-2 text-right">{fmtNum(page.views)}</td>
                          <td className="py-2 text-right">{page.avgTime}</td>
                        </tr>
                      ))
                    )}
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
                    {sourceMedium.length === 0 ? (
                      <tr>
                        <td className="py-4 text-sm text-muted-foreground" colSpan={4}>
                          {data.traffic.empty_reason || 'Sin fuentes/medios en este rango.'}
                        </td>
                      </tr>
                    ) : (
                      sourceMedium.map((row, idx) => (
                        <tr key={`${row.source}-${idx}`} className="border-b border-border/40">
                          <td className="py-2">{row.source}</td>
                          <td className="py-2 text-right">{fmtNum(row.sessions)}</td>
                          <td className="py-2 text-right">{fmtNum(row.users)}</td>
                          <td className="py-2 text-right">{row.bounceRate > 0 ? fmtPct(row.bounceRate) : '—'}</td>
                        </tr>
                      ))
                    )}
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
              <CardTitle className="text-base">
                Sesiones Facebook Ads y gasto estimado ({TRAFFIC_GRANULARITY_LABELS[effectiveTrafficGranularity]})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <FacebookSessionsSpendChart
                points={selectedTrafficSeries}
                totalSpend={data.facebook.spend}
              />
            </CardContent>
          </Card>

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
            <EmptyState
              icon={Search}
              title="Google Ads no está conectado"
              description="Conecta tu cuenta de Google Ads para visualizar tráfico, gasto y conversiones atribuidas."
              action={{ label: 'Conectar Google Ads', onClick: () => router.push('/configuracion') }}
            />
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
