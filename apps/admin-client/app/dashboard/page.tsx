'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { MockDataBanner } from '@/components/mock-data-banner'

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

export default function DashboardPage() {
  const [tenants] = useState<Tenant[]>(mockTenants)

  const totalMRR = tenants.reduce((sum, t) => sum + t.mrr, 0)
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const trialTenants = tenants.filter(t => t.status === 'trial').length
  const hasMock = useMemo(() => true, [])

  const getPlanBadge = (plan: Tenant['plan']) => {
    const styles: Record<string, string> = {
      starter: 'bg-muted/50 text-muted-foreground',
      professional: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      enterprise: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[plan]}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    )
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
      trial: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
      suspended: 'bg-red-500/10 text-red-600 dark:text-red-400',
      cancelled: 'bg-muted/50 text-muted-foreground',
    }
    const labels: Record<string, string> = {
      active: 'Activo',
      trial: 'Trial',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    }
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Vista general de la plataforma Akademate"
      >
        {hasMock && <MockDataBanner />}
      </PageHeader>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Total Tenants</p>
          <p className="text-3xl font-bold text-foreground mt-2">{tenants.length}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">Activos</p>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-2">{activeTenants}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">En Trial</p>
          <p className="text-3xl font-bold text-amber-600 dark:text-amber-400 mt-2">{trialTenants}</p>
        </div>
        <div className="glass-panel p-5">
          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">MRR Total</p>
          <p className="text-3xl font-bold text-foreground mt-2">${totalMRR}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl">
          <h3 className="text-white font-semibold">Onboarding pendiente</h3>
          <p className="text-indigo-100 text-sm mt-1">2 tenants necesitan completar setup</p>
          <button className="mt-4 px-4 py-2 bg-white/95 text-indigo-700 rounded-lg text-sm font-medium hover:bg-white transition-colors">
            Ver pendientes
          </button>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-foreground font-semibold">Tickets de soporte</h3>
          <p className="text-muted-foreground text-sm mt-1">3 tickets abiertos requieren atencion</p>
          <button className="mt-4 px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Ver tickets
          </button>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-foreground font-semibold">Pagos fallidos</h3>
          <p className="text-muted-foreground text-sm mt-1">1 pago rechazado en los ultimos 7 dias</p>
          <button className="mt-4 px-4 py-2 bg-muted/50 text-foreground rounded-lg text-sm font-medium hover:bg-muted transition-colors">
            Gestionar
          </button>
        </div>
      </div>

      {/* Link to Roadmap */}
      <Link
        href="/dashboard/roadmap"
        className="glass-panel p-5 flex items-center justify-between group hover:shadow-lg transition-shadow"
      >
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-lg font-semibold text-foreground">Enterprise Readiness</h2>
            <span className="px-2.5 py-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
              Score 32/100
            </span>
          </div>
          <p className="text-muted-foreground text-sm mt-1">Ver mapa de gaps y roadmap para $1M+ ARR</p>
        </div>
        <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground group-hover:translate-x-1 transition-all" />
      </Link>

      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Tenants recientes</h2>
            <p className="text-muted-foreground text-sm">Gestiona academias registradas</p>
          </div>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium">
            + Nuevo tenant
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuarios</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Cursos</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((tenant, idx) => (
                <tr key={tenant.id} className={`hover:bg-muted/20 transition-colors ${idx < tenants.length - 1 ? 'border-b border-muted/20' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{tenant.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{tenant.name}</p>
                        <p className="text-muted-foreground text-sm">{tenant.slug}.akademate.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlanBadge(tenant.plan)}</td>
                  <td className="px-6 py-4">{getStatusBadge(tenant.status)}</td>
                  <td className="px-6 py-4 text-foreground">{tenant.usersCount}</td>
                  <td className="px-6 py-4 text-foreground">{tenant.coursesCount}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${tenant.mrr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {tenant.mrr > 0 ? `$${tenant.mrr}/mo` : 'Trial'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
