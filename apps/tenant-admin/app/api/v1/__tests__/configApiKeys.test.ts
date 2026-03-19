/**
 * @fileoverview Tests para el endpoint interno de gestion de API keys
 * Ruta: /api/internal/api-keys (GET, POST)
 * Ruta: /api/internal/api-keys/[id] (PATCH, DELETE)
 * Autenticacion via cookie payload-token (NO Bearer)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Mocks
// ============================================================================

vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: vi.fn(),
}))

vi.mock('@payload-config', () => ({
  default: Promise.resolve({}),
}))

// Mock cookies de next/headers
const mockCookiesGet = vi.fn()
vi.mock('next/headers', () => ({
  cookies: vi.fn().mockResolvedValue({
    get: (...args: unknown[]) => mockCookiesGet(...args),
  }),
}))

// Mock apiKeyAuth — los route handlers importan desde '@/lib/apiKeyAuth'
vi.mock('@/lib/apiKeyAuth', () => ({
  generateApiKey: vi.fn().mockReturnValue('ak_mock_0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef'),
  hashApiKey: vi.fn().mockReturnValue('mocked_hash_value_abc123'),
}))

// Mock de Payload instance
const mockPayloadFind = vi.fn()
const mockPayloadCreate = vi.fn()
const mockPayloadAuth = vi.fn()
const mockPayloadFindByID = vi.fn()
const mockPayloadUpdate = vi.fn()
const mockPayloadDelete = vi.fn()

import { getPayloadHMR } from '@payloadcms/next/utilities'

// ============================================================================
// Imports de route handlers
// ============================================================================

import { GET, POST } from '../../internal/api-keys/route'
import { DELETE, PATCH } from '../../internal/api-keys/[id]/route'

// ============================================================================
// Setup
// ============================================================================

beforeEach(() => {
  vi.clearAllMocks()

  // Setup Payload mock
  ;(getPayloadHMR as any).mockResolvedValue({
    find: mockPayloadFind,
    create: mockPayloadCreate,
    auth: mockPayloadAuth,
    findByID: mockPayloadFindByID,
    update: mockPayloadUpdate,
    delete: mockPayloadDelete,
  })
})

// ============================================================================
// Helpers
// ============================================================================

function createRequest(
  url: string,
  init?: RequestInit,
): Request {
  return new Request(url, init)
}

function setupAuthenticatedUser(tenantId = '3', userId = 'user-1') {
  mockCookiesGet.mockReturnValue({ value: 'valid-payload-token' })
  mockPayloadAuth.mockResolvedValue({
    user: { id: userId, email: 'admin@test.com', role: 'admin', tenant: tenantId },
  })
}

function setupUnauthenticated() {
  mockCookiesGet.mockReturnValue(undefined)
}

// ============================================================================
// Tests: GET /api/internal/api-keys
// ============================================================================

describe('GET /api/internal/api-keys', () => {
  it('retorna 401 sin cookie de sesion', async () => {
    setupUnauthenticated()

    const request = createRequest('http://localhost/api/internal/api-keys')
    const response = await GET(request)

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.code).toBe('UNAUTHENTICATED')
  })

  it('retorna 401 cuando la sesion del usuario es invalida', async () => {
    mockCookiesGet.mockReturnValue({ value: 'invalid-token' })
    mockPayloadAuth.mockResolvedValue({ user: null })

    const request = createRequest('http://localhost/api/internal/api-keys')
    const response = await GET(request)

    expect(response.status).toBe(401)
  })

  it('retorna lista de keys del tenant autenticado', async () => {
    setupAuthenticatedUser('5')
    mockPayloadFind.mockResolvedValue({
      docs: [
        {
          id: 'k1',
          name: 'Key de Prueba',
          scopes: [{ scope: 'courses:read' }],
          is_active: true,
          rate_limit_per_day: 1000,
          last_used_at: null,
          createdAt: '2026-01-01T00:00:00Z',
        },
      ],
    })

    const request = createRequest('http://localhost/api/internal/api-keys')
    const response = await GET(request)

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data).toBeDefined()
    expect(body.data).toHaveLength(1)
    expect(body.data[0].name).toBe('Key de Prueba')
    expect(body.data[0].scopes).toEqual(['courses:read'])
  })
})

// ============================================================================
// Tests: POST /api/internal/api-keys
// ============================================================================

describe('POST /api/internal/api-keys', () => {
  it('retorna 401 sin cookie de sesion', async () => {
    setupUnauthenticated()

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Test', scopes: ['courses:read'] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(401)
  })

  it('requiere el campo "name"', async () => {
    setupAuthenticatedUser()

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: JSON.stringify({ scopes: ['courses:read'] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.error).toContain('name')
  })

  it('requiere al menos un scope', async () => {
    setupAuthenticatedUser()

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Sin Scopes', scopes: [] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.error).toContain('scope')
  })

  it('valida scopes contra la lista permitida', async () => {
    setupAuthenticatedUser()

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: JSON.stringify({ name: 'Bad Scope', scopes: ['invalid:scope'] }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('VALIDATION_ERROR')
    expect(body.error).toContain('invalid:scope')
  })

  it('crea una key con scopes validos y retorna plain_key', async () => {
    setupAuthenticatedUser('3')
    mockPayloadCreate.mockResolvedValue({
      id: 'new-key-1',
      name: 'Integracion CRM',
      scopes: [{ scope: 'courses:read' }, { scope: 'students:read' }],
      rate_limit_per_day: 1000,
      createdAt: '2026-03-19T12:00:00Z',
    })

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: JSON.stringify({
        name: 'Integracion CRM',
        scopes: ['courses:read', 'students:read'],
      }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.data.plain_key).toBeDefined()
    expect(body.data.plain_key).toMatch(/^ak_/)
    expect(body.data.name).toBe('Integracion CRM')
  })

  it('retorna 400 para JSON invalido', async () => {
    setupAuthenticatedUser()

    const request = createRequest('http://localhost/api/internal/api-keys', {
      method: 'POST',
      body: 'not-json',
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await POST(request)

    expect(response.status).toBe(400)
    const body = await response.json()
    expect(body.code).toBe('BAD_REQUEST')
  })
})

// ============================================================================
// Tests: DELETE /api/internal/api-keys/[id]
// ============================================================================

describe('DELETE /api/internal/api-keys/[id]', () => {
  it('retorna 401 sin cookie de sesion', async () => {
    setupUnauthenticated()

    const request = createRequest('http://localhost/api/internal/api-keys/key-1', {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'key-1' }),
    })

    expect(response.status).toBe(401)
    const body = await response.json()
    expect(body.code).toBe('UNAUTHENTICATED')
  })

  it('retorna 404 si la key no existe o pertenece a otro tenant', async () => {
    setupAuthenticatedUser('3')
    mockPayloadFindByID.mockResolvedValue(null)

    const request = createRequest('http://localhost/api/internal/api-keys/nonexistent', {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'nonexistent' }),
    })

    expect(response.status).toBe(404)
  })

  it('revoca (soft delete) una key existente por defecto', async () => {
    setupAuthenticatedUser('3')
    mockPayloadFindByID.mockResolvedValue({
      id: 'key-to-revoke',
      tenant: '3',
      name: 'Revocable Key',
    })
    mockPayloadUpdate.mockResolvedValue({})

    const request = createRequest('http://localhost/api/internal/api-keys/key-to-revoke', {
      method: 'DELETE',
    })

    const response = await DELETE(request, {
      params: Promise.resolve({ id: 'key-to-revoke' }),
    })

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.data.revoked).toBe(true)
    expect(body.data.is_active).toBe(false)
  })
})

// ============================================================================
// Tests: PATCH /api/internal/api-keys/[id]
// ============================================================================

describe('PATCH /api/internal/api-keys/[id]', () => {
  it('retorna 401 sin cookie de sesion', async () => {
    setupUnauthenticated()

    const request = createRequest('http://localhost/api/internal/api-keys/key-1', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Updated' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'key-1' }),
    })

    expect(response.status).toBe(401)
  })

  it('retorna 404 si la key no pertenece al tenant', async () => {
    setupAuthenticatedUser('3')
    // Key pertenece a tenant 999
    mockPayloadFindByID.mockResolvedValue({
      id: 'key-other',
      tenant: '999',
    })

    const request = createRequest('http://localhost/api/internal/api-keys/key-other', {
      method: 'PATCH',
      body: JSON.stringify({ name: 'Hacked' }),
      headers: { 'Content-Type': 'application/json' },
    })

    const response = await PATCH(request, {
      params: Promise.resolve({ id: 'key-other' }),
    })

    expect(response.status).toBe(404)
  })
})
