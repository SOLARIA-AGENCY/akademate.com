'use client'

import { useState } from 'react'
import { PageHeader } from '@/components/page-header'
import { MockDataBanner } from '@/components/mock-data-banner'

interface TenantApiKey {
  id: string
  name: string
  key: string
  permissions: string[]
  status: 'active' | 'revoked'
  requestsToday: number
  requestsMonth: number
  createdAt: string
  lastUsed: string | null
}

interface Tenant {
  id: string
  name: string
  slug: string
  email: string
  phone: string
  plan: 'starter' | 'professional' | 'enterprise'
  status: 'active' | 'trial' | 'suspended' | 'cancelled'
  usersCount: number
  coursesCount: number
  studentsCount: number
  sitesCount: number
  createdAt: string
  trialEndsAt: string | null
  mrr: number
  lastActivity: string
  logoUrl: string | null
  apiKeys: TenantApiKey[]
  apiUsage: {
    requestsToday: number
    requestsMonth: number
    webhooksConfigured: number
    integrationsActive: string[]
  }
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'CEP Formacion',
    slug: 'cep-formacion',
    email: 'admin@cepformacion.es',
    phone: '+34 91 234 5678',
    plan: 'professional',
    status: 'active',
    usersCount: 12,
    coursesCount: 45,
    studentsCount: 1234,
    sitesCount: 3,
    createdAt: '2024-01-15',
    trialEndsAt: null,
    mrr: 299,
    lastActivity: '2025-12-07T10:30:00',
    logoUrl: '/tenants/cep-logo.png',
    apiKeys: [
      { id: 'k1', name: 'Production Key', key: 'ak_cep_live_xxxxxxxxxxxx', permissions: ['read', 'write'], status: 'active', requestsToday: 89, requestsMonth: 2456, createdAt: '2024-06-15', lastUsed: '2025-12-07T10:30:00' },
      { id: 'k2', name: 'Meta Ads Webhook', key: 'ak_cep_meta_xxxxxxxxxxxx', permissions: ['write'], status: 'active', requestsToday: 12, requestsMonth: 345, createdAt: '2024-08-20', lastUsed: '2025-12-07T08:15:00' },
    ],
    apiUsage: { requestsToday: 101, requestsMonth: 2801, webhooksConfigured: 2, integrationsActive: ['Meta Ads', 'Mailchimp', 'WhatsApp'] },
  },
  {
    id: '2',
    name: 'Academia Madrid',
    slug: 'academia-madrid',
    email: 'contacto@academiamadrid.es',
    phone: '+34 91 555 1234',
    plan: 'starter',
    status: 'trial',
    usersCount: 3,
    coursesCount: 8,
    studentsCount: 156,
    sitesCount: 1,
    createdAt: '2025-11-20',
    trialEndsAt: '2025-12-20',
    mrr: 0,
    lastActivity: '2025-12-06T14:22:00',
    logoUrl: null,
    apiKeys: [
      { id: 'k3', name: 'Test Key', key: 'ak_madrid_test_xxxxxxxxx', permissions: ['read'], status: 'active', requestsToday: 5, requestsMonth: 45, createdAt: '2025-11-25', lastUsed: '2025-12-06T14:22:00' },
    ],
    apiUsage: { requestsToday: 5, requestsMonth: 45, webhooksConfigured: 0, integrationsActive: [] },
  },
  {
    id: '3',
    name: 'Instituto Barcelona',
    slug: 'instituto-barcelona',
    email: 'admin@institutobarcelona.cat',
    phone: '+34 93 444 5678',
    plan: 'enterprise',
    status: 'active',
    usersCount: 28,
    coursesCount: 120,
    studentsCount: 4567,
    sitesCount: 5,
    createdAt: '2024-06-10',
    trialEndsAt: null,
    mrr: 599,
    lastActivity: '2025-12-07T09:15:00',
    logoUrl: '/tenants/barcelona-logo.png',
    apiKeys: [
      { id: 'k4', name: 'Main Production', key: 'ak_bcn_prod_xxxxxxxxxxxxx', permissions: ['read', 'write', 'delete'], status: 'active', requestsToday: 234, requestsMonth: 8765, createdAt: '2024-06-15', lastUsed: '2025-12-07T09:15:00' },
      { id: 'k5', name: 'Analytics Export', key: 'ak_bcn_analytics_xxxxxxx', permissions: ['read'], status: 'active', requestsToday: 45, requestsMonth: 1234, createdAt: '2024-09-10', lastUsed: '2025-12-07T06:00:00' },
    ],
    apiUsage: { requestsToday: 357, requestsMonth: 12344, webhooksConfigured: 5, integrationsActive: ['Meta Ads', 'Google Ads', 'Mailchimp', 'HubSpot CRM', 'WhatsApp', 'Zapier'] },
  },
  {
    id: '4',
    name: 'Centro Formativo Valencia',
    slug: 'centro-valencia',
    email: 'info@centroformativovalencia.es',
    phone: '+34 96 333 4444',
    plan: 'professional',
    status: 'suspended',
    usersCount: 8,
    coursesCount: 25,
    studentsCount: 890,
    sitesCount: 2,
    createdAt: '2024-09-01',
    trialEndsAt: null,
    mrr: 299,
    lastActivity: '2025-11-15T16:45:00',
    logoUrl: null,
    apiKeys: [],
    apiUsage: { requestsToday: 0, requestsMonth: 0, webhooksConfigured: 1, integrationsActive: [] },
  },
]

export default function TenantsPage() {
  const [tenants] = useState<Tenant[]>(mockTenants)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [planFilter, setPlanFilter] = useState<string>('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null)

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter
    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter
    return matchesSearch && matchesStatus && matchesPlan
  })

  const totalMRR = tenants.reduce((sum, t) => sum + t.mrr, 0)
  const activeTenants = tenants.filter(t => t.status === 'active').length
  const trialTenants = tenants.filter(t => t.status === 'trial').length

  const getPlanBadge = (plan: Tenant['plan']) => {
    const styles: Record<string, string> = {
      starter: 'bg-muted/50 text-muted-foreground',
      professional: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400',
      enterprise: 'bg-purple-500/10 text-purple-600 dark:text-purple-400',
    }
    return (
      <span className={`plan-info px-2.5 py-1 rounded-md text-xs font-medium ${styles[plan]}`}>
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
      <span className={`badge px-2.5 py-1 rounded-md text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    )
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    })
  }

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)

    if (diffHours < 1) return 'Hace unos minutos'
    if (diffHours < 24) return `Hace ${diffHours}h`
    if (diffDays < 7) return `Hace ${diffDays} dias`
    return formatDate(dateString)
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tenants"
        description="Gestiona las academias registradas en la plataforma"
      >
        <MockDataBanner />
      </PageHeader>

      {/* Stats Cards */}
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

      {/* Filters & Actions */}
      <div className="glass-panel overflow-hidden">
        <div className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="search"
                placeholder="Search tenants..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-muted/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos los estados</option>
              <option value="active">Activos</option>
              <option value="trial">En Trial</option>
              <option value="suspended">Suspendidos</option>
              <option value="cancelled">Cancelados</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="px-4 py-2 bg-muted/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="all">Todos los planes</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Tenant
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 border rounded-lg hover:bg-muted/40 transition-colors"
            >
              Create Tenant
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted/30">
              <tr>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide" data-column="domain">Domain</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Usuarios</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Alumnos</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">MRR</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Ultima Actividad</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-muted-foreground uppercase tracking-wide">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {filteredTenants.map((tenant, idx) => (
                <tr key={tenant.id} className={`hover:bg-muted/20 transition-colors ${idx < filteredTenants.length - 1 ? 'border-b border-muted/20' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                        <span className="text-white font-bold">{tenant.name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="text-foreground font-medium">{tenant.name}</p>
                        <p className="text-muted-foreground text-sm">{tenant.slug}.akademate.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-muted-foreground text-sm">{tenant.slug}.akademate.com</td>
                  <td className="px-6 py-4">{getPlanBadge(tenant.plan)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(tenant.status)}
                      {tenant.status === 'trial' && tenant.trialEndsAt && (
                        <span className="text-xs text-muted-foreground">
                          Expira: {formatDate(tenant.trialEndsAt)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-foreground">{tenant.usersCount}</div>
                    <div className="text-xs text-muted-foreground">{tenant.sitesCount} sedes</div>
                  </td>
                  <td className="px-6 py-4 text-foreground">{tenant.studentsCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${tenant.mrr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                      {tenant.mrr > 0 ? `$${tenant.mrr}/mo` : 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-muted-foreground text-sm">{formatLastActivity(tenant.lastActivity)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors" title="Editar">
                        <span className="sr-only">Edit</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-destructive hover:bg-muted/50 rounded-lg transition-colors" title="Eliminar">
                        <span className="sr-only">Delete</span>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6M9 7h6m-7-3h8a1 1 0 011 1v2H6V5a1 1 0 011-1z" />
                        </svg>
                      </button>
                      <button className="p-2 text-muted-foreground hover:text-primary hover:bg-muted/50 rounded-lg transition-colors" title="Impersonar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="pagination flex items-center justify-between px-6 py-4 text-sm text-muted-foreground">
          <span>Mostrando 1-4 de {filteredTenants.length}</span>
          <div className="flex items-center gap-2">
            <button className="rounded-md border px-3 py-1">Prev</button>
            <button className="rounded-md border px-3 py-1">Next</button>
          </div>
        </div>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{selectedTenant.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-foreground">{selectedTenant.name}</h2>
                  <p className="text-muted-foreground text-sm">{selectedTenant.slug}.akademate.com</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-2 text-muted-foreground hover:text-foreground rounded-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl">
                  <p className="text-muted-foreground text-sm">Plan</p>
                  <div className="mt-1">{getPlanBadge(selectedTenant.plan)}</div>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl">
                  <p className="text-muted-foreground text-sm">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedTenant.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-muted/30 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedTenant.usersCount}</p>
                  <p className="text-muted-foreground text-sm">Usuarios</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedTenant.coursesCount}</p>
                  <p className="text-muted-foreground text-sm">Cursos</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedTenant.studentsCount.toLocaleString()}</p>
                  <p className="text-muted-foreground text-sm">Alumnos</p>
                </div>
                <div className="bg-muted/30 p-4 rounded-xl text-center">
                  <p className="text-2xl font-bold text-foreground">{selectedTenant.sitesCount}</p>
                  <p className="text-muted-foreground text-sm">Sedes</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-muted/30">
                  <span className="text-muted-foreground">Email</span>
                  <span className="text-foreground">{selectedTenant.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted/30">
                  <span className="text-muted-foreground">Telefono</span>
                  <span className="text-foreground">{selectedTenant.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted/30">
                  <span className="text-muted-foreground">Fecha de Alta</span>
                  <span className="text-foreground">{formatDate(selectedTenant.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-muted/30">
                  <span className="text-muted-foreground">MRR</span>
                  <span className={`font-medium ${selectedTenant.mrr > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'}`}>
                    {selectedTenant.mrr > 0 ? `$${selectedTenant.mrr}/mes` : 'Trial Gratuito'}
                  </span>
                </div>
              </div>

              {/* API Usage Section */}
              <div className="bg-muted/20 rounded-xl p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-foreground font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Uso de API
                  </h3>
                  <span className="text-xs text-muted-foreground">{selectedTenant.apiKeys.length} API Keys</span>
                </div>

                {/* API Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-indigo-600 dark:text-indigo-400">{selectedTenant.apiUsage.requestsToday.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Requests Hoy</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{selectedTenant.apiUsage.requestsMonth.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">Requests/Mes</p>
                  </div>
                  <div className="bg-card rounded-lg p-3 text-center">
                    <p className="text-lg font-bold text-purple-600 dark:text-purple-400">{selectedTenant.apiUsage.webhooksConfigured}</p>
                    <p className="text-xs text-muted-foreground">Webhooks</p>
                  </div>
                </div>

                {/* Integrations */}
                {selectedTenant.apiUsage.integrationsActive.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-muted-foreground mb-2">Integraciones Activas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTenant.apiUsage.integrationsActive.map((integration) => (
                        <span key={integration} className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Keys List */}
                {selectedTenant.apiKeys.length > 0 && (
                  <div>
                    <p className="text-xs text-muted-foreground mb-2">API Keys</p>
                    <div className="space-y-2">
                      {selectedTenant.apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between bg-card rounded-lg p-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apiKey.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                            <span className="text-sm text-foreground">{apiKey.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-muted-foreground font-mono">{apiKey.key.substring(0, 20)}...</span>
                            <span className="text-xs text-muted-foreground">{apiKey.requestsToday} req/dia</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTenant.apiKeys.length === 0 && (
                  <p className="text-center text-muted-foreground text-sm py-2">Sin API Keys configuradas</p>
                )}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  Acceder al Panel
                </button>
                <button className="px-4 py-2 bg-muted/50 text-foreground rounded-lg hover:bg-muted transition-colors">
                  Editar
                </button>
                <button className="px-4 py-2 bg-red-500/10 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-500/20 transition-colors">
                  Suspender
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Tenant Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl w-full max-w-lg mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-foreground">Crear Nuevo Tenant</h2>
              <p className="text-muted-foreground text-sm mt-1">Configura una nueva academia en la plataforma</p>
            </div>
            <div className="p-6 pt-0 space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Nombre de la Academia</label>
                <input
                  type="text"
                  placeholder="Ej: Academia Central"
                  className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Slug (URL)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="academia-central"
                    className="flex-1 px-4 py-2 bg-muted/50 rounded-l-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  <span className="px-4 py-2 bg-muted/30 rounded-r-lg text-muted-foreground">.akademate.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email de Contacto</label>
                <input
                  type="email"
                  placeholder="admin@academia.es"
                  className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Plan Inicial</label>
                <select className="w-full px-4 py-2 bg-muted/50 rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary">
                  <option value="trial">Trial (14 dias gratis)</option>
                  <option value="starter">Starter - $99/mes</option>
                  <option value="professional">Professional - $299/mes</option>
                  <option value="enterprise">Enterprise - $599/mes</option>
                </select>
              </div>
            </div>
            <div className="p-6 pt-0 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-muted/50 text-foreground rounded-lg hover:bg-muted transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                Crear Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
