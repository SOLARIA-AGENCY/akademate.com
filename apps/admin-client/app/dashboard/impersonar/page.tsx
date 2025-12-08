'use client';

import { useState } from 'react';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: 'starter' | 'professional' | 'enterprise';
  status: 'active' | 'trial' | 'suspended' | 'cancelled';
  adminEmail: string;
  dashboardUrl: string;
  payloadAdminUrl: string;
  usersCount: number;
  lastAccess: string;
}

const mockTenants: Tenant[] = [
  {
    id: '1',
    name: 'CEP Formacion',
    slug: 'cep-formacion',
    plan: 'professional',
    status: 'active',
    adminEmail: 'admin@cepformacion.com',
    dashboardUrl: 'http://localhost:3002',
    payloadAdminUrl: 'http://localhost:3002/admin',
    usersCount: 12,
    lastAccess: '2025-12-07 10:30',
  },
  {
    id: '2',
    name: 'Academia Madrid',
    slug: 'academia-madrid',
    plan: 'starter',
    status: 'trial',
    adminEmail: 'admin@academiamadrid.com',
    dashboardUrl: 'http://localhost:3002',
    payloadAdminUrl: 'http://localhost:3002/admin',
    usersCount: 3,
    lastAccess: '2025-12-06 18:45',
  },
  {
    id: '3',
    name: 'Instituto Barcelona',
    slug: 'instituto-barcelona',
    plan: 'enterprise',
    status: 'active',
    adminEmail: 'admin@institutobarcelona.com',
    dashboardUrl: 'http://localhost:3002',
    payloadAdminUrl: 'http://localhost:3002/admin',
    usersCount: 28,
    lastAccess: '2025-12-07 09:15',
  },
];

type AccessType = 'dashboard' | 'payload';

export default function ImpersonarPage() {
  const [tenants] = useState<Tenant[]>(mockTenants);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [accessType, setAccessType] = useState<AccessType>('dashboard');
  const [isImpersonating, setIsImpersonating] = useState(false);

  const filteredTenants = tenants.filter(t =>
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.adminEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleImpersonate = (tenant: Tenant, type: AccessType) => {
    setSelectedTenant(tenant);
    setAccessType(type);
  };

  const confirmImpersonate = () => {
    if (!selectedTenant) return;
    setIsImpersonating(true);

    // Simulate impersonation process
    setTimeout(() => {
      // In production: Set impersonation token/cookie and redirect
      const url = accessType === 'payload' ? selectedTenant.payloadAdminUrl : selectedTenant.dashboardUrl;
      window.open(url, '_blank');
      setIsImpersonating(false);
      setSelectedTenant(null);
    }, 1500);
  };

  const getStatusColor = (status: Tenant['status']) => {
    const colors = {
      active: 'bg-green-500',
      trial: 'bg-yellow-500',
      suspended: 'bg-red-500',
      cancelled: 'bg-slate-500',
    };
    return colors[status];
  };

  const getPlanBadge = (plan: Tenant['plan']) => {
    const styles = {
      starter: 'bg-slate-600 text-slate-200',
      professional: 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30',
      enterprise: 'bg-purple-600/20 text-purple-400 border border-purple-500/30',
    };
    return styles[plan];
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Impersonar Tenant</h1>
          <p className="text-slate-400 mt-1">Accede al dashboard de Payload CMS como administrador del tenant</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/20 rounded-lg">
          <svg className="w-4 h-4 text-amber-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          <span className="text-amber-500 text-sm font-medium">Modo Super Admin</span>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div>
            <h3 className="text-red-400 font-semibold">Acceso con privilegios elevados</h3>
            <p className="text-red-300/70 text-sm mt-1">
              Al impersonar un tenant, tendras acceso completo a su base de datos, configuraciones y datos de usuarios.
              Todas las acciones quedaran registradas en el log de auditoria.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, slug o email del admin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <div
            key={tenant.id}
            className="bg-slate-800/50 backdrop-blur border border-slate-700/50 rounded-xl p-5 hover:border-indigo-500/50 transition-all"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">{tenant.name.charAt(0)}</span>
                </div>
                <div>
                  <h3 className="text-white font-semibold">{tenant.name}</h3>
                  <p className="text-slate-500 text-sm">{tenant.slug}.akademate.com</p>
                </div>
              </div>
              <div className={`w-3 h-3 rounded-full ${getStatusColor(tenant.status)}`} title={tenant.status}></div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Plan</span>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPlanBadge(tenant.plan)}`}>
                  {tenant.plan.charAt(0).toUpperCase() + tenant.plan.slice(1)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Admin</span>
                <span className="text-slate-300">{tenant.adminEmail}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Usuarios</span>
                <span className="text-slate-300">{tenant.usersCount}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-400">Ultimo acceso</span>
                <span className="text-slate-300">{tenant.lastAccess}</span>
              </div>
            </div>

            <div className="space-y-2">
              <button
                onClick={() => handleImpersonate(tenant, 'dashboard')}
                className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                </svg>
                Dashboard CMS
              </button>
              <button
                onClick={() => handleImpersonate(tenant, 'payload')}
                className="w-full px-4 py-2.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-sm font-medium flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
                </svg>
                Payload Admin (DB)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Impersonation Confirmation Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {!isImpersonating ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{selectedTenant.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">{selectedTenant.name}</h3>
                    <p className="text-slate-400 text-sm">{selectedTenant.slug}.akademate.com</p>
                  </div>
                </div>

                {/* Access Type Badge */}
                <div className={`mb-4 px-4 py-2 rounded-lg text-center font-medium ${
                  accessType === 'payload'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {accessType === 'payload' ? 'Acceso Payload Admin (Base de Datos)' : 'Acceso Dashboard CMS'}
                </div>

                <div className="bg-slate-900/50 rounded-xl p-4 mb-6">
                  <h4 className="text-white font-medium mb-3">Acceso que obtendras:</h4>
                  {accessType === 'payload' ? (
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Panel nativo de Payload CMS
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Acceso DIRECTO a todas las colecciones
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        CRUD completo en base de datos
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Gestion de Media, Users, Config
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-red-300">Puede modificar/eliminar datos permanentemente</span>
                      </li>
                    </ul>
                  ) : (
                    <ul className="space-y-2 text-sm text-slate-300">
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Dashboard personalizado del tenant
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Gestion de Cursos, Ciclos, Leads
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Planner y Convocatorias
                      </li>
                      <li className="flex items-center gap-2">
                        <svg className="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Interfaz amigable para gestores
                      </li>
                    </ul>
                  )}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="flex-1 px-4 py-3 bg-slate-700 text-white rounded-xl hover:bg-slate-600 transition-colors font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImpersonate}
                    className={`flex-1 px-4 py-3 text-white rounded-xl transition-colors font-medium flex items-center justify-center gap-2 ${
                      accessType === 'payload'
                        ? 'bg-orange-600 hover:bg-orange-500'
                        : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {accessType === 'payload' ? 'Abrir Payload Admin' : 'Abrir Dashboard'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="w-8 h-8 text-indigo-400 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Iniciando sesion...</h3>
                <p className="text-slate-400">Accediendo como admin de {selectedTenant.name}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Info Panel */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-5">
        <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Como funciona la impersonacion
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 font-bold">1</span>
            </div>
            <div>
              <p className="text-white font-medium">Selecciona tenant</p>
              <p className="text-slate-400">Elige la academia a la que quieres acceder</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 font-bold">2</span>
            </div>
            <div>
              <p className="text-white font-medium">Confirma acceso</p>
              <p className="text-slate-400">Se generara un token temporal de acceso</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-indigo-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-indigo-400 font-bold">3</span>
            </div>
            <div>
              <p className="text-white font-medium">Accede al CMS</p>
              <p className="text-slate-400">Payload CMS se abrira en nueva pestana</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
