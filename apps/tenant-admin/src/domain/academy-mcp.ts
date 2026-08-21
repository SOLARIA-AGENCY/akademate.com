export const CEP_PUBLIC_ORIGIN = 'https://cepformacion.akademate.com'
export const AKADEMATE_SAAS_ORIGIN = 'https://app.akademate.com'
export const MCP_PROTOCOL_VERSION = '2025-03-26'
export const MCP_SERVER_NAME = 'akademate'
export const MCP_SERVER_VERSION = '0.4.0'

export type McpJsonRpcRequest = {
  jsonrpc?: string
  id?: string | number | null
  method?: string
  params?: Record<string, unknown>
}

export type McpToolDefinition = {
  name: string
  description: string
  inputSchema: Record<string, unknown>
}

export type McpResourceDefinition = {
  uri: string
  name: string
  description: string
  mimeType: string
}

export type McpToolDispatch =
  | { kind: 'get'; path: string }
  | { kind: 'post'; path: string; body?: (args: Record<string, unknown>) => unknown }

function paginationQuery(args: Record<string, unknown>): string {
  const limit = typeof args.limit === 'number' ? args.limit : 20
  const offset = typeof args.offset === 'number' ? args.offset : 0
  const search = typeof args.search === 'string' && args.search.trim() ? `&search=${encodeURIComponent(args.search)}` : ''
  return `limit=${limit}&offset=${offset}${search}`
}

export const MCP_TOOLS: McpToolDefinition[] = [
  {
    name: 'list_courses',
    description: 'List academy catalog items (courses, workshops, classes). Not limited to vocational FP.',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number' },
        offset: { type: 'number' },
        search: { type: 'string' },
      },
    },
  },
  {
    name: 'get_course',
    description: 'Get one catalog item by ID.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },
  {
    name: 'list_cycles',
    description: 'List long programs or cycles when the academy uses them.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'get_cycle',
    description: 'Get one cycle/program by ID.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },
  {
    name: 'list_campuses',
    description: 'List venues / campuses / studios.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'get_campus',
    description: 'Get one venue by ID.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },
  {
    name: 'list_convocatorias',
    description: 'List scheduled activities / course runs / workshops.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'get_convocatoria',
    description: 'Get one scheduled activity by ID.',
    inputSchema: { type: 'object', required: ['id'], properties: { id: { type: 'string' } } },
  },
  {
    name: 'list_leads',
    description: 'List prospective students / leads.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'create_lead',
    description: 'Create a lead. Requires email.',
    inputSchema: {
      type: 'object',
      required: ['email'],
      properties: {
        email: { type: 'string' },
        first_name: { type: 'string' },
        last_name: { type: 'string' },
        phone: { type: 'string' },
        source: { type: 'string' },
      },
    },
  },
  {
    name: 'list_students',
    description: 'List enrolled learners.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'create_enrollment',
    description: 'Enroll a learner in a scheduled activity.',
    inputSchema: {
      type: 'object',
      required: ['studentId', 'courseRunId'],
      properties: { studentId: { type: 'string' }, courseRunId: { type: 'string' } },
    },
  },
  {
    name: 'list_staff',
    description: 'List instructors and staff.',
    inputSchema: { type: 'object', properties: { limit: { type: 'number' }, offset: { type: 'number' } } },
  },
  {
    name: 'get_analytics',
    description: 'Academy health KPIs.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_me',
    description: 'Describe the authenticated API key and tenant.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'get_compliance_policy',
    description: 'Resolved region pack and official family catalog. Staff-only roster policy, not learner attendance.',
    inputSchema: { type: 'object', properties: { courseRunId: { type: 'string' } } },
  },
  {
    name: 'list_placement_agencies',
    description: 'Public employment-agency pages for the tenant.',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'create_blog_draft',
    description: 'Create a draft news/blog article with SEO keywords',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string' },
        excerpt: { type: 'string' },
        body: { type: 'string' },
        keywords: { type: 'array', items: { type: 'string' } },
      },
      required: ['title'],
    },
  },
  {
    name: 'create_faq',
    description: 'Create a draft FAQ',
    inputSchema: {
      type: 'object',
      properties: {
        question: { type: 'string' },
        answer: { type: 'string' },
      },
      required: ['question', 'answer'],
    },
  },
  {
    name: 'list_website_media',
    description: 'List media used on the public website',
    inputSchema: { type: 'object', properties: {} },
  },
  {
    name: 'list_integrations',
    description: 'List academy connectors (signage, access, payments, meetings, ads, finance). No secrets.',
    inputSchema: { type: 'object', properties: {} },
  },
]

export const MCP_RESOURCES: McpResourceDefinition[] = [
  { uri: 'akademate://courses', name: 'Catalog', description: 'First 100 catalog items', mimeType: 'application/json' },
  { uri: 'akademate://cycles', name: 'Programs', description: 'Long programs / cycles', mimeType: 'application/json' },
  { uri: 'akademate://convocatorias', name: 'Schedule', description: 'Scheduled activities', mimeType: 'application/json' },
  { uri: 'akademate://campuses', name: 'Venues', description: 'Campuses and studios', mimeType: 'application/json' },
  { uri: 'akademate://analytics', name: 'KPIs', description: 'Dashboard KPIs', mimeType: 'application/json' },
  { uri: 'akademate://integrations', name: 'Connectors', description: 'Integration catalog without secrets', mimeType: 'application/json' },
]

const RESOURCE_PATHS: Record<string, string> = {
  'akademate://courses': '/api/v1/courses?limit=100&offset=0',
  'akademate://cycles': '/api/v1/cycles?limit=100&offset=0',
  'akademate://convocatorias': '/api/v1/convocatorias?limit=100&offset=0',
  'akademate://campuses': '/api/v1/campuses?limit=100&offset=0',
  'akademate://analytics': '/api/v1/analytics',
  'akademate://integrations': '/api/integrations',
}

export function resolveToolDispatch(name: string, args: Record<string, unknown>): McpToolDispatch {
  switch (name) {
    case 'list_courses':
      return { kind: 'get', path: `/api/v1/courses?${paginationQuery(args)}` }
    case 'get_course':
      return { kind: 'get', path: `/api/v1/courses/${args.id}` }
    case 'list_cycles':
      return { kind: 'get', path: `/api/v1/cycles?${paginationQuery(args)}` }
    case 'get_cycle':
      return { kind: 'get', path: `/api/v1/cycles/${args.id}` }
    case 'list_campuses':
      return { kind: 'get', path: `/api/v1/campuses?${paginationQuery(args)}` }
    case 'get_campus':
      return { kind: 'get', path: `/api/v1/campuses/${args.id}` }
    case 'list_convocatorias':
      return { kind: 'get', path: `/api/v1/convocatorias?${paginationQuery(args)}` }
    case 'get_convocatoria':
      return { kind: 'get', path: `/api/v1/convocatorias/${args.id}` }
    case 'list_leads':
      return { kind: 'get', path: `/api/v1/leads?${paginationQuery(args)}` }
    case 'create_lead':
      return { kind: 'post', path: '/api/v1/leads', body: () => args }
    case 'list_students':
      return { kind: 'get', path: `/api/v1/students?${paginationQuery(args)}` }
    case 'create_enrollment':
      return {
        kind: 'post',
        path: '/api/v1/enrollments',
        body: () => ({ studentId: args.studentId, courseRunId: args.courseRunId }),
      }
    case 'list_staff':
      return { kind: 'get', path: `/api/v1/staff?${paginationQuery(args)}` }
    case 'get_analytics':
      return { kind: 'get', path: '/api/v1/analytics' }
    case 'get_me':
      return { kind: 'get', path: '/api/v1/me' }
    case 'get_compliance_policy':
      return {
        kind: 'get',
        path: args.courseRunId
          ? `/api/compliance/policy?courseRunId=${encodeURIComponent(String(args.courseRunId))}`
          : '/api/compliance/policy',
      }
    case 'list_placement_agencies':
      return { kind: 'get', path: '/api/compliance/agencies' }
    case 'list_integrations':
      return { kind: 'get', path: '/api/integrations' }
    case 'create_blog_draft':
      return { kind: 'post', path: '/api/blog_posts', body: () => args }
    case 'create_faq':
      return { kind: 'post', path: '/api/contenido/faqs', body: () => args }
    case 'list_website_media':
      return { kind: 'get', path: '/api/media?limit=60&sort=-createdAt' }
    default:
      throw new Error(`Unknown tool: ${name}`)
  }
}

export function resolveResourcePath(uri: string): string {
  const path = RESOURCE_PATHS[uri]
  if (!path) throw new Error(`Unknown resource: ${uri}`)
  return path
}

export function buildMcpDiscovery(origin: string) {
  const normalized = origin.replace(/\/$/, '')
  return {
    protocolVersion: MCP_PROTOCOL_VERSION,
    server: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
    transport: { type: 'http', url: `${normalized}/mcp` },
    authentication: { type: 'bearer', header: 'Authorization', format: 'Bearer <api_key>' },
    api: { rest: `${normalized}/api/v1`, openapi: `${normalized}/api/v1/openapi` },
    hosts: {
      current: normalized,
      cep: CEP_PUBLIC_ORIGIN,
      akademateSaas: AKADEMATE_SAAS_ORIGIN,
    },
  }
}

export function listMcpTools(extra: McpToolDefinition[] = []): McpToolDefinition[] {
  return extra.length > 0 ? [...MCP_TOOLS, ...extra] : MCP_TOOLS
}

export async function handleMcpJsonRpc(
  request: McpJsonRpcRequest,
  options: {
    callApi: (dispatch: McpToolDispatch) => Promise<unknown>
    readResource: (path: string) => Promise<unknown>
    listTools?: () => McpToolDefinition[]
    callConstruction?: (name: string, args: Record<string, unknown>) => Promise<unknown>
  },
): Promise<Record<string, unknown> | null> {
  const id = request.id ?? null
  const method = request.method ?? ''
  const params = request.params ?? {}

  if (request.id === undefined && method.startsWith('notifications/')) {
    return null
  }

  if (method === 'initialize') {
    return {
      jsonrpc: '2.0',
      id,
      result: {
        protocolVersion: MCP_PROTOCOL_VERSION,
        capabilities: { tools: {}, resources: {} },
        serverInfo: { name: MCP_SERVER_NAME, version: MCP_SERVER_VERSION },
      },
    }
  }

  if (method === 'ping' || method === 'tools/list') {
    return {
      jsonrpc: '2.0',
      id,
      result: method === 'ping' ? {} : { tools: options.listTools?.() ?? MCP_TOOLS },
    }
  }

  if (method === 'resources/list') {
    return { jsonrpc: '2.0', id, result: { resources: MCP_RESOURCES } }
  }

  if (method === 'tools/call') {
    const name = String(params.name ?? '')
    const args = (params.arguments ?? {}) as Record<string, unknown>
    if (name.startsWith('construct_')) {
      if (!options.callConstruction) {
        return {
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: 'Error: Construction tools are off' }],
            isError: true,
          },
        }
      }
      return options
        .callConstruction(name, args)
        .then((data) => ({
          jsonrpc: '2.0',
          id,
          result: { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] },
        }))
        .catch((error: unknown) => ({
          jsonrpc: '2.0',
          id,
          result: {
            content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
            isError: true,
          },
        }))
    }
    return options
      .callApi(resolveToolDispatch(name, args))
      .then((data) => ({
        jsonrpc: '2.0',
        id,
        result: { content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] },
      }))
      .catch((error: unknown) => ({
        jsonrpc: '2.0',
        id,
        result: {
          content: [{ type: 'text', text: `Error: ${error instanceof Error ? error.message : String(error)}` }],
          isError: true,
        },
      }))
  }

  if (method === 'resources/read') {
    const uri = String(params.uri ?? '')
    return options
      .readResource(resolveResourcePath(uri))
      .then((data) => ({
        jsonrpc: '2.0',
        id,
        result: { contents: [{ uri, mimeType: 'application/json', text: JSON.stringify(data, null, 2) }] },
      }))
      .catch((error: unknown) => ({
        jsonrpc: '2.0',
        id,
        error: { code: -32000, message: error instanceof Error ? error.message : String(error) },
      }))
  }

  return {
    jsonrpc: '2.0',
    id,
    error: { code: -32601, message: `Method not found: ${method}` },
  }
}
