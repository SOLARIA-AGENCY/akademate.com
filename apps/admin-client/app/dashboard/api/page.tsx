'use client';

import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/page-header';

interface Endpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  auth: boolean;
}

interface ApiKey {
  id: string;
  name: string;
  key: string;
  tenant: string;
  permissions: string[];
  createdAt: string;
  lastUsed: string | null;
  requestsToday: number;
  status: 'active' | 'revoked';
}

interface ApiStats {
  period: string;
  summary: {
    totalRequests: number;
    avgLatencyMs: number;
    errorRate: number;
    errorCount: number;
  };
  topEndpoints: { path: string; method: string; requests: number; avgLatencyMs: number }[];
  topIps: { ip: string; requests: number }[];
  byStatus: { status: number; count: number }[];
}

interface LogEntry {
  id: string;
  method: string;
  path: string;
  status: number;
  latencyMs: number;
  ip: string | null;
  userAgent: string | null;
  tenantId: string | null;
  createdAt: string;
}

interface LogsResponse {
  docs: LogEntry[];
  total: number;
  page: number;
  totalPages: number;
}

const ENDPOINTS: Endpoint[] = [
  { id: 'auth-session', name: 'Sesión actual', method: 'GET', path: '/api/auth/session', description: 'Devuelve la sesión activa del usuario autenticado', category: 'Auth', auth: true },
  { id: 'auth-all', name: 'Better Auth handler', method: 'POST', path: '/api/auth/[...all]', description: 'Endpoints de Better Auth: sign-in, sign-out, session management', category: 'Auth', auth: false },
  { id: 'ops-health', name: 'Health check', method: 'GET', path: '/api/ops/health', description: 'Estado de salud del servicio: Payload CMS + Auth', category: 'Ops', auth: true },
  { id: 'ops-metrics', name: 'Métricas globales', method: 'GET', path: '/api/ops/metrics', description: 'Contadores globales: tenants, usuarios, cursos, matrículas', category: 'Ops', auth: true },
  { id: 'ops-tenants', name: 'Listado de tenants', method: 'GET', path: '/api/ops/tenants', description: 'Lista paginada de tenants con estado y plan. Soporta ?limit= y ?page=', category: 'Ops', auth: true },
  { id: 'ops-weekly-activity', name: 'Actividad semanal', method: 'GET', path: '/api/ops/weekly-activity', description: 'Conteo diario de tenants y usuarios creados en la semana actual', category: 'Ops', auth: true },
  { id: 'ops-readiness-score', name: 'Enterprise readiness score', method: 'GET', path: '/api/ops/readiness-score', description: 'Puntuación 0-100 de madurez del sistema', category: 'Ops', auth: true },
  { id: 'ops-server-metrics', name: 'Métricas del servidor', method: 'GET', path: '/api/ops/server-metrics', description: 'CPU, memoria, uptime. Usa Hetzner Cloud API si hay token', category: 'Ops', auth: true },
  { id: 'ops-service-health', name: 'Estado de servicios', method: 'GET', path: '/api/ops/service-health', description: 'Checks reales de DB, Payload CMS, S3', category: 'Ops', auth: true },
  { id: 'ops-api-stats', name: 'Estadísticas de API', method: 'GET', path: '/api/ops/api-stats', description: 'Requests totales, latencia, tasa de error, top endpoints/IPs', category: 'Ops', auth: true },
  { id: 'ops-logs', name: 'Logs de requests', method: 'GET', path: '/api/ops/logs', description: 'Historial de requests con filtros por path, método, status, IP', category: 'Ops', auth: true },
  { id: 'ops-api-keys', name: 'API Keys', method: 'GET', path: '/api/ops/api-keys', description: 'Listado de API keys activas (stub)', category: 'Ops', auth: true },
  { id: 'profile-get', name: 'Perfil de usuario', method: 'GET', path: '/api/ops/profile', description: 'Devuelve nombre, email e imagen del usuario autenticado', category: 'Profile', auth: true },
  { id: 'profile-patch', name: 'Actualizar perfil', method: 'PATCH', path: '/api/ops/profile', description: 'Actualiza el nombre del usuario. Body: { name: string }', category: 'Profile', auth: true },
  { id: 'change-password', name: 'Cambiar contraseña', method: 'POST', path: '/api/ops/change-password', description: 'Cambia la contraseña del usuario', category: 'Profile', auth: true },
  { id: 'upload', name: 'Upload de archivo', method: 'POST', path: '/api/upload', description: 'Sube un archivo directamente al servidor', category: 'Upload', auth: true },
  { id: 'upload-presign', name: 'Presigned URL', method: 'POST', path: '/api/upload/presign', description: 'Genera URL prefirmada para subida directa a S3/R2', category: 'Upload', auth: true },
];

export default function ApiPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'keys' | 'logs'>('endpoints');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResponse, setTestResponse] = useState<string>('');
  const [isTestLoading, setIsTestLoading] = useState(false);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [stats, setStats] = useState<ApiStats | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [logs, setLogs] = useState<LogsResponse | null>(null);
  const [logsLoading, setLogsLoading] = useState(false);
  const [logFilters, setLogFilters] = useState({ path: '', method: '', status: '', ip: '', hours: '24' });

  useEffect(() => {
    fetch('/api/ops/api-keys')
      .then((res) => res.ok ? res.json() : [])
      .then((data) => setApiKeys(Array.isArray(data) ? data : []))
      .catch(() => setApiKeys([]));

    fetch('/api/ops/api-stats?hours=24')
      .then((res) => res.ok ? res.json() : null)
      .then((data) => { if (data) setStats(data); })
      .catch(() => {})
      .finally(() => setStatsLoading(false));
  }, []);

  const fetchLogs = useCallback(async () => {
    setLogsLoading(true);
    const params = new URLSearchParams({ limit: '50', page: '1', hours: logFilters.hours });
    if (logFilters.path) params.set('path', logFilters.path);
    if (logFilters.method) params.set('method', logFilters.method);
    if (logFilters.status) params.set('status', logFilters.status);
    if (logFilters.ip) params.set('ip', logFilters.ip);

    try {
      const res = await fetch(`/api/ops/logs?${params}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch {
      /* ignore */
    } finally {
      setLogsLoading(false);
    }
  }, [logFilters]);

  useEffect(() => {
    if (activeTab === 'logs') fetchLogs();
  }, [activeTab, fetchLogs]);

  const categories = ['all', ...Array.from(new Set(ENDPOINTS.map(e => e.category)))];
  const filteredEndpoints = selectedCategory === 'all'
    ? ENDPOINTS
    : ENDPOINTS.filter(e => e.category === selectedCategory);

  const getMethodColor = (method: string) => {
    const colors: Record<string, string> = {
      GET: 'bg-green-500/20 text-green-400 border-green-500/30',
      POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[method] ?? 'bg-gray-500/20 text-gray-400';
  };

  const getStatusColor = (status: number) => {
    if (status < 300) return 'text-green-400';
    if (status < 400) return 'text-blue-400';
    if (status < 500) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleTestRequest = async () => {
    if (!selectedEndpoint) return;
    setIsTestLoading(true);
    setTestResponse('');
    const start = Date.now();
    try {
      // Only GET endpoints without dynamic segments can be tested directly
      const path = selectedEndpoint.path.includes('[') ? '/api/ops/health' : selectedEndpoint.path;
      const res = await fetch(path, { method: selectedEndpoint.method === 'GET' ? 'GET' : 'GET' });
      const latency = Date.now() - start;
      let body: unknown;
      try { body = await res.json(); } catch { body = await res.text(); }
      setTestResponse(JSON.stringify({ status: res.status, latencyMs: latency, body }, null, 2));
    } catch (err) {
      setTestResponse(JSON.stringify({ error: err instanceof Error ? err.message : 'Error de red' }, null, 2));
    }
    setIsTestLoading(false);
  };

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <>
      <PageHeader
        title="API Console"
        description="Explora, prueba y gestiona las APIs de Akademate"
      />

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Endpoints</p>
          <p className="text-2xl font-bold text-foreground mt-1">{ENDPOINTS.length}</p>
          <p className="text-xs text-muted-foreground mt-1">Catalogados</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Requests (24h)</p>
          <p className="text-2xl font-bold text-blue-400 mt-1">
            {statsLoading ? '—' : (stats?.summary.totalRequests ?? 0).toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {stats ? `${stats.summary.errorCount} errores` : '—'}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Latencia media</p>
          <p className="text-2xl font-bold text-purple-400 mt-1">
            {statsLoading ? '—' : `${stats?.summary.avgLatencyMs ?? 0}ms`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">Últimas 24h</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-5">
          <p className="text-muted-foreground text-sm">Tasa de error</p>
          <p className={`text-2xl font-bold mt-1 ${(stats?.summary.errorRate ?? 0) > 5 ? 'text-red-400' : 'text-green-400'}`}>
            {statsLoading ? '—' : `${stats?.summary.errorRate ?? 0}%`}
          </p>
          <p className="text-xs text-muted-foreground mt-1">HTTP 5xx</p>
        </div>
      </div>

      {/* Top endpoints */}
      {stats && stats.topEndpoints.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-3">Top Endpoints (24h)</h3>
          <div className="divide-y divide-border">
            {stats.topEndpoints.slice(0, 5).map((ep, i) => (
              <div key={i} className="flex items-center gap-3 py-2">
                <span className={`px-1.5 py-0.5 text-xs font-mono font-semibold rounded border shrink-0 ${getMethodColor(ep.method)}`}>
                  {ep.method}
                </span>
                <span className="font-mono text-sm text-foreground flex-1 truncate">{ep.path}</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{ep.requests.toLocaleString()} req</span>
                <span className="text-xs text-muted-foreground whitespace-nowrap">{ep.avgLatencyMs}ms</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Top IPs */}
      {stats && stats.topIps.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-5 mb-6">
          <h3 className="text-foreground font-semibold mb-3">Top IPs (24h)</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {stats.topIps.slice(0, 4).map((ip, i) => (
              <div key={i} className="p-3 bg-muted/20 rounded-lg">
                <p className="font-mono text-xs text-foreground">{ip.ip}</p>
                <p className="text-xs text-muted-foreground mt-1">{ip.requests.toLocaleString()} requests</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 w-fit">
        {(['endpoints', 'keys', 'logs'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors capitalize ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab === 'endpoints' ? 'Endpoints' : tab === 'keys' ? 'API Keys' : 'Logs'}
          </button>
        ))}
      </div>

      {/* Endpoints tab */}
      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                  selectedCategory === cat
                    ? 'bg-indigo-600 text-white'
                    : 'bg-card border border-border text-muted-foreground hover:text-foreground'
                }`}
              >
                {cat === 'all' ? 'Todos' : cat}
              </button>
            ))}
          </div>
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {filteredEndpoints.map(endpoint => (
              <div
                key={endpoint.id}
                className={`p-4 flex items-start gap-4 hover:bg-muted/20 transition-colors cursor-pointer ${
                  selectedEndpoint?.id === endpoint.id ? 'bg-muted/30' : ''
                }`}
                onClick={() => setSelectedEndpoint(selectedEndpoint?.id === endpoint.id ? null : endpoint)}
              >
                <span className={`mt-0.5 px-2 py-0.5 text-xs font-mono font-semibold rounded border shrink-0 ${getMethodColor(endpoint.method)}`}>
                  {endpoint.method}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-sm text-foreground">{endpoint.path}</span>
                    <span className="text-xs text-muted-foreground">{endpoint.name}</span>
                    {endpoint.auth && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">Auth</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{endpoint.description}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded bg-muted/40 text-muted-foreground shrink-0">{endpoint.category}</span>
              </div>
            ))}
          </div>

          {selectedEndpoint && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded border ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-foreground">{selectedEndpoint.path}</span>
              </div>
              <p className="text-muted-foreground text-sm">{selectedEndpoint.description}</p>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Probar endpoint</p>
                <button
                  onClick={handleTestRequest}
                  disabled={isTestLoading}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium disabled:opacity-50"
                >
                  {isTestLoading ? 'Enviando...' : 'Enviar request'}
                </button>
                {testResponse && (
                  <pre className="mt-2 p-3 bg-muted/30 rounded-lg text-xs font-mono text-foreground overflow-auto max-h-48">
                    {testResponse}
                  </pre>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* API Keys tab */}
      {activeTab === 'keys' && (
        <div className="bg-card border border-border rounded-xl">
          <div className="p-4 border-b border-muted/30 flex justify-between items-center">
            <h3 className="text-foreground font-medium">API Keys</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium opacity-50 cursor-not-allowed" disabled>
              Nueva API Key
            </button>
          </div>
          <div className="p-8 text-center text-muted-foreground">
            <p className="text-sm">No hay API keys creadas.</p>
            <p className="text-xs mt-1">La gestión de API keys estará disponible próximamente.</p>
          </div>
          {apiKeys.map(key => (
            <div key={key.id} className="p-4 hover:bg-muted/30 border-t border-muted/20">
              <div className="flex items-center justify-between mb-2">
                <p className="text-foreground font-medium">{key.name}</p>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${key.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                  {key.status === 'active' ? 'Activa' : 'Revocada'}
                </span>
              </div>
              <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2">
                <span className="text-foreground font-mono text-sm flex-1">{key.key}</span>
                <button onClick={() => copyToClipboard(key.key)} className="p-1 text-muted-foreground hover:text-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Logs tab */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 flex flex-wrap gap-3 items-end">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Path</label>
              <input
                type="text"
                placeholder="/api/ops/..."
                value={logFilters.path}
                onChange={(e) => setLogFilters(f => ({ ...f, path: e.target.value }))}
                className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-48"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Método</label>
              <select
                value={logFilters.method}
                onChange={(e) => setLogFilters(f => ({ ...f, method: e.target.value }))}
                className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
              >
                <option value="">Todos</option>
                {['GET', 'POST', 'PUT', 'PATCH', 'DELETE'].map(m => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Status</label>
              <input
                type="text"
                placeholder="200"
                value={logFilters.status}
                onChange={(e) => setLogFilters(f => ({ ...f, status: e.target.value }))}
                className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-20"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">IP</label>
              <input
                type="text"
                placeholder="192.168..."
                value={logFilters.ip}
                onChange={(e) => setLogFilters(f => ({ ...f, ip: e.target.value }))}
                className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground outline-none w-32"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Período</label>
              <select
                value={logFilters.hours}
                onChange={(e) => setLogFilters(f => ({ ...f, hours: e.target.value }))}
                className="bg-muted/30 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground outline-none"
              >
                <option value="1">1h</option>
                <option value="6">6h</option>
                <option value="24">24h</option>
                <option value="168">7 días</option>
              </select>
            </div>
            <button
              onClick={fetchLogs}
              className="px-4 py-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 text-sm font-medium transition-colors"
            >
              Filtrar
            </button>
          </div>

          {/* Logs table */}
          <div className="bg-card border border-border rounded-xl overflow-hidden">
            <div className="p-3 border-b border-border flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {logs ? `${logs.total.toLocaleString()} requests` : 'Cargando...'}
              </p>
              <button onClick={fetchLogs} className="text-xs text-primary hover:underline">
                Actualizar
              </button>
            </div>
            {logsLoading ? (
              <div className="p-8 text-center text-muted-foreground text-sm">Cargando logs...</div>
            ) : logs && logs.docs.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p className="text-sm">Sin logs registrados.</p>
                <p className="text-xs mt-1">Los requests se registran automáticamente al usar la API.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/20 text-xs text-muted-foreground">
                    <tr>
                      <th className="px-4 py-2 text-left">Timestamp</th>
                      <th className="px-4 py-2 text-left">Método</th>
                      <th className="px-4 py-2 text-left">Path</th>
                      <th className="px-4 py-2 text-left">Status</th>
                      <th className="px-4 py-2 text-right">Latencia</th>
                      <th className="px-4 py-2 text-left">IP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {logs?.docs.map((log) => (
                      <tr key={log.id} className="hover:bg-muted/10">
                        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="px-4 py-2">
                          <span className={`px-1.5 py-0.5 text-xs font-mono font-semibold rounded border ${getMethodColor(log.method)}`}>
                            {log.method}
                          </span>
                        </td>
                        <td className="px-4 py-2 font-mono text-xs text-foreground max-w-xs truncate">{log.path}</td>
                        <td className={`px-4 py-2 font-mono text-sm font-semibold ${getStatusColor(log.status)}`}>
                          {log.status}
                        </td>
                        <td className="px-4 py-2 text-right text-xs text-muted-foreground">{log.latencyMs}ms</td>
                        <td className="px-4 py-2 font-mono text-xs text-muted-foreground">{log.ip ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
