/**
 * @module @akademate/api/middleware
 * Barrel export for all middleware modules
 */

// Authentication middleware
export {
  extractContext,
  requireAuthentication,
  hasRole,
  hasAnyRole,
  hasAllRoles,
  isAdmin,
  isInstructor,
  isStudent,
  type JwtPayload,
  type JwtVerifier,
  type AuthMiddlewareConfig,
  type ApiRequest,
} from './auth'

// Validation middleware
export {
  // Schemas
  PaginationSchema,
  SortSchema,
  FilterSchema,
  ListQuerySchema,
  UuidSchema,
  UuidParamSchema,
  EmailSchema,
  PhoneSchema,
  SlugSchema,
  UrlSchema,
  // Entity schemas
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateCourseRunSchema,
  CreateEnrollmentSchema,
  CreateLeadSchema,
  // Types
  type PaginationParams,
  type SortParams,
  type FilterParams,
  type ListQueryParams,
  type CreateCourseInput,
  type UpdateCourseInput,
  type CreateCourseRunInput,
  type CreateEnrollmentInput,
  type CreateLeadInput,
  // Functions
  validateBody,
  validateQuery,
  validateParams,
  createListQuerySchema,
  createEntitySchema,
} from './validation'

// Rate limiting middleware
export {
  checkRateLimit,
  createRateLimiter,
  getRateLimitHeaders,
  checkRedisRateLimit,
  RateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
  type RedisRateLimitConfig,
} from './rateLimit'
