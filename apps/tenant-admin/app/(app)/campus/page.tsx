'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { RequireAuth, useSession } from './providers/SessionProvider'
import { Card, CardContent, CardHeader, CardTitle } from '@payload-config/components/ui/card'
import { Progress } from '@payload-config/components/ui/progress'
import { Badge } from '@payload-config/components/ui/badge'
import { Button } from '@payload-config/components/ui/button'
import { Skeleton } from '@payload-config/components/ui/skeleton'
import { EntityThumb } from '@payload-config/components/ui/entity-thumb'
import {
  continueEnrollments,
  dueBadgeLabel,
  greetingSubtitle,
  overallProgressPercent,
  type CampusDashboardPayload,
  type EnrollmentCard,
  type UpcomingKind,
} from './lib/dashboard'
import { ProgressRadialCard } from './components/ProgressRadialCard'

function upcomingKindLabel(kind: UpcomingKind): string {
  switch (kind) {
    case 'session':
      return 'Sesión'
    case 'assignment':
      return 'Entrega'
    case 'tutoring':
      return 'Tutoría'
    default: {
      const exhaustive: never = kind
      return exhaustive
    }
  }
}

function formatWhen(iso: string): string {
  const date = new Date(iso)
  if (Number.isNaN(date.getTime())) return ''
  const now = new Date()
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  const time = date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
  if (sameDay) return `Hoy ${time}`
  return `${date.toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })} · ${time}`
}

function continueLabel(enrollment: EnrollmentCard): string {
  if (enrollment.progressPercent <= 0) return 'Comenzar'
  return 'Continuar'
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Skeleton className="h-48 lg:col-span-6" />
        <Skeleton className="h-48 lg:col-span-3" />
        <Skeleton className="h-48 lg:col-span-3" />
      </div>
    </div>
  )
}

function CampusDashboard() {
  const { student } = useSession()
  const [payload, setPayload] = useState<CampusDashboardPayload | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!student) return

    const loadDashboard = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/campus/dashboard', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('campus_token')}`,
          },
        })
        if (!response.ok) return
        const data = (await response.json()) as CampusDashboardPayload
        setPayload({
          enrollments: data.enrollments ?? [],
          stats: data.stats ?? null,
          liveClass: data.liveClass ?? null,
          upcoming: data.upcoming ?? [],
          attendanceRate: data.attendanceRate ?? null,
          badges: data.badges ?? [],
          weeklyActivity: data.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0],
        })
      } catch (error) {
        console.error('[Campus] Failed to load dashboard:', error)
      } finally {
        setLoading(false)
      }
    }

    void loadDashboard()
  }, [student])

  if (loading) return <DashboardSkeleton />

  const enrollments = payload?.enrollments ?? []
  const stats = payload?.stats
  const liveClass = payload?.liveClass ?? null
  const upcoming = payload?.upcoming ?? []
  const continuing = continueEnrollments(enrollments)
  const pendingAssignments = upcoming.filter((item) => item.kind === 'assignment').length
  const liveCount = liveClass ? 1 : 0
  const week = payload?.weeklyActivity ?? [0, 0, 0, 0, 0, 0, 0]
  const weekLabels = ['L', 'M', 'X', 'J', 'V', 'S', 'D']

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-slate-900">
          ¡Hola de nuevo, {student?.firstName}!
        </h1>
        <p className="text-slate-500">{greetingSubtitle(liveCount, pendingAssignments)}</p>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
        <Card className="bg-primary/10 lg:col-span-6">
          <CardContent className="flex h-full flex-col justify-between gap-4 p-5">
            {liveClass ? (
              <>
                <Badge variant="secondary">Clase en directo</Badge>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">{liveClass.title}</h2>
                  <p className="text-sm text-slate-500">
                    {[liveClass.teacherName, formatWhen(liveClass.startsAt), liveClass.place]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </div>
                <Button asChild>
                  <Link href={liveClass.joinUrl ?? liveClass.lessonHref}>Entrar al aula virtual</Link>
                </Button>
              </>
            ) : (
              <>
                <Badge variant="secondary">Próxima clase</Badge>
                <div className="space-y-1">
                  <h2 className="text-xl font-semibold text-slate-900">No hay clase en directo hoy</h2>
                  <p className="text-sm text-slate-500">
                    Cuando tengas una sesión en curso, el acceso al aula aparecerá aquí.
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <div className="flex flex-col gap-5 lg:col-span-3">
          <ProgressRadialCard percent={overallProgressPercent(enrollments)} />
          <Card>
            <CardContent className="space-y-3 p-5">
              <p className="text-sm text-slate-500">Racha de estudio</p>
              <p className="text-2xl font-semibold text-slate-900">
                {stats?.currentStreak ?? 0} días
              </p>
              <div className="flex items-end gap-1">
                {week.map((value, index) => (
                  <div key={weekLabels[index]} className="flex flex-1 flex-col items-center gap-1">
                    <div
                      className={`w-full rounded-sm ${value > 0 ? 'bg-primary' : 'bg-muted'}`}
                      style={{ height: value > 0 ? 20 : 8 }}
                    />
                    <span className="text-[10px] text-slate-500">{weekLabels[index]}</span>
                  </div>
                ))}
              </div>
              {payload?.attendanceRate != null ? (
                <p className="text-xs text-slate-500">{payload.attendanceRate}% asistencia</p>
              ) : null}
            </CardContent>
          </Card>
        </div>

        <Card className="lg:col-span-3">
          <CardHeader className="p-5 pb-2">
            <CardTitle className="text-base">Próximas sesiones y entregas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-5 pt-0">
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">Sin sesiones próximas.</p>
            ) : (
              upcoming.map((item) => {
                const due =
                  item.kind === 'assignment' ? dueBadgeLabel(item.dueAt ?? item.at) : null
                return (
                  <div key={`${item.kind}-${item.at}-${item.title}`} className="space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-slate-900">{item.title}</p>
                      {due ? <Badge variant="warning">{due}</Badge> : null}
                    </div>
                    <p className="text-xs text-slate-500">
                      {upcomingKindLabel(item.kind)} · {formatWhen(item.at)}
                      {item.place ? ` · ${item.place}` : ''}
                    </p>
                  </div>
                )
              })
            )}
          </CardContent>
        </Card>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold text-slate-900">Continuar estudiando</h2>
        {continuing.length === 0 ? (
          <Card>
            <CardContent className="space-y-3 p-6">
              <h3 className="text-lg font-medium">Sin cursos activos</h3>
              <p className="text-sm text-slate-500">Aún no estás matriculado en ningún curso.</p>
              <Button asChild>
                <Link href="/campus/cursos">Explorar cursos</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {continuing.map((enrollment) => (
              <Card key={enrollment.id}>
                <CardContent className="space-y-4 p-5">
                  <div className="flex items-start gap-3">
                    <EntityThumb
                      src={enrollment.courseThumbnail}
                      alt={enrollment.courseTitle}
                      fallback="book"
                      size="md"
                    />
                    <div className="min-w-0 space-y-2">
                      {enrollment.courseRunTitle ? (
                        <Badge variant="secondary">{enrollment.courseRunTitle}</Badge>
                      ) : null}
                      <h3 className="font-medium text-slate-900">{enrollment.courseTitle}</h3>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Progreso</span>
                      <span>{enrollment.progressPercent}%</span>
                    </div>
                    <Progress value={enrollment.progressPercent} className="h-2" />
                  </div>
                  <Link
                    href={
                      enrollment.lastLessonId
                        ? `/campus/cursos/${enrollment.id}/leccion/${enrollment.lastLessonId}`
                        : `/campus/cursos/${enrollment.id}`
                    }
                    className="text-sm font-medium text-primary"
                  >
                    {continueLabel(enrollment)}
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-slate-900">Logros y certificaciones recientes</h2>
          <Link href="/campus/logros" className="text-sm text-primary">
            Ver logros
          </Link>
        </div>
        {payload?.badges && payload.badges.length > 0 ? (
          <div className="flex flex-wrap gap-3">
            {payload.badges.map((badge) => (
              <Badge key={badge.id} variant="secondary">
                {badge.name}
              </Badge>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-5">
              <p className="text-sm text-slate-500">Aún no hay logros recientes.</p>
            </CardContent>
          </Card>
        )}
      </section>
    </div>
  )
}

export default function CampusPage() {
  return (
    <RequireAuth>
      <CampusDashboard />
    </RequireAuth>
  )
}
