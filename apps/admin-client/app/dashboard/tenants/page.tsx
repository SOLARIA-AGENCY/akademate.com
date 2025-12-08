'use client';

import { useState } from 'react';

interface TenantApiKey {
  id: string;
  name: string;
  key: string;
  permissions: string[];
  status: 'active' | 'revoked';
  requestsToday: number;
  requestsMonth: number;
  createdAt: string;
  lastUsed: string | null;
}

interface Tenant {
  id: string;
  name: string;
  slug: string;
  email: string;
  phone: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  usersCount: number;
  coursesCount: number;
  studentsCount: number;
  sitesCount: number;
  createdAt: string;
  trialEndsAt: string | null;
  mrr: number;
  lastActivity: string;
  logoUrl: string | null;
  apiKeys: TenantApiKey[];
  apiUsage: {
    requestsToday: number;
    requestsMonth: number;
    webhooksConfigured: number;
    integrationsActive: string[];
  };
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'CEP Formación',
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
      { id: 'k6', name: 'CRM Integration', key: 'ak_bcn_crm_xxxxxxxxxxxx', permissions: ['read', 'write'], status: 'active', requestsToday: 78, requestsMonth: 2345, createdAt: '2024-11-20', lastUsed: '2025-12-07T09:00:00' },
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
    apiKeys: [
      { id: 'k7', name: 'Production Key', key: 'ak_vlc_prod_xxxxxxxxxxxxx', permissions: ['read', 'write'], status: 'revoked', requestsToday: 0, requestsMonth: 0, createdAt: '2024-09-05', lastUsed: '2025-11-15T16:45:00' },
    ],
    apiUsage: { requestsToday: 0, requestsMonth: 0, webhooksConfigured: 1, integrationsActive: [] },
  },
  {
    id: '5',
    name: 'Formación Sevilla',
    slug: 'formacion-sevilla',
    email: 'hola@formacionsevilla.es',
    phone: '+34 95 222 1111',
    plan: 'starter',
    status: 'cancelled',
    usersCount: 2,
    coursesCount: 5,
    studentsCount: 78,
    sitesCount: 1,
    createdAt: '2024-03-20',
    trialEndsAt: null,
    mrr: 0,
    lastActivity: '2025-10-30T11:00:00',
    logoUrl: null,
    apiKeys: [],
    apiUsage: { requestsToday: 0, requestsMonth: 0, webhooksConfigured: 0, integrationsActive: [] },
  },
];

export default function TenantsPage() {
  const [tenants] = useState<Tenant[]>(mockTenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  const filteredTenants = tenants.filter(tenant => {
    const matchesSearch = tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tenant.slug.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tenant.status === statusFilter;
    const matchesPlan = planFilter === 'all' || tenant.plan === planFilter;
    return matchesSearch && matchesStatus && matchesPlan;
  });

  const totalMRR = tenants.reduce((sum, t) => sum + t.mrr, 0);
  const activeTenants = tenants.filter(t => t.status === 'active').length;
  const trialTenants = tenants.filter(t => t.status === 'trial').length;

  const getPlanBadge = (plan: Tenant['plan']) => {
    const styles = {
      starter: 'bg-gray-100 text-gray-800',
      professional: 'bg-blue-100 text-blue-800',
      enterprise: 'bg-purple-100 text-purple-800',
    };
    const labels = {
      starter: 'Starter',
      professional: 'Professional',
      enterprise: 'Enterprise',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[plan]}`}>
        {labels[plan]}
      </span>
    );
  };

  const getStatusBadge = (status: Tenant['status']) => {
    const styles = {
      active: 'bg-green-100 text-green-800',
      trial: 'bg-yellow-100 text-yellow-800',
      suspended: 'bg-red-100 text-red-800',
      cancelled: 'bg-gray-100 text-gray-500',
    };
    const labels = {
      active: 'Activo',
      trial: 'Trial',
      suspended: 'Suspendido',
      cancelled: 'Cancelado',
    };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {labels[status]}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatLastActivity = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffHours < 1) return 'Hace unos minutos';
    if (diffHours < 24) return `Hace ${diffHours}h`;
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return formatDate(dateString);
  };

  return (
    <>
      {/* Mock Data Indicator */}
      <div className="mb-4 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg flex items-center gap-2">
        <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        <span className="text-amber-500 text-sm font-medium">Mock Data - Desarrollo</span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Total Tenants</p>
              <p className="text-2xl font-bold text-white mt-1">{tenants.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Activos</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{activeTenants}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">En Trial</p>
              <p className="text-2xl font-bold text-yellow-400 mt-1">{trialTenants}</p>
            </div>
            <div className="w-10 h-10 bg-yellow-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">MRR Total</p>
              <p className="text-2xl font-bold text-white mt-1">€{totalMRR.toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Filters & Actions */}
      <div className="bg-slate-800 rounded-xl border border-slate-700 mb-6">
        <div className="p-4 border-b border-slate-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Buscar por nombre, email o slug..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
              className="px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="all">Todos los planes</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nuevo Tenant
            </button>
          </div>
        </div>

        {/* Tenants Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Tenant</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Plan</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Estado</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Usuarios</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Alumnos</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">MRR</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Última Actividad</th>
                <th className="text-left px-6 py-3 text-xs font-medium text-slate-400 uppercase tracking-wider">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-slate-750 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                        {tenant.logoUrl ? (
                          <span className="text-white font-bold">{tenant.name.charAt(0)}</span>
                        ) : (
                          <span className="text-slate-400 font-bold">{tenant.name.charAt(0)}</span>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{tenant.name}</p>
                        <p className="text-slate-400 text-sm">{tenant.slug}.akademate.com</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">{getPlanBadge(tenant.plan)}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      {getStatusBadge(tenant.status)}
                      {tenant.status === 'trial' && tenant.trialEndsAt && (
                        <span className="text-xs text-slate-400">
                          Expira: {formatDate(tenant.trialEndsAt)}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300">{tenant.usersCount}</div>
                    <div className="text-xs text-slate-500">{tenant.sitesCount} sedes</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300">{tenant.studentsCount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`font-medium ${tenant.mrr > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                      {tenant.mrr > 0 ? `€${tenant.mrr}/mo` : 'Trial'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-slate-400 text-sm">{formatLastActivity(tenant.lastActivity)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedTenant(tenant)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors"
                        title="Ver detalles"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded transition-colors" title="Editar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-700 rounded transition-colors" title="Impersonar">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                      </button>
                      <button className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded transition-colors" title="Suspender">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tenant Detail Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-slate-700 flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{selectedTenant.name.charAt(0)}</span>
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">{selectedTenant.name}</h2>
                  <p className="text-slate-400 text-sm">{selectedTenant.slug}.akademate.com</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTenant(null)}
                className="p-2 text-slate-400 hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-750 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Plan</p>
                  <div className="mt-1">{getPlanBadge(selectedTenant.plan)}</div>
                </div>
                <div className="bg-slate-750 p-4 rounded-lg">
                  <p className="text-slate-400 text-sm">Estado</p>
                  <div className="mt-1">{getStatusBadge(selectedTenant.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4">
                <div className="bg-slate-750 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant.usersCount}</p>
                  <p className="text-slate-400 text-sm">Usuarios</p>
                </div>
                <div className="bg-slate-750 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant.coursesCount}</p>
                  <p className="text-slate-400 text-sm">Cursos</p>
                </div>
                <div className="bg-slate-750 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant.studentsCount.toLocaleString()}</p>
                  <p className="text-slate-400 text-sm">Alumnos</p>
                </div>
                <div className="bg-slate-750 p-4 rounded-lg text-center">
                  <p className="text-2xl font-bold text-white">{selectedTenant.sitesCount}</p>
                  <p className="text-slate-400 text-sm">Sedes</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-400">Email</span>
                  <span className="text-white">{selectedTenant.email}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-400">Teléfono</span>
                  <span className="text-white">{selectedTenant.phone}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-400">Fecha de Alta</span>
                  <span className="text-white">{formatDate(selectedTenant.createdAt)}</span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-700">
                  <span className="text-slate-400">MRR</span>
                  <span className={`font-medium ${selectedTenant.mrr > 0 ? 'text-green-400' : 'text-slate-400'}`}>
                    {selectedTenant.mrr > 0 ? `€${selectedTenant.mrr}/mes` : 'Trial Gratuito'}
                  </span>
                </div>
              </div>

              {/* API Usage Section */}
              <div className="bg-slate-900 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium flex items-center gap-2">
                    <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                    </svg>
                    Uso de API
                  </h3>
                  <span className="text-xs text-slate-500">{selectedTenant.apiKeys.length} API Keys</span>
                </div>

                {/* API Stats */}
                <div className="grid grid-cols-3 gap-3 mb-4">
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <p className="text-lg font-bold text-blue-400">{selectedTenant.apiUsage.requestsToday.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Requests Hoy</p>
                  </div>
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <p className="text-lg font-bold text-green-400">{selectedTenant.apiUsage.requestsMonth.toLocaleString()}</p>
                    <p className="text-xs text-slate-500">Requests/Mes</p>
                  </div>
                  <div className="bg-slate-800 rounded p-3 text-center">
                    <p className="text-lg font-bold text-purple-400">{selectedTenant.apiUsage.webhooksConfigured}</p>
                    <p className="text-xs text-slate-500">Webhooks</p>
                  </div>
                </div>

                {/* Integrations */}
                {selectedTenant.apiUsage.integrationsActive.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs text-slate-500 mb-2">Integraciones Activas</p>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedTenant.apiUsage.integrationsActive.map((integration) => (
                        <span key={integration} className="px-2 py-0.5 bg-indigo-500/20 text-indigo-300 rounded text-xs">
                          {integration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* API Keys List */}
                {selectedTenant.apiKeys.length > 0 && (
                  <div>
                    <p className="text-xs text-slate-500 mb-2">API Keys</p>
                    <div className="space-y-2">
                      {selectedTenant.apiKeys.map((apiKey) => (
                        <div key={apiKey.id} className="flex items-center justify-between bg-slate-800 rounded p-2">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apiKey.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span className="text-sm text-white">{apiKey.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-xs text-slate-500 font-mono">{apiKey.key.substring(0, 20)}...</span>
                            <span className="text-xs text-slate-400">{apiKey.requestsToday} req/día</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedTenant.apiKeys.length === 0 && (
                  <p className="text-center text-slate-500 text-sm py-2">Sin API Keys configuradas</p>
                )}
              </div>

              <div className="flex gap-3">
                <button className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                  Acceder al Panel
                </button>
                <button className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors">
                  Editar
                </button>
                <button className="px-4 py-2 bg-red-600/20 text-red-400 rounded-lg hover:bg-red-600/30 transition-colors">
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
          <div className="bg-slate-800 rounded-xl border border-slate-700 w-full max-w-lg mx-4">
            <div className="p-6 border-b border-slate-700">
              <h2 className="text-xl font-bold text-white">Crear Nuevo Tenant</h2>
              <p className="text-slate-400 text-sm mt-1">Configura una nueva academia en la plataforma</p>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Nombre de la Academia</label>
                <input
                  type="text"
                  placeholder="Ej: Academia Central"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Slug (URL)</label>
                <div className="flex items-center">
                  <input
                    type="text"
                    placeholder="academia-central"
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-l-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="px-4 py-2 bg-slate-600 border border-slate-600 rounded-r-lg text-slate-300">.akademate.com</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email de Contacto</label>
                <input
                  type="email"
                  placeholder="admin@academia.es"
                  className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Plan Inicial</label>
                <select className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="trial">Trial (14 días gratis)</option>
                  <option value="starter">Starter - €99/mes</option>
                  <option value="professional">Professional - €299/mes</option>
                  <option value="enterprise">Enterprise - €599/mes</option>
                </select>
              </div>
            </div>
            <div className="p-6 border-t border-slate-700 flex justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors"
              >
                Cancelar
              </button>
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Crear Tenant
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
