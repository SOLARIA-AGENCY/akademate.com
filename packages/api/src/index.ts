/**
 * @module @akademate/api
 * Multi-tenant API package for Akademate.com
 *
 * This package provides:
 * - Standardized error handling with RFC 7231 compliant codes
 * - Request context extraction (tenant, user, metadata)
 * - Authentication middleware with JWT support
 * - Request validation with Zod schemas
 * - Rate limiting (in-memory and Redis)
 * - Typed route handler factories
 *
 * @example
 * ```typescript
 * import { createHandlerFactory, ApiError, validateBody, CreateLeadSchema } from '@akademate/api'
 *
 * const createHandler = createHandlerFactory({ jwtVerifier })
 *
 * export const createLead = createHandler(
 *   { requireAuth: true, rateLimit: RateLimitPresets.standard },
 *   async (input, context) => {
 *     const validated = validateBody(CreateLeadSchema, input)
 *     // ... create lead
 *     return { id: newLead.id }
 *   }
 * )
 * ```
 */

// ============================================================================
// Core Exports
// ============================================================================

// Error handling
export {
  ApiError,
  ErrorCode,
  errorCodeToStatus,
  isApiError,
  isApiErrorResponse,
  type ApiErrorDetails,
  type ApiErrorResponse,
  type ApiSuccessResponse,
  type ApiResponse,
} from './errors'

// Context types
export {
  ContextHeaders,
  extractTenantFromHost,
  extractIpAddress,
  generateRequestId,
  type TenantContext,
  type UserContext,
  type ApiContext,
  type AuthenticatedApiContext,
} from './context'

// ============================================================================
// Middleware Exports
// ============================================================================

export {
  // Auth
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
  // Validation
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
  CreateCourseSchema,
  UpdateCourseSchema,
  CreateCourseRunSchema,
  CreateEnrollmentSchema,
  CreateLeadSchema,
  type PaginationParams,
  type SortParams,
  type FilterParams,
  type ListQueryParams,
  type CreateCourseInput,
  type UpdateCourseInput,
  type CreateCourseRunInput,
  type CreateEnrollmentInput,
  type CreateLeadInput,
  validateBody,
  validateQuery,
  validateParams,
  createListQuerySchema,
  createEntitySchema,
  // Rate limiting
  checkRateLimit,
  createRateLimiter,
  getRateLimitHeaders,
  checkRedisRateLimit,
  RateLimitPresets,
  type RateLimitConfig,
  type RateLimitResult,
  type RedisRateLimitConfig,
} from './middleware'

// ============================================================================
// Handler Factory Exports
// ============================================================================

export {
  createHandlerFactory,
  createAuthenticatedHandlerFactory,
  successResponse,
  paginatedResponse,
  createdResponse,
  noContentResponse,
  defineRoute,
  withOpenApi,
  type RouteHandler,
  type HandlerConfig,
  type RequestLike,
  type ResponseConfig,
  type HandlerResult,
  type ErrorResult,
  type MethodHandlers,
  type RouteDefinition,
  type OpenApiMetadata,
} from './handlers'

// ============================================================================
// GDPR Compliance Exports
// ============================================================================

export {
  // Types
  type ExportFormat,
  type UserProfileExport,
  type MembershipExport,
  type EnrollmentExport,
  type LessonProgressExport,
  type SubmissionExport,
  type CertificateExport,
  type BadgeExport,
  type PointsTransactionExport,
  type StreakExport,
  type AttendanceExport,
  type LeadDataExport,
  type AuditLogExport,
  type UserDataExport,
  type ExportRequest,
  type ExportResponse,
  type GdprExportDependencies,
  type ExportSection,
  // Schemas
  ExportFormatSchema,
  ExportRequestSchema,
  // Service
  GdprExportService,
  createGdprExportService,
} from './gdpr'
