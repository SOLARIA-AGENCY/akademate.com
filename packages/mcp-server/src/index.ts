#!/usr/bin/env node
/**
 * Akademate MCP Server
 *
 * Exposes Akademate V1 API as MCP tools and resources so Claude Desktop,
 * Cursor, Continue.dev and any other MCP client can manage your academy.
 *
 * Configuration (environment variables):
 *   AKADEMATE_API_URL  — Base URL of your Akademate instance (default: http://localhost:3000)
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

const API_URL = (process.env.AKADEMATE_API_URL ?? 'http://localhost:3000').replace(/\/$/, '')
const API_KEY = process.env.AKADEMATE_API_KEY ?? ''

if (!API_KEY) {
  process.stderr.write(
    '[akademate-mcp] WARNING: AKADEMATE_API_KEY is not set. All API calls will fail with 401.\n',
  )
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
  })
  const data = await res.json()
  if (!res.ok) {
    const err = data as { error?: string; code?: string }
    throw new Error(`API error ${res.status}: ${err.error ?? JSON.stringify(data)} (${err.code ?? 'UNKNOWN'})`)
  }
  return data
}

async function apiPost(path: string, body: unknown): Promise<unknown> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) {
    const err = data as { error?: string; code?: string }
    throw new Error(`API error ${res.status}: ${err.error ?? JSON.stringify(data)} (${err.code ?? 'UNKNOWN'})`)
  }
  return data
}

function toText(data: unknown): string {
  return JSON.stringify(data, null, 2)
}

// ---------------------------------------------------------------------------
// Server definition
// ---------------------------------------------------------------------------

const server = new Server(
  {
    name: 'akademate',
    version: '0.1.0',
  },
  {
    capabilities: {
      tools: {},
      resources: {},
    },
  },
)

// ---------------------------------------------------------------------------
// Tools — list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'get_courses',
        description:
          'List courses in the academy. Returns a paginated list with title, status, and creation date. Use this to browse the course catalog before fetching a specific course.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of courses to return (1-100, default 20)',
              minimum: 1,
              maximum: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of courses to skip for pagination (default 0)',
              minimum: 0,
            },
            search: {
              type: 'string',
              description: 'Optional text to filter courses by title (client-side filter on returned results)',
            },
          },
        },
      },
      {
        name: 'get_course',
        description:
          'Get full details of a single course by its ID. Returns all course fields including description, status, and associated metadata.',
        inputSchema: {
          type: 'object',
          required: ['id'],
          properties: {
            id: {
              type: 'string',
              description: 'Course ID (obtain from get_courses)',
            },
          },
        },
      },
      {
        name: 'get_students',
        description:
          'List students registered in the academy. Returns a paginated list with name, email, and registration date.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of students to return (1-100, default 20)',
              minimum: 1,
              maximum: 100,
            },
            offset: {
              type: 'number',
              description: 'Number of students to skip for pagination (default 0)',
              minimum: 0,
            },
          },
        },
      },
      {
        name: 'get_analytics',
        description:
          'Get dashboard KPI metrics: total students, courses, enrollments, active enrollments, and completion rate percentage. Use this to get a quick summary of the academy\'s performance.',
        inputSchema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'create_enrollment',
        description:
          'Enroll a student in a course run (convocatoria). Requires both the student ID and the course run ID. The enrollment is created with status "active".',
        inputSchema: {
          type: 'object',
          required: ['studentId', 'courseRunId'],
          properties: {
            studentId: {
              type: 'string',
              description: 'ID of the student to enroll (obtain from get_students)',
            },
            courseRunId: {
              type: 'string',
              description: 'ID of the course run / convocatoria to enroll the student in',
            },
          },
        },
      },
      {
        name: 'get_schedule',
        description:
          'Get upcoming course runs / convocatorias. Lists all courses with their available runs ordered by creation date. Useful to check what sessions are available before enrolling a student.',
        inputSchema: {
          type: 'object',
          properties: {
            limit: {
              type: 'number',
              description: 'Number of courses to inspect (default 20)',
              minimum: 1,
              maximum: 50,
            },
          },
        },
      },
    ],
  }
})

// ---------------------------------------------------------------------------
// Tools — call
// ---------------------------------------------------------------------------

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params
  const params = (args ?? {}) as Record<string, unknown>

  try {
    switch (name) {
      case 'get_courses': {
        const limit = typeof params.limit === 'number' ? params.limit : 20
        const offset = typeof params.offset === 'number' ? params.offset : 0
        const search = typeof params.search === 'string' ? params.search.toLowerCase() : ''

        const data = await apiGet(`/api/v1/courses?limit=${limit}&offset=${offset}`)
        const result = data as { data: Array<Record<string, unknown>>; total: number; limit: number; offset: number }

        // Client-side text filter when search param is provided
        if (search) {
          result.data = result.data.filter((c) => {
            const title = String(c.title ?? '').toLowerCase()
            return title.includes(search)
          })
        }

        return { content: [{ type: 'text', text: toText(result) }] }
      }

      case 'get_course': {
        const id = String(params.id)
        const data = await apiGet(`/api/v1/courses/${id}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      case 'get_students': {
        const limit = typeof params.limit === 'number' ? params.limit : 20
        const offset = typeof params.offset === 'number' ? params.offset : 0
        const data = await apiGet(`/api/v1/students?limit=${limit}&offset=${offset}`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      case 'get_analytics': {
        const data = await apiGet('/api/v1/analytics')
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      case 'create_enrollment': {
        const studentId = String(params.studentId)
        const courseRunId = String(params.courseRunId)
        const data = await apiPost('/api/v1/enrollments', { studentId, courseRunId })
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      case 'get_schedule': {
        const limit = typeof params.limit === 'number' ? params.limit : 20
        // Fetch courses — course runs are typically nested in course objects
        const data = await apiGet(`/api/v1/courses?limit=${limit}&offset=0`)
        return { content: [{ type: 'text', text: toText(data) }] }
      }

      default:
        throw new Error(`Unknown tool: ${name}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    }
  }
})

// ---------------------------------------------------------------------------
// Resources — list
// ---------------------------------------------------------------------------

server.setRequestHandler(ListResourcesRequestSchema, async () => {
  return {
    resources: [
      {
        uri: 'akademate://courses',
        name: 'Course Catalog',
        description: 'Full list of courses available in the academy (first 100)',
        mimeType: 'application/json',
      },
      {
        uri: 'akademate://students',
        name: 'Student List',
        description: 'List of students registered in the academy (first 100)',
        mimeType: 'application/json',
      },
    ],
  }
})

// ---------------------------------------------------------------------------
// Resources — read
// ---------------------------------------------------------------------------

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params

  try {
    switch (uri) {
      case 'akademate://courses': {
        const data = await apiGet('/api/v1/courses?limit=100&offset=0')
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: toText(data),
            },
          ],
        }
      }

      case 'akademate://students': {
        const data = await apiGet('/api/v1/students?limit=100&offset=0')
        return {
          contents: [
            {
              uri,
              mimeType: 'application/json',
              text: toText(data),
            },
          ],
        }
      }

      default:
        throw new Error(`Unknown resource URI: ${uri}`)
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    throw new Error(`Failed to read resource ${uri}: ${message}`)
  }
})

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)
  process.stderr.write('[akademate-mcp] Server started. Listening on stdio.\n')
}

main().catch((err) => {
  process.stderr.write(`[akademate-mcp] Fatal error: ${err instanceof Error ? err.message : err}\n`)
  process.exit(1)
})
