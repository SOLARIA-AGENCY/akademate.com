export function parseTenantId(value: string | number | null | undefined): number | null {
  if (typeof value === 'number' && Number.isFinite(value) && value > 0) return value
  if (typeof value !== 'string') return null
  const parsed = Number.parseInt(value, 10)
  if (!Number.isFinite(parsed) || parsed <= 0) return null
  return parsed
}

export function withTenantScope<
  TWhere extends Record<string, unknown> | undefined | null,
>(baseWhere: TWhere, tenantId: string | number | null | undefined): TWhere | Record<string, unknown> {
  const parsedTenantId = parseTenantId(tenantId)
  if (!parsedTenantId) {
    return (baseWhere ?? undefined) as TWhere
  }

  const tenantCondition = { tenant: { equals: parsedTenantId } }
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
