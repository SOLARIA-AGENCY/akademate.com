'use client'

import { useMemo, useState, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Users,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  DollarSign,
  BarChart3,
  UserPlus,
  UserMinus,
  RefreshCw,
  Shield,
  Ticket,
  Wifi,
  Receipt,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MetricsBarChart, type MetricDataPoint } from '@/components/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/ui/kpi-card'
import { Progress } from '@/components/ui/progress'
import {
  DataTable,
  DataTableHeader,
  DataTableBody,
  DataTableRow,
  DataTableHead,
  DataTableCell,
  DataTableEmpty,
} from '@/components/ui/data-table'
import { useTenants, useMrr, useChurn, useGrowth, useServiceHealth } from '@/hooks/use-ops-data'
import { Skeleton } from '@/components/ui/skeleton'

const planStyles: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  professional: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent text-accent-foreground',
}

function formatEur(n: number): string {
  if (n >= 1_000_000) return `€${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `€${(n / 1_000).toFixed(1)}K`
  return `€${n.toLocaleString('es-ES')}`
}

function formatPct(n: number | null): string {
  if (n === null) return '—'
  return `${n > 0 ? '+' : ''}${n}%`
}

// Clickable KPI wrapper with hover styles
function KPILink({
  href,
  children,
}: {
  href: string
  children: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl transition-all hover:scale-[1.02] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary/50"
    >
      {children}
    </Link>
  )
}

export default function DashboardPage() {
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants()
  const { data: mrr, isLoading: mrrLoading } = useMrr()
  const { data: churn, isLoading: churnLoading } = useChurn()
  const { data: growth, isLoading: growthLoading } = useGrowth()
  const { data: health, isLoading: healthLoading } = useServiceHealth()

  const tenants = tenantsData?.docs ?? []
  const kpiLoading = mrrLoading || churnLoading || growthLoading || healthLoading

  const [weeklyActivity, setWeeklyActivity] = useState<{ days: string[]; total: number[] }>({
    days: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'],
    total: [0, 0, 0, 0, 0, 0, 0],
  })
  const [readinessScore, setReadinessScore] = useState<number | null>(null)

  useEffect(() => {
    fetch('/api/ops/weekly-activity')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setWeeklyActivity(data) })
      .catch(() => {})

    fetch('/api/ops/readiness-score')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setReadinessScore(data.score) })
      .catch(() => {})
  }, [])

  const weeklyMetrics = useMemo<MetricDataPoint[]>(() => {
    const days = weeklyActivity.days
    const totals = weeklyActivity.total
    return days.map((name, i) => ({
      name,
      value: totals[i] ?? 0,
      color: i < 5 ? 'hsl(142 76% 36%)' : 'hsl(217 91% 60%)',
    }))
  }, [weeklyActivity])

  const uptimeLabel =
    health?.overall === 'operational'
      ? '100%'
      : health?.overall === 'degraded'
      ? '~95%'
      : health
      ? '⚠ Outage'
      : '—'

  return (
    <div className="space-y-8">
      <PageHeader
        title="Command Center"
        description="Panel de operaciones Akademate — Revenue · Clientes · Salud del sistema"
      />

      <section className="flex flex-wrap items-center gap-3">
        <Link
          href="/dashboard/tenants/create"
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          Crear Tenant
        </Link>
        <Link
          href="/dashboard/tenants"
          className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-muted/50 transition-colors"
        >
          Ver todos
        </Link>
      </section>

      {/* ── ROW 1: Revenue ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" />
          Revenue
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <KPILink href="/dashboard/finanzas/ingresos">
                <KPICard
                  label="MRR"
                  value={mrr ? formatEur(mrr.mrr_eur) : '—'}
                  icon={<DollarSign className="h-5 w-5 text-primary" />}
                  trend={
                    mrr?.mrr_growth_pct !== null && mrr?.mrr_growth_pct !== undefined
                      ? {
                          value: mrr.mrr_growth_pct,
                          direction: mrr.mrr_growth_pct >= 0 ? 'up' : 'down',
                          label: 'vs mes anterior',
                        }
                      : undefined
                  }
                />
              </KPILink>

              <KPILink href="/dashboard/finanzas/ingresos">
                <KPICard
                  label="ARR"
                  value={mrr ? formatEur(mrr.arr_eur) : '—'}
                  icon={<BarChart3 className="h-5 w-5 text-primary" />}
                  trend={
                    mrr?.mrr_growth_pct !== null && mrr?.mrr_growth_pct !== undefined
                      ? {
                          value: mrr.mrr_growth_pct,
                          direction: mrr.mrr_growth_pct >= 0 ? 'up' : 'down',
                          label: 'vs mes anterior',
                        }
                      : undefined
                  }
                />
              </KPILink>

              <KPILink href="/dashboard/analytics">
                <KPICard
                  label="MRR Growth"
                  value={formatPct(mrr?.mrr_growth_pct ?? null)}
                  icon={<TrendingUp className="h-5 w-5 text-success" />}
                  variant={
                    mrr?.mrr_growth_pct == null
                      ? 'default'
                      : mrr.mrr_growth_pct >= 0
                      ? 'success'
                      : 'danger'
                  }
                />
              </KPILink>

              <KPILink href="/dashboard/analytics/retencion">
                <KPICard
                  label="MRR Perdido"
                  value={churn ? formatEur(churn.churned_mrr_eur) : '—'}
                  icon={<TrendingDown className="h-5 w-5 text-destructive" />}
                  variant={churn && churn.churned_mrr_eur > 0 ? 'danger' : 'default'}
                />
              </KPILink>
            </>
          )}
        </div>
      </section>

      {/* ── ROW 2: Clientes ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Users className="h-3.5 w-3.5" />
          Clientes
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <KPILink href="/dashboard/tenants">
                <KPICard
                  label="Total Tenants"
                  value={mrr?.active_tenants ?? tenants.length}
                  icon={<Users className="h-5 w-5 text-primary" />}
                />
              </KPILink>

              <KPILink href="/dashboard/tenants?filter=new">
                <KPICard
                  label="Nuevos este mes"
                  value={growth?.new_this_month ?? 0}
                  icon={<UserPlus className="h-5 w-5 text-success" />}
                  variant="success"
                  trend={
                    growth?.signup_growth_pct !== null && growth?.signup_growth_pct !== undefined
                      ? {
                          value: growth.signup_growth_pct,
                          direction: growth.signup_growth_pct >= 0 ? 'up' : 'down',
                          label: 'vs mes anterior',
                        }
                      : undefined
                  }
                />
              </KPILink>

              <KPILink href="/dashboard/analytics/retencion">
                <KPICard
                  label="Churned este mes"
                  value={churn?.churned_count ?? 0}
                  icon={<UserMinus className="h-5 w-5 text-destructive" />}
                  variant={churn && churn.churned_count > 0 ? 'danger' : 'success'}
                />
              </KPILink>

              <KPILink href="/dashboard/suscripciones">
                <KPICard
                  label="Trial → Paid"
                  value={growth?.trial_to_paid_pct !== null && growth?.trial_to_paid_pct !== undefined ? `${growth.trial_to_paid_pct}%` : '—'}
                  icon={<RefreshCw className="h-5 w-5 text-primary" />}
                  variant={
                    growth?.trial_to_paid_pct == null
                      ? 'default'
                      : growth.trial_to_paid_pct >= 60
                      ? 'success'
                      : growth.trial_to_paid_pct >= 30
                      ? 'warning'
                      : 'danger'
                  }
                />
              </KPILink>
            </>
          )}
        </div>
      </section>

      {/* ── ROW 3: Health (semáforo operacional) ── */}
      <section>
        <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-2">
          <Shield className="h-3.5 w-3.5" />
          Salud del Sistema
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {healthLoading ? (
            Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          ) : (
            <>
              <KPILink href="/dashboard/estado">
                <KPICard
                  label="Uptime"
                  value={uptimeLabel}
                  icon={<Wifi className="h-5 w-5 text-success" />}
                  variant={
                    health?.overall === 'operational'
                      ? 'success'
                      : health?.overall === 'degraded'
                      ? 'warning'
                      : health
                      ? 'danger'
                      : 'default'
                  }
                />
              </KPILink>

              <KPILink href="/dashboard/soporte">
                <KPICard
                  label="Tickets abiertos"
                  value="—"
                  icon={<Ticket className="h-5 w-5 text-warning" />}
                  variant="warning"
                />
              </KPILink>

              <KPILink href="/dashboard/api">
                <KPICard
                  label="API Error Rate"
                  value="—"
                  icon={<Activity className="h-5 w-5 text-primary" />}
                />
              </KPILink>

              <KPILink href="/dashboard/finanzas/gastos">
                <KPICard
                  label="Costes mes"
                  value="—"
                  icon={<Receipt className="h-5 w-5 text-muted-foreground" />}
                />
              </KPILink>
            </>
          )}
        </div>
      </section>

      {/* ── Activity Chart + Recent Signups ── */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Actividad Semanal</CardTitle>
              </div>
              <Badge variant="outline">Esta semana</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <MetricsBarChart data={weeklyMetrics} height={180} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-success" />
                <CardTitle className="text-base">Últimos Registros</CardTitle>
              </div>
              <Link href="/dashboard/tenants" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
                Ver todos →
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {!growth ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
              </div>
            ) : growth.recent_signups.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin registros recientes</p>
            ) : (
              <div className="space-y-2">
                {growth.recent_signups.map((s) => (
                  <Link
                    key={s.id}
                    href={`/dashboard/tenants/${s.id}`}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 bg-gradient-to-br from-primary to-cyan-600 rounded-md flex items-center justify-center text-white font-bold text-xs">
                        {s.name.charAt(0)}
                      </div>
                      <span className="text-sm font-medium">{s.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {new Date(s.created_at).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* ── Top Tenants by Plan ── */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 sm:px-6 py-4">
          <div>
            <CardTitle className="text-lg">Tenants</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Academias registradas en la plataforma</p>
          </div>
          <Link
            href="/dashboard/tenants/create"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo tenant
          </Link>
        </CardHeader>
        {tenantsLoading ? (
          <div className="p-6 space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <DataTable>
              <DataTableHeader>
                <DataTableRow>
                  <DataTableHead>Tenant</DataTableHead>
                  <DataTableHead>Plan</DataTableHead>
                  <DataTableHead>Estado</DataTableHead>
                  <DataTableHead align="right">MRR est.</DataTableHead>
                  <DataTableHead align="right">Usuarios</DataTableHead>
                </DataTableRow>
              </DataTableHeader>
              <DataTableBody>
                {tenants.length === 0 ? (
                  <DataTableEmpty
                    colSpan={5}
                    title="Sin tenants"
                    description="No hay tenants registrados en la plataforma"
                  />
                ) : (
                  tenants.map((tenant) => {
                    const max = tenant.limits?.maxUsers ?? 0
                    const plan = max >= 100 ? 'enterprise' : max >= 20 ? 'professional' : 'starter'
                    const prices: Record<string, number> = { starter: 199, professional: 299, enterprise: 599 }
                    return (
                      <DataTableRow key={tenant.id}>
                        <DataTableCell>
                          <Link
                            href={`/dashboard/tenants/${tenant.id}`}
                            className="flex items-center gap-3 hover:underline"
                          >
                            <div className="w-9 h-9 bg-gradient-to-br from-primary to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                              {tenant.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-foreground font-medium">{tenant.name}</p>
                              <p className="text-muted-foreground text-xs">{tenant.domain ?? `${tenant.slug}.akademate.com`}</p>
                            </div>
                          </Link>
                        </DataTableCell>
                        <DataTableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${planStyles[plan]}`}>
                            {plan.charAt(0).toUpperCase() + plan.slice(1)}
                          </span>
                        </DataTableCell>
                        <DataTableCell>
                          <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${tenant.active ? 'bg-success/10 text-success' : 'bg-muted text-muted-foreground'}`}>
                            {tenant.active ? 'Activo' : 'Inactivo'}
                          </span>
                        </DataTableCell>
                        <DataTableCell align="right" numeric>
                          {formatEur(prices[plan] ?? 199)}
                        </DataTableCell>
                        <DataTableCell align="right" numeric>
                          {tenant.limits?.maxUsers ?? '∞'}
                        </DataTableCell>
                      </DataTableRow>
                    )
                  })
                )}
              </DataTableBody>
            </DataTable>
          </div>
        )}
      </Card>

      {/* ── Enterprise Readiness ── */}
      <Card className="overflow-hidden">
        <Link
          href="/dashboard/roadmap"
          className="block p-6 group transition-colors hover:bg-muted/30"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-warning/10">
                <Target className="h-6 w-6 text-warning" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-lg font-semibold text-foreground">Enterprise Readiness</h2>
                  <Badge variant="outline" className="border-warning/50 text-warning">
                    Score {readinessScore ?? '—'}/100
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Ver mapa de gaps y roadmap para alcanzar $1M+ ARR
                </p>
                <Progress value={readinessScore ?? 0} max={100} variant="warning" size="md" />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all mt-2" />
          </div>
        </Link>
      </Card>
    </div>
  )
}
