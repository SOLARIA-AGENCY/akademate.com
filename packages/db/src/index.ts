import type { TenantId } from '@akademate/types'
import {
  apiKeys,
  auditLogs,
  courses,
  featureFlags,
  memberships,
  planEnum,
  schema,
  subscriptions,
  tenants,
  users,
  webhooks,
} from './schema'

export const schemaVersion = '0.0.1'

export type TenantScopedRecord = {
  tenant_id: TenantId
  created_at?: Date
  updated_at?: Date
}

export type TenantFilter = {
  tenantId: TenantId
  status?: 'active' | 'archived'
}

export const withTenantScope = <T extends Record<string, unknown>>(tenantId: TenantId, payload: T) => ({
  ...payload,
  tenant_id: tenantId,
})

export const defaultAuditColumns = {
  created_at: 'created_at',
  updated_at: 'updated_at',
}

export {
  schema,
  tenants,
  users,
  memberships,
  courses,
  apiKeys,
  featureFlags,
  auditLogs,
  subscriptions,
  webhooks,
  planEnum,
}
