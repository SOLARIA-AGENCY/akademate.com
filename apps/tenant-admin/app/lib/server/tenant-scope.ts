export type TenantScopeOptions = { unscoped?: boolean }

export function parseTenantId(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value !== 'string') return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function isSuperadminRole(role: string | null | undefined): boolean {
  return role === 'superadmin'
}

export function dashboardTenantScopeOptions(
  role: string | null | undefined,
): TenantScopeOptions | undefined {
  return isSuperadminRole(role) ? { unscoped: true } : undefined
}

export function withTenantScope<
  TWhere extends Record<string, unknown> | undefined | null,
>(
  baseWhere: TWhere,
  tenantId: string | number | null | undefined,
  options?: TenantScopeOptions,
): TWhere | Record<string, unknown> {
  if (options?.unscoped) {
    return (baseWhere ?? {}) as TWhere
  }

  const parsedTenantId = parseTenantId(tenantId)
  const tenantCondition = {
    tenant: { equals: parsedTenantId ?? -1 },
  }

  if (!parsedTenantId) {
    if (!baseWhere || Object.keys(baseWhere).length === 0) {
      return tenantCondition
    }

    const base = baseWhere as Record<string, unknown>
    const existingAnd = base.and
    if (Array.isArray(existingAnd)) {
      return {
        ...base,
        and: [...existingAnd, tenantCondition],
      }
    }

    return {
      and: [base, tenantCondition],
    }
  }

  if (!baseWhere || Object.keys(baseWhere).length === 0) {
    return tenantCondition
  }

  const base = baseWhere as Record<string, unknown>
  const existingAnd = base.and
  if (Array.isArray(existingAnd)) {
    return {
      ...base,
      and: [tenantCondition, ...existingAnd],
    }
  }

  return {
    and: [tenantCondition, base],
  }
}
