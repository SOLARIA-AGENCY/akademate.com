'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
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
  CalendarClock,
  GraduationCap,
  Loader2,
  AlertTriangle,
  Info,
  UserRound,
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
import { ToggleGroup, ToggleGroupItem } from '@payload-config/components/ui/toggle-group'
import { KpiStatCard } from '@payload-config/components/akademate/dashboard/KpiStatCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@payload-config/components/ui/table'
import { Avatar, AvatarFallback } from '@payload-config/components/ui/avatar'
import { DirectoryNeutralBadge } from '@payload-config/components/directory/PremiumDirectoryShell'
import {
  DirectoryCampusIdentity,
  DirectoryStaffIcons,
  type DirectoryStaffRef,
} from '@payload-config/components/directory/PremiumDirectoryShell'
import { getPublicCampusImage } from '@/app/lib/public-campus-assets'
import { useDashboardMetrics } from '@payload-config/hooks/useDashboardMetrics'
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
  id: string | number
  title: string
  entity_name: string
  timestamp: string
  type?: string
  lead_id?: string | number | null
  lead_type?: string | null
  lead_source?: string | null
  lead_status?: string | null
  href?: string | null
}

interface OperationalAlert {
  severity: 'warning' | 'info'
  message: string
  count: number
}

interface CampusDistribution {
  campus_id?: string | number
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

function mapLeadDocToActivity(doc: Record<string, unknown>): RecentActivity {
  const id = doc.id == null ? `lead-${String(doc.email ?? '')}` : String(doc.id)
  const first = String(doc.first_name ?? doc.firstName ?? '').trim()
  const last = String(doc.last_name ?? doc.lastName ?? '').trim()
  const name = `${first} ${last}`.trim() || String(doc.email ?? 'Lead')
  return {
    id,
    type: 'lead',
    title: 'Nuevo lead registrado',
    entity_name: name,
    timestamp: String(doc.created_at ?? doc.createdAt ?? new Date().toISOString()),
    lead_id: doc.id == null ? null : String(doc.id),
    lead_type: typeof doc.lead_type === 'string'
      ? doc.lead_type
      : typeof doc.leadType === 'string'
        ? doc.leadType
        : null,
    lead_source: typeof doc.source === 'string' ? doc.source : null,
    lead_status: typeof doc.status === 'string' ? doc.status : 'new',
    href: doc.id == null ? null : `/leads/${String(doc.id)}`,
  }
}

// KPI item type for dashboard cards
interface KpiItem {
  title: string
  value: number
  icon: LucideIcon
  href?: string
}

// Weekly chart data point type
interface WeeklyChartDataPoint {
  semana: string
  Leads: number
  Inscripciones: number
  Cursos: number
}

type HomeRangeKey = '1d' | '7d' | '30d' | '6m'

const LEAD_STATUS_LABELS: Record<string, string> = {
  new: 'Pendiente de contactar',
  contacted: 'Contactado',
  following_up: 'En seguimiento',
  interested: 'Interesado',
  enrolling: 'En matriculación',
  enrolled: 'Matriculado',
  on_hold: 'En espera',
  not_interested: 'No interesado',
  discarded: 'Descartado',
  unreachable: 'No contactable',
}

const LEAD_STATUS_VARIANTS: Record<string, 'info' | 'success' | 'warning' | 'neutral' | 'destructive'> = {
  new: 'info',
  contacted: 'warning',
  following_up: 'warning',
  interested: 'success',
  enrolling: 'success',
  enrolled: 'success',
  on_hold: 'neutral',
  not_interested: 'destructive',
  discarded: 'destructive',
  unreachable: 'neutral',
}

function leadInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'L'
}

function rangeComparisonLabel(range: HomeRangeKey): string {
  switch (range) {
    case '1d':
      return 'vs. -1d'
    case '7d':
      return 'vs. -7d'
    case '30d':
      return 'vs. -30d'
    case '6m':
      return 'vs. -6m'
    default: {
      const exhaustive: never = range
      return exhaustive
    }
  }
}

function seriesDelta(
  series: number[],
): { delta: string; deltaTone: 'success' | 'danger' | 'neutral' } {
  if (series.length < 2) return { delta: 'sin cambio', deltaTone: 'neutral' }
  const current = series.at(-1) ?? 0
  const previous = series.at(-2) ?? 0
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) {
    return { delta: 'sin cambio', deltaTone: 'neutral' }
  }
  const pct = ((current - previous) / Math.abs(previous)) * 100
  const rounded = Math.round(pct * 10) / 10
  if (rounded === 0) return { delta: 'sin cambio', deltaTone: 'neutral' }
  const delta = `${rounded > 0 ? '+' : ''}${String(rounded).replace('.', ',')}%`
  const deltaTone: 'success' | 'danger' | 'neutral' =
    rounded > 0 ? 'success' : rounded < 0 ? 'danger' : 'neutral'
  return { delta, deltaTone }
}

export default function DashboardPage() {
  // Use the combined hook for initial fetch + real-time updates
  // Type assertion required as TypeScript cannot resolve types through path alias
  const router = useRouter()
  const { branding } = useTenantBranding()
  const tenantId = parseInt(branding.tenantId, 10)
  const hookResult: UseDashboardMetricsResult = useDashboardMetrics({
    tenantId: Number.isFinite(tenantId) && tenantId > 0 ? tenantId : undefined,
    enableRealtime: true,
  }) as UseDashboardMetricsResult
  const { data, loading, error, isConnected } = hookResult

  const [lmsSummary, setLmsSummary] = useState<LmsSummary>({
    totalEnrollments: 0,
    activeEnrollments: 0,
    completionRate: 0,
    certificatesIssued: 0,
  })
  const [range, setRange] = useState<HomeRangeKey>('7d')
  const [isClient, setIsClient] = useState(false)

  const [homeTeachers, setHomeTeachers] = useState<DirectoryStaffRef[]>([])
  const [homeCampuses, setHomeCampuses] = useState<
    Array<{ id: string; name: string; imageUrl: string | null }>
  >([])
  const [homeLeads, setHomeLeads] = useState<RecentActivity[]>([])
  const [directoryError, setDirectoryError] = useState<string | null>(null)
  const [cycleStats, setCycleStats] = useState<{
    gradoMedio: number
    gradoSuperior: number
    totalInscritos: number
    plazasDisponibles: number
    convAbiertas: number
    convPlanificadas: number
  }>({
    gradoMedio: 0,
    gradoSuperior: 0,
    totalInscritos: 0,
    plazasDisponibles: 0,
    convAbiertas: 0,
    convPlanificadas: 0,
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
      const activeStatuses = new Set(['active', 'pending', 'confirmed', 'enrolled', 'in_progress'])
      const activeEnrollments = enrollments.filter((item) =>
        activeStatuses.has(String(item.status ?? '').toLowerCase())
      ).length
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
      const [medioRes, superiorRes, openRes, plannedRes] = await Promise.all([
        fetch('/api/cycles?where[level][equals]=grado_medio&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/cycles?where[level][equals]=grado_superior&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/course-runs?where[status][equals]=enrollment_open&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
        fetch('/api/course-runs?where[status][equals]=published&limit=0', {
          credentials: 'include',
          cache: 'no-store',
        }),
      ])

      const medioData = medioRes.ok ? ((await medioRes.json()) as { totalDocs?: number }) : null
      const superiorData = superiorRes.ok
        ? ((await superiorRes.json()) as { totalDocs?: number })
        : null
      const openData = openRes.ok ? ((await openRes.json()) as { totalDocs?: number }) : null
      const plannedData = plannedRes.ok
        ? ((await plannedRes.json()) as { totalDocs?: number })
        : null

      setCycleStats({
        gradoMedio: medioData?.totalDocs ?? 0,
        gradoSuperior: superiorData?.totalDocs ?? 0,
        totalInscritos: 0,
        plazasDisponibles: 0,
        convAbiertas: openData?.totalDocs ?? 0,
        convPlanificadas: plannedData?.totalDocs ?? 0,
      })
    } catch {
      // Keep previous stats on transient errors
    }
  }

  async function refreshHomeShortcuts() {
    try {
      const [staffRes, campusRes, leadsRes] = await Promise.all([
        fetch('/api/staff?type=profesor&limit=12', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/campuses?limit=12', { credentials: 'include', cache: 'no-store' }),
        fetch('/api/leads?limit=50&sort=-createdAt', { credentials: 'include', cache: 'no-store' }),
      ])
      const failed = [
        !staffRes.ok ? 'profesores' : null,
        !campusRes.ok ? 'sedes' : null,
        !leadsRes.ok ? 'leads' : null,
      ].filter((item): item is string => Boolean(item))
      setDirectoryError(failed.length > 0 ? `No se pudo cargar ${failed.join(', ')}.` : null)
      if (staffRes.ok) {
        const payload = (await staffRes.json()) as {
          data?: Array<{
            id?: number | string
            fullName?: string
            firstName?: string
            lastName?: string
            photo?: string | null
          }>
        }
        setHomeTeachers(
          (payload.data ?? []).map((staff) => ({
            id: staff.id == null ? null : String(staff.id),
            name:
              staff.fullName?.trim() ||
              `${staff.firstName ?? ''} ${staff.lastName ?? ''}`.trim() ||
              'Docente',
            photo: staff.photo ?? null,
          })),
        )
      }
      if (campusRes.ok) {
        const payload = (await campusRes.json()) as {
          docs?: Array<{ id?: number | string; name?: string; slug?: string; image?: unknown }>
        }
        setHomeCampuses(
          (payload.docs ?? []).map((campus) => {
            const image =
              campus.image && typeof campus.image === 'object' && 'url' in campus.image
                ? String((campus.image as { url?: string }).url ?? '')
                : null
            return {
              id: String(campus.id ?? ''),
              name: campus.name ?? 'Sede',
              imageUrl: getPublicCampusImage(campus.slug ?? campus.id, image),
            }
          }),
        )
      }
      if (leadsRes.ok) {
        const payload = (await leadsRes.json()) as { docs?: Array<Record<string, unknown>> }
        setHomeLeads((payload.docs ?? []).map(mapLeadDocToActivity))
      } else {
        setHomeLeads([])
      }
    } catch {
      setDirectoryError('No se pudo cargar leads.')
      setHomeLeads([])
    }
  }

  useEffect(() => {
    setIsClient(true)
    void refreshCampusSummary()
    void refreshCycleStats()
    void refreshHomeShortcuts()
  }, [])

  const primaryKpis: KpiItem[] = [
    {
      title: 'Alumnos',
      value: metrics.active_students,
      icon: GraduationCap,
      href: '/dashboard/alumnos',
    },
    {
      title: 'Leads',
      value: metrics.leads_this_month,
      icon: FileText,
      href: '/leads',
    },
    {
      title: 'Matrículas',
      value: lmsSummary.totalEnrollments,
      icon: BookOpen,
      href: '/dashboard/alumnos',
    },
    {
      title: 'Convocatorias',
      value: metrics.active_convocations,
      icon: Calendar,
      href: '/programacion',
    },
  ]

  const visibleActivities = useMemo(() => {
    const byId = new Map<string, RecentActivity>()
    for (const activity of recentActivities) {
      byId.set(String(activity.id), activity)
    }
    for (const activity of homeLeads) {
      const key = String(activity.id)
      if (!byId.has(key)) byId.set(key, activity)
    }
    return Array.from(byId.values()).sort(
      (left, right) => new Date(right.timestamp).getTime() - new Date(left.timestamp).getTime(),
    )
  }, [homeLeads, recentActivities])

  const directoryBanner = [
    directoryError,
    error ? 'No se pudieron cargar las métricas del dashboard.' : null,
  ]
    .filter(Boolean)
    .join(' ')

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

  return (
    <div className="flex flex-col" data-oid="re7drx3">
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

      <div
        className="sticky top-0 z-20 isolate -mx-4 mt-0 border-y border-border/60 bg-[hsl(var(--dashboard-canvas))] px-4"
        data-testid="dashboard-home-range-bar"
      >
        <div className="flex h-12 items-center">
          <ToggleGroup
            type="single"
            value={range}
            onValueChange={(value) => {
              if (value) setRange(value as HomeRangeKey)
            }}
            variant="outline"
            size="sm"
            aria-label="Rango"
            data-testid="dashboard-home-filters"
            className="flex flex-wrap justify-start gap-1"
          >
            <ToggleGroupItem value="1d" className="px-3">
              1D
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="px-3">
              7D
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="px-3">
              30D
            </ToggleGroupItem>
            <ToggleGroupItem value="6m" className="px-3">
              6M
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>

      <div className="flex flex-col gap-6 pt-6">
      {directoryBanner ? (
        <div
          className="rounded-lg border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="status"
        >
          {directoryBanner}
        </div>
      ) : null}
      {/* KPIs operativos */}
      <div
        className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"
        data-oid="gtfb5.8"
      >
        {primaryKpis.map((kpi) => {
          const deltaProps =
            kpi.title === 'Leads'
              ? seriesDelta(weeklyMetrics.leads)
              : kpi.title === 'Alumnos' || kpi.title === 'Matrículas'
                ? seriesDelta(weeklyMetrics.enrollments)
                : seriesDelta([])
          return (
            <KpiStatCard
              key={kpi.title}
              label={kpi.title}
              value={kpi.value}
              icon={kpi.icon}
              href={kpi.href}
              comparisonLabel={rangeComparisonLabel(range)}
              {...deltaProps}
            />
          )
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Docentes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/profesores')}>
              Ver todos
            </Button>
          </CardHeader>
          <CardContent>
            {homeTeachers.length > 0 ? (
              <DirectoryStaffIcons staff={homeTeachers} />
            ) : (
              <p className="text-sm text-muted-foreground">Sin docentes cargados</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-base">Sedes</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => router.push('/dashboard/sedes')}>
              Ver todas
            </Button>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {homeCampuses.length > 0 ? (
              homeCampuses.map((campus) => (
                <DirectoryCampusIdentity
                  key={campus.id}
                  name={campus.name}
                  imageUrl={campus.imageUrl}
                  href={`/dashboard/sedes/${campus.id}`}
                />
              ))
            ) : (
              <p className="text-sm text-muted-foreground">Sin sedes cargadas</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ciclos Formativos KPIs */}
      <div
        className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full"
        data-oid="cycle-kpis"
      >
        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/dashboard/ciclos')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground">
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

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/dashboard/ciclos')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground">
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

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/matriculas')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-ti-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-ti-t">
              Total Inscritos Ciclos
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

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/dashboard/ciclos')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-pd-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-pd-t">
              Plazas Disponibles Ciclos
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

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/programacion')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-ca-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-ca-t">
              Conv. Abiertas
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-ca-i">
              <Calendar className="h-4 w-4 text-primary" data-oid="kpi-ca-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-ca-c">
            <div className="text-2xl font-bold" data-oid="kpi-ca-v">
              {cycleStats.convAbiertas}
            </div>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => router.push('/programacion')}>
          <CardHeader
            className="flex flex-row items-center justify-between space-y-0 p-4 pb-2"
            data-oid="kpi-cp-h"
          >
            <CardTitle className="text-sm font-medium text-muted-foreground" data-oid="kpi-cp-t">
              Conv. Planificadas
            </CardTitle>
            <div className="rounded-full bg-primary/10 p-1.5" data-oid="kpi-cp-i">
              <CalendarClock className="h-4 w-4 text-primary" data-oid="kpi-cp-ic" />
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-1" data-oid="kpi-cp-c">
            <div className="text-2xl font-bold" data-oid="kpi-cp-v">
              {cycleStats.convPlanificadas}
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
        <Card className="min-w-0 overflow-hidden" data-oid="gyr4u6s">
          <CardHeader data-oid="_1yx95t">
            <CardTitle data-oid="yy10ure">Actividad Reciente</CardTitle>
            <CardDescription data-oid="fb_-r1-">Últimos eventos del sistema</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0 p-0" data-oid="ds2gh4z">
            {visibleActivities.length > 0 ? (
              <div className="w-full min-w-0 overflow-x-auto" data-oid="4dur1yy">
                <Table className="min-w-[720px] table-fixed">
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[24%]">Persona</TableHead>
                      <TableHead className="w-[17%]">Acción</TableHead>
                      <TableHead className="w-[14%]">Lead</TableHead>
                      <TableHead className="w-[18%]">Fecha de inscripción</TableHead>
                      <TableHead className="w-[12%]">Origen</TableHead>
                      <TableHead className="w-[15%]">Estado</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleActivities.map((activity) => {
                      const name = activity.entity_name || 'Lead'
                      const status = activity.lead_status ?? ''
                      const isLead = activity.type === 'lead' || Boolean(activity.lead_id)
                      const rowClass = activity.href
                        ? 'cursor-pointer hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary'
                        : ''
                      return (
                        <TableRow
                          key={`${activity.type ?? 'activity'}-${activity.id}`}
                          className={rowClass}
                          tabIndex={activity.href ? 0 : undefined}
                          onClick={activity.href ? () => router.push(activity.href!) : undefined}
                          onKeyDown={activity.href ? (event) => {
                            if (event.key === 'Enter' || event.key === ' ') {
                              event.preventDefault()
                              router.push(activity.href!)
                            }
                          } : undefined}
                        >
                          <TableCell className="max-w-0">
                            <div className="flex min-w-0 items-center gap-2">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {isLead ? <UserRound className="h-4 w-4" aria-hidden="true" /> : leadInitials(name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="truncate text-xs font-medium" title={name}>{name}</span>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-0 truncate text-xs" title={activity.title}>
                            {activity.title}
                          </TableCell>
                          <TableCell>
                            {isLead ? (
                              <DirectoryNeutralBadge className="max-w-full truncate text-[10px]">
                                {activity.lead_type || 'Orgánico'}
                              </DirectoryNeutralBadge>
                            ) : '—'}
                          </TableCell>
                          <TableCell className="whitespace-nowrap text-xs text-muted-foreground">
                            {new Date(activity.timestamp).toLocaleDateString('es-ES', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="truncate text-xs text-muted-foreground">
                            {isLead ? activity.lead_source || 'Orgánico' : '—'}
                          </TableCell>
                          <TableCell>
                            {isLead ? (
                              <Badge variant={LEAD_STATUS_VARIANTS[status] ?? 'neutral'} className="max-w-full truncate text-[10px]">
                                {LEAD_STATUS_LABELS[status] ?? status ?? 'Pendiente de contactar'}
                              </Badge>
                            ) : '—'}
                          </TableCell>
                        </TableRow>
                      )
                    })}
                  </TableBody>
                </Table>
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
            {isClient && weeklyMetrics.leads.length > 0 ? (
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
    </div>
  )
}
