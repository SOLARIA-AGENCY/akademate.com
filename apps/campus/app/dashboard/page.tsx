'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  CampusApiError,
  type CampusDashboard,
  fetchCampusDashboard,
} from '../../lib/campus-client'
import { AuthGuard, useSession } from '../../lib/session-context'

export default function DashboardPage() {
  const { user, logout, refreshSession } = useSession()
  const [dashboard, setDashboard] = useState<CampusDashboard | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? ''

  useEffect(() => {
    let active = true
    setDashboard(null)
    setIsLoading(true)
    setError(null)
    fetchCampusDashboard(apiBaseUrl).then((result) => {
      if (!active) return
      setDashboard(result)
      setIsLoading(false)
    }).catch((cause) => {
      if (!active) return
      setDashboard(null)
      setIsLoading(false)
      if (cause instanceof CampusApiError && cause.status === 401) void refreshSession()
      else setError(cause instanceof Error ? cause.message : 'No se pudo cargar el dashboard.')
    })
    return () => { active = false }
  }, [apiBaseUrl, refreshSession])

  const displayName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Alumno'
  const averageProgress = dashboard?.enrollments.length
    ? Math.round(dashboard.enrollments.reduce((sum, item) => sum + item.progressPercent, 0) / dashboard.enrollments.length)
    : 0

  return (
    <AuthGuard>
      <main className="space-y-6" data-testid="dashboard">
        <section className="rounded-2xl border border-border bg-card/70 p-6 shadow-xl shadow-black/30">
          <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Panel del alumno</p>
          <div className="mt-2 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-semibold">Bienvenido, <span data-testid="user-name">{displayName}</span></h1>
              <p className="mt-2 text-sm text-muted-foreground">Tus cursos, progreso y próximos pasos.</p>
            </div>
            <div className="text-left md:text-right">
              <div className="text-xs uppercase tracking-[0.15em] text-muted-foreground">Progreso medio</div>
              <div className="text-3xl font-semibold" data-testid="completion-rate">{averageProgress}%</div>
            </div>
          </div>
        </section>

        <nav className="grid gap-2 rounded-2xl border border-border bg-card/60 p-4 sm:grid-cols-3" aria-label="Campus">
          <Link className="rounded-lg border border-primary/50 px-4 py-2 text-sm" href="/dashboard">Dashboard</Link>
          <Link className="rounded-lg border border-border/60 px-4 py-2 text-sm" href="/progress">Progreso</Link>
          <Link className="rounded-lg border border-border/60 px-4 py-2 text-sm" href="/certificates">Certificados</Link>
        </nav>

        <section className="rounded-2xl border border-border bg-card/60 p-6" aria-busy={isLoading}>
          <h2 className="text-xl font-semibold">Cursos activos</h2>
          {isLoading && <p className="mt-4 text-sm text-muted-foreground" role="status">Cargando cursos…</p>}
          {error && <p className="mt-4 text-sm text-red-400" role="alert">{error}</p>}
          {!isLoading && !error && dashboard?.enrollments.length === 0 && (
            <p className="mt-4 text-sm text-muted-foreground">Todavía no tienes cursos activos.</p>
          )}
          {dashboard && dashboard.enrollments.length > 0 && (
            <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3" data-testid="courses-grid">
              {dashboard.enrollments.map((course) => (
                <article key={course.id} className="rounded-xl border border-border/60 bg-background/40 p-4" data-testid="course-card">
                  <div className="text-sm font-semibold">{course.courseTitle || course.courseRunTitle}</div>
                  <div className="mt-1 text-xs text-muted-foreground">{course.completedModules}/{course.totalModules} módulos</div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted" aria-label={`${course.progressPercent}% completado`}>
                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, course.progressPercent))}%` }} />
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <div className="flex items-center justify-between rounded-2xl border border-border bg-card/60 p-4">
          <div>
            <div className="text-sm font-semibold">{user?.email}</div>
            <div className="text-xs text-muted-foreground">Sesión protegida del campus</div>
          </div>
          <button className="rounded-lg border border-border/60 px-4 py-2 text-xs" type="button" onClick={() => void logout()}>
            Cerrar sesión
          </button>
        </div>
      </main>
    </AuthGuard>
  )
}
