/**
 * @module @akademate/api/handlers
 * Typed route handler factory for API endpoints
 */

import { ApiError, type ApiSuccessResponse, type ApiErrorResponse } from './errors'
import type { ApiContext, AuthenticatedApiContext } from './context'
import { extractContext, requireAuthentication, type AuthMiddlewareConfig } from './middleware/auth'
import { createRateLimiter, getRateLimitHeaders, type RateLimitConfig } from './middleware/rateLimit'

// ============================================================================
// Handler Types
// ============================================================================

export type RouteHandler<TInput, TOutput, TContext extends ApiContext = ApiContext> = (
  input: TInput,
  context: TContext
) => Promise<TOutput>

export interface HandlerConfig<TInput = unknown> {
  /** Require authenticated user */
  requireAuth?: boolean
  /** Required roles for access */
  requiredRoles?: string[]
  /** Required permissions for access */
  requiredPermissions?: string[]
  /** Rate limit configuration */
  rateLimit?: RateLimitConfig
  /** Input validation schema (Zod) */
  schema?: {
    parse(input: unknown): TInput
  }
}

export interface RequestLike {
  headers: Headers
  url: string
  method: string
  json(): Promise<unknown>
}

export interface ResponseConfig {
  status?: number
  headers?: Record<string, string>
}

// ============================================================================
// Handler Result Types
// ============================================================================

export interface HandlerResult<T> {
  data: T
  status: number
  headers: Record<string, string>
}

export interface ErrorResult {
  error: ApiErrorResponse['error']
  status: number
  headers: Record<string, string>
}

// ============================================================================
// Create Handler Factory
// ============================================================================

export function createHandlerFactory(jwtConfig: AuthMiddlewareConfig) {
  /**
   * Creates a typed API handler with middleware chain
   */
  return function createHandler<TInput, TOutput>(
    config: HandlerConfig<TInput>,
    handler: RouteHandler<TInput, TOutput, ApiContext>
  ) {
    return async (request: RequestLike): Promise<HandlerResult<TOutput> | ErrorResult> => {
      const responseHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
      }

      try {
        // 1. Extract context (tenant + optional user)
        const context = await extractContext(request, jwtConfig)

        // 2. Rate limiting (if configured)
        if (config.rateLimit) {
          const rateLimiter = createRateLimiter(config.rateLimit)
          const rateLimitResult = rateLimiter(context)
          Object.assign(responseHeaders, getRateLimitHeaders(rateLimitResult))
        }

        // 3. Authentication (if required)
        let effectiveContext: ApiContext = context
        if (config.requireAuth) {
          effectiveContext = await requireAuthentication(context, {
            requiredRoles: config.requiredRoles,
            requiredPermissions: config.requiredPermissions,
          })
        }

        // 4. Parse and validate input
        let input: TInput
        if (config.schema) {
          const body = await request.json().catch(() => ({}))
          input = config.schema.parse(body)
        } else {
          input = (await request.json().catch(() => ({}))) as TInput
        }

        // 5. Execute handler
        const result = await handler(input, effectiveContext)

        return {
          data: result,
          status: 200,
          headers: responseHeaders,
        }
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            error: error.toJSON().error,
            status: error.status,
            headers: responseHeaders,
          }
        }

        // Unexpected error
        const apiError = ApiError.internal(
          process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : error instanceof Error
              ? error.message
              : 'Unknown error',
          error instanceof Error ? error : undefined
        )

        return {
          error: apiError.toJSON().error,
          status: apiError.status,
          headers: responseHeaders,
        }
      }
    }
  }
}

// ============================================================================
// Authenticated Handler Factory
// ============================================================================

export function createAuthenticatedHandlerFactory(jwtConfig: AuthMiddlewareConfig) {
  /**
   * Creates a typed API handler that always requires authentication
   */
  return function createAuthenticatedHandler<TInput, TOutput>(
    config: Omit<HandlerConfig<TInput>, 'requireAuth'>,
    handler: RouteHandler<TInput, TOutput, AuthenticatedApiContext>
  ) {
    const factory = createHandlerFactory(jwtConfig)
    return factory<TInput, TOutput>(
      { ...config, requireAuth: true },
      handler as RouteHandler<TInput, TOutput, ApiContext>
    )
  }
}

// ============================================================================
// Response Helpers
// ============================================================================

export function successResponse<T>(data: T, meta?: ApiSuccessResponse<T>['meta']): ApiSuccessResponse<T> {
  return { data, meta }
}

export function paginatedResponse<T>(
  items: T[],
  pagination: { page: number; pageSize: number; totalCount: number }
): ApiSuccessResponse<T[]> {
  return {
    data: items,
    meta: {
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalCount: pagination.totalCount,
      totalPages: Math.ceil(pagination.totalCount / pagination.pageSize),
    },
  }
}

export function createdResponse<T>(data: T): HandlerResult<T> {
  return {
    data,
    status: 201,
    headers: { 'Content-Type': 'application/json' },
  }
}

export function noContentResponse(): HandlerResult<null> {
  return {
    data: null,
    status: 204,
    headers: {},
  }
}

// ============================================================================
// HTTP Method Specific Factories
// ============================================================================

export interface MethodHandlers<TContext extends ApiContext = ApiContext> {
  get: <TOutput>(handler: RouteHandler<void, TOutput, TContext>) => void
  post: <TInput, TOutput>(handler: RouteHandler<TInput, TOutput, TContext>) => void
  put: <TInput, TOutput>(handler: RouteHandler<TInput, TOutput, TContext>) => void
  patch: <TInput, TOutput>(handler: RouteHandler<TInput, TOutput, TContext>) => void
  delete: <TOutput>(handler: RouteHandler<void, TOutput, TContext>) => void
}

// ============================================================================
// Route Builder
// ============================================================================

export interface RouteDefinition<TInput, TOutput> {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  config: HandlerConfig<TInput>
  handler: RouteHandler<TInput, TOutput, ApiContext>
}

export function defineRoute<TInput, TOutput>(
  method: RouteDefinition<TInput, TOutput>['method'],
  path: string,
  config: HandlerConfig<TInput>,
  handler: RouteHandler<TInput, TOutput, ApiContext>
): RouteDefinition<TInput, TOutput> {
  return { method, path, config, handler }
}

// ============================================================================
// OpenAPI Metadata Decorator (for documentation generation)
// ============================================================================

export interface OpenApiMetadata {
  summary: string
  description?: string
  tags: string[]
  operationId: string
  deprecated?: boolean
}

export function withOpenApi<T extends RouteDefinition<unknown, unknown>>(
  route: T,
  metadata: OpenApiMetadata
): T & { openApi: OpenApiMetadata } {
  return { ...route, openApi: metadata }
}
