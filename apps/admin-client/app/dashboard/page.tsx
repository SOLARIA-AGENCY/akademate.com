'use client'

import { useMemo, useState } from 'react'

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

  const enterpriseGaps = [
    { name: 'Billing/Stripe + usage', status: 'missing', gap: '100%', note: 'Planes, checkout, metering' },
    { name: 'SSO/SCIM', status: 'missing', gap: '100%', note: 'SAML/OIDC + directory sync' },
    { name: 'Audit logs enterprise', status: 'partial', gap: '70%', note: 'Export/search/retention' },
    { name: 'API keys + rate limits', status: 'partial', gap: '60%', note: 'Scopes, quotas por plan' },
    { name: 'Onboarding wizard', status: 'missing', gap: '100%', note: 'TTFV y checklist' },
    { name: 'Analytics avanzada', status: 'partial', gap: '50%', note: 'MRR/NRR/churn funnels' },
    { name: 'White-label + dominios', status: 'missing', gap: '100%', note: 'Custom domain + branding' },
    { name: 'Feature flags', status: 'missing', gap: '100%', note: 'Rollouts tenant-aware' },
    { name: 'Webhooks/retries', status: 'missing', gap: '100%', note: 'Eventos + colas + reintentos' },
    { name: 'Security/Compliance', status: 'missing', gap: '100%', note: 'MFA, GDPR export/delete, status' },
  ]

  const roadmap = [
    { phase: 'Fase 1 (4w) - $100K ARR', items: ['Stripe Billing básico', 'Pricing page', 'Onboarding wizard', 'Audit logs mejorados'] },
    { phase: 'Fase 2 (6w) - $500K ARR', items: ['Usage-based billing', 'API keys + rate limiting', 'Webhooks', 'Feature flags', 'Analytics avanzada'] },
    { phase: 'Fase 3 (8w) - $1M+ ARR', items: ['SSO/OIDC + SAML', 'SCIM directory sync', 'Custom domains/white-label', 'Security & compliance center'] },
  ]

  const getPlanBadge = (plan: Tenant['plan']) => {
    const styles: Record<string, string> = {
      starter: 'bg-slate-600 text-slate-200',
      professional: 'bg-indigo-600/20 text-indigo-300',
      enterprise: 'bg-purple-600/20 text-purple-300',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[plan]}`}>
        {plan.charAt(0).toUpperCase() + plan.slice(1)}
      </span>
    )
  }

  const getStatusBadge = (status: Tenant['status']) => {
    const styles: Record<string, string> = {
      active: 'bg-emerald-600/20 text-emerald-300',
      trial: 'bg-amber-600/20 text-amber-300',
      suspended: 'bg-red-600/20 text-red-300',
      cancelled: 'bg-slate-600/20 text-slate-400',
    }
    const labels: Record<string, string> = {
      active: 'Activo',
      trial: 'Trial',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    }
    return (
      <span className={`px-2 py-1 rounded text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {hasMock ? (
        <div className="px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center gap-2 text-amber-300 text-sm font-medium">
          <span className="badge-dot" style={{ backgroundColor: '#f59e0b' }} />
          Mock data para demo. Conecta con Payload/DB para datos reales por tenant.
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="glass-panel p-4">
          <p className="text-slate-400 text-xs font-medium">Total Tenants</p>
          <p className="text-2xl font-bold text-white mt-1">{tenants.length}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-slate-400 text-xs font-medium">Activos</p>
          <p className="text-2xl font-bold text-emerald-300 mt-1">{activeTenants}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-slate-400 text-xs font-medium">En Trial</p>
          <p className="text-2xl font-bold text-amber-300 mt-1">{trialTenants}</p>
        </div>
        <div className="glass-panel p-4">
          <p className="text-slate-400 text-xs font-medium">MRR Total</p>
          <p className="text-2xl font-bold text-white mt-1">${totalMRR}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-5 rounded-xl shadow-lg shadow-indigo-500/30">
          <h3 className="text-white font-semibold">Onboarding pendiente</h3>
          <p className="text-indigo-100 text-sm mt-1">2 tenants necesitan completar setup</p>
          <button className="mt-4 px-4 py-2 bg-white text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-50 transition-colors">
            Ver pendientes
          </button>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-white font-semibold">Tickets de soporte</h3>
          <p className="text-slate-400 text-sm mt-1">3 tickets abiertos requieren atención</p>
          <button className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            Ver tickets
          </button>
        </div>
        <div className="glass-panel p-5">
          <h3 className="text-white font-semibold">Pagos fallidos</h3>
          <p className="text-slate-400 text-sm mt-1">1 pago rechazado en los últimos 7 días</p>
          <button className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-700 transition-colors">
            Gestionar
          </button>
        </div>
      </div>

      {/* Enterprise readiness status */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Enterprise readiness (mock)</h2>
            <p className="text-slate-400 text-sm">Mapa de gaps para subir a $1M+ ARR.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 text-xs font-semibold">Score 32/100</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {enterpriseGaps.map(feature => (
            <div key={feature.name} className="p-4 rounded-lg border border-slate-800 bg-slate-900/60">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-white font-semibold">{feature.name}</p>
                  <p className="text-slate-400 text-sm">{feature.note}</p>
                </div>
                <span
                  className={`px-2 py-1 text-xs font-semibold rounded ${
                    feature.status === 'missing'
                      ? 'bg-red-500/15 text-red-300'
                      : 'bg-amber-500/15 text-amber-300'
                  }`}
                >
                  Gap {feature.gap}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Roadmap */}
      <div className="glass-panel p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Roadmap implementación</h2>
            <p className="text-slate-400 text-sm">Prioriza billing, SSO/SCIM, API keys y webhooks.</p>
          </div>
          <span className="px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-200 text-xs font-semibold">Mock plan</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {roadmap.map(step => (
            <div key={step.phase} className="p-4 rounded-lg border border-slate-800 bg-slate-900/60 space-y-2">
              <p className="text-sm text-slate-400">{step.phase}</p>
              <ul className="list-disc list-inside text-sm text-white space-y-1">
                {step.items.map(item => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white">Tenants recientes</h2>
            <p className="text-slate-400 text-sm">Gestiona academias registradas</p>
          </div>
          <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium">
            + Nuevo tenant
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/70">
              <tr className="border-b border-slate-800">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Usuarios</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">Cursos</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase">MRR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {tenants.map(tenant => (
                <tr key={tenant.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold text-sm">{tenant.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-white font-medium">{tenant.name}</p>
                        <p className="text-slate-500 text-sm">{tenant.slug}.akademate.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlanBadge(tenant.plan)}</td>
                  <td className="px-6 py-4">{getStatusBadge(tenant.status)}</td>
                  <td className="px-6 py-4 text-slate-300">{tenant.usersCount}</td>
                  <td className="px-6 py-4 text-slate-300">{tenant.coursesCount}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${tenant.mrr > 0 ? 'text-emerald-300' : 'text-slate-500'}`}>
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
