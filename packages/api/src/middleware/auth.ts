/**
 * @module @akademate/api/middleware/auth
 * Authentication middleware for API routes
 */

import { ApiError, ErrorCode } from '../errors'
import type { ApiContext, AuthenticatedApiContext, UserContext, TenantContext } from '../context'
import { ContextHeaders, extractTenantFromHost, extractIpAddress, generateRequestId } from '../context'

// ============================================================================
// JWT Verification Types
// ============================================================================

export interface JwtPayload {
  sub: string // userId
  email: string
  tenantId: string
  roles: string[]
  iat: number
  exp: number
}

export interface JwtVerifier {
  verify(token: string): Promise<JwtPayload>
}

// ============================================================================
// Auth Middleware Configuration
// ============================================================================

export interface AuthMiddlewareConfig {
  jwtVerifier: JwtVerifier
  requireAuth?: boolean
  requiredRoles?: string[]
  requiredPermissions?: string[]
}

// ============================================================================
// Request Interface (framework agnostic)
// ============================================================================

export interface ApiRequest {
  headers: Headers
  url: string
}

// ============================================================================
// Auth Middleware
// ============================================================================

export async function extractContext(
  request: ApiRequest,
  config: AuthMiddlewareConfig
): Promise<ApiContext> {
  const headers = request.headers

  // Generate request ID
  const requestId = headers.get(ContextHeaders.REQUEST_ID) || generateRequestId()

  // Extract tenant context
  const tenant = await extractTenantContext(headers, request.url)

  // Extract user context if auth header present
  const authHeader = headers.get('authorization')
  let user: UserContext | undefined

  if (authHeader) {
    user = await extractUserContext(authHeader, config.jwtVerifier, tenant.tenantId)
  }

  // Build context
  const context: ApiContext = {
    tenant,
    user,
    requestId,
    timestamp: new Date(),
    ip: extractIpAddress(headers) ?? undefined,
    userAgent: headers.get(ContextHeaders.USER_AGENT) ?? undefined,
  }

  return context
}

export async function requireAuthentication(
  context: ApiContext,
  config?: Pick<AuthMiddlewareConfig, 'requiredRoles' | 'requiredPermissions'>
): Promise<AuthenticatedApiContext> {
  if (!context.user) {
    throw ApiError.unauthorized('Authentication required')
  }

  // Check required roles
  if (config?.requiredRoles?.length) {
    const hasRole = config.requiredRoles.some((role) =>
      context.user!.roles.includes(role)
    )
    if (!hasRole) {
      throw new ApiError(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        `Required roles: ${config.requiredRoles.join(', ')}`
      )
    }
  }

  // Check required permissions
  if (config?.requiredPermissions?.length && context.user.permissions) {
    const hasPermission = config.requiredPermissions.every((perm) =>
      context.user!.permissions!.includes(perm)
    )
    if (!hasPermission) {
      throw new ApiError(
        ErrorCode.INSUFFICIENT_PERMISSIONS,
        `Missing permissions: ${config.requiredPermissions.join(', ')}`
      )
    }
  }

  return context as AuthenticatedApiContext
}

// ============================================================================
// Helper Functions
// ============================================================================

async function extractTenantContext(
  headers: Headers,
  url: string
): Promise<TenantContext> {
  // Priority 1: Explicit header
  const tenantIdHeader = headers.get(ContextHeaders.TENANT_ID)
  if (tenantIdHeader) {
    return {
      tenantId: tenantIdHeader,
      tenantSlug: headers.get(ContextHeaders.TENANT_SLUG) ?? undefined,
    }
  }

  // Priority 2: Subdomain extraction
  const host = headers.get('host') ?? ''
  const tenantSlug = extractTenantFromHost(host)
  if (tenantSlug) {
    return {
      tenantId: tenantSlug, // In production, resolve slug to ID
      tenantSlug,
    }
  }

  // Priority 3: URL query param (for testing)
  try {
    const urlObj = new URL(url)
    const tenantParam = urlObj.searchParams.get('tenant_id')
    if (tenantParam) {
      return { tenantId: tenantParam }
    }
  } catch {
    // Invalid URL, continue
  }

  // No tenant found - might be a public endpoint
  throw new ApiError(
    ErrorCode.TENANT_NOT_FOUND,
    'Tenant context required. Provide x-tenant-id header or use tenant subdomain.'
  )
}

async function extractUserContext(
  authHeader: string,
  jwtVerifier: JwtVerifier,
  tenantId: string
): Promise<UserContext> {
  // Extract token from Bearer scheme
  const [scheme, token] = authHeader.split(' ')

  if (scheme?.toLowerCase() !== 'bearer' || !token) {
    throw new ApiError(
      ErrorCode.AUTH_INVALID_TOKEN,
      'Invalid authorization header. Expected: Bearer <token>'
    )
  }

  try {
    const payload = await jwtVerifier.verify(token)

    // Verify tenant match
    if (payload.tenantId !== tenantId) {
      throw new ApiError(
        ErrorCode.TENANT_ACCESS_DENIED,
        'Token tenant does not match request tenant'
      )
    }

    // Check expiration
    if (payload.exp * 1000 < Date.now()) {
      throw new ApiError(ErrorCode.AUTH_TOKEN_EXPIRED, 'Token has expired')
    }

    return {
      userId: payload.sub,
      email: payload.email,
      roles: payload.roles,
    }
  } catch (error) {
    if (error instanceof ApiError) throw error

    throw new ApiError(
      ErrorCode.AUTH_INVALID_TOKEN,
      'Invalid or malformed token',
      undefined,
      error instanceof Error ? error : undefined
    )
  }
}

// ============================================================================
// Role-Based Access Control Helpers
// ============================================================================

export function hasRole(context: ApiContext, role: string): boolean {
  return context.user?.roles.includes(role) ?? false
}

export function hasAnyRole(context: ApiContext, roles: string[]): boolean {
  return roles.some((role) => hasRole(context, role))
}

export function hasAllRoles(context: ApiContext, roles: string[]): boolean {
  return roles.every((role) => hasRole(context, role))
}

export function isAdmin(context: ApiContext): boolean {
  return hasAnyRole(context, ['admin', 'superadmin', 'owner'])
}

export function isInstructor(context: ApiContext): boolean {
  return hasAnyRole(context, ['instructor', 'professor', 'teacher'])
}

export function isStudent(context: ApiContext): boolean {
  return hasRole(context, 'student')
}
