import type { NextRequest } from 'next/server'
import { getAuthenticatedUserContext } from '../../leads/_lib/auth'

export function esc(value: string): string {
  return value.replace(/'/g, "''")
}

export function toPositiveInt(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return parseInt(value, 10)
  return null
}

export function toNullableNumber(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const n = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(n)) return null
  return n
}

export async function hasColumn(drizzle: any, tableName: string, columnName: string): Promise<boolean> {
  try {
    const result = await drizzle.execute(`
      SELECT 1
      FROM information_schema.columns
      WHERE table_name = '${esc(tableName)}'
        AND column_name = '${esc(columnName)}'
      LIMIT 1
    `)
    const rows = Array.isArray(result) ? result : (result?.rows ?? [])
    return rows.length > 0
  } catch {
    return false
  }
}

export async function requireTenantContext(request: NextRequest, payload: any): Promise<{
  tenantId: number | null
  userId: string | number
} | null> {
  const auth = await getAuthenticatedUserContext(request, payload)
  if (!auth) return null
  return {
    tenantId: auth.tenantId,
    userId: auth.userId,
  }
}

export function resolvePhotoUrl(row: Record<string, unknown>): string | null {
  const directUrl = typeof row.photo_url === 'string' && row.photo_url.trim().length > 0 ? row.photo_url.trim() : null
  if (directUrl) return directUrl

  const filename = typeof row.photo_filename === 'string' && row.photo_filename.trim().length > 0
    ? row.photo_filename.trim()
    : null
  if (filename) return `/media/${filename}`

  return null
}
