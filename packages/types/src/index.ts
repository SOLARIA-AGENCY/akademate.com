export type TenantId = string

export type TenantScoped = {
  tenantId: TenantId
}

export type DomainResolution = {
  host: string
  tenantId: TenantId
}

export type UserClaim = {
  userId: string
  tenantId: TenantId
  roles: string[]
  issuedAt?: number
  expiresAt?: number
}

export type AuditEvent = {
  tenantId: TenantId
  actorId: string
  action: string
  target?: string
  createdAt: Date
  metadata?: Record<string, unknown>
}
