/**
 * @fileoverview Tests para lib/v1Auth.ts
 * Cubre: requireV1Auth — autenticacion y comprobacion de scopes
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'

// ============================================================================
// Mocks
// ============================================================================

// Mock de Payload CMS utilities
vi.mock('@payloadcms/next/utilities', () => ({
  getPayloadHMR: vi.fn(),
}))

// Mock del config de Payload
vi.mock('@payload-config', () => ({
  default: Promise.resolve({}),
}))

// Mock de apiKeyAuth — controlamos validateBearerToken
const mockValidateBearerToken = vi.fn()
vi.mock('../../../../lib/apiKeyAuth', () => ({
  validateBearerToken: (...args: unknown[]) => mockValidateBearerToken(...args),
}))

// Importar despues de los mocks
import { requireV1Auth } from '../../../../lib/v1Auth'

// ============================================================================
// Helpers
// ============================================================================

function createRequest(headers: Record<string, string> = {}): Request {
  return new Request('http://localhost/api/v1/test', {
    headers: new Headers(headers),
  })
}

// ============================================================================
// Tests
// ============================================================================

describe('requireV1Auth', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // --------------------------------------------------------------------------
  // Sin header de autorizacion
  // --------------------------------------------------------------------------

  it('retorna ok:false con 401 cuando no hay header Authorization', async () => {
    const request = createRequest()

    const result = await requireV1Auth(request, 'courses:read')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(result.response.status).toBe(401)
      expect(body.code).toBe('MISSING_API_KEY')
      expect(body.error).toContain('Missing API key')
    }
  })

  // --------------------------------------------------------------------------
  // Bearer token invalido
  // --------------------------------------------------------------------------

  it('retorna ok:false con 401 para Bearer token invalido', async () => {
    mockValidateBearerToken.mockResolvedValue(null)

    const request = createRequest({
      authorization: 'Bearer ak_invalid_token_xyz',
    })

    const result = await requireV1Auth(request, 'courses:read')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(result.response.status).toBe(401)
      expect(body.code).toBe('INVALID_API_KEY')
    }
  })

  // --------------------------------------------------------------------------
  // Scope insuficiente
  // --------------------------------------------------------------------------

  it('retorna ok:false con 403 cuando el scope es insuficiente', async () => {
    mockValidateBearerToken.mockResolvedValue({
      valid: true,
      tenantId: '1',
      scopes: ['courses:read'], // solo lectura
      keyId: 'key-1',
    })

    const request = createRequest({
      authorization: 'Bearer ak_valid_but_wrong_scope',
    })

    // Requiere courses:write pero el key solo tiene courses:read
    const result = await requireV1Auth(request, 'courses:write')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      const body = await result.response.json()
      expect(result.response.status).toBe(403)
      expect(body.code).toBe('FORBIDDEN')
      expect(body.error).toContain('courses:write')
    }
  })

  // --------------------------------------------------------------------------
  // Token valido con scope correcto
  // --------------------------------------------------------------------------

  it('retorna ok:true cuando el token es valido y tiene el scope requerido', async () => {
    const mockAuth = {
      valid: true,
      tenantId: '42',
      scopes: ['courses:read', 'courses:write'],
      keyId: 'key-99',
    }
    mockValidateBearerToken.mockResolvedValue(mockAuth)

    const request = createRequest({
      authorization: 'Bearer ak_valid_with_scope',
    })

    const result = await requireV1Auth(request, 'courses:read')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.auth.tenantId).toBe('42')
      expect(result.auth.keyId).toBe('key-99')
      expect(result.auth.scopes).toContain('courses:read')
    }
  })

  // --------------------------------------------------------------------------
  // requiredScope null acepta cualquier key valido
  // --------------------------------------------------------------------------

  it('retorna ok:true sin verificar scope cuando requiredScope es null', async () => {
    mockValidateBearerToken.mockResolvedValue({
      valid: true,
      tenantId: '5',
      scopes: ['analytics:read'],
      keyId: 'key-null-scope',
    })

    const request = createRequest({
      authorization: 'Bearer ak_any_scope_ok',
    })

    const result = await requireV1Auth(request, null)

    expect(result.ok).toBe(true)
  })

  // --------------------------------------------------------------------------
  // Header x-api-bearer-token tiene prioridad
  // --------------------------------------------------------------------------

  it('usa x-api-bearer-token cuando esta presente', async () => {
    mockValidateBearerToken.mockResolvedValue({
      valid: true,
      tenantId: '10',
      scopes: ['courses:read'],
      keyId: 'key-header',
    })

    const request = createRequest({
      'x-api-bearer-token': 'ak_from_middleware',
    })

    const result = await requireV1Auth(request, 'courses:read')

    expect(result.ok).toBe(true)
    expect(mockValidateBearerToken).toHaveBeenCalledWith(
      'ak_from_middleware',
      expect.any(Function),
    )
  })

  // --------------------------------------------------------------------------
  // No reconoce formatos de Authorization incorrectos
  // --------------------------------------------------------------------------

  it('retorna 401 si Authorization no usa formato "Bearer <token>"', async () => {
    const request = createRequest({
      authorization: 'Basic dXNlcjpwYXNz',
    })

    const result = await requireV1Auth(request, 'courses:read')

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.response.status).toBe(401)
    }
  })
})
