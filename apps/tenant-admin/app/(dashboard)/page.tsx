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
  RefreshCw,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { PageHeader } from '@payload-config/components/ui/PageHeader'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
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
  const hookResult: UseDashboardMetricsResult = useDashboardMetrics({ tenantId: 1, enableRealtime: true }) as UseDashboardMetricsResult
  const { data, loading, error, isConnected, lastUpdate, refresh } = hookResult
  const { branding } = useTenantBranding()

  const [lmsSummary, setLmsSummary] = useState<LmsSummary>({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completionRate: 0,
    certificatesIssued: 0,
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
      const completionRate = enrollments.length > 0 ? Math.round((completedCount / enrollments.length) * 100) : 0

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

  useEffect(() => {
    void refreshCampusSummary()
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

  const getStatusBadge = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      abierta: 'default',
      planificada: 'secondary',
      lista_espera: 'outline',
      cerrada: 'destructive',
    }
    return variants[status] ?? 'default'
  }

  const getCampaignStatusBadge = (status: string): 'default' | 'secondary' | 'destructive' => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      activa: 'default',
      pausada: 'secondary',
      finalizada: 'destructive',
    }
    return variants[status] ?? 'default'
  }

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Cargando métricas del dashboard...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <Card className="max-w-md">
          <CardContent className="pt-6 text-center space-y-4">
            <p className="text-destructive font-semibold">Error al cargar dashboard</p>
            <p className="text-sm text-muted-foreground">{error.message}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Reintentar
            </button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        className="mb-0"
        title="Dashboard"
        description={`Vista general de la operativa de ${branding.academyName}`}
        icon={BookOpen}
        badge={(
          <Badge variant={isConnected ? 'default' : 'outline'}>
            {isConnected ? 'EN VIVO' : 'SIN CONEXIÓN'}
          </Badge>
        )}
        actions={(
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              void refresh()
              void refreshCampusSummary()
            }}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Actualizar
          </Button>
        )}
        filters={(
          <div className="flex w-full flex-wrap items-center gap-2 text-sm">
            <Badge variant="outline" className="capitalize">{formattedDate}</Badge>
            <Badge variant="outline">{isConnected ? 'Conectado' : 'Sin conexión'}</Badge>
            {lastUpdate && (
              <Badge variant="outline">
                Actualizado: {lastUpdate.toLocaleTimeString('es-ES')}
              </Badge>
            )}
          </div>
        )}
      />

      {/* Primera línea de KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{kpi.title}</CardTitle>
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Segunda línea de KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {secondaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{kpi.title}</CardTitle>
                <div className="rounded-full bg-primary/10 p-2">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Integración Campus Virtual */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-primary" />
              Campus Virtual Integrado
            </CardTitle>
            <CardDescription>
              Estado operativo LMS y accesos directos desde el dashboard principal.
            </CardDescription>
          </div>
          <Badge variant="outline">LMS</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Inscripciones LMS</p>
              <p className="text-2xl font-bold">{lmsSummary.totalEnrollments}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Activas</p>
              <p className="text-2xl font-bold">{lmsSummary.activeEnrollments}</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Finalización</p>
              <p className="text-2xl font-bold">{lmsSummary.completionRate}%</p>
            </div>
            <div className="rounded-lg border p-3">
              <p className="text-xs text-muted-foreground">Certificados</p>
              <p className="text-2xl font-bold">{lmsSummary.certificatesIssued}</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
              <a href="/campus-virtual">Abrir módulo Campus</a>
            </Button>
            <Button asChild variant="outline" size="sm">
              <a href="/campus/login" target="_blank" rel="noreferrer">
                Ir al Campus alumno
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Próximas Convocatorias */}
        <Card>
          <CardHeader>
            <CardTitle>Próximas Convocatorias</CardTitle>
            <CardDescription>Cursos programados en los próximos meses</CardDescription>
          </CardHeader>
          <CardContent>
            {convocations.length > 0 ? (
              <div className="space-y-4">
                {convocations.slice(0, 5).map((conv: Convocation) => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{conv.course_title}</p>
                      <p className="text-xs text-muted-foreground">{conv.campus_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(conv.start_date).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={getStatusBadge(conv.status)}>{conv.status}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {conv.enrolled}/{conv.capacity_max} plazas
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay convocatorias programadas
              </p>
            )}
          </CardContent>
        </Card>

        {/* Campañas Activas */}
        <Card>
          <CardHeader>
            <CardTitle>Campañas de Marketing</CardTitle>
            <CardDescription>Rendimiento de campañas publicitarias</CardDescription>
          </CardHeader>
          <CardContent>
            {campaigns.length > 0 ? (
              <div className="space-y-4">
                {campaigns.slice(0, 5).map((campaign: Campaign) => (
                  <div
                    key={campaign.id}
                    className="flex items-center justify-between border-b pb-2 last:border-0"
                  >
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">{campaign.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.leads_generated} leads • {campaign.conversion_rate}% conversión
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {campaign.cost_per_lead.toFixed(2)}€ por lead
                      </p>
                    </div>
                    <Badge variant={getCampaignStatusBadge(campaign.status)}>
                      {campaign.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay campañas configuradas
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Blocks Row 1: Activity Timeline + Activity Chart */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Actividad Reciente */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivities.length > 0 ? (
              <div className="space-y-3">
                {recentActivities.map((activity, idx) => (
                  <div key={idx} className="flex items-start gap-3 border-b pb-3 last:border-0 last:pb-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/10">
                      <Clock className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="text-sm font-medium leading-none">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.entity_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                          day: 'numeric',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay actividad reciente
              </p>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de Actividad Mensual */}
        <Card>
          <CardHeader>
            <CardTitle>Actividad Mensual</CardTitle>
            <CardDescription>Últimas 4 semanas</CardDescription>
          </CardHeader>
          <CardContent>
            {weeklyMetrics.leads.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={
                    [0, 1, 2, 3].map((i): WeeklyChartDataPoint => ({
                      semana: `Sem ${i + 1}`,
                      Leads: weeklyMetrics.leads[i] ?? 0,
                      Inscripciones: weeklyMetrics.enrollments[i] ?? 0,
                      Cursos: weeklyMetrics.courses_added[i] ?? 0,
                    }))
                  }
                  margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="semana" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="Leads" stroke="hsl(var(--primary))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Inscripciones" stroke="hsl(var(--chart-2))" strokeWidth={2} />
                  <Line type="monotone" dataKey="Cursos" stroke="hsl(var(--chart-3))" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay datos disponibles
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* New Blocks Row 2: Operational Alerts + Campus Distribution */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Alertas Operativas */}
        <Card>
          <CardHeader>
            <CardTitle>Alertas Operativas</CardTitle>
            <CardDescription>Requieren atención</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert, idx) => (
                  <div
                    key={idx}
                    className={`flex items-center gap-3 rounded-md border p-3 ${
                      alert.severity === 'warning'
                        ? 'border-orange-200 bg-orange-50 dark:border-orange-900 dark:bg-orange-950'
                        : 'border-blue-200 bg-blue-50 dark:border-blue-900 dark:bg-blue-950'
                    }`}
                  >
                    {alert.severity === 'warning' ? (
                      <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    ) : (
                      <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    )}
                    <div className="flex-1">
                      <p className="text-sm font-medium">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.count} {alert.count === 1 ? 'elemento' : 'elementos'}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-center py-8 text-center">
                <div className="space-y-2">
                  <div className="flex h-12 w-12 mx-auto items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-sm font-medium">Todo en orden</p>
                  <p className="text-xs text-muted-foreground">No hay alertas pendientes</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Distribución de Alumnos por Sede */}
        <Card>
          <CardHeader>
            <CardTitle>Alumnos por Sede</CardTitle>
            <CardDescription>Distribución actual</CardDescription>
          </CardHeader>
          <CardContent>
            {campusDistribution.length > 0 ? (
              <div className="space-y-3">
                {campusDistribution.map((campus, idx) => {
                  const maxStudents = Math.max(...campusDistribution.map(c => c.student_count))
                  const percentage = maxStudents > 0 ? (campus.student_count / maxStudents) * 100 : 0

                  return (
                    <div key={idx} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{campus.campus_name}</span>
                        <span className="text-muted-foreground">{campus.student_count} alumnos</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No hay datos de distribución
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
