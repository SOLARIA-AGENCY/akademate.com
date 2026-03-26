#!/usr/bin/env node
/**
 * Akademate MCP Server v0.2.0
 *
 * Exposes the Akademate V1 API as MCP tools and resources so Claude Desktop,
 * Cursor, Continue.dev and any other MCP client can manage your academy.
 *
 * Configuration (environment variables):
 *   AKADEMATE_API_URL  — Base URL of your Akademate instance (default: https://cepformacion.akademate.com)
 *   AKADEMATE_API_KEY  — API key obtained from /configuracion/apis
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  CallToolRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js'

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const API_URL = (process.env.AKADEMATE_API_URL ?? 'https://cepformacion.akademate.com').replace(/\/$/, '')
const API_KEY = process.env.AKADEMATE_API_KEY ?? ''

if (!API_KEY) {
  process.stderr.write(
    '[akademate-mcp] WARNING: AKADEMATE_API_KEY is not set. All API calls will fail with 401.\n',
  )
}

// ---------------------------------------------------------------------------
// HTTP helpers
// ---------------------------------------------------------------------------

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
  })
  const data = await res.json()
  if (!res.ok) {
    const err = data as { error?: string; code?: string }
    throw new Error(`API ${res.status}: ${err.error ?? JSON.stringify(data)}`)
  }
  return data
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = data as { error?: string; code?: string }
    throw new Error(`API ${res.status}: ${err.error ?? JSON.stringify(data)}`)
  }
  return data
}

function toText(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

// Pagination helper
function paginationParams(params: Record<string, unknown>): string {
  const limit = typeof params.limit === 'number' ? params.limit : 20
  const offset = typeof params.offset === 'number' ? params.offset : 0
  return `limit=${limit}&offset=${offset}`
}

// ---------------------------------------------------------------------------
// Server
// ---------------------------------------------------------------------------

const server = new Server(
  { name: 'akademate', version: '0.2.0' },
  { capabilities: { tools: {}, resources: {} } },
)

// ---------------------------------------------------------------------------
// Tools — list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── Courses ────────────────────────────────────────────────────────
    {
      name: 'list_courses',
      description: 'List courses in the academy catalog. Returns title, type, area, duration, price. Use search to filter by name.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (1-100, default 20)' },
          offset: { type: 'number', description: 'Skip N results (default 0)' },
          search: { type: 'string', description: 'Filter courses by name' },
        },
      },
    },
    {
      name: 'get_course',
      description: 'Get full details of a course by ID.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Course ID' } },
      },
    },

    // ── Cycles ─────────────────────────────────────────────────────────
    {
      name: 'list_cycles',
      description: 'List ciclos formativos (grado medio / superior). Returns name, level, family, hours, capacity.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },
    {
      name: 'get_cycle',
      description: 'Get full details of a ciclo formativo by ID, including modules, requirements, career paths.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Cycle ID' } },
      },
    },

    // ── Campuses (Sedes) ───────────────────────────────────────────────
    {
      name: 'list_campuses',
      description: 'List academy campuses/sedes. Returns name, address, city, phone, email, capacity.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },
    {
      name: 'get_campus',
      description: 'Get full details of a campus/sede by ID, including classrooms, services, schedule.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Campus ID' } },
      },
    },

    // ── Convocatorias (Course Runs) ────────────────────────────────────
    {
      name: 'list_convocatorias',
      description: 'List convocatorias (course runs / enrollment periods). Returns course name, campus, dates, enrollment status, available seats.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },
    {
      name: 'get_convocatoria',
      description: 'Get full details of a convocatoria by ID: dates, schedule, seats, price, instructor.',
      inputSchema: {
        type: 'object',
        required: ['id'],
        properties: { id: { type: 'string', description: 'Convocatoria ID' } },
      },
    },

    // ── Leads ──────────────────────────────────────────────────────────
    {
      name: 'list_leads',
      description: 'List leads (prospective students from forms, ads, etc). Returns name, email, phone, status, source, score.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },
    {
      name: 'create_lead',
      description: 'Create a new lead from a prospective student. Requires at minimum an email. Optionally provide name, phone, utm_source, utm_campaign.',
      inputSchema: {
        type: 'object',
        required: ['email'],
        properties: {
          email: { type: 'string', description: 'Lead email (required)' },
          first_name: { type: 'string', description: 'First name' },
          last_name: { type: 'string', description: 'Last name' },
          phone: { type: 'string', description: 'Phone number' },
          source: { type: 'string', description: 'Lead source (e.g. facebook_ads, google_ads, organic, referral)' },
          utm_campaign: { type: 'string', description: 'UTM campaign code for tracking' },
          utm_source: { type: 'string', description: 'UTM source' },
          utm_medium: { type: 'string', description: 'UTM medium' },
        },
      },
    },

    // ── Students ───────────────────────────────────────────────────────
    {
      name: 'list_students',
      description: 'List enrolled students. Returns name, email, enrollment status.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },

    // ── Enrollments ────────────────────────────────────────────────────
    {
      name: 'create_enrollment',
      description: 'Enroll a student in a convocatoria. Creates an active enrollment.',
      inputSchema: {
        type: 'object',
        required: ['studentId', 'courseRunId'],
        properties: {
          studentId: { type: 'string', description: 'Student ID' },
          courseRunId: { type: 'string', description: 'Convocatoria / course-run ID' },
        },
      },
    },

    // ── Staff ──────────────────────────────────────────────────────────
    {
      name: 'list_staff',
      description: 'List academy staff (professors, administrative). Returns name, role, email, campus assignment.',
      inputSchema: {
        type: 'object',
        properties: {
          limit: { type: 'number', description: 'Results per page (default 20)' },
          offset: { type: 'number', description: 'Skip N results' },
        },
      },
    },

    // ── Analytics ──────────────────────────────────────────────────────
    {
      name: 'get_analytics',
      description: 'Get dashboard KPIs: total students, courses, enrollments, active enrollments, completion rate. Quick academy health check.',
      inputSchema: { type: 'object', properties: {} },
    },
  ],
}))

// ---------------------------------------------------------------------------
// Tools — call
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const params = (args ?? {}) as Record<string, unknown>

  try {
    switch (name) {
      // Courses
      case 'list_courses': {
        const data = await apiGet(`/api/v1/courses?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }
      case 'get_course': {
        const data = await apiGet(`/api/v1/courses/${params.id}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Cycles
      case 'list_cycles': {
        const data = await apiGet(`/api/v1/cycles?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }
      case 'get_cycle': {
        const data = await apiGet(`/api/v1/cycles/${params.id}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Campuses
      case 'list_campuses': {
        const data = await apiGet(`/api/v1/campuses?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }
      case 'get_campus': {
        const data = await apiGet(`/api/v1/campuses/${params.id}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Convocatorias
      case 'list_convocatorias': {
        const data = await apiGet(`/api/v1/convocatorias?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }
      case 'get_convocatoria': {
        const data = await apiGet(`/api/v1/convocatorias/${params.id}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Leads
      case 'list_leads': {
        const data = await apiGet(`/api/v1/leads?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }
      case 'create_lead': {
        const data = await apiPost('/api/v1/leads', params)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Students
      case 'list_students': {
        const data = await apiGet(`/api/v1/students?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Enrollments
      case 'create_enrollment': {
        const data = await apiPost('/api/v1/enrollments', {
          studentId: params.studentId,
          courseRunId: params.courseRunId,
        })
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Staff
      case 'list_staff': {
        const data = await apiGet(`/api/v1/staff?${paginationParams(params)}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      // Analytics
      case 'get_analytics': {
        const data = await apiGet('/api/v1/analytics')
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return { content: [{ type: 'text', text: `Error: ${message}` }], isError: true }
  }
})

// ---------------------------------------------------------------------------
// Resources
// ---------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'akademate://courses',
      name: 'Catalogo de Cursos',
      description: 'All courses in the academy (first 100)',
      mimeType: 'application/json',
    },
    {
      uri: 'akademate://cycles',
      name: 'Ciclos Formativos',
      description: 'All ciclos formativos (grado medio y superior)',
      mimeType: 'application/json',
    },
    {
      uri: 'akademate://convocatorias',
      name: 'Convocatorias Activas',
      description: 'Active enrollment periods with seats and dates',
      mimeType: 'application/json',
    },
    {
      uri: 'akademate://campuses',
      name: 'Sedes',
      description: 'Academy campuses with address and contact info',
      mimeType: 'application/json',
    },
    {
      uri: 'akademate://analytics',
      name: 'Dashboard KPIs',
      description: 'Key performance indicators: students, enrollments, completion rate',
      mimeType: 'application/json',
    },
  ],
}))

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  const RESOURCE_PATHS: Record<string, string> = {
    'akademate://courses': '/api/v1/courses?limit=100&offset=0',
    'akademate://cycles': '/api/v1/cycles?limit=100&offset=0',
    'akademate://convocatorias': '/api/v1/convocatorias?limit=100&offset=0',
    'akademate://campuses': '/api/v1/campuses?limit=100&offset=0',
    'akademate://analytics': '/api/v1/analytics',
  }

  const path = RESOURCE_PATHS[uri]
  if (!path) throw new Error(`Unknown resource: ${uri}`)

  try {
    const data = await apiGet(path)
    return { contents: [{ uri, mimeType: 'application/json', text: toText(data) }] }
  } catch (err) {
    throw new Error(`Failed to read ${uri}: ${err instanceof Error ? err.message : err}`)
  }
})

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[akademate-mcp] v0.2.0 ready — 16 tools, 5 resources\n')
}

main().catch((err) => {
  process.stderr.write(`[akademate-mcp] Fatal: ${err instanceof Error ? err.message : err}\n`)
  process.exit(1)
})
