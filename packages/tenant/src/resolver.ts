/**
 * Tenant Resolution Utilities
 *
 * Resolves tenant from various sources:
 * 1. Custom header (X-Tenant-ID) - for API calls
 * 2. Cookie (akademate_tenant) - for browser sessions
 * 3. Subdomain (tenant.akademate.io)
 * 4. Custom domain lookup (tenant's custom domain)
 */

export const TENANT_HEADER = 'x-tenant-id'
export const TENANT_COOKIE = 'akademate_tenant'

export type TenantResolution = {
  tenantId: string | null
  tenantSlug: string | null
  source: 'header' | 'cookie' | 'subdomain' | 'domain' | 'none'
  isValid: boolean
}

/**
 * Known system domains that should not be treated as tenant subdomains
 */
const SYSTEM_SUBDOMAINS = ['www', 'api', 'admin', 'app', 'dashboard', 'docs', 'status', 'mail']

/**
 * Base domains for the application
 */
const BASE_DOMAINS = ['akademate.io', 'akademate.com', 'localhost']

/**
 * Resolve tenant slug from hostname
 *
 * Handles:
 * - demo.akademate.io -> "demo"
 * - akademate.io -> null (main site)
 * - www.akademate.io -> null (main site)
 * - custom-domain.com -> lookup required
 */
export function resolveTenantFromHost(
  host: string,
  customDomains?: Map<string, string> // domain -> tenantSlug
): TenantResolution {
  // Remove port if present
  const hostname = host.split(':')[0].toLowerCase()

  // Check if it's a custom domain
  if (customDomains?.has(hostname)) {
    return {
      tenantId: null, // Will need to lookup from slug
      tenantSlug: customDomains.get(hostname)!,
      source: 'domain',
      isValid: true,
    }
  }

  // Check if it's a base domain
  for (const baseDomain of BASE_DOMAINS) {
    if (hostname === baseDomain) {
      // Main domain, no tenant
      return {
        tenantId: null,
        tenantSlug: null,
        source: 'none',
        isValid: false,
      }
    }

    // Check for subdomain
    if (hostname.endsWith(`.${baseDomain}`)) {
      const subdomain = hostname.replace(`.${baseDomain}`, '')

      // System subdomains are not tenants
      if (SYSTEM_SUBDOMAINS.includes(subdomain)) {
        return {
          tenantId: null,
          tenantSlug: null,
          source: 'none',
          isValid: false,
        }
      }

      // Valid tenant subdomain
      return {
        tenantId: null, // Will need to lookup from slug
        tenantSlug: subdomain,
        source: 'subdomain',
        isValid: true,
      }
    }
  }

  // Check for localhost variations (for development)
  if (hostname.includes('localhost') || hostname.includes('127.0.0.1')) {
    // In development, check for subdomain pattern like "demo.localhost"
    const parts = hostname.split('.')
    if (parts.length > 1 && !SYSTEM_SUBDOMAINS.includes(parts[0])) {
      return {
        tenantId: null,
        tenantSlug: parts[0],
        source: 'subdomain',
        isValid: true,
      }
    }
    return {
      tenantId: null,
      tenantSlug: null,
      source: 'none',
      isValid: false,
    }
  }

  // Unknown domain - might be a custom domain not in our map
  return {
    tenantId: null,
    tenantSlug: null,
    source: 'none',
    isValid: false,
  }
}

/**
 * Parse tenant from cookie string
 */
export function parseTenantCookie(cookieHeader: string | null): string | null {
  if (!cookieHeader) return null

  const cookies = cookieHeader.split(';')
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === TENANT_COOKIE) {
      return value || null
    }
  }
  return null
}

/**
 * Get tenant resolution from all sources
 *
 * Priority:
 * 1. Header (X-Tenant-ID) - explicit API override
 * 2. Cookie (akademate_tenant) - session persistence
 * 3. Subdomain/Domain - URL-based resolution
 */
export function getFullTenantResolution(
  headers: {
    get(name: string): string | null
  },
  customDomains?: Map<string, string>
): TenantResolution {
  // 1. Check header
  const headerTenant = headers.get(TENANT_HEADER)
  if (headerTenant) {
    return {
      tenantId: headerTenant,
      tenantSlug: null,
      source: 'header',
      isValid: true,
    }
  }

  // 2. Check cookie
  const cookieTenant = parseTenantCookie(headers.get('cookie'))
  if (cookieTenant) {
    return {
      tenantId: cookieTenant,
      tenantSlug: null,
      source: 'cookie',
      isValid: true,
    }
  }

  // 3. Check host
  const host = headers.get('host')
  if (host) {
    return resolveTenantFromHost(host, customDomains)
  }

  return {
    tenantId: null,
    tenantSlug: null,
    source: 'none',
    isValid: false,
  }
}
