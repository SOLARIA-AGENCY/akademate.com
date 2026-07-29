import type { NextRequest } from 'next/server'
import { getAuthenticatedUserContext } from '@/app/api/leads/_lib/auth'

const GDPR_MANAGER_ROLES = new Set(['admin', 'gestor', 'superadmin'])

export type GdprActor = {
  userId: string | number
  tenantId: number | null
  role: string | null
}

export type GdprSubject = {
  id: string | number
  tenantId?: string | number | null
  tenant?: string | number | { id?: string | number | null } | null
}

function toPositiveInteger(value: unknown): number | null {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) return value
  if (typeof value === 'string' && /^\d+$/.test(value)) return Number(value)
  return null
}

function getSubjectTenantId(subject: GdprSubject): number | null {
  const tenant = subject.tenantId ?? subject.tenant
  if (tenant && typeof tenant === 'object') return toPositiveInteger(tenant.id)
  return toPositiveInteger(tenant)
}

export async function authenticateGdprActor(
  request: NextRequest,
  payload: unknown,
): Promise<GdprActor | null> {
  return getAuthenticatedUserContext(request, payload)
}

export function canAccessGdprSubject(actor: GdprActor, subject: GdprSubject): boolean {
  if (String(actor.userId) === String(subject.id)) return true
  if (!actor.role || !GDPR_MANAGER_ROLES.has(actor.role)) return false
  if (actor.role === 'superadmin') return true

  const subjectTenantId = getSubjectTenantId(subject)
  return actor.tenantId !== null && subjectTenantId !== null && actor.tenantId === subjectTenantId
}
