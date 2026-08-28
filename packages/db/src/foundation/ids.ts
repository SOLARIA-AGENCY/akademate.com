const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

export function generateCorrelationId(): string {
  return globalThis.crypto.randomUUID()
}

export function isUuid(value: string): boolean {
  return UUID_RE.test(value)
}

/**
 * Drizzle tenant ids are UUIDs. Payload still uses positive integers.
 * The wrapper accepts both so callers do not throw during the expand window.
 * RLS policies on Drizzle tables cast app.tenant_id to uuid. Pass a UUID
 * when querying those tables. An integer setting will not match UUID rows.
 */
export function isValidTenantId(value: string | number): boolean {
  if (typeof value === 'number') {
    return Number.isInteger(value) && value > 0
  }
  const trimmed = value.trim()
  if (trimmed.length === 0) return false
  if (isUuid(trimmed)) return true
  const parsed = Number(trimmed)
  return Number.isInteger(parsed) && parsed > 0 && String(parsed) === trimmed
}
