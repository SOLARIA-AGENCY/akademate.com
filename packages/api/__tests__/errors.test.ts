/**
 * @module @akademate/api/__tests__/errors
 * Tests for API error handling
 */

import { describe, it, expect } from 'vitest'
import {
  ApiError,
  ErrorCode,
  errorCodeToStatus,
  isApiError,
  isApiErrorResponse,
} from '../src/errors'

describe('ErrorCode', () => {
  it('should have all authentication error codes', () => {
    expect(ErrorCode.AUTH_REQUIRED).toBe('AUTH_REQUIRED')
    expect(ErrorCode.AUTH_INVALID_TOKEN).toBe('AUTH_INVALID_TOKEN')
    expect(ErrorCode.AUTH_TOKEN_EXPIRED).toBe('AUTH_TOKEN_EXPIRED')
    expect(ErrorCode.AUTH_INVALID_CREDENTIALS).toBe('AUTH_INVALID_CREDENTIALS')
  })

  it('should have all authorization error codes', () => {
    expect(ErrorCode.FORBIDDEN).toBe('FORBIDDEN')
    expect(ErrorCode.INSUFFICIENT_PERMISSIONS).toBe('INSUFFICIENT_PERMISSIONS')
    expect(ErrorCode.TENANT_ACCESS_DENIED).toBe('TENANT_ACCESS_DENIED')
  })

  it('should have all not found error codes', () => {
    expect(ErrorCode.NOT_FOUND).toBe('NOT_FOUND')
    expect(ErrorCode.RESOURCE_NOT_FOUND).toBe('RESOURCE_NOT_FOUND')
    expect(ErrorCode.TENANT_NOT_FOUND).toBe('TENANT_NOT_FOUND')
    expect(ErrorCode.USER_NOT_FOUND).toBe('USER_NOT_FOUND')
  })

  it('should have all validation error codes', () => {
    expect(ErrorCode.VALIDATION_ERROR).toBe('VALIDATION_ERROR')
    expect(ErrorCode.INVALID_INPUT).toBe('INVALID_INPUT')
    expect(ErrorCode.MISSING_REQUIRED_FIELD).toBe('MISSING_REQUIRED_FIELD')
    expect(ErrorCode.INVALID_FORMAT).toBe('INVALID_FORMAT')
  })

  it('should have all business logic error codes', () => {
    expect(ErrorCode.ENROLLMENT_CLOSED).toBe('ENROLLMENT_CLOSED')
    expect(ErrorCode.COURSE_NOT_PUBLISHED).toBe('COURSE_NOT_PUBLISHED')
    expect(ErrorCode.CAPACITY_EXCEEDED).toBe('CAPACITY_EXCEEDED')
    expect(ErrorCode.INVALID_STATUS_TRANSITION).toBe('INVALID_STATUS_TRANSITION')
  })
})

describe('errorCodeToStatus', () => {
  it('should map authentication errors to 401', () => {
    expect(errorCodeToStatus.AUTH_REQUIRED).toBe(401)
    expect(errorCodeToStatus.AUTH_INVALID_TOKEN).toBe(401)
    expect(errorCodeToStatus.AUTH_TOKEN_EXPIRED).toBe(401)
  })

  it('should map authorization errors to 403', () => {
    expect(errorCodeToStatus.FORBIDDEN).toBe(403)
    expect(errorCodeToStatus.INSUFFICIENT_PERMISSIONS).toBe(403)
    expect(errorCodeToStatus.TENANT_ACCESS_DENIED).toBe(403)
  })

  it('should map not found errors to 404', () => {
    expect(errorCodeToStatus.NOT_FOUND).toBe(404)
    expect(errorCodeToStatus.RESOURCE_NOT_FOUND).toBe(404)
    expect(errorCodeToStatus.TENANT_NOT_FOUND).toBe(404)
  })

  it('should map validation errors to 400', () => {
    expect(errorCodeToStatus.VALIDATION_ERROR).toBe(400)
    expect(errorCodeToStatus.INVALID_INPUT).toBe(400)
  })

  it('should map conflict errors to 409', () => {
    expect(errorCodeToStatus.CONFLICT).toBe(409)
    expect(errorCodeToStatus.DUPLICATE_ENTRY).toBe(409)
  })

  it('should map rate limit errors to 429', () => {
    expect(errorCodeToStatus.RATE_LIMIT_EXCEEDED).toBe(429)
    expect(errorCodeToStatus.TOO_MANY_REQUESTS).toBe(429)
  })

  it('should map server errors to 500+', () => {
    expect(errorCodeToStatus.INTERNAL_ERROR).toBe(500)
    expect(errorCodeToStatus.DATABASE_ERROR).toBe(500)
    expect(errorCodeToStatus.SERVICE_UNAVAILABLE).toBe(503)
  })

  it('should map business logic errors to 422', () => {
    expect(errorCodeToStatus.ENROLLMENT_CLOSED).toBe(422)
    expect(errorCodeToStatus.COURSE_NOT_PUBLISHED).toBe(422)
    expect(errorCodeToStatus.CAPACITY_EXCEEDED).toBe(422)
  })
})

describe('ApiError', () => {
  describe('constructor', () => {
    it('should create error with code and message', () => {
      const error = new ApiError(ErrorCode.NOT_FOUND, 'Course not found')

      expect(error.code).toBe(ErrorCode.NOT_FOUND)
      expect(error.message).toBe('Course not found')
      expect(error.status).toBe(404)
      expect(error.name).toBe('ApiError')
    })

    it('should include details when provided', () => {
      const details = [{ field: 'email', constraint: 'Invalid format' }]
      const error = new ApiError(ErrorCode.VALIDATION_ERROR, 'Validation failed', details)

      expect(error.details).toEqual(details)
    })

    it('should include timestamp', () => {
      const before = new Date().toISOString()
      const error = new ApiError(ErrorCode.INTERNAL_ERROR, 'Something went wrong')
      const after = new Date().toISOString()

      expect(error.timestamp >= before).toBe(true)
      expect(error.timestamp <= after).toBe(true)
    })

    it('should preserve cause error', () => {
      const cause = new Error('Database connection failed')
      const error = new ApiError(ErrorCode.DATABASE_ERROR, 'Database error', undefined, cause)

      expect(error.cause).toBe(cause)
    })
  })

  describe('toJSON', () => {
    it('should serialize to standard error response format', () => {
      const error = new ApiError(
        ErrorCode.VALIDATION_ERROR,
        'Validation failed',
        [{ field: 'email', constraint: 'Required' }]
      )

      const json = error.toJSON()

      expect(json).toHaveProperty('error')
      expect(json.error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(json.error.message).toBe('Validation failed')
      expect(json.error.details).toHaveLength(1)
      expect(json.error.timestamp).toBeDefined()
    })
  })

  describe('static factory methods', () => {
    it('should create notFound error', () => {
      const error = ApiError.notFound('Course', '123')

      expect(error.code).toBe(ErrorCode.RESOURCE_NOT_FOUND)
      expect(error.message).toBe("Course with id '123' not found")
      expect(error.status).toBe(404)
    })

    it('should create notFound error without id', () => {
      const error = ApiError.notFound('User')

      expect(error.message).toBe('User not found')
    })

    it('should create unauthorized error', () => {
      const error = ApiError.unauthorized()

      expect(error.code).toBe(ErrorCode.AUTH_REQUIRED)
      expect(error.message).toBe('Authentication required')
      expect(error.status).toBe(401)
    })

    it('should create unauthorized error with custom message', () => {
      const error = ApiError.unauthorized('Token expired')

      expect(error.message).toBe('Token expired')
    })

    it('should create forbidden error', () => {
      const error = ApiError.forbidden()

      expect(error.code).toBe(ErrorCode.FORBIDDEN)
      expect(error.message).toBe('Access denied')
      expect(error.status).toBe(403)
    })

    it('should create conflict error', () => {
      const error = ApiError.conflict('Email already exists', [
        { field: 'email', value: 'test@example.com' }
      ])

      expect(error.code).toBe(ErrorCode.CONFLICT)
      expect(error.status).toBe(409)
      expect(error.details?.[0].field).toBe('email')
    })

    it('should create internal error', () => {
      const cause = new Error('Connection timeout')
      const error = ApiError.internal('Server error', cause)

      expect(error.code).toBe(ErrorCode.INTERNAL_ERROR)
      expect(error.status).toBe(500)
      expect(error.cause).toBe(cause)
    })

    it('should create rateLimit error', () => {
      const error = ApiError.rateLimit(30)

      expect(error.code).toBe(ErrorCode.RATE_LIMIT_EXCEEDED)
      expect(error.status).toBe(429)
      expect(error.details?.[0].retryAfter).toBe(30)
    })
  })

  describe('fromZodError', () => {
    it('should convert Zod error to ApiError', () => {
      const zodError = {
        issues: [
          { path: ['email'], message: 'Invalid email' },
          { path: ['phone', 'number'], message: 'Required' },
        ]
      }

      const error = ApiError.fromZodError(zodError)

      expect(error.code).toBe(ErrorCode.VALIDATION_ERROR)
      expect(error.message).toBe('Validation failed')
      expect(error.details).toHaveLength(2)
      expect(error.details?.[0].field).toBe('email')
      expect(error.details?.[0].constraint).toBe('Invalid email')
      expect(error.details?.[1].field).toBe('phone.number')
    })
  })
})

describe('Type Guards', () => {
  describe('isApiError', () => {
    it('should return true for ApiError instances', () => {
      const error = new ApiError(ErrorCode.NOT_FOUND, 'Not found')
      expect(isApiError(error)).toBe(true)
    })

    it('should return false for regular errors', () => {
      const error = new Error('Regular error')
      expect(isApiError(error)).toBe(false)
    })

    it('should return false for non-errors', () => {
      expect(isApiError('string')).toBe(false)
      expect(isApiError(null)).toBe(false)
      expect(isApiError(undefined)).toBe(false)
    })
  })

  describe('isApiErrorResponse', () => {
    it('should return true for valid error response', () => {
      const response = {
        error: {
          code: ErrorCode.NOT_FOUND,
          message: 'Not found',
          timestamp: new Date().toISOString()
        }
      }
      expect(isApiErrorResponse(response)).toBe(true)
    })

    it('should return false for success response', () => {
      const response = { data: { id: '123' } }
      expect(isApiErrorResponse(response)).toBe(false)
    })

    it('should return false for invalid values', () => {
      expect(isApiErrorResponse(null)).toBe(false)
      expect(isApiErrorResponse('string')).toBe(false)
      expect(isApiErrorResponse({ error: 'string' })).toBe(false)
    })
  })
})
