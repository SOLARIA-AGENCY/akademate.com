'use client'

import { useMemo } from 'react'
import Link from 'next/link'
import {
  ArrowRight,
  Users,
  CheckCircle2,
  Clock,
  DollarSign,
  UserPlus,
  Headphones,
  CreditCard,
  Target,
  TrendingUp,
  Activity,
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MetricsBarChart, type MetricDataPoint } from '@/components/charts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { KPICard } from '@/components/ui/kpi-card'
import { ActionCard } from '@/components/ui/action-card'
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
import { useTenants, useOpsMetrics } from '@/hooks/use-ops-data'
import { Skeleton } from '@/components/ui/skeleton'

const planStyles: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  professional: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent text-accent-foreground',
}

function deriveplan(limits?: { maxUsers?: number; maxCourses?: number }): string {
  const max = limits?.maxUsers ?? 0
  if (max >= 100) return 'enterprise'
  if (max >= 20) return 'professional'
  return 'starter'
}

export default function DashboardPage() {
  const { data: tenantsData, isLoading: tenantsLoading } = useTenants()
  const { data: metrics, isLoading: metricsLoading } = useOpsMetrics()

  const tenants = tenantsData?.docs ?? []
  const isLoading = tenantsLoading || metricsLoading

  const weeklyMetrics = useMemo<MetricDataPoint[]>(() => [
    { name: 'Lun', value: 45, color: 'hsl(142 76% 36%)' },
    { name: 'Mar', value: 52, color: 'hsl(142 76% 36%)' },
    { name: 'Mié', value: 38, color: 'hsl(142 76% 36%)' },
    { name: 'Jue', value: 65, color: 'hsl(142 76% 36%)' },
    { name: 'Vie', value: 48, color: 'hsl(142 76% 36%)' },
    { name: 'Sáb', value: 22, color: 'hsl(217 91% 60%)' },
    { name: 'Dom', value: 15, color: 'hsl(217 91% 60%)' },
  ], [])

  return (
    <div className="space-y-8">
      <PageHeader
        title="Dashboard"
        description="Vista general de la plataforma Akademate"
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

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="metrics-grid">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))
        ) : (
          <>
            <KPICard
              label="Total Tenants"
              value={metrics?.tenants.total ?? tenants.length}
              data-testid="tenant-count"
              icon={<Users className="h-5 w-5 text-primary" />}
            />
            <KPICard
              label="Activos"
              value={metrics?.tenants.active ?? tenants.filter(t => t.active).length}
              data-testid="user-count"
              icon={<CheckCircle2 className="h-5 w-5 text-success" />}
              variant="success"
            />
            <KPICard
              label="En Trial"
              value={metrics?.tenants.trial ?? 0}
              icon={<Clock className="h-5 w-5 text-warning" />}
              variant="warning"
            />
            <KPICard
              label="Total Usuarios"
              value={metrics?.users.total ?? 0}
              data-testid="revenue"
              icon={<DollarSign className="h-5 w-5 text-primary" />}
            />
          </>
        )}
      </section>

      {/* Action Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          variant="gradient"
          icon={<UserPlus className="h-5 w-5 text-white" />}
          title="Gestionar Tenants"
          description="Administra academias y organizaciones registradas en la plataforma"
          href="/dashboard/tenants"
        />
        <ActionCard
          variant="warning"
          icon={<Headphones className="h-5 w-5" />}
          title="Soporte"
          description="Gestiona tickets y solicitudes de soporte de tenants"
          href="/dashboard/soporte"
        />
        <ActionCard
          variant="danger"
          icon={<CreditCard className="h-5 w-5" />}
          title="Facturación"
          description="Revisa suscripciones y estado de pagos"
          href="/dashboard/facturacion"
        />
      </section>

      {/* Activity Chart */}
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
                <TrendingUp className="h-5 w-5 text-success" />
                <CardTitle className="text-base">Estado del Sistema</CardTitle>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="space-y-1">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{metrics?.courses.total ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Cursos totales</p>
              </div>
              <div className="space-y-1">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{metrics?.enrollments.total ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Matrículas activas</p>
              </div>
              <div className="space-y-1">
                <p className="text-2xl font-bold text-success">—</p>
                <p className="text-xs text-muted-foreground">Uptime del sistema</p>
              </div>
              <div className="space-y-1">
                {metricsLoading ? (
                  <Skeleton className="h-8 w-16" />
                ) : (
                  <p className="text-2xl font-bold text-foreground">{metrics?.users.total ?? 0}</p>
                )}
                <p className="text-xs text-muted-foreground">Usuarios registrados</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card data-testid="recent-activity">
          <CardHeader>
            <CardTitle className="text-base">Actividad reciente</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Últimas acciones registradas en la plataforma.
          </CardContent>
        </Card>
        <Card data-testid="user-profile">
          <CardHeader>
            <CardTitle className="text-base">Perfil de usuario</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Información del operador y roles asignados.
          </CardContent>
        </Card>
        <Card data-testid="health-status">
          <CardHeader>
            <CardTitle className="text-base">Estado del sistema</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Servicios críticos activos y monitorizados.
          </CardContent>
        </Card>
      </section>

      {/* Enterprise Readiness Card */}
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
                    Score 32/100
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm mb-4">
                  Ver mapa de gaps y roadmap para alcanzar $1M+ ARR
                </p>
                <Progress value={32} max={100} variant="warning" size="md" />
              </div>
            </div>
            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all mt-2" />
          </div>
        </Link>
      </Card>

      {/* Tenants Table */}
      <Card className="overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border px-6 py-4">
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
                <DataTableHead align="right">Límite usuarios</DataTableHead>
                <DataTableHead align="right">Límite cursos</DataTableHead>
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
                  const plan = deriveplan(tenant.limits)
                  return (
                    <DataTableRow key={tenant.id}>
                      <DataTableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 bg-gradient-to-br from-primary to-cyan-600 rounded-lg flex items-center justify-center text-white font-bold text-sm shadow-sm">
                            {tenant.name.charAt(0)}
                          </div>
                          <div>
                            <p className="text-foreground font-medium">{tenant.name}</p>
                            <p className="text-muted-foreground text-xs">{tenant.slug}.akademate.com</p>
                          </div>
                        </div>
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
                        {tenant.limits?.maxUsers ?? '∞'}
                      </DataTableCell>
                      <DataTableCell align="right" numeric>
                        {tenant.limits?.maxCourses ?? '∞'}
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
    </div>
  )
}
