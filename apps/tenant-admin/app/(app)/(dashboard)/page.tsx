'use client'

import { useEffect, useState } from 'react'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@payload-config/components/ui/card'
import {
  BookOpen,
  Users,
  FileText,
  Calendar,
  GraduationCap,
  Building2,
  Loader2,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { traducirEstado } from '@payload-config/lib/estados'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { useDashboardMetrics } from '@payload-config/hooks'
import { useTenantBranding } from '@/app/providers/tenant-branding'

// Dashboard data types - defined locally to ensure TypeScript resolution
interface DashboardMetrics {
  total_courses: number
  active_students: number
  leads_this_month: number
  total_teachers: number
  total_campuses: number
  active_convocations: number
}

interface Convocation {
  id: number
  name: string
  course_title: string
  campus_name: string
  status: string
  start_date: string
  end_date: string
  enrolled: number
  capacity_max: number
  enrollmentsCount: number
  capacityPercentage: number
}

interface Campaign {
  id: number
  name: string
  status: string
  leads_generated: number
  conversion_rate: number
  cost_per_lead: number
  leadsCount: number
  conversionRate: number
  budget: number
  spent: number
}

interface RecentActivity {
  id: number
  title: string
  entity_name: string
  timestamp: string
}

interface OperationalAlert {
  severity: 'warning' | 'info'
  message: string
  count: number
}

interface CampusDistribution {
  campus_name: string
  student_count: number
}

interface WeeklyMetrics {
  leads: number[]
  enrollments: number[]
  courses_added: number[]
}

interface DashboardData {
  metrics: DashboardMetrics
  convocations: Convocation[]
  campaigns: Campaign[]
  recentActivities: RecentActivity[]
  weeklyMetrics: WeeklyMetrics
  alerts: OperationalAlert[]
  campusDistribution: CampusDistribution[]
}

interface UseDashboardMetricsResult {
  data: DashboardData
  loading: boolean
  error: Error | null
  isConnected: boolean
  lastUpdate: Date | null
  refresh: () => Promise<void>
}

interface LmsEnrollment {
  id: string
  status: string
  progress?: {
    percent?: number
  }
}

interface LmsSummary {
  totalEnrollments: number
  activeEnrollments: number
  completionRate: number
  certificatesIssued: number
}

// KPI item type for dashboard cards
interface KpiItem {
  title: string
  value: number
  icon: LucideIcon
}

// Weekly chart data point type
interface WeeklyChartDataPoint {
  semana: string
  Leads: number
  Inscripciones: number
  Cursos: number
}

export default function DashboardPage() {
  // Use the combined hook for initial fetch + real-time updates
  // Type assertion required as TypeScript cannot resolve types through path alias
  const { branding } = useTenantBranding()
  const tenantId =
    parseInt(branding.tenantId, 10) ||
    parseInt(process.env.NEXT_PUBLIC_DEFAULT_TENANT_ID ?? '2', 10)
  const hookResult: UseDashboardMetricsResult = useDashboardMetrics({
    tenantId,
    enableRealtime: true,
  }) as UseDashboardMetricsResult
  const { data, loading, error, isConnected } = hookResult

  const [lmsSummary, setLmsSummary] = useState<LmsSummary>({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completionRate: 0,
    certificatesIssued: 0,
  })

  const [cycleStats, setCycleStats] = useState<{
    gradoMedio: number
    gradoSuperior: number
    totalInscritos: number
    plazasDisponibles: number
  }>({
    gradoMedio: 0,
    gradoSuperior: 0,
    totalInscritos: 0,
    plazasDisponibles: 0,
  })

  // Destructure data for easier access with explicit types
  const metrics: DashboardMetrics = data.metrics
  const convocations: Convocation[] = data.convocations
  const campaigns: Campaign[] = data.campaigns
  const recentActivities: RecentActivity[] = data.recentActivities
  const weeklyMetrics: WeeklyMetrics = data.weeklyMetrics
  const alerts: OperationalAlert[] = data.alerts
  const campusDistribution: CampusDistribution[] = data.campusDistribution

  const refreshCampusSummary = async () => {
    try {
      const response = await fetch('/api/lms/enrollments?limit=200', {
        credentials: 'include',
        cache: 'no-store',
      })

      if (!response.ok) {
        return
      }

      const payload = (await response.json()) as { data?: LmsEnrollment[] }
      const enrollments = payload.data ?? []
      const activeEnrollments = enrollments.filter((item) => item.status === 'active').length
      const completedCount = enrollments.filter(
        (item) => (item.progress?.percent ?? 0) >= 100 || item.status === 'completed'
      ).length
      const completionRate =
        enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0

      setLmsSummary({
        totalEnrollments: enrollments.length,
        activeEnrollments,
        completionRate,
        certificatesIssued: completedCount,
      })
    } catch {
      // Keep previous LMS summary on transient errors
    }
  }

  const refreshCycleStats = async () => {
    try {
      const [medioRes, superiorRes] = await Promise.all([
        fetch('/api/cycles?where[level][equals]=grado_medio&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/cycles?where[level][equals]=grado_superior&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      const medioData = medioRes.ok ? ((await medioRes.json()) as { totalDocs?: number }) : null
      const superiorData = superiorRes.ok
        ? ((await superiorRes.json()) as { totalDocs?: number })
        : null

      setCycleStats({
        gradoMedio: medioData?.totalDocs ?? 0,
        gradoSuperior: superiorData?.totalDocs ?? 0,
        totalInscritos: 0,
        plazasDisponibles: 0,
      })
    } catch {
      // Keep previous stats on transient errors
    }
  }

  useEffect(() => {
    void refreshCampusSummary()
    void refreshCycleStats()
  }, [])

  // Format current date in Spanish
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  // Primera línea de KPIs
  const primaryKpis: KpiItem[] = [
    {
      title: 'Cursos',
      value: metrics.total_courses,
      icon: BookOpen,
    },
    {
      title: 'Alumnos',
      value: metrics.active_students,
      icon: GraduationCap,
    },
    {
      title: 'Leads este Mes',
      value: metrics.leads_this_month,
      icon: FileText,
    },
  ]

  // Segunda línea de KPIs
  const secondaryKpis: KpiItem[] = [
    {
      title: 'Profesores',
      value: metrics.total_teachers,
      icon: Users,
    },
    {
      title: 'Sedes',
      value: metrics.total_campuses,
      icon: Building2,
    },
    {
      title: 'Convocatorias',
      value: metrics.active_convocations,
      icon: Calendar,
    },
  ]

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="vk.x.j2">
        <div className="text-center space-y-4" data-oid="o8:n.yc">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" data-oid="kwj0duj" />
          <p className="text-muted-foreground" data-oid="9en21sh">
            Cargando métricas del dashboard...
          </p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96" data-oid="whcoip2">
        <Card className="max-w-md" data-oid="wj55d45">
          <CardContent className="pt-6 text-center space-y-4" data-oid="qe-_ke3">
            <p className="text-destructive font-semibold" data-oid="ep:o68y">
              Error al cargar dashboard
            </p>
            <p className="text-sm text-muted-foreground" data-oid="4jbulqb">
              {error.message}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              data-oid="cuj-a3y"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6" data-oid="re7drx3">
      <PageHeader
        title="Dashboard"
        description={`Vista general de la operativa de ${branding.academyName}`}
        badge={
          <Badge
            variant={isConnected ? 'default' : 'outline'}
            className="text-xs"
            data-oid="tnbqb:6"
          >
            {isConnected ? 'En vivo' : 'Sin conexión'}
          </Badge>
        }
        data-oid="qqq2bhb"
      />

      {/* Primera línea de KPIs */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full"
        data-oid="gtfb5.8"
      >
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} data-oid="2vutiv1">
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
                data-oid="c0g4t-7"
              >
                <CardTitle className="text-sm font-medium text-muted-foreground" data-oid=":dyjg58">
                  {kpi.title}
                </CardTitle>
                <div className="rounded-full bg-primary/10 p-1.5" data-oid="m2mi0bx">
                  <Icon className="h-4 w-4 text-primary" data-oid=".uig.-." />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1" data-oid="owkmxd3">
                <div className="text-2xl font-bold" data-oid="1os:j:d">
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Segunda línea de KPIs */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full"
        data-oid="j786_4e"
      >
        {secondaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title} data-oid="cy2berj">
              <CardHeader
                className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
                data-oid="6ufjv33"
              >
                <CardTitle className="text-sm font-medium text-muted-foreground" data-oid=".xo8cz5">
                  {kpi.title}
                </CardTitle>
                <div className="rounded-full bg-primary/10 p-1.5" data-oid="l-ernu4">
                  <Icon className="h-4 w-4 text-primary" data-oid="02t67q_" />
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-1" data-oid="888c_ox">
                <div className="text-2xl font-bold" data-oid="m2fulny">
                  {kpi.value}
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Ciclos Formativos KPIs */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 w-full"
        data-oid="cycle-kpis"
      >
        <Card data-oid="kpi-gm">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-gm-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-gm-t">
              Ciclos Grado Medio
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-gm-i">
              <GraduationCap className="h-4 w-4 text-primary" data-oid="kpi-gm-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-gm-c">
            <div className="text-2xl font-bold" data-oid="kpi-gm-v">
              {cycleStats.gradoMedio}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="kpi-gs">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-gs-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-gs-t">
              Ciclos Grado Superior
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-gs-i">
              <GraduationCap className="h-4 w-4 text-primary" data-oid="kpi-gs-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-gs-c">
            <div className="text-2xl font-bold" data-oid="kpi-gs-v">
              {cycleStats.gradoSuperior}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="kpi-ti">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-ti-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-ti-t">
              Total Inscritos
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-ti-i">
              <Users className="h-4 w-4 text-primary" data-oid="kpi-ti-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-ti-c">
            <div className="text-2xl font-bold" data-oid="kpi-ti-v">
              {cycleStats.totalInscritos}
            </div>
          </CardContent>
        </Card>

        <Card data-oid="kpi-pd">
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-pd-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-pd-t">
              Plazas Disponibles
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-pd-i">
              <BookOpen className="h-4 w-4 text-primary" data-oid="kpi-pd-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-pd-c">
            <div className="text-2xl font-bold" data-oid="kpi-pd-v">
              {cycleStats.plazasDisponibles}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integración Campus Virtual */}
      <Card data-oid="22e-.p_">
        <CardHeader className="flex flex-row items-start justify-between" data-oid="bxh2a5d">
          <div className="space-y-1" data-oid="7m3524m">
            <CardTitle className="flex items-center gap-2" data-oid="ijt.71:">
              <GraduationCap className="h-5 w-5 text-primary" data-oid="xhzaqjw" />
              Campus Virtual Integrado
            </CardTitle>
            <CardDescription data-oid="c-cqodn">
              Estado operativo LMS y accesos directos desde el dashboard principal.
            </CardDescription>
          </div>
          <Badge
            variant="outline"
            className="pointer-events-none cursor-default"
            data-oid="v-oil83"
          >
            Campus Virtual
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4" data-oid="zfclf:d">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4" data-oid="n--3jcr">
            <div className="rounded-lg border p-3" data-oid="t3px523">
              <p className="text-xs text-muted-foreground" data-oid="62uhw6-">
                Inscripciones LMS
              </p>
              <p className="text-2xl font-bold" data-oid="uo6us2f">
                {lmsSummary.totalEnrollments}
              </p>
            </div>
            <div className="rounded-lg border p-3" data-oid="64gsznz">
              <p className="text-xs text-muted-foreground" data-oid="_k414kp">
                Activas
              </p>
              <p className="text-2xl font-bold" data-oid="88xrs41">
                {lmsSummary.activeEnrollments}
              </p>
            </div>
            <div className="rounded-lg border p-3" data-oid=":4az6dv">
              <p className="text-xs text-muted-foreground" data-oid="skdtj.8">
                Finalización
              </p>
              <p className="text-2xl font-bold" data-oid="1di0wxr">
                {lmsSummary.completionRate}%
              </p>
            </div>
            <div className="rounded-lg border p-3" data-oid="326ricc">
              <p className="text-xs text-muted-foreground" data-oid="kknaejh">
                Certificados
              </p>
              <p className="text-2xl font-bold" data-oid="qyo8ot1">
                {lmsSummary.certificatesIssued}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2" data-oid="13852wt">
            <Button asChild size="sm" data-oid="g_h72m:">
              <a href="/campus-virtual" data-oid="i2825fj">
                Abrir módulo Campus
              </a>
            </Button>
            <Button asChild variant="outline" size="sm" data-oid="58p91m_">
              <a href="/campus/login" target="_blank" rel="noreferrer" data-oid="3-295vh">
                Ir al Campus alumno
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2" data-oid="80103c1">
        {/* Próximas Convocatorias */}
        <Card data-oid="mahxjkj">
          <CardHeader data-oid="1smon18">
            <CardTitle data-oid="k-9p4r5">Próximas Convocatorias</CardTitle>
            <CardDescription data-oid="wlp33:b">
              Cursos programados en los próximos meses
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="_cqso::">
            {convocations.length > 0 ? (
              <div className="space-y-4" data-oid=".z-3fy7">
                {convocations.slice(0, 5).map((conv: Convocation) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                    data-oid="67xx1nc"
                  >
                    <div className="space-y-1" data-oid="pvyu5da">
                      <p className="text-sm font-medium leading-none" data-oid=".bt2x8h">
                        {conv.course_title}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="l19a-ut">
                        {conv.campus_name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="azt2avg">
                        {new Date(conv.start_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2" data-oid="smqcdf2">
                      <Badge variant={traducirEstado(conv.status).variant} data-oid="e-z94il">
                        {traducirEstado(conv.status).label}
                      </Badge>
                      <span className="text-xs text-muted-foreground" data-oid="x.4n2xe">
                        {conv.enrolled}/{conv.capacity_max} plazas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="ac9pjtq">
                No hay convocatorias programadas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Campañas Activas */}
        <Card data-oid="z7ypsgw">
          <CardHeader data-oid="tf1:7kz">
            <CardTitle data-oid="2ut3hrz">Campañas de Marketing</CardTitle>
            <CardDescription data-oid="o4p_.dj">
              Rendimiento de campañas publicitarias
            </CardDescription>
          </CardHeader>
          <CardContent data-oid="o7dkw5i">
            {campaigns.length > 0 ? (
              <div className="space-y-4" data-oid=":gr7n06">
                {campaigns.slice(0, 5).map((campaign: Campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                    data-oid="qtaxg9z"
                  >
                    <div className="space-y-1" data-oid="gc41tyn">
                      <p className="text-sm font-medium leading-none" data-oid="fb0m7.4">
                        {campaign.name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="37i.2g0">
                        {campaign.leads_generated} leads • {campaign.conversion_rate}% conversión
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid=".6p686f">
                        {campaign.cost_per_lead.toFixed(2)}€ por lead
                      </p>
                    </div>
                    <Badge variant={traducirEstado(campaign.status).variant} data-oid="hyb0psg">
                      {traducirEstado(campaign.status).label}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="vwf4d0m">
                No hay campañas configuradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Blocks Row 1: Activity Timeline + Activity Chart */}
      <div className="grid gap-4 md:grid-cols-2" data-oid="fy2n-p0">
        {/* Actividad Reciente */}
        <Card data-oid="gyr4u6s">
          <CardHeader data-oid="_1yx95t">
            <CardTitle data-oid="yy10ure">Actividad Reciente</CardTitle>
            <CardDescription data-oid="fb_-r1-">Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent data-oid="ds2gh4z">
            {recentActivities.length > 0 ? (
              <div className="space-y-3" data-oid="4dur1yy">
                {recentActivities.map((activity, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0"
                    data-oid="km06da7"
                  >
                    <div
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10"
                      data-oid="bv5c4xc"
                    >
                      <Clock className="h-4 w-4 text-primary" data-oid="j9.3iof" />
                    </div>
                    <div className="flex-1 space-y-1" data-oid="852sqx:">
                      <p className="text-sm font-medium leading-none" data-oid="36mp1xz">
                        {activity.title}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="th0qltd">
                        {activity.entity_name}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="d0i02-m">
                        {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="v:7wdlj">
                No hay actividad reciente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Actividad Mensual */}
        <Card data-oid="3-_roh9">
          <CardHeader data-oid="0xkikx0">
            <CardTitle data-oid="rd.i6fv">Actividad Mensual</CardTitle>
            <CardDescription data-oid="h-f:ic6">Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent data-oid="y1b-ygm">
            {weeklyMetrics.leads.length > 0 ? (
              <ResponsiveContainer width="100%" height={200} data-oid="boyfcdf">
                <LineChart
                  data={[0, 1, 2, 3].map(
                    (i): WeeklyChartDataPoint => ({
                      semana: `Sem ${i + 1}`,
                      Leads: weeklyMetrics.leads[i] ?? 0,
                      Inscripciones: weeklyMetrics.enrollments[i] ?? 0,
                      Cursos: weeklyMetrics.courses_added[i] ?? 0,
                    })
                  )}
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                  data-oid="rwmufty"
                >
                  <CartesianGrid
                    strokeDasharray="3 3"
                    className="stroke-muted"
                    data-oid="ttd7xs9"
                  />
                  <XAxis dataKey="semana" className="text-xs" data-oid="rzuhvs4" />
                  <YAxis className="text-xs" data-oid="hqk797f" />
                  <Tooltip data-oid=".p55dds" />
                  <Legend data-oid="u-sppg6" />
                  <Line
                    type="monotone"
                    dataKey="Leads"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    data-oid="bauvw_m"
                  />
                  <Line
                    type="monotone"
                    dataKey="Inscripciones"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    data-oid="cex0:jq"
                  />
                  <Line
                    type="monotone"
                    dataKey="Cursos"
                    stroke="hsl(var(--chart-3))"
                    strokeWidth={2}
                    data-oid="qvu-lsd"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="1gn:r0o">
                No hay datos disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Blocks Row 2: Operational Alerts + Campus Distribution */}
      <div className="grid gap-4 md:grid-cols-2" data-oid="ux:ka67">
        {/* Alertas Operativas */}
        <Card data-oid="nn8l4ro">
          <CardHeader data-oid="sw1lpxg">
            <CardTitle data-oid="b8sbdxs">Alertas Operativas</CardTitle>
            <CardDescription data-oid="k1p0m7w">Requieren atención</CardDescription>
          </CardHeader>
          <CardContent data-oid="ub9mtli">
            {alerts.length > 0 ? (
              <div className="space-y-3" data-oid="x_zot34">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-md border p-3 ${
                      alert.severity === 'warning'
                        ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
                        : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                    }`}
                    data-oid="veafq43"
                  >
                    {alert.severity === 'warning' ? (
                      <AlertTriangle
                        className="h-5 w-5 text-orange-600 dark:text-orange-400"
                        data-oid="ze3xn31"
                      />
                    ) : (
                      <Info
                        className="h-5 w-5 text-blue-600 dark:text-blue-400"
                        data-oid="pwd4oea"
                      />
                    )}
                    <div className="flex-1" data-oid="7ljnzmr">
                      <p className="text-sm font-medium" data-oid="zsk6wl_">
                        {alert.message}
                      </p>
                      <p className="text-xs text-muted-foreground" data-oid="2vgb_.1">
                        {alert.count} {alert.count === 1 ? 'elemento' : 'elementos'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center" data-oid="2.yzvcu">
                <div className="space-y-2" data-oid="v7h5lg2">
                  <div
                    className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30"
                    data-oid="lalr5.7"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6 text-green-600 dark:text-green-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      data-oid="syecflp"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                        data-oid="1bla-2o"
                      />
                    </svg>
                  </div>
                  <p className="text-sm font-medium" data-oid="3v5tqnd">
                    Todo en orden
                  </p>
                  <p className="text-xs text-muted-foreground" data-oid="r2esh20">
                    No hay alertas pendientes
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución de Alumnos por Sede */}
        <Card data-oid="n4di-0g">
          <CardHeader data-oid="xf31n2n">
            <CardTitle data-oid="kuuhjua">Alumnos por Sede</CardTitle>
            <CardDescription data-oid="q:hqp0_">Distribución actual</CardDescription>
          </CardHeader>
          <CardContent data-oid="-ohuvq1">
            {campusDistribution.length > 0 ? (
              <div className="space-y-3" data-oid=".3-d.pc">
                {campusDistribution.map((campus, idx) => {
                  const maxStudents = Math.max(...campusDistribution.map((c) => c.student_count))
                  const percentage =
                    maxStudents > 0 ? (campus.student_count / maxStudents) * 100 : 0

                  return (
                    <div key={idx} className="space-y-2" data-oid="rhzr:6:">
                      <div className="flex items-center justify-between text-sm" data-oid="9t-p7z9">
                        <span className="font-medium" data-oid="nfciqco">
                          {campus.campus_name}
                        </span>
                        <span className="text-muted-foreground" data-oid="b_gr7.u">
                          {campus.student_count} alumnos
                        </span>
                      </div>
                      <div
                        className="h-2 bg-secondary rounded-full overflow-hidden"
                        data-oid="hq8w372"
                      >
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                          data-oid="tqec.6n"
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8" data-oid="msm:cek">
                No hay datos de distribución
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
