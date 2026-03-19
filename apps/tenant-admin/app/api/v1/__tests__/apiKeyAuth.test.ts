/**
 * @fileoverview Tests para lib/apiKeyAuth.ts
 * Cubre: hashApiKey, generateApiKey, validateBearerToken
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { hashApiKey, generateApiKey, validateBearerToken } from '../../../../lib/apiKeyAuth'

// ============================================================================
// Tests: hashApiKey
// ============================================================================

describe('hashApiKey', () => {
  it('produce un hash SHA-256 hex consistente para la misma entrada', () => {
    const input = 'ak_test_abc123'
    const hash1 = hashApiKey(input)
    const hash2 = hashApiKey(input)

    expect(hash1).toBe(hash2)
  })

  it('produce hashes diferentes para entradas diferentes', () => {
    const hash1 = hashApiKey('ak_key_one')
    const hash2 = hashApiKey('ak_key_two')

    expect(hash1).not.toBe(hash2)
  })

  it('retorna un string hexadecimal de 64 caracteres (SHA-256)', () => {
    const hash = hashApiKey('cualquier_valor')

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
  })

  it('maneja strings vacios sin error', () => {
    const hash = hashApiKey('')

    expect(hash).toMatch(/^[a-f0-9]{64}$/)
    expect(hash).toBe(hashApiKey(''))
  })
})

// ============================================================================
// Tests: generateApiKey
// ============================================================================

describe('generateApiKey', () => {
  it('produce keys con prefijo "ak_"', () => {
    const key = generateApiKey()

    expect(key.startsWith('ak_')).toBe(true)
  })

  it('produce un hex de 64+ caracteres despues del prefijo', () => {
    const key = generateApiKey()
    const hexPart = key.slice(3) // quitar "ak_"

    expect(hexPart.length).toBeGreaterThanOrEqual(64)
    expect(hexPart).toMatch(/^[a-f0-9]+$/)
  })

  it('produce keys unicas en cada invocacion', () => {
    const keys = new Set<string>()
    for (let i = 0; i < 100; i++) {
      keys.add(generateApiKey())
    }

    // Las 100 keys deben ser unicas
    expect(keys.size).toBe(100)
  })

  it('genera keys con longitud total consistente (ak_ + 64 hex = 67 chars)', () => {
    const key = generateApiKey()

    // "ak_" (3) + 64 hex chars = 67 total
    expect(key.length).toBe(67)
  })
})

// ============================================================================
// Tests: validateBearerToken
// ============================================================================

describe('validateBearerToken', () => {
  const mockFind = vi.fn()
  const mockUpdate = vi.fn()
  const mockGetPayload = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockUpdate.mockResolvedValue({})
    mockGetPayload.mockResolvedValue({
      find: mockFind,
      update: mockUpdate,
    })
  })

  it('retorna null cuando el token es vacio', async () => {
    const result = await validateBearerToken('', mockGetPayload)

    expect(result).toBeNull()
    expect(mockGetPayload).not.toHaveBeenCalled()
  })

  it('retorna null cuando el token no es string', async () => {
    // @ts-expect-error testing invalid input
    const result = await validateBearerToken(null, mockGetPayload)

    expect(result).toBeNull()
  })

  it('retorna null cuando no se encuentra un key_hash coincidente', async () => {
    mockFind.mockResolvedValue({ docs: [] })

    const result = await validateBearerToken('ak_nonexistent', mockGetPayload)

    expect(result).toBeNull()
    expect(mockFind).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'api-keys',
        where: expect.objectContaining({
          key_hash: { equals: expect.any(String) },
          is_active: { equals: true },
        }),
      }),
    )
  })

  it('retorna ValidatedApiKey cuando el token coincide con un key activo', async () => {
    const mockApiKey = {
      id: 'key-123',
      tenant: { id: 42 },
      scopes: [
        { scope: 'courses:read' },
        { scope: 'students:read' },
      ],
    }
    mockFind.mockResolvedValue({ docs: [mockApiKey] })

    const result = await validateBearerToken('ak_valid_token', mockGetPayload)

    expect(result).toEqual({
      valid: true,
      tenantId: '42',
      scopes: ['courses:read', 'students:read'],
      keyId: 'key-123',
    })
  })

  it('extrae tenantId cuando tenant es un ID directo (no objeto)', async () => {
    const mockApiKey = {
      id: 'key-456',
      tenant: 7,
      scopes: [{ scope: 'analytics:read' }],
    }
    mockFind.mockResolvedValue({ docs: [mockApiKey] })

    const result = await validateBearerToken('ak_direct_tenant', mockGetPayload)

    expect(result).toEqual({
      valid: true,
      tenantId: '7',
      scopes: ['analytics:read'],
      keyId: 'key-456',
    })
  })

  it('actualiza last_used_at de forma asincrona (fire-and-forget)', async () => {
    const mockApiKey = {
      id: 'key-789',
      tenant: 1,
      scopes: [{ scope: 'courses:read' }],
    }
    mockFind.mockResolvedValue({ docs: [mockApiKey] })

    await validateBearerToken('ak_track_usage', mockGetPayload)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        collection: 'api-keys',
        id: 'key-789',
        data: expect.objectContaining({
          last_used_at: expect.any(String),
        }),
      }),
    )
  })

  it('retorna null si ocurre un error en la consulta', async () => {
    mockFind.mockRejectedValue(new Error('DB connection failed'))

    const result = await validateBearerToken('ak_error_token', mockGetPayload)

    expect(result).toBeNull()
  })
})
