'use client';

import { useEffect, useMemo, useState } from 'react';
import { PageHeader } from '@/components/page-header';

interface Tenant {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  active: boolean;
  contactEmail: string | null;
  limits?: {
    maxUsers?: number | null;
    maxCourses?: number | null;
  };
  createdAt: string;
}

type AccessType = 'dashboard' | 'payload';

const FALLBACK_TENANT_BASE = process.env.NEXT_PUBLIC_TENANT_ADMIN_URL ?? 'http://akademate-tenant:3009';

function normalizeBaseUrl(input: string): string {
  const value = input.trim();
  if (!value) return FALLBACK_TENANT_BASE;
  if (value.startsWith('http://') || value.startsWith('https://')) return value.replace(/\/$/, '');
  return `https://${value}`.replace(/\/$/, '');
}

function getPreviewUrl(tenant: Tenant, accessType: AccessType): string {
  const base = tenant.domain ? normalizeBaseUrl(tenant.domain) : normalizeBaseUrl(FALLBACK_TENANT_BASE);
  return accessType === 'payload' ? `${base}/admin` : base;
}

function getEnvironment(tenant: Tenant): 'production' | 'staging' | 'development' {
  const base = getPreviewUrl(tenant, 'dashboard');
  if (base.includes('localhost') || base.includes('127.0.0.1') || base.startsWith('http://')) return 'development';
  if (base.includes('staging') || base.includes('preview') || base.includes('dev.')) return 'staging';
  return 'production';
}

export default function ImpersonarPage() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);
  const [accessType, setAccessType] = useState<AccessType>('dashboard');
  const [reason, setReason] = useState('');
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [viewMode, setViewMode] = useState<'cards' | 'list'>('list');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    reachable: boolean;
    status: number | null;
    checkedAt: string;
    url: string;
  } | null>(null);

  useEffect(() => {
    fetch('/api/ops/tenants?limit=100')
      .then((response) => response.json())
      .then((data) => setTenants(Array.isArray(data.docs) ? data.docs : []))
      .catch(() => setTenants([]))
      .finally(() => setLoading(false));
  }, []);

  const filteredTenants = useMemo(
    () =>
      tenants.filter(
        (tenant) =>
          tenant.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          tenant.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (tenant.contactEmail ?? '').toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    [searchTerm, tenants],
  );

  const handleImpersonate = (tenant: Tenant, type: AccessType) => {
    setSelectedTenant(tenant);
    setAccessType(type);
    setReason('');
    setError(null);
  };

  const confirmImpersonate = async () => {
    if (!selectedTenant) return;
    setIsImpersonating(true);
    setError(null);

    try {
      const response = await fetch('/api/ops/impersonation', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: selectedTenant.id,
          accessType,
          reason: reason.trim() || undefined,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'No se pudo iniciar la impersonacion');
        return;
      }

      setLastResult({
        reachable: Boolean(data.destination?.reachable),
        status: typeof data.destination?.status === 'number' ? data.destination.status : null,
        checkedAt: String(data.destination?.checkedAt || new Date().toISOString()),
        url: String(data.targetUrl),
      });

      window.open(String(data.targetUrl), '_blank', 'noopener,noreferrer');
      setSelectedTenant(null);
      setReason('');
    } catch {
      setError('Error de red al iniciar impersonacion');
    } finally {
      setIsImpersonating(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Impersonar Tenant"
        description="Acceso auditado a dashboard y admin de tenant"
      />

      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
        <h3 className="text-red-400 font-semibold">Acceso con privilegios elevados</h3>
        <p className="text-red-300/70 text-sm mt-1">
          Todas las acciones quedan auditadas por tenant, URL de destino y operador.
        </p>
      </div>

      <div className="relative">
        <input
          type="text"
          placeholder="Buscar por nombre, slug o email del admin..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="w-full px-4 py-3 bg-muted/50 border border-muted/30 rounded-xl text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        />
      </div>

      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Cargando...' : `${filteredTenants.length} tenant${filteredTenants.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-1">
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'list' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
          >
            Lista
          </button>
          <button
            onClick={() => setViewMode('cards')}
            className={`px-3 py-1 rounded-md text-sm ${viewMode === 'cards' ? 'bg-background text-foreground' : 'text-muted-foreground'}`}
          >
            Tarjetas
          </button>
        </div>
      </div>

      {lastResult && (
        <div className={`rounded-xl border p-4 ${lastResult.reachable ? 'bg-green-500/10 border-green-500/30' : 'bg-yellow-500/10 border-yellow-500/30'}`}>
          <p className="text-sm font-medium text-foreground">
            Ultima impersonacion: {lastResult.url}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Check destino: {lastResult.reachable ? 'reachable' : 'unreachable'}{lastResult.status ? ` (HTTP ${lastResult.status})` : ''} · {new Date(lastResult.checkedAt).toLocaleString('es-ES')}
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div key={item} className="bg-muted/30 rounded-xl h-16 animate-pulse" />
          ))}
        </div>
      ) : filteredTenants.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          {tenants.length === 0 ? 'No hay tenants registrados aún' : 'No se encontraron tenants con ese criterio'}
        </div>
      ) : viewMode === 'list' ? (
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
                    <p className="text-foreground font-medium">{tenant.name}</p>
                    <p className="text-muted-foreground text-xs">{tenant.slug}</p>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell text-sm text-muted-foreground">
                    {tenant.domain ?? `${tenant.slug}.akademate.com`}
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell text-sm text-muted-foreground">
                    {tenant.contactEmail ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    <span className={`inline-flex items-center text-xs font-medium px-2.5 py-1 rounded-full ${tenant.active ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                      {tenant.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden lg:table-cell text-sm text-muted-foreground">
                    {tenant.limits?.maxUsers ?? '—'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleImpersonate(tenant, 'dashboard')}
                        className="px-3 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-xs font-medium"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => handleImpersonate(tenant, 'payload')}
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-lg hover:bg-orange-500 transition-colors text-xs font-medium"
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTenants.map((tenant) => (
            <div key={tenant.id} className="bg-muted/50 backdrop-blur border border-muted/30 rounded-xl p-5">
              <h3 className="text-foreground font-semibold">{tenant.name}</h3>
              <p className="text-muted-foreground text-sm mt-1">{tenant.domain ?? `${tenant.slug}.akademate.com`}</p>
              <p className="text-muted-foreground text-xs mt-1">{tenant.contactEmail ?? 'Sin email'}</p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => handleImpersonate(tenant, 'dashboard')}
                  className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm"
                >
                  Dashboard
                </button>
                <button
                  onClick={() => handleImpersonate(tenant, 'payload')}
                  className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-500 text-sm"
                >
                  Payload
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedTenant && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full mx-4 shadow-2xl">
            {!isImpersonating ? (
              <>
                <h3 className="text-xl font-bold text-foreground">{selectedTenant.name}</h3>
                <p className="text-muted-foreground text-sm mt-1">
                  {selectedTenant.domain ?? `${selectedTenant.slug}.akademate.com`} · {getEnvironment(selectedTenant)}
                </p>

                <div className="mt-4 p-3 rounded-lg bg-muted/40 border border-border text-sm">
                  <p className="text-muted-foreground">Destino previsto</p>
                  <p className="font-mono text-foreground break-all mt-1">
                    {getPreviewUrl(selectedTenant, accessType)}
                  </p>
                </div>

                <div className="mt-4">
                  <label className="block text-sm font-medium text-foreground mb-2">Motivo (opcional)</label>
                  <textarea
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    rows={3}
                    className="w-full rounded-lg border border-border bg-muted/30 px-3 py-2 text-sm text-foreground"
                    placeholder="Ej. soporte de incidente P1 en login del tenant"
                  />
                </div>

                {error && <p className="text-sm text-red-500 mt-3">{error}</p>}

                <div className="flex gap-3 mt-6">
                  <button
                    onClick={() => setSelectedTenant(null)}
                    className="flex-1 px-4 py-3 bg-muted/50 text-foreground rounded-xl hover:bg-muted"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={confirmImpersonate}
                    className={`flex-1 px-4 py-3 text-white rounded-xl ${
                      accessType === 'payload' ? 'bg-orange-600 hover:bg-orange-500' : 'bg-indigo-600 hover:bg-indigo-500'
                    }`}
                  >
                    {accessType === 'payload' ? 'Abrir Payload Admin' : 'Abrir Dashboard'}
                  </button>
                </div>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-foreground font-semibold">Creando sesion de impersonacion...</p>
                <p className="text-muted-foreground text-sm mt-1">Auditando y validando destino</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
