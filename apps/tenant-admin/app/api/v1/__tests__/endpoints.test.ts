/**
 * @fileoverview Tests de autenticacion para TODOS los endpoints v1
 * Verifica que cada endpoint rechaza correctamente requests sin auth,
 * con tokens invalidos, y con scopes insuficientes.
 */

import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: Promise.resolve({}),
}))

// Mock de requireV1Auth — control total del resultado de autenticacion
// Se mockea con la ruta alias '@/lib/v1Auth' que usan los route handlers
const mockRequireV1Auth = vi.fn()
vi.mock('@/lib/v1Auth', () => ({
  requireV1Auth: (...args: unknown[]) => mockRequireV1Auth(...args),
}))

// Mock apiKeyAuth para endpoints que lo usan directamente (keys)
vi.mock('@/lib/apiKeyAuth', () => ({
  generateApiKey: vi.fn().mockReturnValue('ak_mock_generated_key_0123456789abcdef0123456789abcdef'),
  hashApiKey: vi.fn().mockReturnValue('mockhash123'),
  validateBearerToken: vi.fn(),
}))

// ============================================================================
// Imports de route handlers
// ============================================================================

import { GET as getMe } from '../me/route'
import { GET as getCourses, POST as postCourses } from '../courses/route'
import { GET as getCourseById, PATCH as patchCourseById } from '../courses/[id]/route'
import { GET as getCycles } from '../cycles/route'
import { GET as getCycleById } from '../cycles/[id]/route'
import { GET as getCampuses } from '../campuses/route'
import { GET as getCampusById } from '../campuses/[id]/route'
import { GET as getStaff } from '../staff/route'
import { GET as getStaffById } from '../staff/[id]/route'
import { GET as getConvocatorias } from '../convocatorias/route'
import { GET as getConvocatoriaById } from '../convocatorias/[id]/route'
import { GET as getStudents, POST as postStudents } from '../students/route'
import { GET as getEnrollments, POST as postEnrollments } from '../enrollments/route'
import { GET as getLeads, POST as postLeads } from '../leads/route'
import { GET as getKeys, POST as postKeys } from '../keys/route'
import { POST as postMedia } from '../media/route'
import { GET as getAnalytics } from '../analytics/route'

// ============================================================================
// Helpers
// ============================================================================

function createRequest(url = 'http://localhost/api/v1/test', init?: RequestInit): Request {
  return new Request(url, init)
}

function mockContextWithId(id: string) {
  return { params: Promise.resolve({ id }) }
}

function make401Response() {
  const { NextResponse } = require('next/server')
  return NextResponse.json(
    { error: 'Missing API key', code: 'MISSING_API_KEY' },
    { status: 401 },
  )
}

function make403Response(scope: string) {
  const { NextResponse } = require('next/server')
  return NextResponse.json(
    { error: `Insufficient permissions. Required scope: ${scope}`, code: 'FORBIDDEN' },
    { status: 403 },
  )
}

function makeInvalidKeyResponse() {
  const { NextResponse } = require('next/server')
  return NextResponse.json(
    { error: 'Invalid or inactive API key', code: 'INVALID_API_KEY' },
    { status: 401 },
  )
}

// ============================================================================
// Definicion de endpoints a testear
// ============================================================================

interface EndpointDef {
  name: string
  handler: (req: Request, ctx?: any) => Promise<Response>
  method: string
  url: string
  requiresContext?: boolean
  requiredScope: string | null
  body?: object
}

const endpoints: EndpointDef[] = [
  // Auth
  { name: 'GET /api/v1/me', handler: getMe, method: 'GET', url: 'http://localhost/api/v1/me', requiredScope: null },

  // Courses
  { name: 'GET /api/v1/courses', handler: getCourses, method: 'GET', url: 'http://localhost/api/v1/courses', requiredScope: 'courses:read' },
  { name: 'POST /api/v1/courses', handler: postCourses, method: 'POST', url: 'http://localhost/api/v1/courses', requiredScope: 'courses:write', body: { title: 'Test' } },
  { name: 'GET /api/v1/courses/:id', handler: getCourseById, method: 'GET', url: 'http://localhost/api/v1/courses/1', requiresContext: true, requiredScope: 'courses:read' },
  { name: 'PATCH /api/v1/courses/:id', handler: patchCourseById, method: 'PATCH', url: 'http://localhost/api/v1/courses/1', requiresContext: true, requiredScope: 'courses:write', body: { title: 'Updated' } },

  // Cycles
  { name: 'GET /api/v1/cycles', handler: getCycles, method: 'GET', url: 'http://localhost/api/v1/cycles', requiredScope: 'cycles:read' },
  { name: 'GET /api/v1/cycles/:id', handler: getCycleById, method: 'GET', url: 'http://localhost/api/v1/cycles/1', requiresContext: true, requiredScope: 'cycles:read' },

  // Campuses
  { name: 'GET /api/v1/campuses', handler: getCampuses, method: 'GET', url: 'http://localhost/api/v1/campuses', requiredScope: 'campuses:read' },
  { name: 'GET /api/v1/campuses/:id', handler: getCampusById, method: 'GET', url: 'http://localhost/api/v1/campuses/1', requiresContext: true, requiredScope: 'campuses:read' },

  // Staff
  { name: 'GET /api/v1/staff', handler: getStaff, method: 'GET', url: 'http://localhost/api/v1/staff', requiredScope: 'staff:read' },
  { name: 'GET /api/v1/staff/:id', handler: getStaffById, method: 'GET', url: 'http://localhost/api/v1/staff/1', requiresContext: true, requiredScope: 'staff:read' },

  // Convocatorias
  { name: 'GET /api/v1/convocatorias', handler: getConvocatorias, method: 'GET', url: 'http://localhost/api/v1/convocatorias', requiredScope: 'convocatorias:read' },
  { name: 'GET /api/v1/convocatorias/:id', handler: getConvocatoriaById, method: 'GET', url: 'http://localhost/api/v1/convocatorias/1', requiresContext: true, requiredScope: 'convocatorias:read' },

  // Students
  { name: 'GET /api/v1/students', handler: getStudents, method: 'GET', url: 'http://localhost/api/v1/students', requiredScope: 'students:read' },
  { name: 'POST /api/v1/students', handler: postStudents, method: 'POST', url: 'http://localhost/api/v1/students', requiredScope: 'students:write', body: { email: 'test@test.com' } },

  // Enrollments
  { name: 'GET /api/v1/enrollments', handler: getEnrollments, method: 'GET', url: 'http://localhost/api/v1/enrollments', requiredScope: 'enrollments:read' },
  { name: 'POST /api/v1/enrollments', handler: postEnrollments, method: 'POST', url: 'http://localhost/api/v1/enrollments', requiredScope: 'enrollments:write', body: { studentId: '1', courseRunId: '1' } },

  // Leads
  { name: 'GET /api/v1/leads', handler: getLeads, method: 'GET', url: 'http://localhost/api/v1/leads', requiredScope: 'students:read' },
  { name: 'POST /api/v1/leads', handler: postLeads, method: 'POST', url: 'http://localhost/api/v1/leads', requiredScope: 'students:write', body: { email: 'lead@test.com' } },

  // Keys
  { name: 'GET /api/v1/keys', handler: getKeys, method: 'GET', url: 'http://localhost/api/v1/keys', requiredScope: 'keys:manage' },
  { name: 'POST /api/v1/keys', handler: postKeys, method: 'POST', url: 'http://localhost/api/v1/keys', requiredScope: 'keys:manage', body: { name: 'Test Key', scopes: ['courses:read'] } },

  // Media
  { name: 'POST /api/v1/media', handler: postMedia, method: 'POST', url: 'http://localhost/api/v1/media', requiredScope: 'courses:write' },

  // Analytics
  { name: 'GET /api/v1/analytics', handler: getAnalytics, method: 'GET', url: 'http://localhost/api/v1/analytics', requiredScope: 'analytics:read' },
]

// ============================================================================
// Tests
// ============================================================================

describe('Autenticacion de endpoints V1', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // 401 - Sin Bearer token
  // --------------------------------------------------------------------------

  describe('401 — Sin Bearer token', () => {
    for (const endpoint of endpoints) {
      it(`${endpoint.name} retorna 401 sin token`, async () => {
        mockRequireV1Auth.mockResolvedValue({
          ok: false,
          response: make401Response(),
        })

        const init: RequestInit = { method: endpoint.method }
        if (endpoint.body) {
          init.body = JSON.stringify(endpoint.body)
          init.headers = { 'Content-Type': 'application/json' }
        }

        const request = createRequest(endpoint.url, init)
        const ctx = endpoint.requiresContext ? mockContextWithId('test-id') : undefined

        const response = endpoint.requiresContext
          ? await endpoint.handler(request, ctx)
          : await endpoint.handler(request)

        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.error).toBeDefined()
      })
    }
  })

  // --------------------------------------------------------------------------
  // 401 - Token invalido
  // --------------------------------------------------------------------------

  describe('401 — Token invalido', () => {
    for (const endpoint of endpoints) {
      it(`${endpoint.name} retorna 401 con token invalido`, async () => {
        mockRequireV1Auth.mockResolvedValue({
          ok: false,
          response: makeInvalidKeyResponse(),
        })

        const init: RequestInit = {
          method: endpoint.method,
          headers: { authorization: 'Bearer ak_invalid_xyz' },
        }
        if (endpoint.body) {
          init.body = JSON.stringify(endpoint.body)
          ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
        }

        const request = createRequest(endpoint.url, init)
        const ctx = endpoint.requiresContext ? mockContextWithId('test-id') : undefined

        const response = endpoint.requiresContext
          ? await endpoint.handler(request, ctx)
          : await endpoint.handler(request)

        expect(response.status).toBe(401)
        const body = await response.json()
        expect(body.code).toBe('INVALID_API_KEY')
      })
    }
  })

  // --------------------------------------------------------------------------
  // 403 - Scope insuficiente
  // --------------------------------------------------------------------------

  describe('403 — Scope insuficiente', () => {
    // Solo endpoints que requieren un scope especifico
    const scopedEndpoints = endpoints.filter((e) => e.requiredScope !== null)

    for (const endpoint of scopedEndpoints) {
      it(`${endpoint.name} retorna 403 cuando falta scope "${endpoint.requiredScope}"`, async () => {
        mockRequireV1Auth.mockResolvedValue({
          ok: false,
          response: make403Response(endpoint.requiredScope!),
        })

        const init: RequestInit = {
          method: endpoint.method,
          headers: { authorization: 'Bearer ak_valid_but_wrong_scope' },
        }
        if (endpoint.body) {
          init.body = JSON.stringify(endpoint.body)
          ;(init.headers as Record<string, string>)['Content-Type'] = 'application/json'
        }

        const request = createRequest(endpoint.url, init)
        const ctx = endpoint.requiresContext ? mockContextWithId('test-id') : undefined

        const response = endpoint.requiresContext
          ? await endpoint.handler(request, ctx)
          : await endpoint.handler(request)

        expect(response.status).toBe(403)
        const body = await response.json()
        expect(body.code).toBe('FORBIDDEN')
      })
    }
  })
})
