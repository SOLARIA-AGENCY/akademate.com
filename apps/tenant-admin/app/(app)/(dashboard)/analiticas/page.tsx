'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend,
} from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Badge } from '@payload-config/components/ui/badge'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { Button } from '@payload-config/components/ui/button'
import {
  BarChart3,
  TrendingUp,
  Users,
  DollarSign,
  Eye,
  MousePointer,
  Globe,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Target,
  Zap,
} from 'lucide-react'

// ---------------------------------------------------------------------------
// Mock Data — structured for easy replacement with real API calls
// ---------------------------------------------------------------------------

const MOCK = {
  overview: {
    totalSessions: 4521,
    totalAdSpend: 2340.5,
    totalConversions: 47,
    globalROAS: 3.2,
    sessionsTrend: 12.5,
    spendTrend: -5.2,
    conversionsTrend: 23.1,
    roasTrend: 8.4,
  },
  organic: {
    users: 3200,
    sessions: 4521,
    pagesPerSession: 2.8,
    bounceRate: 42.3,
    usersTrend: 8.3,
    sessionsTrend: 12.5,
    pagesTrend: -1.2,
    bounceTrend: -3.1,
    topPages: [
      { path: '/p/ciclos/cfgm-farmacia-parafarmacia', views: 1240, avgTime: '2:45' },
      { path: '/p/ciclos/cfgs-higiene-bucodental', views: 980, avgTime: '2:12' },
      { path: '/p/convocatorias/SC-2026-001', views: 756, avgTime: '3:10' },
      { path: '/p/convocatorias/SC-2026-002', views: 623, avgTime: '2:55' },
      { path: '/p/ciclos', views: 412, avgTime: '1:30' },
      { path: '/p/ciclos/cfgs-anatomia-patologica', views: 389, avgTime: '2:20' },
      { path: '/p/blog/becas-fp-2026', views: 345, avgTime: '4:05' },
      { path: '/p/contacto', views: 298, avgTime: '1:15' },
      { path: '/p/ciclos/cfgm-emergencias-sanitarias', views: 276, avgTime: '2:30' },
      { path: '/p/nosotros', views: 210, avgTime: '1:50' },
    ],
    topQueries: [
      { query: 'farmacia parafarmacia tenerife', impressions: 3400, clicks: 245, ctr: 7.2, position: 4.2 },
      { query: 'higiene bucodental canarias', impressions: 2100, clicks: 178, ctr: 8.5, position: 3.8 },
      { query: 'ciclo fp tenerife', impressions: 1800, clicks: 92, ctr: 5.1, position: 6.1 },
      { query: 'cep formacion', impressions: 1200, clicks: 340, ctr: 28.3, position: 1.2 },
      { query: 'estudiar farmacia tenerife', impressions: 890, clicks: 67, ctr: 7.5, position: 5.4 },
    ],
    sourceMedium: [
      { source: 'google / organic', sessions: 2890, users: 2100, bounceRate: 38.2 },
      { source: 'direct / (none)', sessions: 820, users: 610, bounceRate: 45.1 },
      { source: 'instagram / social', sessions: 410, users: 340, bounceRate: 52.3 },
      { source: 'facebook / social', sessions: 245, users: 198, bounceRate: 48.7 },
      { source: 'bing / organic', sessions: 156, users: 120, bounceRate: 41.0 },
    ],
  },
  facebook: {
    spend: 1560.3,
    impressions: 89400,
    clicks: 3240,
    ctr: 3.62,
    conversions: 32,
    roas: 3.8,
    spendTrend: -3.4,
    impressionsTrend: 15.2,
    clicksTrend: 9.8,
    ctrTrend: -4.7,
    conversionsTrend: 18.5,
    roasTrend: 6.2,
    campaigns: [
      {
        id: 1,
        name: 'SOLARIA AGENCY - CICLOS FP - CAPTACION 2026 - SA-SC-SAN-FAR-2628-CIC-CAP26',
        status: 'active' as const,
        budget: 25,
        impressions: 52300,
        clicks: 1890,
        cpc: 0.48,
        conversions: 19,
        roas: 4.2,
      },
      {
        id: 2,
        name: 'SOLARIA AGENCY - CICLOS FP - CAPTACION 2026 - SA-SC-SAN-HIG-2628-CIC-CAP26',
        status: 'active' as const,
        budget: 20,
        impressions: 37100,
        clicks: 1350,
        cpc: 0.55,
        conversions: 13,
        roas: 3.1,
      },
    ],
  },
  google: {
    clicks: 1280,
    impressions: 45600,
    ctr: 2.81,
    avgCpc: 0.61,
    cost: 780.2,
    conversions: 15,
    cpa: 52.01,
    clicksTrend: 5.6,
    impressionsTrend: 11.3,
    ctrTrend: -5.1,
    cpcTrend: -2.3,
    costTrend: 3.1,
    conversionsTrend: 14.2,
    cpaTrend: -9.5,
    campaigns: [
      {
        id: 1,
        name: 'Farmacia Parafarmacia - Search',
        type: 'Search' as const,
        status: 'active' as const,
        budget: 15,
        impressions: 28900,
        clicks: 820,
        cpc: 0.58,
        conversions: 10,
      },
      {
        id: 2,
        name: 'Higiene Bucodental - Search',
        type: 'Search' as const,
        status: 'active' as const,
        budget: 12,
        impressions: 16700,
        clicks: 460,
        cpc: 0.67,
        conversions: 5,
      },
    ],
  },
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtNum = (n: number) => new Intl.NumberFormat('es-ES').format(n)
const fmtCur = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n)
const fmtPct = (n: number) => `${n.toFixed(1)}%`
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(1)}K` : fmtNum(n))

// ---------------------------------------------------------------------------
// Small reusable sub-components
// ---------------------------------------------------------------------------

type Tab = 'overview' | 'organic' | 'facebook' | 'google'

const TABS: { id: Tab; label: string; icon: typeof BarChart3; color: string }[] = [
  { id: 'overview', label: 'Vision General', icon: BarChart3, color: 'text-foreground' },
  { id: 'organic', label: 'Organico', icon: Globe, color: 'text-emerald-500' },
  { id: 'facebook', label: 'Facebook Ads', icon: Zap, color: 'text-blue-500' },
  { id: 'google', label: 'Google Ads', icon: Search, color: 'text-amber-500' },
]

const DATE_RANGES = ['7d', '30d', '90d'] as const
const DATE_LABELS: Record<(typeof DATE_RANGES)[number], string> = {
  '7d': 'Ultimos 7 dias',
  '30d': 'Ultimos 30 dias',
  '90d': 'Ultimos 90 dias',
}

function TrendBadge({ value }: { value: number }) {
  const positive = value >= 0
  return (
    <span
      className={`inline-flex items-center gap-0.5 text-xs font-medium ${positive ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
    >
      {positive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {Math.abs(value).toFixed(1)}%
    </span>
  )
}

function KpiCard({
  title,
  value,
  trend,
  icon: Icon,
  iconColor,
}: {
  title: string
  value: string
  trend: number
  icon: typeof Eye
  iconColor?: string
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconColor ?? 'text-muted-foreground'}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        <TrendBadge value={trend} />
      </CardContent>
    </Card>
  )
}

function TableWrapper({ children }: { children: React.ReactNode }) {
  return <div className="overflow-x-auto -mx-6 px-6">{children}</div>
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return (
    <th
      className={`py-3 px-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}

function Td({
  children,
  align = 'left',
  mono,
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
  mono?: boolean
}) {
  return (
    <td
      className={`py-3 px-4 text-sm ${align === 'right' ? 'text-right' : 'text-left'} ${mono ? 'font-mono tabular-nums' : ''}`}
    >
      {children}
    </td>
  )
}

function StatusBadge({ status }: { status: string }) {
  const active = status === 'active'
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${active ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400' : 'bg-muted text-muted-foreground'}`}
    >
      {active ? 'Activo' : 'Pausado'}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tab Content Components
// ---------------------------------------------------------------------------

// Generate 30 days of mock traffic data
function generateTrafficData() {
  const data = []
  const now = new Date()
  for (let i = 29; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const dayOfWeek = date.getDay()
    // More traffic on weekdays, less on weekends
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 80 : 150
    const organic = Math.round(base + Math.random() * 60)
    const facebook = Math.round(30 + Math.random() * 40)
    const google = Math.round(15 + Math.random() * 25)
    data.push({
      date: date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }),
      fullDate: date.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }),
      Organico: organic,
      'Facebook Ads': facebook,
      'Google Ads': google,
      Total: organic + facebook + google,
    })
  }
  return data
}

const TRAFFIC_DATA = generateTrafficData()

function TrafficChart() {
  const [view, setView] = useState<'area' | 'bar'>('area')
  const [showChannels, setShowChannels] = useState(true)
  const [isChartReady, setIsChartReady] = useState(false)

  useEffect(() => {
    setIsChartReady(true)
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base">Trafico por dia</CardTitle>
        <div className="flex gap-1">
          <Button size="sm" variant={view === 'area' ? 'default' : 'outline'} onClick={() => setView('area')} className="text-xs h-7 px-2">Area</Button>
          <Button size="sm" variant={view === 'bar' ? 'default' : 'outline'} onClick={() => setView('bar')} className="text-xs h-7 px-2">Barras</Button>
          <Button size="sm" variant="ghost" onClick={() => setShowChannels(!showChannels)} className="text-xs h-7 px-2">
            {showChannels ? 'Total' : 'Canales'}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-72 w-full">
          {isChartReady ? (
            <ResponsiveContainer width="100%" height="100%">
              {view === 'area' ? (
                <AreaChart data={TRAFFIC_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorOrganic" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorFb" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorGoogle" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item?.fullDate || label
                    }}
                  />
                  {showChannels ? (
                    <>
                      <Area type="monotone" dataKey="Organico" stroke="#10B981" fill="url(#colorOrganic)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Facebook Ads" stroke="#3B82F6" fill="url(#colorFb)" strokeWidth={2} />
                      <Area type="monotone" dataKey="Google Ads" stroke="#F59E0B" fill="url(#colorGoogle)" strokeWidth={2} />
                    </>
                  ) : (
                    <Area type="monotone" dataKey="Total" stroke="hsl(var(--primary))" fill="url(#colorTotal)" strokeWidth={2.5} />
                  )}
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </AreaChart>
              ) : (
                <BarChart data={TRAFFIC_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.5} />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      fontSize: '12px',
                      color: 'hsl(var(--foreground))',
                    }}
                    labelFormatter={(label, payload) => {
                      const item = payload?.[0]?.payload
                      return item?.fullDate || label
                    }}
                  />
                  {showChannels ? (
                    <>
                      <Bar dataKey="Organico" fill="#10B981" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Facebook Ads" fill="#3B82F6" radius={[2, 2, 0, 0]} />
                      <Bar dataKey="Google Ads" fill="#F59E0B" radius={[2, 2, 0, 0]} />
                    </>
                  ) : (
                    <Bar dataKey="Total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  )}
                  <Legend wrapperStyle={{ fontSize: '12px' }} />
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="h-full w-full rounded-md bg-muted/30" />
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function OverviewTab() {
  const d = MOCK.overview
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Total Sesiones" value={fmtNum(d.totalSessions)} trend={d.sessionsTrend} icon={Eye} />
        <KpiCard
          title="Total Gasto Ads"
          value={fmtCur(d.totalAdSpend)}
          trend={d.spendTrend}
          icon={DollarSign}
        />
        <KpiCard
          title="Total Conversiones"
          value={fmtNum(d.totalConversions)}
          trend={d.conversionsTrend}
          icon={Target}
        />
        <KpiCard
          title="ROAS Global"
          value={`${d.globalROAS.toFixed(1)}x`}
          trend={d.roasTrend}
          icon={TrendingUp}
        />
      </div>

      {/* Traffic chart */}
      <TrafficChart />

      {/* Channel distribution */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="border-l-4 border-l-emerald-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Globe className="h-4 w-4 text-emerald-500" />
              Organico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{fmtK(MOCK.organic.sessions)}</p>
            <p className="text-xs text-muted-foreground">sesiones</p>
            <p className="text-sm">
              {fmtNum(MOCK.organic.users)} usuarios &middot; {fmtPct(MOCK.organic.bounceRate)} rebote
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-blue-500" />
              Facebook Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{fmtCur(MOCK.facebook.spend)}</p>
            <p className="text-xs text-muted-foreground">gasto</p>
            <p className="text-sm">
              {fmtNum(MOCK.facebook.conversions)} conv. &middot; ROAS {MOCK.facebook.roas.toFixed(1)}x
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-amber-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Search className="h-4 w-4 text-amber-500" />
              Google Ads
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-1">
            <p className="text-2xl font-bold">{fmtCur(MOCK.google.cost)}</p>
            <p className="text-xs text-muted-foreground">gasto</p>
            <p className="text-sm">
              {fmtNum(MOCK.google.conversions)} conv. &middot; CPA {fmtCur(MOCK.google.cpa)}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function OrganicTab() {
  const d = MOCK.organic
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard title="Usuarios" value={fmtNum(d.users)} trend={d.usersTrend} icon={Users} iconColor="text-emerald-500" />
        <KpiCard title="Sesiones" value={fmtNum(d.sessions)} trend={d.sessionsTrend} icon={Eye} iconColor="text-emerald-500" />
        <KpiCard title="Paginas / Sesion" value={d.pagesPerSession.toFixed(1)} trend={d.pagesTrend} icon={BarChart3} iconColor="text-emerald-500" />
        <KpiCard title="Tasa de Rebote" value={fmtPct(d.bounceRate)} trend={d.bounceTrend} icon={MousePointer} iconColor="text-emerald-500" />
      </div>

      {/* Top Pages */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top 10 Paginas</CardTitle>
        </CardHeader>
        <CardContent>
          <TableWrapper>
            <table className="w-full min-w-[500px]">
              <thead className="border-b">
                <tr>
                  <Th>Pagina</Th>
                  <Th align="right">Visitas</Th>
                  <Th align="right">Tiempo Medio</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.topPages.map((p, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <Td>
                      <code className="text-xs bg-muted px-1.5 py-0.5 rounded">{p.path}</code>
                    </Td>
                    <Td align="right" mono>{fmtNum(p.views)}</Td>
                    <Td align="right" mono>{p.avgTime}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* Top Queries */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Top Queries (Search Console)</CardTitle>
        </CardHeader>
        <CardContent>
          <TableWrapper>
            <table className="w-full min-w-[600px]">
              <thead className="border-b">
                <tr>
                  <Th>Query</Th>
                  <Th align="right">Impresiones</Th>
                  <Th align="right">Clics</Th>
                  <Th align="right">CTR</Th>
                  <Th align="right">Posicion</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.topQueries.map((q, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <Td>{q.query}</Td>
                    <Td align="right" mono>{fmtNum(q.impressions)}</Td>
                    <Td align="right" mono>{fmtNum(q.clicks)}</Td>
                    <Td align="right" mono>{fmtPct(q.ctr)}</Td>
                    <Td align="right" mono>{q.position.toFixed(1)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </CardContent>
      </Card>

      {/* Source / Medium */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Fuente / Medio</CardTitle>
        </CardHeader>
        <CardContent>
          <TableWrapper>
            <table className="w-full min-w-[500px]">
              <thead className="border-b">
                <tr>
                  <Th>Fuente / Medio</Th>
                  <Th align="right">Sesiones</Th>
                  <Th align="right">Usuarios</Th>
                  <Th align="right">Rebote</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.sourceMedium.map((s, i) => (
                  <tr key={i} className="hover:bg-muted/50">
                    <Td>{s.source}</Td>
                    <Td align="right" mono>{fmtNum(s.sessions)}</Td>
                    <Td align="right" mono>{fmtNum(s.users)}</Td>
                    <Td align="right" mono>{fmtPct(s.bounceRate)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </CardContent>
      </Card>
    </div>
  )
}

function FacebookTab() {
  const d = MOCK.facebook
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <KpiCard title="Gasto" value={fmtCur(d.spend)} trend={d.spendTrend} icon={DollarSign} iconColor="text-blue-500" />
        <KpiCard title="Impresiones" value={fmtK(d.impressions)} trend={d.impressionsTrend} icon={Eye} iconColor="text-blue-500" />
        <KpiCard title="Clics" value={fmtNum(d.clicks)} trend={d.clicksTrend} icon={MousePointer} iconColor="text-blue-500" />
        <KpiCard title="CTR" value={fmtPct(d.ctr)} trend={d.ctrTrend} icon={Target} iconColor="text-blue-500" />
        <KpiCard title="Conversiones" value={fmtNum(d.conversions)} trend={d.conversionsTrend} icon={Users} iconColor="text-blue-500" />
        <KpiCard title="ROAS" value={`${d.roas.toFixed(1)}x`} trend={d.roasTrend} icon={TrendingUp} iconColor="text-blue-500" />
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="h-4 w-4 text-blue-500" />
            Campanas Facebook
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableWrapper>
            <table className="w-full min-w-[900px]">
              <thead className="border-b">
                <tr>
                  <Th>Campana</Th>
                  <Th>Estado</Th>
                  <Th align="right">Ppto./dia</Th>
                  <Th align="right">Impresiones</Th>
                  <Th align="right">Clics</Th>
                  <Th align="right">CPC</Th>
                  <Th align="right">Conv.</Th>
                  <Th align="right">ROAS</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <Td>
                      <span className="text-xs leading-tight block max-w-xs truncate" title={c.name}>
                        {c.name}
                      </span>
                    </Td>
                    <Td><StatusBadge status={c.status} /></Td>
                    <Td align="right" mono>{fmtCur(c.budget)}</Td>
                    <Td align="right" mono>{fmtK(c.impressions)}</Td>
                    <Td align="right" mono>{fmtNum(c.clicks)}</Td>
                    <Td align="right" mono>{fmtCur(c.cpc)}</Td>
                    <Td align="right" mono>{c.conversions}</Td>
                    <Td align="right" mono>
                      <span className={c.roas >= 3.5 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : ''}>
                        {c.roas.toFixed(1)}x
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </CardContent>
      </Card>
    </div>
  )
}

function GoogleTab() {
  const d = MOCK.google
  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7">
        <KpiCard title="Clics" value={fmtNum(d.clicks)} trend={d.clicksTrend} icon={MousePointer} iconColor="text-amber-500" />
        <KpiCard title="Impresiones" value={fmtK(d.impressions)} trend={d.impressionsTrend} icon={Eye} iconColor="text-amber-500" />
        <KpiCard title="CTR" value={fmtPct(d.ctr)} trend={d.ctrTrend} icon={Target} iconColor="text-amber-500" />
        <KpiCard title="CPC Medio" value={fmtCur(d.avgCpc)} trend={d.cpcTrend} icon={DollarSign} iconColor="text-amber-500" />
        <KpiCard title="Coste" value={fmtCur(d.cost)} trend={d.costTrend} icon={DollarSign} iconColor="text-amber-500" />
        <KpiCard title="Conversiones" value={fmtNum(d.conversions)} trend={d.conversionsTrend} icon={Users} iconColor="text-amber-500" />
        <KpiCard title="CPA" value={fmtCur(d.cpa)} trend={d.cpaTrend} icon={BarChart3} iconColor="text-amber-500" />
      </div>

      {/* Campaigns */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4 text-amber-500" />
            Campanas Google
          </CardTitle>
        </CardHeader>
        <CardContent>
          <TableWrapper>
            <table className="w-full min-w-[800px]">
              <thead className="border-b">
                <tr>
                  <Th>Campana</Th>
                  <Th>Tipo</Th>
                  <Th>Estado</Th>
                  <Th align="right">Ppto./dia</Th>
                  <Th align="right">Impresiones</Th>
                  <Th align="right">Clics</Th>
                  <Th align="right">CPC</Th>
                  <Th align="right">Conv.</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {d.campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-muted/50">
                    <Td>
                      <span className="text-xs leading-tight block max-w-xs truncate" title={c.name}>
                        {c.name}
                      </span>
                    </Td>
                    <Td>
                      <Badge variant="outline" className="text-xs">
                        {c.type}
                      </Badge>
                    </Td>
                    <Td><StatusBadge status={c.status} /></Td>
                    <Td align="right" mono>{fmtCur(c.budget)}</Td>
                    <Td align="right" mono>{fmtK(c.impressions)}</Td>
                    <Td align="right" mono>{fmtNum(c.clicks)}</Td>
                    <Td align="right" mono>{fmtCur(c.cpc)}</Td>
                    <Td align="right" mono>{c.conversions}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrapper>
        </CardContent>
      </Card>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AnaliticasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('overview')
  const [dateRange, setDateRange] = useState<(typeof DATE_RANGES)[number]>('30d')

  return (
    <div className="space-y-6">
      <PageHeader
        title="Analiticas y Metricas"
        description="Panel completo de rendimiento por canal"
        icon={BarChart3}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30">
              Datos de ejemplo
            </Badge>
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
            <Button variant="outline" size="sm" className="gap-1.5">
              <RefreshCw className="h-3.5 w-3.5" />
              Actualizar
            </Button>
          </div>
        }
      />

      {/* Tabs */}
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
              <Icon className={`h-4 w-4 ${isActive ? tab.color : ''}`} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Date range label */}
      <p className="text-xs text-muted-foreground">{DATE_LABELS[dateRange]}</p>

      {/* Active tab content */}
      {activeTab === 'overview' && <OverviewTab />}
      {activeTab === 'organic' && <OrganicTab />}
      {activeTab === 'facebook' && <FacebookTab />}
      {activeTab === 'google' && <GoogleTab />}

      {/* Footer */}
      <div className="text-center text-xs text-muted-foreground py-4 border-t border-border">
        Vista preliminar de Analytics &middot; Los datos mostrados son de ejemplo para demostracion
      </div>
    </div>
  )
}
