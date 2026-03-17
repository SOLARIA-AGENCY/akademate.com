'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  active: boolean;
  contactEmail: string | null;
  limits: {
    maxUsers: number;
    maxCourses: number;
  };
  createdAt: string;
}

type AccessType = 'dashboard' | 'payload';

const TENANT_ADMIN_URL =
  process.env.NEXT_PUBLIC_TENANT_ADMIN_URL ?? 'http://akademate-tenant:3009';

function getTenantDashboardUrl(tenant: Tenant): string {
  if (tenant.domain) return `https://${tenant.domain}`;
  return `${TENANT_ADMIN_URL}`;
}

function getTenantPayloadUrl(tenant: Tenant): string {
  if (tenant.domain) return `https://${tenant.domain}/admin`;
  return `${TENANT_ADMIN_URL}/admin`;
}

export default function ImpersonarPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [accessType, setAccessType] = useState<AccessType>('dashboard');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');

  useEffect(() => {
    fetch('/api/ops/tenants?limit=100')
      .then((r) => r.json())
      .then((data) => setTenants(Array.isArray(data.docs) ? data.docs : []))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredTenants = tenants.filter(
    (t) =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.contactEmail ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const handleImpersonate = (tenant: Tenant, type: AccessType) => {
    setSelectedTenant(tenant);
    setAccessType(type);
  };

  const confirmImpersonate = () => {
    if (!selectedTenant) return;
    setIsImpersonating(true);
    setTimeout(() => {
      const url =
        accessType === 'payload'
          ? getTenantPayloadUrl(selectedTenant)
          : getTenantDashboardUrl(selectedTenant);
      window.open(url, '_blank');
      setIsImpersonating(false);
      setSelectedTenant(null);
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impersonar Tenant"
        description="Accede al dashboard de un tenant como super-administrador"
      />

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
              Al impersonar un tenant, tendrás acceso completo a su configuración y datos.
              Todas las acciones quedan registradas en el log de auditoría.
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Buscar por nombre, slug o email del admin..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-12 pr-4 py-3 bg-muted/50 border border-muted/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      {/* View Toggle + Count */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Cargando...' : `${filteredTenants.length} tenant${filteredTenants.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'list' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista de lista"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`p-2 rounded-md transition-colors ${viewMode === 'cards' ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            title="Vista de tarjetas"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
          </button>
        </div>
      </div>

      {/* Tenants */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-muted/30 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {tenants.length === 0
            ? 'No hay tenants registrados aún'
            : 'No se encontraron tenants con ese criterio'}
        </div>
      ) : viewMode === 'list' ? (
        /* ===== LIST VIEW ===== */
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Tenant</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden md:table-cell">Dominio</th>
                <th className="text-left text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Admin</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden sm:table-cell">Estado</th>
                <th className="text-center text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3 hidden lg:table-cell">Usuarios</th>
                <th className="text-right text-xs font-medium text-muted-foreground uppercase tracking-wider px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredTenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                        <span className="text-white font-bold text-sm">{tenant.name.charAt(0)}</span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-foreground font-medium truncate">{tenant.name}</p>
                        <p className="text-muted-foreground text-xs">{tenant.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-sm text-muted-foreground">{tenant.domain ?? `${tenant.slug}.akademate.com`}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground truncate block max-w-[180px]">{tenant.contactEmail ?? '—'}</span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full ${
                      tenant.active
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${tenant.active ? 'bg-green-500' : 'bg-red-500'}`} />
                      {tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell">
                    <span className="text-sm text-muted-foreground">{tenant.limits.maxUsers}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleImpersonate(tenant, 'dashboard')}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-xs font-medium"
                        title="Dashboard CMS"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleImpersonate(tenant, 'payload')}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-xs font-medium"
                        title="Payload Admin"
                      >
                        Payload
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        /* ===== CARDS VIEW ===== */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <div
              key={tenant.id}
              className="bg-muted/50 backdrop-blur border border-muted/30 rounded-xl p-5 hover:border-indigo-500/50 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{tenant.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-foreground font-semibold">{tenant.name}</h3>
                    <p className="text-muted-foreground text-sm">{tenant.domain ?? `${tenant.slug}.akademate.com`}</p>
                  </div>
                </div>
                <div
                  className={`w-3 h-3 rounded-full ${tenant.active ? 'bg-green-500' : 'bg-red-500'}`}
                  title={tenant.active ? 'Activo' : 'Inactivo'}
                />
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Admin</span>
                  <span className="text-foreground truncate max-w-[160px]">{tenant.contactEmail ?? '—'}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Límite usuarios</span>
                  <span className="text-foreground">{tenant.limits.maxUsers}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Registrado</span>
                  <span className="text-foreground">{new Date(tenant.createdAt).toLocaleDateString('es-ES')}</span>
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
      )}

      {/* Impersonation Confirmation Modal */}
      {selectedTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
            {!isImpersonating ? (
              <>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <span className="text-white font-bold text-xl">{selectedTenant.name.charAt(0)}</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-foreground">{selectedTenant.name}</h3>
                    <p className="text-muted-foreground text-sm">{selectedTenant.domain ?? `${selectedTenant.slug}.akademate.com`}</p>
                  </div>
                </div>
                <div className={`mb-4 px-4 py-2 rounded-lg text-center font-medium ${
                  accessType === 'payload'
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30'
                    : 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30'
                }`}>
                  {accessType === 'payload' ? 'Acceso Payload Admin (Base de Datos)' : 'Acceso Dashboard CMS'}
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="flex-1 px-4 py-3 bg-muted/50 text-foreground rounded-xl hover:bg-muted transition-colors font-medium"
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
                <h3 className="text-xl font-bold text-foreground mb-2">Iniciando sesión...</h3>
                <p className="text-muted-foreground">Accediendo como admin de {selectedTenant.name}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
