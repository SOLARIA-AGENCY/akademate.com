import type { TenantId } from './foundation'

export interface TenantScoped {
  tenantId: TenantId
}

export interface DomainResolution {
  host: string
  tenantId: TenantId
}

export interface UserClaim {
  userId: string
  tenantId: TenantId
  roles: string[]
  issuedAt?: number
  expiresAt?: number
}

export * from './foundation'
export * from './billing'
