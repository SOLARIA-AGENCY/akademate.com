'use client';

import { useState } from 'react';

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

type McpServer = {
  name: string;
  endpoint: string;
  authToken: string;
  resources: string[];
  tools: string[];
};

const mockMcp: McpServer = {
  name: 'Akademate MCP',
  endpoint: 'mcp://api.akademate.com',
  authToken: 'mcp-dev-token-global-superadmin',
  resources: ['tenants', 'courses', 'leads', 'webhooks', 'jobs'],
  tools: ['list-tenants', 'impersonate-tenant', 'trigger-webhook', 'queue-job'],
};

const mockEndpoints: Endpoint[] = [
  // Authentication
  {
    id: '1',
    name: 'Login',
    method: 'POST',
    path: '/api/auth/login',
    description: 'Authenticate a user and get access token',
    category: 'Authentication',
    auth: false,
    body: '{\n  "email": "user@example.com",\n  "password": "your-password"\n}',
    exampleResponse: '{\n  "token": "eyJhbGciOiJIUzI1NiIs...",\n  "user": {\n    "id": "1",\n    "email": "user@example.com",\n    "role": "admin"\n  },\n  "expiresAt": "2025-12-08T12:00:00Z"\n}',
  },
  {
    id: '2',
    name: 'Refresh Token',
    method: 'POST',
    path: '/api/auth/refresh',
    description: 'Refresh an expired access token',
    category: 'Authentication',
    auth: true,
    exampleResponse: '{\n  "token": "eyJhbGciOiJIUzI1NiIs...",\n  "expiresAt": "2025-12-08T12:00:00Z"\n}',
  },
  // Tenants
  {
    id: '3',
    name: 'List Tenants',
    method: 'GET',
    path: '/api/tenants',
    description: 'Get all tenants (Super Admin only)',
    category: 'Tenants',
    auth: true,
    params: [
      { name: 'status', type: 'string', required: false, description: 'Filter by status (active, trial, suspended)' },
      { name: 'plan', type: 'string', required: false, description: 'Filter by plan (starter, professional, enterprise)' },
      { name: 'limit', type: 'number', required: false, description: 'Number of results (default: 20)' },
      { name: 'offset', type: 'number', required: false, description: 'Pagination offset' },
    ],
    exampleResponse: '{\n  "data": [\n    {\n      "id": "1",\n      "name": "CEP Formacion",\n      "slug": "cep-formacion",\n      "plan": "professional",\n      "status": "active"\n    }\n  ],\n  "total": 5,\n  "limit": 20,\n  "offset": 0\n}',
  },
  {
    id: '4',
    name: 'Get Tenant',
    method: 'GET',
    path: '/api/tenants/:id',
    description: 'Get a specific tenant by ID',
    category: 'Tenants',
    auth: true,
    params: [
      { name: 'id', type: 'string', required: true, description: 'Tenant ID' },
    ],
    exampleResponse: '{\n  "id": "1",\n  "name": "CEP Formacion",\n  "slug": "cep-formacion",\n  "email": "admin@cepformacion.es",\n  "plan": "professional",\n  "status": "active",\n  "usersCount": 12,\n  "coursesCount": 45\n}',
  },
  {
    id: '5',
    name: 'Create Tenant',
    method: 'POST',
    path: '/api/tenants',
    description: 'Create a new tenant',
    category: 'Tenants',
    auth: true,
    body: '{\n  "name": "New Academy",\n  "slug": "new-academy",\n  "email": "admin@newacademy.com",\n  "plan": "starter"\n}',
    exampleResponse: '{\n  "id": "6",\n  "name": "New Academy",\n  "slug": "new-academy",\n  "status": "trial",\n  "createdAt": "2025-12-08T10:00:00Z"\n}',
  },
  // Courses
  {
    id: '6',
    name: 'List Courses',
    method: 'GET',
    path: '/api/courses',
    description: 'Get all courses for current tenant',
    category: 'Courses',
    auth: true,
    params: [
      { name: 'type', type: 'string', required: false, description: 'Course type (telematico, ocupados, desempleados, privados)' },
      { name: 'status', type: 'string', required: false, description: 'Status (draft, published, archived)' },
    ],
    exampleResponse: '{\n  "data": [\n    {\n      "id": "1",\n      "title": "Marketing Digital",\n      "type": "ocupados",\n      "hours": 40,\n      "price": 299\n    }\n  ],\n  "total": 45\n}',
  },
  {
    id: '7',
    name: 'Create Course',
    method: 'POST',
    path: '/api/courses',
    description: 'Create a new course',
    category: 'Courses',
    auth: true,
    body: '{\n  "title": "New Course",\n  "description": "Course description",\n  "type": "ocupados",\n  "hours": 40,\n  "price": 299,\n  "siteIds": ["1", "2"]\n}',
    exampleResponse: '{\n  "id": "46",\n  "title": "New Course",\n  "slug": "new-course",\n  "status": "draft",\n  "createdAt": "2025-12-08T10:00:00Z"\n}',
  },
  // Students
  {
    id: '8',
    name: 'List Students',
    method: 'GET',
    path: '/api/students',
    description: 'Get all students for current tenant',
    category: 'Students',
    auth: true,
    params: [
      { name: 'search', type: 'string', required: false, description: 'Search by name or email' },
      { name: 'courseId', type: 'string', required: false, description: 'Filter by course enrollment' },
    ],
    exampleResponse: '{\n  "data": [\n    {\n      "id": "1",\n      "name": "Juan Garcia",\n      "email": "juan@example.com",\n      "enrollments": 3\n    }\n  ],\n  "total": 1234\n}',
  },
  // Leads
  {
    id: '9',
    name: 'List Leads',
    method: 'GET',
    path: '/api/leads',
    description: 'Get all leads for current tenant',
    category: 'Leads',
    auth: true,
    params: [
      { name: 'status', type: 'string', required: false, description: 'Lead status (new, contacted, qualified, converted)' },
      { name: 'source', type: 'string', required: false, description: 'Lead source (web, meta_ads, google_ads)' },
    ],
    exampleResponse: '{\n  "data": [\n    {\n      "id": "1",\n      "name": "Maria Lopez",\n      "email": "maria@example.com",\n      "phone": "+34666123456",\n      "source": "meta_ads",\n      "status": "new"\n    }\n  ],\n  "total": 156\n}',
  },
  {
    id: '10',
    name: 'Create Lead',
    method: 'POST',
    path: '/api/leads',
    description: 'Create a new lead (webhook compatible)',
    category: 'Leads',
    auth: true,
    body: '{\n  "name": "New Lead",\n  "email": "lead@example.com",\n  "phone": "+34666123456",\n  "source": "web",\n  "courseInterest": "Marketing Digital",\n  "utmSource": "google",\n  "utmCampaign": "summer_promo"\n}',
    exampleResponse: '{\n  "id": "157",\n  "name": "New Lead",\n  "status": "new",\n  "createdAt": "2025-12-08T10:00:00Z"\n}',
  },
  // Webhooks
  {
    id: '11',
    name: 'Meta Ads Webhook',
    method: 'POST',
    path: '/api/webhooks/meta',
    description: 'Receive leads from Meta Ads Lead Forms',
    category: 'Webhooks',
    auth: false,
    body: '{\n  "entry": [{\n    "changes": [{\n      "value": {\n        "leadgen_id": "123456789",\n        "form_id": "987654321"\n      }\n    }]\n  }]\n}',
    exampleResponse: '{\n  "status": "received",\n  "leadId": "158"\n}',
  },
];

const mockApiKeys: ApiKey[] = [
  {
    id: '1',
    name: 'Production API Key',
    key: 'ak_live_xxxxxxxxxxxxxxxxxxxxx',
    tenant: 'platform',
    permissions: ['read', 'write', 'delete'],
    createdAt: '2025-01-15',
    lastUsed: '2025-12-07T15:30:00',
    requestsToday: 1247,
    status: 'active',
  },
  {
    id: '2',
    name: 'CEP Formacion Integration',
    key: 'ak_tenant_cep_xxxxxxxxxxxxx',
    tenant: 'CEP Formacion',
    permissions: ['read', 'write'],
    createdAt: '2025-06-20',
    lastUsed: '2025-12-07T14:22:00',
    requestsToday: 89,
    status: 'active',
  },
  {
    id: '3',
    name: 'Test Key (Staging)',
    key: 'ak_test_xxxxxxxxxxxxxxxxxxxxx',
    tenant: 'platform',
    permissions: ['read'],
    createdAt: '2025-11-01',
    lastUsed: null,
    requestsToday: 0,
    status: 'active',
  },
];

export default function ApiPage() {
  const [selectedEndpoint, setSelectedEndpoint] = useState<Endpoint | null>(null);
  const [activeTab, setActiveTab] = useState<'endpoints' | 'keys' | 'logs'>('endpoints');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testResponse, setTestResponse] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [requestBody, setRequestBody] = useState<string>('');
  const [requestHeaders, setRequestHeaders] = useState<string>('{\n  "Authorization": "Bearer YOUR_TOKEN",\n  "Content-Type": "application/json"\n}');
  const [mcpStatus, setMcpStatus] = useState<'idle' | 'connecting' | 'connected'>('idle');
  const [mcpMessage, setMcpMessage] = useState<string | null>(null);

  const categories = ['all', ...new Set(mockEndpoints.map(e => e.category))];

  const filteredEndpoints = selectedCategory === 'all'
    ? mockEndpoints
    : mockEndpoints.filter(e => e.category === selectedCategory);

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
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    setTestResponse(selectedEndpoint.exampleResponse || '{"status": "success"}');
    setIsLoading(false);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const connectMcp = () => {
    setMcpStatus('connecting');
    setMcpMessage(null);
    setTimeout(() => {
      setMcpStatus('connected');
      setMcpMessage('Conexión MCP mock establecida. Implementa handshake/auth real en el servidor MCP.');
    }, 600);
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

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">API Console</h1>
        <p className="text-slate-400 mt-1">Explora, prueba y gestiona las APIs de Akademate</p>
      </div>

      {/* MCP Server mock (listo para implementar servidor real con auth) */}
      <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.08em] text-slate-500">MCP Server</p>
            <h3 className="text-lg font-semibold text-white">{mockMcp.name}</h3>
          </div>
          <span
            className={`px-3 py-1 text-xs font-semibold rounded-full ${
              mcpStatus === 'connected'
                ? 'bg-emerald-500/15 text-emerald-300'
                : mcpStatus === 'connecting'
                  ? 'bg-amber-500/15 text-amber-300'
                  : 'bg-slate-700 text-slate-300'
            }`}
          >
            {mcpStatus === 'connected' ? 'Conectado' : mcpStatus === 'connecting' ? 'Conectando' : 'Desconectado'}
          </span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm text-slate-300">
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Endpoint (mock)</p>
            <p className="font-mono break-all">{mockMcp.endpoint}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Token</p>
            <p className="font-mono break-all">{mockMcp.authToken}</p>
          </div>
          <div className="p-3 rounded-lg bg-slate-800/60 border border-slate-800">
            <p className="text-xs text-slate-500 mb-1">Handshake</p>
            <p className="text-slate-300 text-sm">Pendiente de auth bearer + listado de resources/tools.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {mockMcp.resources.map(resource => (
            <span key={resource} className="px-2 py-1 text-xs rounded bg-indigo-500/15 text-indigo-200 border border-indigo-500/20">
              {resource}
            </span>
          ))}
          {mockMcp.tools.map(tool => (
            <span key={tool} className="px-2 py-1 text-xs rounded bg-cyan-500/15 text-cyan-200 border border-cyan-500/20">
              {tool}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={connectMcp}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-500 transition-colors text-sm font-medium"
            disabled={mcpStatus === 'connecting'}
          >
            {mcpStatus === 'connecting' ? 'Conectando...' : 'Conectar MCP'}
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(mockMcp.authToken);
              setMcpMessage('Token MCP copiado (mock)');
            }}
            className="px-4 py-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            Copiar token
          </button>
        </div>
        {mcpMessage ? (
          <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 rounded-lg px-3 py-2">
            {mcpMessage}
          </div>
        ) : null}
        <p className="text-xs text-slate-500">
          Implementa el servidor MCP real con auth bearer y handshake; expone resources/tools listados arriba y wirea el cliente SDK.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Endpoints Disponibles</p>
              <p className="text-2xl font-bold text-white mt-1">{mockEndpoints.length}</p>
            </div>
            <div className="w-10 h-10 bg-indigo-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">API Keys Activas</p>
              <p className="text-2xl font-bold text-green-400 mt-1">{mockApiKeys.filter(k => k.status === 'active').length}</p>
            </div>
            <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Requests Hoy</p>
              <p className="text-2xl font-bold text-blue-400 mt-1">{mockApiKeys.reduce((sum, k) => sum + k.requestsToday, 0).toLocaleString()}</p>
            </div>
            <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-slate-400 text-sm">Latencia Media</p>
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

      {/* API limits & scopes (mock) */}
      <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-white">API keys & rate limiting</h2>
            <p className="text-slate-400 text-sm">Definir límites por plan y scopes granulares.</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-indigo-500/15 text-indigo-200">Mock</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          {rateLimits.map(limit => (
            <div key={limit.plan} className="p-4 rounded-lg bg-slate-900/60 border border-slate-800">
              <p className="text-white font-semibold">{limit.plan}</p>
              <p className="text-indigo-300 text-sm">{limit.limit}</p>
              <p className="text-xs text-slate-500 mt-1">{limit.note}</p>
            </div>
          ))}
        </div>
        <p className="text-xs text-slate-500 mt-3">
          Pendiente: generación/rotación de keys, scopes (read/write por recurso), rate limits en edge y logs de requests.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-800 p-1 rounded-lg w-fit">
        <button
          onClick={() => setActiveTab('endpoints')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'endpoints' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Endpoints
        </button>
        <button
          onClick={() => setActiveTab('keys')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'keys' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          API Keys
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
            activeTab === 'logs' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
          }`}
        >
          Logs
        </button>
      </div>

      {activeTab === 'endpoints' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Endpoints List */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            <div className="p-4 border-b border-slate-700">
              <div className="flex gap-2 flex-wrap">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                      selectedCategory === cat
                        ? 'bg-indigo-600 text-white'
                        : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                    }`}
                  >
                    {cat === 'all' ? 'Todos' : cat}
                  </button>
                ))}
              </div>
            </div>
            <div className="divide-y divide-slate-700 max-h-[600px] overflow-y-auto">
              {filteredEndpoints.map(endpoint => (
                <button
                  key={endpoint.id}
                  onClick={() => {
                    setSelectedEndpoint(endpoint);
                    setRequestBody(endpoint.body || '');
                    setTestResponse('');
                  }}
                  className={`w-full p-4 text-left hover:bg-slate-750 transition-colors ${
                    selectedEndpoint?.id === endpoint.id ? 'bg-slate-750' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${getMethodColor(endpoint.method)}`}>
                      {endpoint.method}
                    </span>
                    <span className="text-white font-medium">{endpoint.name}</span>
                    {endpoint.auth && (
                      <svg className="w-4 h-4 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mt-1 font-mono">{endpoint.path}</p>
                  <p className="text-slate-500 text-xs mt-1">{endpoint.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Request Builder */}
          <div className="bg-slate-800 rounded-xl border border-slate-700">
            {selectedEndpoint ? (
              <>
                <div className="p-4 border-b border-slate-700">
                  <div className="flex items-center gap-3 mb-2">
                    <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${getMethodColor(selectedEndpoint.method)}`}>
                      {selectedEndpoint.method}
                    </span>
                    <span className="text-white font-medium">{selectedEndpoint.name}</span>
                  </div>
                  <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2">
                    <span className="text-slate-500 text-sm">https://api.akademate.com</span>
                    <span className="text-white font-mono text-sm">{selectedEndpoint.path}</span>
                    <button
                      onClick={() => copyToClipboard(`https://api.akademate.com${selectedEndpoint.path}`)}
                      className="ml-auto p-1 text-slate-400 hover:text-white"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Parameters */}
                {selectedEndpoint.params && selectedEndpoint.params.length > 0 && (
                  <div className="p-4 border-b border-slate-700">
                    <h4 className="text-white font-medium mb-3">Parameters</h4>
                    <div className="space-y-2">
                      {selectedEndpoint.params.map(param => (
                        <div key={param.name} className="flex items-center gap-3 p-2 bg-slate-900 rounded-lg">
                          <span className="text-indigo-400 font-mono text-sm w-24">{param.name}</span>
                          <span className="text-slate-500 text-xs w-16">{param.type}</span>
                          {param.required && (
                            <span className="px-1.5 py-0.5 bg-red-500/20 text-red-400 text-xs rounded">required</span>
                          )}
                          <span className="text-slate-400 text-xs flex-1">{param.description}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Headers */}
                <div className="p-4 border-b border-slate-700">
                  <h4 className="text-white font-medium mb-3">Headers</h4>
                  <textarea
                    value={requestHeaders}
                    onChange={(e) => setRequestHeaders(e.target.value)}
                    className="w-full h-24 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  />
                </div>

                {/* Body */}
                {(selectedEndpoint.method === 'POST' || selectedEndpoint.method === 'PUT' || selectedEndpoint.method === 'PATCH') && (
                  <div className="p-4 border-b border-slate-700">
                    <h4 className="text-white font-medium mb-3">Request Body</h4>
                    <textarea
                      value={requestBody}
                      onChange={(e) => setRequestBody(e.target.value)}
                      className="w-full h-32 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-slate-300 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    />
                  </div>
                )}

                {/* Send Button */}
                <div className="p-4 border-b border-slate-700">
                  <button
                    onClick={handleTestRequest}
                    disabled={isLoading}
                    className="w-full px-4 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2 font-medium disabled:opacity-50"
                  >
                    {isLoading ? (
                      <>
                        <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        <span>Enviando...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Enviar Request</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Response */}
                <div className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-white font-medium">Response</h4>
                    {testResponse && (
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded font-mono">200 OK</span>
                        <span className="text-slate-500 text-xs">42ms</span>
                      </div>
                    )}
                  </div>
                  <div className="bg-slate-900 rounded-lg p-4 min-h-[150px] max-h-[300px] overflow-y-auto">
                    {testResponse ? (
                      <pre className="text-slate-300 font-mono text-sm whitespace-pre-wrap">{testResponse}</pre>
                    ) : (
                      <p className="text-slate-500 text-sm">Haz clic en &quot;Enviar Request&quot; para ver la respuesta</p>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <div className="p-8 text-center">
                <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
                <p className="text-slate-400">Selecciona un endpoint para comenzar</p>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'keys' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center">
            <h3 className="text-white font-medium">API Keys</h3>
            <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-2 text-sm">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Nueva API Key
            </button>
          </div>
          <div className="divide-y divide-slate-700">
            {mockApiKeys.map(key => (
              <div key={key.id} className="p-4 hover:bg-slate-750 transition-colors">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center">
                      <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-white font-medium">{key.name}</p>
                      <p className="text-slate-400 text-sm">{key.tenant}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    key.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}>
                    {key.status === 'active' ? 'Activa' : 'Revocada'}
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-slate-900 rounded-lg px-3 py-2 mb-3">
                  <span className="text-slate-300 font-mono text-sm flex-1">{key.key}</span>
                  <button
                    onClick={() => copyToClipboard(key.key)}
                    className="p-1 text-slate-400 hover:text-white"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                  </button>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div>
                    <span className="text-slate-500">Permisos:</span>
                    <span className="text-slate-300 ml-2">{key.permissions.join(', ')}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Requests hoy:</span>
                    <span className="text-slate-300 ml-2">{key.requestsToday.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Creada:</span>
                    <span className="text-slate-300 ml-2">{key.createdAt}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'logs' && (
        <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
          <svg className="w-16 h-16 text-slate-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <h3 className="text-white font-medium mb-2">Logs de API</h3>
          <p className="text-slate-400 text-sm mb-4">Visualiza el historial de requests y respuestas de la API</p>
          <span className="px-3 py-1 bg-indigo-500/20 text-indigo-400 rounded-full text-xs font-medium">Coming Soon</span>
        </div>
      )}
    </>
  );
}
