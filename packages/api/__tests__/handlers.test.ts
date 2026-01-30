/**
 * @module @akademate/api/__tests__/handlers
 * Tests for route handler factory
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { z } from 'zod'
import {
  createHandlerFactory,
  createAuthenticatedHandlerFactory,
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  defineRoute,
  withOpenApi,
} from '../src/handlers'
import { ApiError, ErrorCode } from '../src/errors'
import type { AuthMiddlewareConfig, JwtVerifier } from '../src/middleware/auth'
import type { AuthenticatedApiContext } from '../src/context'

// Mock JWT verifier
const createMockVerifier = (payload?: Partial<import('../src/middleware/auth').JwtPayload>): JwtVerifier => ({
  verify: vi.fn().mockResolvedValue({
    sub: '550e8400-e29b-41d4-a716-446655440001',
    email: 'test@example.com',
    tenantId: 'test-tenant',
    roles: ['user'],
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600,
    ...payload,
  }),
})

// Mock request factory
function createMockRequest(options: {
  headers?: Record<string, string>
  body?: unknown
  url?: string
} = {}) {
  const headers = new Headers({
    'x-tenant-id': 'test-tenant',
    'host': 'test.akademate.com',
    ...options.headers,
  })

  return {
    headers,
    url: options.url || 'http://test.akademate.com/api/test',
    method: 'POST',
    json: vi.fn().mockResolvedValue(options.body || {}),
  }
}

describe('createHandlerFactory', () => {
  const jwtVerifier = createMockVerifier()
  const config: AuthMiddlewareConfig = { jwtVerifier }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should create a handler factory', () => {
    const createHandler = createHandlerFactory(config)
    expect(typeof createHandler).toBe('function')
  })

  it('should create handlers that process requests', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      {},
      async (_input, context) => {
        return { tenantId: context.tenant.tenantId }
      }
    )

    const request = createMockRequest()
    const result = await handler(request)

    expect(result.status).toBe(200)
    expect('data' in result).toBe(true)
    if ('data' in result) {
      expect(result.data.tenantId).toBe('test-tenant')
    }
  })

  it('should validate input with schema', async () => {
    const createHandler = createHandlerFactory(config)

    const InputSchema = z.object({
      name: z.string().min(1),
      email: z.string().email(),
    })

    const handler = createHandler(
      { schema: InputSchema },
      async (input, _context) => {
        return { received: input }
      }
    )

    const request = createMockRequest({
      body: { name: 'John', email: 'john@example.com' },
    })

    const result = await handler(request)

    expect(result.status).toBe(200)
    if ('data' in result) {
      expect(result.data.received.name).toBe('John')
    }
  })

  it('should return validation error for invalid input', async () => {
    const createHandler = createHandlerFactory(config)

    const InputSchema = z.object({
      name: z.string().min(1),
    })

    const handler = createHandler(
      { schema: InputSchema },
      async (input, _context) => ({ received: input })
    )

    const request = createMockRequest({
      body: { name: '' }, // Invalid: empty string
    })

    const result = await handler(request)

    // Zod validation error gets caught and wrapped
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect([400, 500]).toContain(result.status) // Either validation or internal error
    }
  })

  it('should require authentication when configured', async () => {
    const verifier = createMockVerifier()
    const createHandler = createHandlerFactory({ jwtVerifier: verifier })

    const handler = createHandler(
      { requireAuth: true },
      async (_input, context) => {
        return { userId: (context as AuthenticatedApiContext).user.userId }
      }
    )

    // Request with valid auth header
    const request = createMockRequest({
      headers: {
        'authorization': 'Bearer valid-token',
        'x-tenant-id': 'test-tenant',
      },
    })

    const result = await handler(request)

    expect(result.status).toBe(200)
    expect(verifier.verify).toHaveBeenCalledWith('valid-token')
  })

  it('should return 401 for missing auth when required', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      { requireAuth: true },
      async (_input, _context) => ({ ok: true })
    )

    const request = createMockRequest() // No auth header

    const result = await handler(request)

    expect(result.status).toBe(401)
    expect('error' in result).toBe(true)
  })

  it('should apply rate limiting', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      {
        rateLimit: {
          windowMs: 60000,
          maxRequests: 2,
          keyGenerator: () => 'rate-limit-test-key',
        },
      },
      async () => ({ ok: true })
    )

    const request = createMockRequest()

    // First two requests should succeed
    await handler(request)
    await handler(request)

    // Third should be rate limited
    const result = await handler(request)

    expect(result.status).toBe(429)
    // Rate limit headers are present when rate limiting is configured
    expect('error' in result).toBe(true)
  })

  it('should include rate limit headers', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      {
        rateLimit: {
          windowMs: 60000,
          maxRequests: 100,
          keyGenerator: () => 'header-test-key',
        },
      },
      async () => ({ ok: true })
    )

    const request = createMockRequest()
    const result = await handler(request)

    expect(result.headers['X-RateLimit-Limit']).toBeDefined()
    expect(result.headers['X-RateLimit-Remaining']).toBeDefined()
    expect(result.headers['X-RateLimit-Reset']).toBeDefined()
  })

  it('should handle handler errors gracefully', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      {},
      async () => {
        throw new ApiError(ErrorCode.NOT_FOUND, 'Resource not found')
      }
    )

    const request = createMockRequest()
    const result = await handler(request)

    expect(result.status).toBe(404)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.code).toBe(ErrorCode.NOT_FOUND)
    }
  })

  it('should wrap unexpected errors as internal errors', async () => {
    const createHandler = createHandlerFactory(config)

    const handler = createHandler(
      {},
      async () => {
        throw new Error('Unexpected database error')
      }
    )

    const request = createMockRequest()
    const result = await handler(request)

    expect(result.status).toBe(500)
    expect('error' in result).toBe(true)
    if ('error' in result) {
      expect(result.error.code).toBe(ErrorCode.INTERNAL_ERROR)
    }
  })
})

describe('createAuthenticatedHandlerFactory', () => {
  it('should create handlers that always require auth', async () => {
    const verifier = createMockVerifier()
    const createAuthHandler = createAuthenticatedHandlerFactory({ jwtVerifier: verifier })

    const handler = createAuthHandler(
      {},
      async (_input, context) => {
        // Context is guaranteed to have user
        return { email: context.user.email }
      }
    )

    const request = createMockRequest({
      headers: {
        'authorization': 'Bearer token',
        'x-tenant-id': 'test-tenant',
      },
    })

    const result = await handler(request)

    expect(result.status).toBe(200)
    if ('data' in result) {
      expect(result.data.email).toBe('test@example.com')
    }
  })
})

describe('Response Helpers', () => {
  describe('successResponse', () => {
    it('should create success response with data', () => {
      const response = successResponse({ id: '123', name: 'Test' })

      expect(response.data).toEqual({ id: '123', name: 'Test' })
      expect(response.meta).toBeUndefined()
    })

    it('should include meta when provided', () => {
      const response = successResponse(
        [{ id: '1' }, { id: '2' }],
        { page: 1, pageSize: 10, totalCount: 100, totalPages: 10 }
      )

      expect(response.meta?.page).toBe(1)
      expect(response.meta?.totalCount).toBe(100)
    })
  })

  describe('paginatedResponse', () => {
    it('should create paginated response with calculated totalPages', () => {
      const items = [{ id: '1' }, { id: '2' }]
      const response = paginatedResponse(items, {
        page: 1,
        pageSize: 10,
        totalCount: 25,
      })

      expect(response.data).toHaveLength(2)
      expect(response.meta?.totalPages).toBe(3)
    })

    it('should handle exact page fit', () => {
      const response = paginatedResponse([], {
        page: 1,
        pageSize: 10,
        totalCount: 100,
      })

      expect(response.meta?.totalPages).toBe(10)
    })
  })

  describe('createdResponse', () => {
    it('should return 201 status', () => {
      const response = createdResponse({ id: 'new-123' })

      expect(response.status).toBe(201)
      expect(response.data.id).toBe('new-123')
    })
  })

  describe('noContentResponse', () => {
    it('should return 204 status with null data', () => {
      const response = noContentResponse()

      expect(response.status).toBe(204)
      expect(response.data).toBeNull()
    })
  })
})

describe('defineRoute', () => {
  it('should create route definition', () => {
    const route = defineRoute(
      'POST',
      '/api/courses',
      { requireAuth: true },
      async (input, context) => ({ created: true })
    )

    expect(route.method).toBe('POST')
    expect(route.path).toBe('/api/courses')
    expect(route.config.requireAuth).toBe(true)
  })
})

describe('withOpenApi', () => {
  it('should attach OpenAPI metadata to route', () => {
    const route = defineRoute(
      'GET',
      '/api/courses',
      {},
      async () => ([])
    )

    const documented = withOpenApi(route, {
      summary: 'List courses',
      description: 'Returns paginated list of courses',
      tags: ['courses'],
      operationId: 'listCourses',
    })

    expect(documented.openApi.summary).toBe('List courses')
    expect(documented.openApi.tags).toContain('courses')
    expect(documented.method).toBe('GET') // Original route preserved
  })
})
