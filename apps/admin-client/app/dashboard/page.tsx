'use client'

import { useMemo, useState } from 'react'
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
} from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MockDataBanner } from '@/components/mock-data-banner'
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
} from '@/components/ui/data-table'

interface Tenant {
  id: string
  name: string
  slug: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  usersCount: number
  coursesCount: number
  createdAt: string
  mrr: number
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'CEP Formación',
    slug: 'cepfp',
    plan: 'professional',
    status: 'active',
    usersCount: 12,
    coursesCount: 45,
    createdAt: '2024-01-15',
    mrr: 299,
  },
  {
    id: '2',
    name: 'Academia Madrid',
    slug: 'academia-madrid',
    plan: 'starter',
    status: 'trial',
    usersCount: 3,
    coursesCount: 8,
    createdAt: '2025-11-20',
    mrr: 0,
  },
  {
    id: '3',
    name: 'Instituto Barcelona',
    slug: 'instituto-barcelona',
    plan: 'enterprise',
    status: 'active',
    usersCount: 28,
    coursesCount: 120,
    createdAt: '2024-06-10',
    mrr: 599,
  },
]

const planStyles: Record<string, string> = {
  starter: 'bg-muted text-muted-foreground',
  professional: 'bg-primary/10 text-primary',
  enterprise: 'bg-accent text-accent-foreground',
}

type TenantStatus = 'active' | 'trial' | 'suspended' | 'cancelled'

const statusStyles: Record<TenantStatus, { bg: string; text: string; label: string }> = {
  active: { bg: 'bg-success/10', text: 'text-success', label: 'Activo' },
  trial: { bg: 'bg-warning/10', text: 'text-warning', label: 'Trial' },
  suspended: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Suspendido' },
  cancelled: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Cancelado' },
}

export default function DashboardPage() {
  const [tenants] = useState<Tenant[]>(mockTenants)

  const totalMRR = tenants.reduce((sum, t) => sum + t.mrr, 0)
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const trialTenants = tenants.filter(t => t.status === 'trial').length
  const hasMock = useMemo(() => true, [])

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <PageHeader
        title="Dashboard"
        description="Vista general de la plataforma Akademate"
      >
        {hasMock && <MockDataBanner />}
      </PageHeader>

      {/* KPI Cards Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          label="Total Tenants"
          value={tenants.length}
          icon={<Users className="h-5 w-5 text-primary" />}
          trend={{ value: 12, direction: 'up', label: 'vs mes anterior' }}
        />
        <KPICard
          label="Activos"
          value={activeTenants}
          icon={<CheckCircle2 className="h-5 w-5 text-success" />}
          variant="success"
        />
        <KPICard
          label="En Trial"
          value={trialTenants}
          icon={<Clock className="h-5 w-5 text-warning" />}
          variant="warning"
        />
        <KPICard
          label="MRR Total"
          value={`$${totalMRR.toLocaleString()}`}
          icon={<DollarSign className="h-5 w-5 text-primary" />}
          trend={{ value: 8.5, direction: 'up', label: 'crecimiento' }}
        />
      </section>

      {/* Action Cards Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ActionCard
          variant="gradient"
          icon={<UserPlus className="h-5 w-5 text-white" />}
          title="Onboarding pendiente"
          description="2 tenants necesitan completar el proceso de setup inicial"
          href="/dashboard/tenants"
          badge={{ text: '2 pendientes', variant: 'warning' }}
        />
        <ActionCard
          variant="warning"
          icon={<Headphones className="h-5 w-5" />}
          title="Tickets de soporte"
          description="3 tickets abiertos requieren atención inmediata"
          href="/dashboard/soporte"
          badge={{ text: '3 abiertos', variant: 'warning' }}
        />
        <ActionCard
          variant="danger"
          icon={<CreditCard className="h-5 w-5" />}
          title="Pagos fallidos"
          description="1 pago rechazado en los últimos 7 días"
          href="/dashboard/facturacion"
          badge={{ text: '$299', variant: 'danger' }}
        />
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
                  <Badge variant="outline" className="badge-warning">
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
            <CardTitle className="text-lg">Tenants recientes</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Gestiona academias registradas en la plataforma</p>
          </div>
          <Link
            href="/dashboard/tenants"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <UserPlus className="h-4 w-4" />
            Nuevo tenant
          </Link>
        </CardHeader>
        <DataTable>
          <DataTableHeader>
            <DataTableRow>
              <DataTableHead>Tenant</DataTableHead>
              <DataTableHead>Plan</DataTableHead>
              <DataTableHead>Estado</DataTableHead>
              <DataTableHead align="right">Usuarios</DataTableHead>
              <DataTableHead align="right">Cursos</DataTableHead>
              <DataTableHead align="right">MRR</DataTableHead>
            </DataTableRow>
          </DataTableHeader>
          <DataTableBody>
            {tenants.map((tenant) => (
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
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${planStyles[tenant.plan]}`}>
                    {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                  </span>
                </DataTableCell>
                <DataTableCell>
                  <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-medium ${statusStyles[tenant.status].bg} ${statusStyles[tenant.status].text}`}>
                    {statusStyles[tenant.status].label}
                  </span>
                </DataTableCell>
                <DataTableCell align="right" numeric>
                  {tenant.usersCount}
                </DataTableCell>
                <DataTableCell align="right" numeric>
                  {tenant.coursesCount}
                </DataTableCell>
                <DataTableCell align="right" numeric>
                  <span className={tenant.mrr > 0 ? 'text-success font-semibold' : 'text-muted-foreground'}>
                    {tenant.mrr > 0 ? `$${tenant.mrr}` : 'Trial'}
                  </span>
                </DataTableCell>
              </DataTableRow>
            ))}
          </DataTableBody>
        </DataTable>
      </Card>
    </div>
  )
}
