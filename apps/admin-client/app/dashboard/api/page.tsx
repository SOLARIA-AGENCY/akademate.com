'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/page-header';

interface Endpoint {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  description: string;
  category: string;
  auth: boolean;
  params?: { name: string; type: string; required: boolean; description: string }[];
  body?: string;
  exampleResponse?: string;
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

export default function ApiPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'keys' | 'logs'>('endpoints');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResponse, setTestResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestBody, setRequestBody] = useState<string>('');
  const [requestHeaders, setRequestHeaders] = useState<string>('{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Content-Type": "application/json"\n}');
  const [mcpStatus, setMcpStatus] = useState<'idle' | 'connecting' | 'connected' | 'error'>('idle');
  const [mcpMessage, setMcpMessage] = useState<string | null>(null);
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);

  useEffect(() => {
    fetch('/api/ops/api-keys')
      .then((res) => {
        if (!res.ok) throw new Error('Not found')
        return res.json()
      })
      .then((data) => setApiKeys(Array.isArray(data) ? data : []))
      .catch(() => setApiKeys([]))
  }, []);

  const ENDPOINTS: Endpoint[] = [
    // Auth
    {
      id: 'auth-session',
      name: 'Sesión actual',
      method: 'GET',
      path: '/api/auth/session',
      description: 'Devuelve la sesión activa del usuario autenticado',
      category: 'Auth',
      auth: true,
    },
    {
      id: 'auth-all',
      name: 'Better Auth handler',
      method: 'POST',
      path: '/api/auth/[...all]',
      description: 'Endpoints de Better Auth: sign-in, sign-out, session management',
      category: 'Auth',
      auth: false,
    },
    // Ops
    {
      id: 'ops-health',
      name: 'Health check',
      method: 'GET',
      path: '/api/ops/health',
      description: 'Estado de salud del servicio: DB, Payload CMS, environment',
      category: 'Ops',
      auth: true,
    },
    {
      id: 'ops-metrics',
      name: 'Métricas globales',
      method: 'GET',
      path: '/api/ops/metrics',
      description: 'Contadores globales: tenants, usuarios, cursos, matrículas',
      category: 'Ops',
      auth: true,
    },
    {
      id: 'ops-tenants',
      name: 'Listado de tenants',
      method: 'GET',
      path: '/api/ops/tenants',
      description: 'Lista paginada de tenants con estado y plan. Soporta ?limit= y ?page=',
      category: 'Ops',
      auth: true,
    },
    {
      id: 'ops-weekly-activity',
      name: 'Actividad semanal',
      method: 'GET',
      path: '/api/ops/weekly-activity',
      description: 'Conteo diario de tenants y usuarios creados en la semana actual',
      category: 'Ops',
      auth: true,
    },
    {
      id: 'ops-readiness-score',
      name: 'Enterprise readiness score',
      method: 'GET',
      path: '/api/ops/readiness-score',
      description: 'Puntuación 0-100 de madurez del sistema basada en checks de infraestructura',
      category: 'Ops',
      auth: true,
    },
    {
      id: 'ops-server-metrics',
      name: 'Métricas del servidor',
      method: 'GET',
      path: '/api/ops/server-metrics',
      description: 'CPU, memoria, uptime del servidor. Usa Hetzner Cloud API si hay token configurado',
      category: 'Ops',
      auth: true,
    },
    // Profile
    {
      id: 'profile-get',
      name: 'Perfil de usuario',
      method: 'GET',
      path: '/api/ops/profile',
      description: 'Devuelve nombre, email e imagen del usuario autenticado',
      category: 'Profile',
      auth: true,
    },
    {
      id: 'profile-patch',
      name: 'Actualizar perfil',
      method: 'PATCH',
      path: '/api/ops/profile',
      description: 'Actualiza el nombre del usuario. Body: { name: string }',
      category: 'Profile',
      auth: true,
    },
    {
      id: 'change-password',
      name: 'Cambiar contraseña',
      method: 'POST',
      path: '/api/ops/change-password',
      description: 'Cambia la contraseña del usuario. Body: { currentPassword, newPassword }',
      category: 'Profile',
      auth: true,
    },
    // Upload
    {
      id: 'upload',
      name: 'Upload de archivo',
      method: 'POST',
      path: '/api/upload',
      description: 'Sube un archivo directamente al servidor',
      category: 'Upload',
      auth: true,
    },
    {
      id: 'upload-presign',
      name: 'Presigned URL',
      method: 'POST',
      path: '/api/upload/presign',
      description: 'Genera URL prefirmada para subida directa a S3/R2',
      category: 'Upload',
      auth: true,
    },
  ];

  const categories = ['all', ...Array.from(new Set(ENDPOINTS.map(e => e.category)))];
  const filteredEndpoints = selectedCategory === 'all'
    ? ENDPOINTS
    : ENDPOINTS.filter(e => e.category === selectedCategory);

  const rateLimits = [
    { plan: 'Free', limit: '0 calls/día', note: 'Sin API en free' },
    { plan: 'Starter', limit: '1K calls/día', note: 'Scopes básicos' },
    { plan: 'Pro', limit: '100K calls/día', note: 'Scopes completos + burst' },
    { plan: 'Enterprise', limit: 'Custom', note: 'Acordado por contrato' },
  ];

  const getMethodColor = (method: string) => {
    const colors = {
      GET: 'bg-green-500/20 text-green-400 border-green-500/30',
      POST: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      PUT: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      PATCH: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
      DELETE: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return colors[method as keyof typeof colors] || 'bg-gray-500/20 text-gray-400';
  };

  const handleTestRequest = async () => {
    if (!selectedEndpoint) return;

    setIsLoading(true);
    setTestResponse('');
    try {
      const res = await fetch('/api/ops/health');
      if (res.ok) {
        setTestResponse(JSON.stringify({ status: 'ok', message: 'Health check passed' }, null, 2));
      } else {
        setTestResponse(JSON.stringify({ status: 'error', message: `HTTP ${res.status}` }, null, 2));
      }
    } catch {
      setTestResponse(JSON.stringify({ status: 'error', message: 'No se pudo conectar con el servidor' }, null, 2));
    }
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const connectMcp = () => {
    setMcpStatus('connecting');
    setMcpMessage(null);
    fetch('/api/ops/health')
      .then((res) => {
        if (res.ok) {
          setMcpStatus('connected');
          setMcpMessage('Conectado. Implementa handshake/auth bearer real en el servidor MCP.');
        } else {
          setMcpStatus('error');
          setMcpMessage(`Error de conexión: HTTP ${res.status}`);
        }
      })
      .catch(() => {
        setMcpStatus('error');
        setMcpMessage('Error de conexión: no se pudo alcanzar el servidor.');
      });
  };

  return (
    <>
      <PageHeader
        title="API Console"
        description="Explora, prueba y gestiona las APIs de Akademate"
      />

      {/* MCP Server */}
      <div className="bg-muted/20 border border-muted/20 rounded-xl p-5 space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-muted-foreground">MCP Server</p>
            <h3 className="text-lg font-semibold text-foreground">Akademate MCP</h3>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              mcpStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300'
                : mcpStatus === 'connecting'
                  ? 'bg-amber-500/15 text-amber-300'
                  : mcpStatus === 'error'
                    ? 'bg-red-500/15 text-red-300'
                    : 'bg-muted/50 text-foreground'
            }`}
          >
            {mcpStatus === 'connected' ? 'Conectado' : mcpStatus === 'connecting' ? 'Conectando' : mcpStatus === 'error' ? 'Error' : 'Desconectado'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-foreground">
          <div className="p-3 rounded-lg bg-card border border-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Endpoint</p>
            <p className="font-mono break-all text-muted-foreground">Pendiente de configuración</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Token</p>
            <p className="font-mono break-all text-muted-foreground">Sin configurar</p>
          </div>
          <div className="p-3 rounded-lg bg-card border border-muted/20">
            <p className="text-xs text-muted-foreground mb-1">Handshake</p>
            <p className="text-muted-foreground text-sm">Pendiente de auth bearer + listado de resources/tools.</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={connectMcp}
            className="px-4 py-2 bg-indigo-600 text-foreground rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
            disabled={mcpStatus === 'connecting'}
          >
            {mcpStatus === 'connecting' ? 'Conectando...' : 'Verificar conexión'}
          </button>
        </div>
        {mcpMessage ? (
          <div className={`text-xs rounded-lg px-3 py-2 ${mcpStatus === 'error' ? 'text-red-300 bg-red-500/10 border border-red-500/20' : 'text-emerald-300 bg-emerald-500/10 border border-emerald-500/20'}`}>
            {mcpMessage}
          </div>
        ) : null}
        <p className="text-xs text-muted-foreground">
          Implementa el servidor MCP real con auth bearer y handshake; expone resources/tools y wirea el cliente SDK.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card border border-border rounded-xl p-5 rounded-xl border border-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Endpoints Disponibles</p>
              <p className="text-2xl font-bold text-foreground mt-1">{ENDPOINTS.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 rounded-xl border border-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">API Keys Activas</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{apiKeys.filter(k => k.status === 'active').length}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 rounded-xl border border-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Requests Hoy</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{apiKeys.reduce((sum, k) => sum + k.requestsToday, 0).toLocaleString() || '—'}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-5 rounded-xl border border-muted/30">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm">Latencia Media</p>
              <p className="text-2xl font-bold text-purple-400 mt-1">42ms</p>
            </div>
            <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* API limits & scopes */}
      <div className="bg-card border border-border rounded-xl p-5 rounded-xl border border-muted/30 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-foreground">API keys & rate limiting</h2>
            <p className="text-muted-foreground text-sm">Definir límites por plan y scopes granulares.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-amber-500/15 text-amber-400">Pendiente</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {rateLimits.map(limit => (
            <div key={limit.plan} className="p-4 rounded-lg bg-muted/20 border border-muted/20">
              <p className="text-foreground font-semibold">{limit.plan}</p>
              <p className="text-indigo-300 text-sm">{limit.limit}</p>
              <p className="text-xs text-muted-foreground mt-1">{limit.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Pendiente: generación/rotación de keys, scopes (read/write por recurso), rate limits en edge y logs de requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-card border border-border rounded-xl p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'endpoints' ? 'bg-indigo-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Endpoints
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'keys' ? 'bg-indigo-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'logs' ? 'bg-indigo-600 text-foreground' : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Logs
        </button>
      </div>

      {activeTab === 'endpoints' && (
        <div className="space-y-4">
          {/* Category filter */}
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

          {/* Endpoints list */}
          <div className="bg-card border border-border rounded-xl divide-y divide-border">
            {filteredEndpoints.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-muted-foreground text-sm">No hay endpoints en esta categoría.</p>
              </div>
            ) : (
              filteredEndpoints.map(endpoint => (
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
              ))
            )}
          </div>

          {/* Detail panel for selected endpoint */}
          {selectedEndpoint && (
            <div className="bg-card border border-border rounded-xl p-5 space-y-4">
              <div className="flex items-center gap-3">
                <span className={`px-2 py-0.5 text-xs font-mono font-semibold rounded border ${getMethodColor(selectedEndpoint.method)}`}>
                  {selectedEndpoint.method}
                </span>
                <span className="font-mono text-foreground">{selectedEndpoint.path}</span>
              </div>
              <p className="text-muted-foreground text-sm">{selectedEndpoint.description}</p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">Autenticación:</span>
                <span className={selectedEndpoint.auth ? 'text-amber-300' : 'text-muted-foreground'}>
                  {selectedEndpoint.auth ? 'Requerida' : 'No requerida'}
                </span>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground font-medium">Probar endpoint</p>
                <div className="flex gap-2">
                  <button
                    onClick={handleTestRequest}
                    disabled={isLoading}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium disabled:opacity-50"
                  >
                    {isLoading ? 'Enviando...' : 'Enviar request'}
                  </button>
                </div>
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

      {activeTab === 'keys' && (
        <div className="bg-card border border-border rounded-xl rounded-xl border border-muted/30">
          <div className="p-4 border-b border-muted/30 flex justify-between items-center">
            <h3 className="text-foreground font-medium">API Keys</h3>
            <button className="px-4 py-2 bg-indigo-600 text-foreground rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva API Key
            </button>
          </div>
          <div className="divide-y divide-muted/20">
            {apiKeys.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-sm">No hay API keys creadas.</p>
                <p className="text-xs mt-1">Usa el botón &quot;Nueva API Key&quot; para crear tu primera clave.</p>
              </div>
            )}
            {apiKeys.map(key => (
              <div key={key.id} className="p-4 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-muted/50 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-foreground font-medium">{key.name}</p>
                      <p className="text-muted-foreground text-sm">{key.tenant}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    key.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {key.status === 'active' ? 'Activa' : 'Revocada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-muted/20 rounded-lg px-3 py-2 mb-3">
                  <span className="text-foreground font-mono text-sm flex-1">{key.key}</span>
                  <button
                    onClick={() => copyToClipboard(key.key)}
                    className="p-1 text-muted-foreground hover:text-foreground"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-muted-foreground">Permisos:</span>
                    <span className="text-foreground ml-2">{key.permissions.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Requests hoy:</span>
                    <span className="text-foreground ml-2">{key.requestsToday.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Creada:</span>
                    <span className="text-foreground ml-2">{key.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-card border border-border rounded-xl rounded-xl border border-muted/30 p-8 text-center">
          <svg className="w-16 h-16 text-muted-foreground mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-foreground font-medium mb-2">Logs de API</h3>
          <p className="text-muted-foreground text-sm mb-4">Visualiza el historial de requests y respuestas de la API</p>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">Coming Soon</span>
        </div>
      )}
    </>
  );
}
