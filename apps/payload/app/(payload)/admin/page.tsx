'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'

type SessionUser = {
  email?: string
  name?: string
  tenantId?: Array<{ id: number; name: string; slug: string }>
}

export default function PayloadStyledDashboardPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [user, setUser] = useState<SessionUser | null>(null)

  useEffect(() => {
    let active = true

    const loadSession = async () => {
      try {
        const response = await fetch('/api/users/me', { credentials: 'include' })
        if (!response.ok) {
          window.location.assign('/admin/login')
          return
        }

        const data = await response.json()
        if (!data?.user) {
          window.location.assign('/admin/login')
          return
        }

        if (!active) return
        setUser(data.user)
      } catch {
        window.location.assign('/admin/login')
      } finally {
        if (active) setIsLoading(false)
      }
    }

    void loadSession()
    return () => { active = false }
  }, [])

  const tenant = useMemo(() => user?.tenantId?.[0], [user])

  if (isLoading) {
    return (
      <main className="ak-admin-page">
        <section className="ak-admin-shell">
          <p className="ak-admin-muted">Loading dashboard...</p>
        </section>
      </main>
    )
  }

  return (
    <main className="ak-admin-page">
      <section className="ak-admin-shell">
        <header className="ak-admin-header">
          <div>
            <p className="ak-admin-kicker">Tenant Dashboard</p>
            <h1>Akademate CMS</h1>
            <p className="ak-admin-muted">
              {tenant ? `Tenant: ${tenant.name}` : 'Tenant not detected'}
            </p>
          </div>
          <div className="ak-admin-user">
            <strong>{user?.name ?? 'Admin'}</strong>
            <span>{user?.email ?? 'Unknown user'}</span>
          </div>
        </header>

        <section className="ak-admin-grid" data-testid="payload-dashboard-grid">
          <Link className="ak-admin-card" href="/admin/collections/courses">
            <h2>Cursos</h2>
            <p>Gestión de catálogo, módulos y contenidos formativos.</p>
          </Link>

          <Link className="ak-admin-card" href="/admin/collections/users">
            <h2>Usuarios</h2>
            <p>Administración de alumnos, profesores y perfiles de acceso.</p>
          </Link>

          <Link className="ak-admin-card" href="/admin/collections/enrollments">
            <h2>Inscripciones</h2>
            <p>Seguimiento del flujo de matrícula y estados por alumno.</p>
          </Link>

          <Link className="ak-admin-card" href="/admin/collections/grades">
            <h2>Evaluación</h2>
            <p>Notas, progreso y trazabilidad académica por curso.</p>
          </Link>
        </section>
      </section>
    </main>
  )
}
