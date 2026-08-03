'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
  MetricCard,
  PageHeader,
  Skeleton,
} from '@akademate/ui'
import {
  ArrowRight,
  BookOpen,
  Building2,
  CalendarDays,
  CircleAlert,
  ClipboardCheck,
  GraduationCap,
  RefreshCcw,
  Users,
  WalletCards,
} from 'lucide-react'

import type { NextDashboard } from '@/src/lib/dashboard/next-dashboard-command'

const statusLabels: Record<NextDashboard['upcomingRuns'][number]['status'], string> = {
  published: 'Publicada',
  enrollment_open: 'Inscripción abierta',
  enrollment_closed: 'Inscripción cerrada',
  in_progress: 'En curso',
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

function LoadingDashboard() {
  return (
    <div className="space-y-6" aria-label="Cargando dashboard">
      <PageHeader
        eyebrow="Centro de operaciones"
        title="Dashboard"
        description="La actividad diaria de tu academia, ordenada por prioridad."
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-28 rounded-xl" />)}
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(320px,0.65fr)]">
        <Skeleton className="h-80 rounded-xl" />
        <Skeleton className="h-80 rounded-xl" />
      </div>
    </div>
  )
}

export default function DashboardHome() {
  const [dashboard, setDashboard] = useState<NextDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [reloadKey, setReloadKey] = useState(0)

  const reload = useCallback(() => {
    setError(false)
    setLoading(true)
    setReloadKey((current) => current + 1)
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const load = async () => {
      setLoading(true)
      setError(false)
      try {
        const response = await fetch('/api/next/dashboard', {
          credentials: 'include',
          cache: 'no-store',
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('dashboard_unavailable')
        const result = await response.json() as NextDashboard
        if (controller.signal.aborted) return
        setDashboard(result)
      } catch {
        if (controller.signal.aborted) return
        setDashboard(null)
        setError(true)
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }
    void load()
    return () => controller.abort()
  }, [reloadKey])

  if (loading) return <LoadingDashboard />

  if (error || !dashboard) {
    return (
      <div className="space-y-6">
        <PageHeader
          eyebrow="Centro de operaciones"
          title="Dashboard"
          description="La actividad diaria de tu academia, ordenada por prioridad."
        />
        <Alert variant="warning" className="max-w-2xl" aria-live="polite">
          <AlertTitle>No pudimos cargar la operativa</AlertTitle>
          <AlertDescription>
            Conservamos la pantalla en estado seguro. Reintenta para recuperar los datos actuales de la academia.
          </AlertDescription>
          <Button type="button" variant="outline" className="mt-4" onClick={reload}>
            <RefreshCcw className="size-4" aria-hidden="true" />
            Reintentar
          </Button>
        </Alert>
      </div>
    )
  }

  const metrics = dashboard.metrics
  const attentionTotal = dashboard.attention.pendingReview
    + dashboard.attention.waitlisted
    + dashboard.attention.paymentReview

  return (
    <div className="space-y-7">
      <PageHeader
        eyebrow="Centro de operaciones"
        title="Dashboard"
        description="Personas, programación y solicitudes en una vista preparada para actuar."
        actions={(
          <Button asChild>
            <Link href="/dashboard/cursos/convocatorias">
              Nueva convocatoria
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        )}
      />

      <section aria-labelledby="dashboard-summary-title" className="space-y-3">
        <div className="flex items-center justify-between gap-4">
          <h2 id="dashboard-summary-title" className="text-sm font-semibold">Academia hoy</h2>
          <p className="text-xs text-muted-foreground">Actualizado {new Date(dashboard.generatedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}</p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Alumnos activos" value={metrics.activeStudents} hint={`${metrics.confirmedEnrollments} matrículas confirmadas`} icon={<GraduationCap className="size-5" />} />
          <MetricCard label="Convocatorias activas" value={metrics.activeCourseRuns} hint={`${metrics.courses} cursos en catálogo`} icon={<CalendarDays className="size-5" />} />
          <MetricCard label="Solicitudes pendientes" value={metrics.pendingRequests} hint="Admisión e inscripción" icon={<ClipboardCheck className="size-5" />} />
          <MetricCard label="Equipo docente" value={metrics.activeTeachers} hint={`${metrics.campuses} sedes operativas`} icon={<Users className="size-5" />} />
        </div>
      </section>

      <section aria-labelledby="dashboard-attention-title" className="rounded-2xl border border-border bg-muted/30 p-4 sm:p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium text-primary">Prioridades</p>
            <h2 id="dashboard-attention-title" className="text-lg font-semibold">Atención operativa</h2>
          </div>
          <Badge variant={attentionTotal > 0 ? 'default' : 'outline'}>{attentionTotal} acciones</Badge>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <Link href="/dashboard/cursos/solicitudes" className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Solicitudes por revisar</span><ClipboardCheck className="size-4 text-primary" /></div>
            <p className="mt-3 text-2xl font-semibold">{dashboard.attention.pendingReview}</p>
          </Link>
          <Link href="/matriculas" className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Lista de espera</span><Users className="size-4 text-primary" /></div>
            <p className="mt-3 text-2xl font-semibold">{dashboard.attention.waitlisted}</p>
          </Link>
          <Link href="/finanzas/cobros-pagos" className="rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <div className="flex items-center justify-between gap-3"><span className="text-sm font-medium">Pagos por conciliar</span><WalletCards className="size-4 text-primary" /></div>
            <p className="mt-3 text-2xl font-semibold">{dashboard.attention.paymentReview}</p>
          </Link>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <Card>
          <CardHeader className="flex-row items-start justify-between gap-4 space-y-0">
            <div>
              <CardTitle>Próximas convocatorias</CardTitle>
              <CardDescription>Programación activa y plazas disponibles.</CardDescription>
            </div>
            <Button asChild variant="outline" size="sm"><Link href="/dashboard/cursos/convocatorias">Ver todas</Link></Button>
          </CardHeader>
          <CardContent>
            {dashboard.upcomingRuns.length === 0 ? (
              <EmptyState title="No hay próximas convocatorias" description="Publica una convocatoria para empezar a recibir solicitudes e inscripciones." icon={<CalendarDays className="size-5" />} />
            ) : (
              <div className="divide-y divide-border">
                {dashboard.upcomingRuns.map((run) => (
                  <div key={run.id} className="flex flex-col gap-3 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{run.courseName}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{run.code} · {formatDate(run.startsAt)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">{statusLabels[run.status]}</Badge>
                      <span className="text-xs text-muted-foreground">{run.availablePlaces === null ? 'Capacidad abierta' : `${run.availablePlaces} plazas`}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad reciente</CardTitle>
            <CardDescription>Últimos movimientos de admisión.</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard.recentActivity.length === 0 ? (
              <EmptyState title="La actividad aparecerá aquí" description="Las nuevas solicitudes se mostrarán cuando lleguen desde tus páginas públicas." icon={<CircleAlert className="size-5" />} />
            ) : (
              <div className="space-y-4">
                {dashboard.recentActivity.map((activity) => (
                  <Link key={activity.id} href={activity.href} className="group flex items-start gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                    <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary"><BookOpen className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium group-hover:text-primary">{activity.title}</span>
                      <span className="mt-0.5 block truncate text-xs text-muted-foreground">{activity.detail} · {formatDate(activity.occurredAt)}</span>
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <section aria-label="Accesos rápidos" className="grid gap-3 sm:grid-cols-3">
        <Button asChild variant="outline" className="justify-start"><Link href="/dashboard/cursos"><BookOpen className="size-4" />Gestionar cursos</Link></Button>
        <Button asChild variant="outline" className="justify-start"><Link href="/dashboard/alumnos"><GraduationCap className="size-4" />Ver alumnos</Link></Button>
        <Button asChild variant="outline" className="justify-start"><Link href="/dashboard/sedes"><Building2 className="size-4" />Gestionar sedes</Link></Button>
      </section>
    </div>
  )
}
