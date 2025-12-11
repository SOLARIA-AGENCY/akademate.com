'use client'

import { useState, useEffect } from 'react'
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
  TrendingUp,
  DollarSign,
  Calendar,
  GraduationCap,
  Building2,
  PieChart,
  Loader2,
  AlertTriangle,
  Info,
  Clock,
} from 'lucide-react'
import { Badge } from '@payload-config/components/ui/badge'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface DashboardMetrics {
  total_courses: number
  active_courses: number
  active_students: number
  total_students: number
  leads_this_month: number
  total_leads: number
  conversion_rate: number
  total_revenue: number
  active_convocations: number
  total_convocations: number
  total_teachers: number
  total_staff: number
  total_campuses: number
  classroom_utilization: number
}

interface Convocation {
  id: number
  codigo: string
  course_title: string
  campus_name: string
  start_date: string
  end_date: string
  status: string
  enrolled: number
  capacity_max: number
}

interface Campaign {
  id: number
  name: string
  leads_generated: number
  conversion_rate: number
  cost_per_lead: number
  status: string
}

interface Activity {
  type: 'lead' | 'enrollment' | 'convocation'
  title: string
  entity_name: string
  timestamp: string
}

interface Alert {
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

export default function DashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_courses: 0,
    active_courses: 0,
    active_students: 0,
    total_students: 0,
    leads_this_month: 0,
    total_leads: 0,
    conversion_rate: 0,
    total_revenue: 0,
    active_convocations: 0,
    total_convocations: 0,
    total_teachers: 0,
    total_staff: 0,
    total_campuses: 0,
    classroom_utilization: 0,
  })
  const [convocations, setConvocations] = useState<Convocation[]>([])
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [recentActivities, setRecentActivities] = useState<Activity[]>([])
  const [weeklyMetrics, setWeeklyMetrics] = useState<WeeklyMetrics>({ leads: [], enrollments: [], courses_added: [] })
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [campusDistribution, setCampusDistribution] = useState<CampusDistribution[]>([])

  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true)
        const response = await fetch('/api/dashboard')
        if (!response.ok) throw new Error('Failed to load dashboard data')

        const result = await response.json()
        if (result.success) {
          setMetrics(result.data.metrics)
          setConvocations(result.data.upcoming_convocations || [])
          setCampaigns(result.data.campaigns || [])
          setRecentActivities(result.data.recent_activities || [])
          setWeeklyMetrics(result.data.weekly_metrics || { leads: [], enrollments: [], courses_added: [] })
          setAlerts(result.data.alerts || [])
          setCampusDistribution(result.data.campus_distribution || [])
          setError(null)
        } else {
          throw new Error(result.error || 'Error loading dashboard')
        }
      } catch (err) {
        console.error('Error loading dashboard:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  // Format current date in Spanish
  const formattedDate = new Intl.DateTimeFormat('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date())

  // Primera línea de KPIs
  const primaryKpis = [
    {
      title: 'Cursos',
      value: metrics.total_courses,
      icon: BookOpen,
      color: 'text-blue-600 dark:text-blue-400',
      bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    },
    {
      title: 'Alumnos',
      value: metrics.active_students,
      icon: GraduationCap,
      color: 'text-green-600 dark:text-green-400',
      bgColor: 'bg-green-100 dark:bg-green-900/30',
    },
    {
      title: 'Leads este Mes',
      value: metrics.leads_this_month,
      icon: FileText,
      color: 'text-orange-600 dark:text-orange-400',
      bgColor: 'bg-orange-100 dark:bg-orange-900/30',
    },
  ]

  // Segunda línea de KPIs
  const secondaryKpis = [
    {
      title: 'Profesores',
      value: metrics.total_teachers,
      icon: Users,
      color: 'text-cyan-600 dark:text-cyan-400',
      bgColor: 'bg-cyan-100 dark:bg-cyan-900/30',
    },
    {
      title: 'Sedes',
      value: metrics.total_campuses,
      icon: Building2,
      color: 'text-indigo-600 dark:text-indigo-400',
      bgColor: 'bg-indigo-100 dark:bg-indigo-900/30',
    },
    {
      title: 'Convocatorias',
      value: metrics.active_convocations,
      icon: Calendar,
      color: 'text-pink-600 dark:text-pink-400',
      bgColor: 'bg-pink-100 dark:bg-pink-900/30',
    },
  ]

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      abierta: 'default',
      planificada: 'secondary',
      lista_espera: 'outline',
      cerrada: 'destructive',
    }
    return variants[status] || 'default'
  }

  const getCampaignStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      activa: 'default',
      pausada: 'secondary',
      finalizada: 'destructive',
    }
    return variants[status] || 'default'
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
            <p className="text-sm text-muted-foreground">{error}</p>
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
    <div className="w-full">
      {/* Header con saludo y fecha - STICKY pegado al header superior */}
      <div className="sticky top-0 z-20 bg-background px-4 md:px-6 py-4 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-muted-foreground mb-1">Hola, ADMIN USER</p>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Vista general de la operativa de CEP Comunicación
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
          </div>
        </div>
      </div>

      {/* Contenido scrolleable con padding */}
      <div className="p-4 md:p-6 space-y-6">
      {/* Primera línea de KPIs */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
        {primaryKpis.map((kpi) => {
          const Icon = kpi.icon
          return (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-base font-semibold">{kpi.title}</CardTitle>
                <div className={`${kpi.bgColor} rounded-full p-2`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
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
                <div className={`${kpi.bgColor} rounded-full p-2`}>
                  <Icon className={`h-4 w-4 ${kpi.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          )
        })}
      </div>

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
                  data={[
                    { semana: 'Sem 1', Leads: weeklyMetrics.leads[0], Inscripciones: weeklyMetrics.enrollments[0], Cursos: weeklyMetrics.courses_added[0] },
                    { semana: 'Sem 2', Leads: weeklyMetrics.leads[1], Inscripciones: weeklyMetrics.enrollments[1], Cursos: weeklyMetrics.courses_added[1] },
                    { semana: 'Sem 3', Leads: weeklyMetrics.leads[2], Inscripciones: weeklyMetrics.enrollments[2], Cursos: weeklyMetrics.courses_added[2] },
                    { semana: 'Sem 4', Leads: weeklyMetrics.leads[3], Inscripciones: weeklyMetrics.enrollments[3], Cursos: weeklyMetrics.courses_added[3] },
                  ]}
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
      </div>{/* Cierre del contenido scrolleable */}
    </div>
  )
}
