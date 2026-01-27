/**
 * @module @akademate/api/context
 * Request context types for API handlers
 */

// ============================================================================
// Tenant Context
// ============================================================================

export interface TenantContext {
  tenantId: string
  tenantSlug?: string
  plan?: 'starter' | 'pro' | 'enterprise'
}

// ============================================================================
// User Context
// ============================================================================

export interface UserContext {
  userId: string
  email: string
  roles: string[]
  permissions?: string[]
}

// ============================================================================
// Request Context
// ============================================================================

export interface ApiContext {
  tenant: TenantContext
  user?: UserContext
  requestId: string
  timestamp: Date
  ip?: string
  userAgent?: string
}

// ============================================================================
// Authenticated Context (user required)
// ============================================================================

export interface AuthenticatedApiContext extends ApiContext {
  user: UserContext
}

// ============================================================================
// Context Headers
// ============================================================================

export const ContextHeaders = {
  TENANT_ID: 'x-tenant-id',
  TENANT_SLUG: 'x-tenant-slug',
  REQUEST_ID: 'x-request-id',
  CORRELATION_ID: 'x-correlation-id',
  USER_AGENT: 'user-agent',
  FORWARDED_FOR: 'x-forwarded-for',
  REAL_IP: 'x-real-ip',
} as const

// ============================================================================
// Context Extraction Utilities
// ============================================================================

export function extractTenantFromHost(host: string): string | null {
  // Pattern: {tenant}.akademate.com or {tenant}.localhost
  const match = /^([a-z0-9-]+)\.(akademate\.com|localhost)/i.exec(host)
  return match?.[1] ?? null
}

export function extractIpAddress(headers: Headers): string | null {
  const forwarded = headers.get(ContextHeaders.FORWARDED_FOR)
  if (forwarded) {
    const firstIp = forwarded.split(',')[0]
    return firstIp ? firstIp.trim() : null
  }
  return headers.get(ContextHeaders.REAL_IP) ?? null
}

export function generateRequestId(): string {
  return `req_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 9)}`
}
