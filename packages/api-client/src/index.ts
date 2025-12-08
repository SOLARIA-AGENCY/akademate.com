import type { DomainResolution, TenantId } from '@akademate/types'

export type ApiClientOptions = {
  baseUrl: string
  tenantId?: TenantId
  token?: string
}

export type RequestContext = {
  path: string
  tenantId?: TenantId
  traceId?: string
}

export class ApiClient {
  constructor(private readonly options: ApiClientOptions) {}

  resolveTenant(host: string): DomainResolution {
    const cleanedHost = host.trim().toLowerCase()
    const [maybeSubdomain] = cleanedHost.split('.')
    const tenantId = this.options.tenantId ?? maybeSubdomain

    if (!tenantId) {
      throw new Error('Unable to resolve tenantId from host or options')
    }

    return { host: cleanedHost, tenantId }
  }

  buildTenantHeaders(tenantId?: TenantId): Record<string, string> {
    const resolvedTenant = tenantId ?? this.options.tenantId
    if (!resolvedTenant) {
      return {}
    }

    return {
      'x-tenant-id': resolvedTenant,
      ...(this.options.token ? { Authorization: `Bearer ${this.options.token}` } : {}),
    }
  }

  placeholderRequest(context: RequestContext) {
    const tenantId = context.tenantId ?? this.options.tenantId
    return {
      url: this.buildUrl(context.path),
      tenantId,
      headers: this.buildTenantHeaders(tenantId),
      note: 'Implement real fetch with caching/revalidation hooks.',
      traceId: context.traceId,
    }
  }

  private buildUrl(path: string) {
    return `${this.options.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`
  }
}
