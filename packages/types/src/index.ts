export type TenantId = string

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

export interface AuditEvent {
  tenantId: TenantId
  actorId: string
  action: string
  target?: string
  createdAt: Date
  metadata?: Record<string, unknown>
}

// Re-export billing types
export * from './billing'
