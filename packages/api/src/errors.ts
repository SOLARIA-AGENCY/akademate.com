/**
 * @module @akademate/api/errors
 * Standardized API error classes and error codes
 */

// ============================================================================
// Error Codes (RFC 7231 compliant + custom)
// ============================================================================

export const ErrorCode = {
  // Authentication (401)
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',

  // Authorization (403)
  FORBIDDEN: 'FORBIDDEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  TENANT_ACCESS_DENIED: 'TENANT_ACCESS_DENIED',

  // Not Found (404)
  NOT_FOUND: 'NOT_FOUND',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',

  // Validation (400)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // Conflict (409)
  CONFLICT: 'CONFLICT',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  RESOURCE_EXISTS: 'RESOURCE_EXISTS',
  OPTIMISTIC_LOCK_FAILED: 'OPTIMISTIC_LOCK_FAILED',

  // Rate Limiting (429)
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',

  // Server Errors (500)
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  DATABASE_ERROR: 'DATABASE_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Business Logic Errors
  ENROLLMENT_CLOSED: 'ENROLLMENT_CLOSED',
  COURSE_NOT_PUBLISHED: 'COURSE_NOT_PUBLISHED',
  CAPACITY_EXCEEDED: 'CAPACITY_EXCEEDED',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
} as const

export type ErrorCode = (typeof ErrorCode)[keyof typeof ErrorCode]

// ============================================================================
// Error Code to HTTP Status mapping
// ============================================================================

export const errorCodeToStatus: Record<ErrorCode, number> = {
  // 401
  AUTH_REQUIRED: 401,
  AUTH_INVALID_TOKEN: 401,
  AUTH_TOKEN_EXPIRED: 401,
  AUTH_INVALID_CREDENTIALS: 401,

  // 403
  FORBIDDEN: 403,
  INSUFFICIENT_PERMISSIONS: 403,
  TENANT_ACCESS_DENIED: 403,

  // 404
  NOT_FOUND: 404,
  RESOURCE_NOT_FOUND: 404,
  TENANT_NOT_FOUND: 404,
  USER_NOT_FOUND: 404,

  // 400
  VALIDATION_ERROR: 400,
  INVALID_INPUT: 400,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FORMAT: 400,

  // 409
  CONFLICT: 409,
  DUPLICATE_ENTRY: 409,
  RESOURCE_EXISTS: 409,
  OPTIMISTIC_LOCK_FAILED: 409,

  // 429
  RATE_LIMIT_EXCEEDED: 429,
  TOO_MANY_REQUESTS: 429,

  // 500
  INTERNAL_ERROR: 500,
  DATABASE_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,

  // Business Logic (422 Unprocessable Entity)
  ENROLLMENT_CLOSED: 422,
  COURSE_NOT_PUBLISHED: 422,
  CAPACITY_EXCEEDED: 422,
  INVALID_STATUS_TRANSITION: 422,
}

// ============================================================================
// API Error Class
// ============================================================================

export interface ApiErrorDetails {
  field?: string
  value?: unknown
  constraint?: string
  [key: string]: unknown
}

export class ApiError extends Error {
  public readonly code: ErrorCode
  public readonly status: number
  public readonly details?: ApiErrorDetails[]
  public readonly timestamp: string

  constructor(
    code: ErrorCode,
    message: string,
    details?: ApiErrorDetails[],
    cause?: Error
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = errorCodeToStatus[code] || 500
    this.details = details
    this.timestamp = new Date().toISOString()
    this.cause = cause
  }

  toJSON(): ApiErrorResponse {
    return {
      error: {
        code: this.code,
        message: this.message,
        details: this.details,
        timestamp: this.timestamp,
      },
    }
  }

  static fromZodError(error: { issues: Array<{ path: (string | number)[]; message: string }> }): ApiError {
    const details: ApiErrorDetails[] = error.issues.map((issue) => ({
      field: issue.path.join('.'),
      constraint: issue.message,
    }))

    return new ApiError(
      ErrorCode.VALIDATION_ERROR,
      'Validation failed',
      details
    )
  }

  static notFound(resource: string, id?: string): ApiError {
    return new ApiError(
      ErrorCode.RESOURCE_NOT_FOUND,
      id ? `${resource} with id '${id}' not found` : `${resource} not found`
    )
  }

  static unauthorized(message = 'Authentication required'): ApiError {
    return new ApiError(ErrorCode.AUTH_REQUIRED, message)
  }

  static forbidden(message = 'Access denied'): ApiError {
    return new ApiError(ErrorCode.FORBIDDEN, message)
  }

  static conflict(message: string, details?: ApiErrorDetails[]): ApiError {
    return new ApiError(ErrorCode.CONFLICT, message, details)
  }

  static internal(message = 'Internal server error', cause?: Error): ApiError {
    return new ApiError(ErrorCode.INTERNAL_ERROR, message, undefined, cause)
  }

  static rateLimit(retryAfter?: number): ApiError {
    const error = new ApiError(
      ErrorCode.RATE_LIMIT_EXCEEDED,
      'Too many requests. Please try again later.',
      retryAfter ? [{ retryAfter }] : undefined
    )
    return error
  }
}

// ============================================================================
// Response Types
// ============================================================================

export interface ApiErrorResponse {
  error: {
    code: ErrorCode
    message: string
    details?: ApiErrorDetails[]
    timestamp: string
  }
}

export interface ApiSuccessResponse<T> {
  data: T
  meta?: {
    page?: number
    pageSize?: number
    totalCount?: number
    totalPages?: number
  }
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse

// ============================================================================
// Type Guards
// ============================================================================

export function isApiError(error: unknown): error is ApiError {
  return error instanceof ApiError
}

export function isApiErrorResponse(response: unknown): response is ApiErrorResponse {
  return (
    typeof response === 'object' &&
    response !== null &&
    'error' in response &&
    typeof (response as ApiErrorResponse).error === 'object'
  )
}
