import type { PolicyKind } from '@akademate/types'

export interface PolicyRecord {
  tenantId?: string | null
  organizationGroupId?: string | null
  kind: PolicyKind
  key: string
  document: Record<string, unknown>
  version: number
}

/**
 * Most specific wins. Tenant override, then group, then platform default.
 */
export function resolvePolicy(
  policies: PolicyRecord[],
  input: { tenantId?: string; organizationGroupId?: string; kind: PolicyKind; key: string },
): PolicyRecord | null {
  const matches = policies.filter((policy) => policy.kind === input.kind && policy.key === input.key)

  const tenantMatch = input.tenantId
    ? matches.find((policy) => policy.tenantId === input.tenantId)
    : undefined
  if (tenantMatch) return tenantMatch

  const groupMatch = input.organizationGroupId
    ? matches.find((policy) => policy.organizationGroupId === input.organizationGroupId && !policy.tenantId)
    : undefined
  if (groupMatch) return groupMatch

  return matches.find((policy) => !policy.tenantId && !policy.organizationGroupId) ?? null
}
